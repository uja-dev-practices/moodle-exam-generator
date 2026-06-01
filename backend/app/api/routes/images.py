import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import FileResponse

from app.api.dependencies import get_exam_service, get_image_service
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.image import ExamImageRead, ExamImageUploadResponse
from app.services.exam_service import ExamService
from app.services.image_service import ImageService

router = APIRouter(tags=["images"])


@router.post(
    "/templates/{template_id}/images",
    response_model=ExamImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_exam_image(
    template_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    exam_service: Annotated[ExamService, Depends(get_exam_service)],
    image_service: Annotated[ImageService, Depends(get_image_service)],
    file: UploadFile = File(...),
    caption: Annotated[str | None, Form()] = None,
) -> ExamImageUploadResponse:
    template = exam_service.get_owned_template(current_user.id, template_id)
    image = image_service.upload(template, file, caption=caption)
    return ExamImageUploadResponse(
        image=ExamImageRead.model_validate(image_service.to_read(image)),
        message="Image uploaded successfully",
    )


@router.get("/templates/{template_id}/images", response_model=list[ExamImageRead])
def list_exam_images(
    template_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    exam_service: Annotated[ExamService, Depends(get_exam_service)],
    image_service: Annotated[ImageService, Depends(get_image_service)],
) -> list[ExamImageRead]:
    exam_service.get_owned_template(current_user.id, template_id)
    images = image_service.list_images(template_id)
    return [ExamImageRead.model_validate(image_service.to_read(image)) for image in images]


@router.get("/images/{image_id}/content")
def get_exam_image_content(
    image_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    image_service: Annotated[ImageService, Depends(get_image_service)],
) -> FileResponse:
    image = image_service.get_image_for_user(current_user.id, image_id)
    return FileResponse(
        path=image.storage_path,
        media_type=image.mime_type,
        filename=image.original_filename,
    )


@router.delete("/templates/{template_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam_image(
    template_id: uuid.UUID,
    image_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    exam_service: Annotated[ExamService, Depends(get_exam_service)],
    image_service: Annotated[ImageService, Depends(get_image_service)],
) -> None:
    template = exam_service.get_owned_template(current_user.id, template_id)
    image_service.delete_image(template, image_id)
