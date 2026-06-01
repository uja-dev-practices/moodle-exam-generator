import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response

from app.api.dependencies import get_exam_service
from app.core.auth import get_current_user
from app.models.exam import ExportFormat
from app.models.user import User
from app.services.exam_service import ExamService

router = APIRouter(prefix="/export", tags=["exports"])


@router.get("/xml/{template_id}")
def export_xml(
    template_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> Response:
    export = service.export(current_user.id, template_id, ExportFormat.XML)
    return Response(content=export.content, media_type="application/xml")


@router.get("/txt/{template_id}")
def export_txt(
    template_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> Response:
    export = service.export(current_user.id, template_id, ExportFormat.TXT)
    return Response(content=export.content, media_type="text/plain; charset=utf-8")


@router.get("/json/{template_id}")
def export_json(
    template_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> Response:
    export = service.export(current_user.id, template_id, ExportFormat.JSON)
    return Response(content=export.content, media_type="application/json")
