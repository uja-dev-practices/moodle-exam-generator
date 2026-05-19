import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.api.dependencies import get_exam_service
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.exam import ExamTemplateCreate, ExamTemplateRead
from app.services.exam_service import ExamService

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("", response_model=ExamTemplateRead, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: ExamTemplateCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> ExamTemplateRead:
    return service.create_template(current_user.id, payload)


@router.get("", response_model=list[ExamTemplateRead])
def list_templates(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> list[ExamTemplateRead]:
    return service.list_templates(current_user.id)


@router.get("/{template_id}", response_model=ExamTemplateRead)
def get_template(
    template_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> ExamTemplateRead:
    return service.get_template(current_user.id, template_id)
