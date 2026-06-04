from typing import Annotated

from fastapi import Depends

from app.core.auth import get_current_user
from app.core.config import Settings, get_settings
from app.core.errors import LLMUnavailableError
from app.core.llm_rate_limit import enforce_llm_rate_limit
from app.models.user import User


def require_llm_generation(
    settings: Annotated[Settings, Depends(get_settings)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Solo permite generación automática si el LLM está configurado por entorno (no en el repo)."""
    if not settings.llm_ready:
        raise LLMUnavailableError("Automatic AI generation is not available")
    enforce_llm_rate_limit(current_user.id, settings)
    return current_user
