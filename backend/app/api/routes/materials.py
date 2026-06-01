import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.dependencies import get_exam_service, get_material_service
from app.core.auth import get_current_user
from app.models.exam import MaterialStatus
from app.models.user import User
from app.schemas.material import ExamMaterialRead, ExamMaterialUploadResponse
from app.services.exam_service import ExamService
from app.services.material_service import MaterialService

router = APIRouter(prefix="/templates/{template_id}/materials", tags=["materials"])


@router.post("", response_model=ExamMaterialUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_material(
    template_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    exam_service: Annotated[ExamService, Depends(get_exam_service)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
    file: UploadFile = File(...),
) -> ExamMaterialUploadResponse:
    template = exam_service.get_owned_template(current_user.id, template_id)
    material = material_service.upload(template, file)
    message = (
        "File uploaded and processed successfully"
        if material.status == MaterialStatus.PROCESSED
        else "File uploaded but text extraction failed"
    )
    return ExamMaterialUploadResponse(material=material, message=message)


@router.get("", response_model=list[ExamMaterialRead])
def list_materials(
    template_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    exam_service: Annotated[ExamService, Depends(get_exam_service)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
) -> list[ExamMaterialRead]:
    exam_service.get_owned_template(current_user.id, template_id)
    return material_service.list_materials(template_id)


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    template_id: uuid.UUID,
    material_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    exam_service: Annotated[ExamService, Depends(get_exam_service)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
) -> None:
    template = exam_service.get_owned_template(current_user.id, template_id)
    material_service.delete_material(template, material_id)
