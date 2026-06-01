import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import AppError, NotFoundError
from app.core.security import clean_text
from app.models.exam import ExamMaterial, ExamTemplate, MaterialStatus
from app.schemas.material import ExamMaterialRead
from app.services.document_extractor import SUPPORTED_EXTENSIONS, DocumentExtractor
from app.services.storage_quota import StorageQuotaService


class MaterialService:
    def __init__(
        self,
        db: Session,
        settings: Settings,
        storage_quota: StorageQuotaService | None = None,
    ) -> None:
        self.db = db
        self.settings = settings
        self.storage_quota = storage_quota or StorageQuotaService(db, settings)
        self.extractor = DocumentExtractor()
        self.upload_root = Path(settings.upload_dir)
        self.upload_root.mkdir(parents=True, exist_ok=True)

    def upload(
        self,
        template: ExamTemplate,
        upload_file: UploadFile,
    ) -> ExamMaterialRead:
        self._validate_upload(template.id, upload_file)

        suffix = Path(upload_file.filename or "file").suffix.lower()
        if suffix not in SUPPORTED_EXTENSIONS:
            raise AppError(
                f"Unsupported extension. Allowed: {', '.join(sorted(SUPPORTED_EXTENSIONS))}",
                status_code=415,
                code="unsupported_media",
            )

        content = upload_file.file.read()
        if len(content) > self.settings.max_upload_bytes:
            raise AppError(
                f"File exceeds maximum size of {self.settings.max_upload_bytes} bytes",
                status_code=413,
                code="file_too_large",
            )
        if not content:
            raise AppError("Uploaded file is empty", status_code=400, code="empty_file")

        self.storage_quota.ensure_template_has_space(template.id, len(content))

        material_id = uuid.uuid4()
        safe_name = f"{material_id}{suffix}"
        target_dir = self.upload_root / str(template.user_id) / str(template.id)
        target_dir.mkdir(parents=True, exist_ok=True)
        storage_path = target_dir / safe_name
        storage_path.write_bytes(content)

        mime_type = upload_file.content_type or SUPPORTED_EXTENSIONS[suffix]
        material = ExamMaterial(
            id=material_id,
            template_id=template.id,
            original_filename=clean_text(upload_file.filename or safe_name, max_length=255),
            mime_type=mime_type,
            size_bytes=len(content),
            storage_path=str(storage_path),
            status=MaterialStatus.PROCESSED,
        )

        try:
            material.extracted_text = clean_text(
                self.extractor.extract(storage_path, mime_type),
                max_length=500_000,
            )
        except AppError as exc:
            material.status = MaterialStatus.FAILED
            material.error_message = clean_text(exc.message, max_length=500)
        except Exception as exc:
            material.status = MaterialStatus.FAILED
            material.error_message = clean_text(str(exc), max_length=500)

        self.db.add(material)
        self.db.commit()
        self.db.refresh(material)
        return self._to_read(material)

    def list_materials(self, template_id: uuid.UUID) -> list[ExamMaterialRead]:
        materials = self.db.scalars(
            select(ExamMaterial)
            .where(ExamMaterial.template_id == template_id)
            .order_by(ExamMaterial.created_at.desc())
        ).all()
        return [self._to_read(material) for material in materials]

    def delete_material(self, template: ExamTemplate, material_id: uuid.UUID) -> None:
        material = self.db.get(ExamMaterial, material_id)
        if material is None or material.template_id != template.id:
            raise NotFoundError("Material not found")

        path = Path(material.storage_path)
        if path.exists():
            path.unlink()

        self.db.delete(material)
        self.db.commit()

    def build_reference_context(
        self,
        template_id: uuid.UUID,
        material_ids: list[uuid.UUID] | None = None,
    ) -> str:
        query = select(ExamMaterial).where(
            ExamMaterial.template_id == template_id,
            ExamMaterial.status == MaterialStatus.PROCESSED,
            ExamMaterial.extracted_text.isnot(None),
        )
        if material_ids:
            query = query.where(ExamMaterial.id.in_(material_ids))

        materials = self.db.scalars(query.order_by(ExamMaterial.created_at.asc())).all()
        if material_ids:
            found_ids = {material.id for material in materials}
            missing = [material_id for material_id in material_ids if material_id not in found_ids]
            if missing:
                raise NotFoundError("One or more material IDs were not found or are not processed")

        if not materials:
            return ""

        sections: list[str] = []
        for material in materials:
            text = material.extracted_text or ""
            if not text.strip():
                continue
            sections.append(
                f"--- Archivo: {material.original_filename} ---\n{text.strip()}"
            )

        if not sections:
            return ""

        combined = "\n\n".join(sections)
        max_chars = self.settings.max_reference_chars
        if len(combined) <= max_chars:
            return combined

        truncated = combined[:max_chars].rsplit("\n", 1)[0]
        return f"{truncated}\n\n[Material truncado por límite de contexto]"

    def _validate_upload(self, template_id: uuid.UUID, upload_file: UploadFile) -> None:
        if not upload_file.filename:
            raise AppError("Filename is required", status_code=400, code="invalid_file")

        count = self.db.scalar(
            select(func.count())
            .select_from(ExamMaterial)
            .where(ExamMaterial.template_id == template_id)
        )
        if count is not None and count >= self.settings.max_materials_per_template:
            raise AppError(
                f"Maximum of {self.settings.max_materials_per_template} files per template reached",
                status_code=409,
                code="too_many_files",
            )

    def _to_read(self, material: ExamMaterial) -> ExamMaterialRead:
        preview = None
        if material.extracted_text:
            preview = material.extracted_text[:300]
            if len(material.extracted_text) > 300:
                preview += "..."
        return ExamMaterialRead(
            id=material.id,
            template_id=material.template_id,
            original_filename=material.original_filename,
            mime_type=material.mime_type,
            size_bytes=material.size_bytes,
            status=material.status,
            error_message=material.error_message,
            text_preview=preview,
            created_at=material.created_at,
        )
