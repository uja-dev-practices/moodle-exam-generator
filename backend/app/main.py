from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import exports, generation, health, templates
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.middleware import RateLimitMiddleware, RequestSizeLimitMiddleware
from app.core.security import require_api_key
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-API-Key"],
    )
    app.add_middleware(RequestSizeLimitMiddleware, settings=settings)
    app.add_middleware(RateLimitMiddleware, settings=settings)

    register_exception_handlers(app)

    app.include_router(health.router)
    protected = [Depends(require_api_key)]
    app.include_router(templates.router, prefix="/exam", dependencies=protected)
    app.include_router(generation.router, prefix="/exam", dependencies=protected)
    app.include_router(exports.router, prefix="/exam", dependencies=protected)

    return app


app = create_app()
