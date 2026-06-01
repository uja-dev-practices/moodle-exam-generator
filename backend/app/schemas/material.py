import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.exam import MaterialStatus


class ExamMaterialRead(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    original_filename: str
    mime_type: str
    size_bytes: int
    status: MaterialStatus
    error_message: str | None
    text_preview: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExamMaterialUploadResponse(BaseModel):
    material: ExamMaterialRead
    message: str = "File uploaded and processed successfully"


class MaterialIdsFilter(BaseModel):
    material_ids: list[uuid.UUID] | None = Field(
        default=None,
        description="Si se indica, solo se usan estos materiales como contexto.",
    )
