import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_exam_service, get_image_service
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.exam import QuestionRead
from app.schemas.image import QuestionImageAttach
from app.services.exam_service import ExamService
from app.services.image_service import ImageService

router = APIRouter(prefix="/questions", tags=["questions"])


@router.patch("/{question_id}/image", response_model=QuestionRead)
def attach_image_to_question(
    question_id: uuid.UUID,
    payload: QuestionImageAttach,
    current_user: Annotated[User, Depends(get_current_user)],
    exam_service: Annotated[ExamService, Depends(get_exam_service)],
    image_service: Annotated[ImageService, Depends(get_image_service)],
) -> QuestionRead:
    question, template = exam_service.get_owned_question(current_user.id, question_id)
    updated = image_service.attach_image_to_question(template, question, payload.image_id)
    return exam_service.to_question_read(updated)
