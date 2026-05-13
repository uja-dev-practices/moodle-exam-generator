import re
from html import escape
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.core.config import Settings, get_settings


CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
ROLE_INJECTION_HINTS = re.compile(
    r"(ignore\s+(all\s+)?previous|system\s*:|developer\s*:|act\s+as\s+system)",
    flags=re.IGNORECASE,
)


def require_api_key(
    settings: Annotated[Settings, Depends(get_settings)],
    x_api_key: Annotated[str | None, Header(alias="X-API-Key")] = None,
) -> None:
    if not x_api_key or x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )


def clean_text(value: str, *, max_length: int = 8_000) -> str:
    cleaned = CONTROL_CHARS.sub("", value).strip()
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length].strip()
    return cleaned


def sanitize_prompt_input(value: str) -> str:
    cleaned = clean_text(value, max_length=4_000)
    return ROLE_INJECTION_HINTS.sub("[filtered instruction]", cleaned)


def html_text(value: str) -> str:
    return escape(clean_text(value), quote=True)
