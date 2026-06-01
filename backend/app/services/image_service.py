import uuid
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import AppError, NotFoundError
from app.core.security import clean_text
from app.models.exam import ExamImage, ExamTemplate, Question
from app.services.storage_quota import StorageQuotaService

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
ALLOWED_IMAGE_MIMES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
}


class ImageService:
    def __init__(
        self,
        db: Session,
        settings: Settings,
        storage_quota: StorageQuotaService | None = None,
    ) -> None:
        self.db = db
        self.settings = settings
        self.storage_quota = storage_quota or StorageQuotaService(db, settings)
        self.image_root = Path(settings.upload_dir) / "exam_images"
        self.image_root.mkdir(parents=True, exist_ok=True)

    def upload(
        self,
        template: ExamTemplate,
        upload_file: UploadFile,
        caption: str | None = None,
    ) -> ExamImage:
        self._validate_upload_count(template.id)
        suffix, mime_type = self._validate_image_file(upload_file)

        content = upload_file.file.read()
        if len(content) > self.settings.max_image_bytes:
            raise AppError(
                f"Image exceeds maximum size of {self.settings.max_image_bytes} bytes",
                status_code=413,
                code="file_too_large",
            )

        self.storage_quota.ensure_template_has_space(template.id, len(content))

        image_id = uuid.uuid4()
        stored_filename = f"{image_id}{suffix}"
        target_dir = self.image_root / str(template.user_id) / str(template.id)
        target_dir.mkdir(parents=True, exist_ok=True)
        storage_path = target_dir / stored_filename
        storage_path.write_bytes(content)
        self._verify_image_integrity(storage_path)

        image = ExamImage(
            id=image_id,
            template_id=template.id,
            original_filename=clean_text(upload_file.filename or stored_filename, max_length=255),
            stored_filename=stored_filename,
            mime_type=mime_type,
            size_bytes=len(content),
            storage_path=str(storage_path),
            caption=clean_text(caption, max_length=500) if caption else None,
        )
        self.db.add(image)
        self.db.commit()
        self.db.refresh(image)
        return image

    def list_images(self, template_id: uuid.UUID) -> list[ExamImage]:
        return list(
            self.db.scalars(
                select(ExamImage)
                .where(ExamImage.template_id == template_id)
                .order_by(ExamImage.created_at.desc())
            ).all()
        )

    def get_image_for_template(self, template_id: uuid.UUID, image_id: uuid.UUID) -> ExamImage:
        image = self.db.get(ExamImage, image_id)
        if image is None or image.template_id != template_id:
            raise NotFoundError("Image not found for this template")
        return image

    def get_image_for_user(self, user_id: uuid.UUID, image_id: uuid.UUID) -> ExamImage:
        image = self.db.get(ExamImage, image_id)
        if image is None:
            raise NotFoundError("Image not found")
        template = image.template
        if template.user_id != user_id:
            raise NotFoundError("Image not found")
        return image

    def delete_image(self, template: ExamTemplate, image_id: uuid.UUID) -> None:
        image = self.get_image_for_template(template.id, image_id)
        for question in list(image.questions):
            question.image_id = None

        path = Path(image.storage_path)
        if path.exists():
            path.unlink()

        self.db.delete(image)
        self.db.commit()

    def attach_image_to_question(
        self,
        template: ExamTemplate,
        question: Question,
        image_id: uuid.UUID | None,
    ) -> Question:
        if question.template_id != template.id:
            raise NotFoundError("Question not found for this template")
        if image_id is not None:
            self.get_image_for_template(template.id, image_id)
        question.image_id = image_id
        self.db.commit()
        self.db.refresh(question)
        return question

    def images_catalog(self, template_id: uuid.UUID) -> str:
        images = self.list_images(template_id)
        if not images:
            return ""

        lines = [
            "Imágenes disponibles para preguntas visuales (el enunciado debe referirse a la imagen; "
            "asigna el campo image_id en cada pregunta que deba mostrarla):"
        ]
        for image in images:
            caption = image.caption or "sin descripción"
            lines.append(
                f"- image_id: {image.id} | archivo: {image.original_filename} | descripción: {caption}"
            )
        return "\n".join(lines)

    def build_image_map(self, template_id: uuid.UUID) -> dict[uuid.UUID, ExamImage]:
        images = self.list_images(template_id)
        return {image.id: image for image in images}

    def to_read(self, image: ExamImage) -> dict[str, object]:
        return {
            "id": image.id,
            "template_id": image.template_id,
            "original_filename": image.original_filename,
            "stored_filename": image.stored_filename,
            "mime_type": image.mime_type,
            "size_bytes": image.size_bytes,
            "caption": image.caption,
            "content_url": f"/exam/images/{image.id}/content",
            "created_at": image.created_at,
        }

    def _validate_upload_count(self, template_id: uuid.UUID) -> None:
        count = self.db.scalar(
            select(func.count()).select_from(ExamImage).where(ExamImage.template_id == template_id)
        )
        if count is not None and count >= self.settings.max_images_per_template:
            raise AppError(
                f"Maximum of {self.settings.max_images_per_template} images per template reached",
                status_code=409,
                code="too_many_images",
            )

    def _validate_image_file(self, upload_file: UploadFile) -> tuple[str, str]:
        if not upload_file.filename:
            raise AppError("Filename is required", status_code=400, code="invalid_file")

        suffix = Path(upload_file.filename).suffix.lower()
        if suffix not in ALLOWED_IMAGE_EXTENSIONS:
            raise AppError(
                f"Unsupported image type. Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}",
                status_code=415,
                code="unsupported_media",
            )

        mime_type = upload_file.content_type or ""
        if mime_type and mime_type not in ALLOWED_IMAGE_MIMES:
            raise AppError("Unsupported image MIME type", status_code=415, code="unsupported_media")

        mime_by_suffix = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".gif": "image/gif",
        }
        resolved_mime = mime_type if mime_type in ALLOWED_IMAGE_MIMES else mime_by_suffix[suffix]
        return suffix, resolved_mime

    def _verify_image_integrity(self, storage_path: Path) -> None:
        try:
            with Image.open(storage_path) as img:
                img.verify()
        except (UnidentifiedImageError, OSError) as exc:
            storage_path.unlink(missing_ok=True)
            raise AppError("Invalid or corrupted image file", status_code=422, code="invalid_image") from exc
