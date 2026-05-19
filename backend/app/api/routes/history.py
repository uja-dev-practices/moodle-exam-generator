from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.exam import ExamHistoryItem
from app.services.exam_service import ExamService
from app.api.dependencies import get_exam_service

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[ExamHistoryItem])
def list_exam_history(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> list[ExamHistoryItem]:
    return service.list_history(current_user.id)
