import uuid

from pydantic import BaseModel


class TemplateStorageUsage(BaseModel):
    template_id: uuid.UUID
    used_bytes: int
    limit_bytes: int
    remaining_bytes: int
    materials_bytes: int
    images_bytes: int
    used_mb: float
    limit_mb: float
