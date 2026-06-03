from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.config import Settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Cabeceras de seguridad; HSTS en producción o cuando el proxy indica HTTPS."""

    def __init__(self, app: object, settings: Settings) -> None:
        super().__init__(app)
        self._settings = settings

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")

        forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
        is_https = forwarded_proto == "https" or request.url.scheme == "https"

        if is_https or self._settings.is_production:
            hsts = f"max-age={self._settings.security_hsts_seconds}"
            if self._settings.is_production:
                hsts += "; includeSubDomains"
            response.headers.setdefault("Strict-Transport-Security", hsts)

        return response
