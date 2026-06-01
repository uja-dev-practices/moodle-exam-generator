import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExamImageRead(BaseModel):
    id: uuid.UUID
    template_id: uuid.UUID
    original_filename: str
    stored_filename: str
    mime_type: str
    size_bytes: int
    caption: str | None
    content_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExamImageUploadResponse(BaseModel):
    image: ExamImageRead
    message: str = "Image uploaded successfully"


class QuestionImageAttach(BaseModel):
    image_id: uuid.UUID | None = Field(
        default=None,
        description="ID de imagen de la plantilla. null para desvincular.",
    )
