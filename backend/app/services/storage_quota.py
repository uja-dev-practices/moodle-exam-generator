import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import AppError
from app.models.exam import ExamImage, ExamMaterial


class StorageQuotaService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings

    def get_template_usage_bytes(self, template_id: uuid.UUID) -> int:
        materials_bytes = self.db.scalar(
            select(func.coalesce(func.sum(ExamMaterial.size_bytes), 0)).where(
                ExamMaterial.template_id == template_id
            )
        )
        images_bytes = self.db.scalar(
            select(func.coalesce(func.sum(ExamImage.size_bytes), 0)).where(
                ExamImage.template_id == template_id
            )
        )
        return int(materials_bytes or 0) + int(images_bytes or 0)

    def ensure_template_has_space(self, template_id: uuid.UUID, incoming_bytes: int) -> None:
        if incoming_bytes <= 0:
            return

        limit = self.settings.max_storage_bytes_per_template
        used = self.get_template_usage_bytes(template_id)
        projected = used + incoming_bytes

        if projected > limit:
            raise AppError(
                message=(
                    f"Template storage quota exceeded. "
                    f"Limit: {self._format_mb(limit)}, "
                    f"used: {self._format_mb(used)}, "
                    f"file: {self._format_mb(incoming_bytes)}"
                ),
                status_code=413,
                code="template_storage_quota_exceeded",
            )

    def get_usage_summary(self, template_id: uuid.UUID) -> dict[str, int | float]:
        materials_bytes = int(
            self.db.scalar(
                select(func.coalesce(func.sum(ExamMaterial.size_bytes), 0)).where(
                    ExamMaterial.template_id == template_id
                )
            )
            or 0
        )
        images_bytes = int(
            self.db.scalar(
                select(func.coalesce(func.sum(ExamImage.size_bytes), 0)).where(
                    ExamImage.template_id == template_id
                )
            )
            or 0
        )
        used = materials_bytes + images_bytes
        limit = self.settings.max_storage_bytes_per_template
        return {
            "template_id": template_id,
            "used_bytes": used,
            "limit_bytes": limit,
            "remaining_bytes": max(limit - used, 0),
            "materials_bytes": materials_bytes,
            "images_bytes": images_bytes,
            "used_mb": round(used / (1024 * 1024), 2),
            "limit_mb": round(limit / (1024 * 1024), 2),
        }

    @staticmethod
    def _format_mb(value_bytes: int) -> str:
        return f"{value_bytes / (1024 * 1024):.2f} MB"
