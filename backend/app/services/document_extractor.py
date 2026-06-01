from pathlib import Path

from app.core.errors import AppError

SUPPORTED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


class DocumentExtractor:
    def extract(self, file_path: Path, mime_type: str) -> str:
        suffix = file_path.suffix.lower()
        if mime_type == "application/pdf" or suffix == ".pdf":
            return self._extract_pdf(file_path)
        if (
            mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            or suffix == ".docx"
        ):
            return self._extract_docx(file_path)
        if mime_type.startswith("text/") or suffix in {".txt", ".md"}:
            return self._extract_text(file_path)
        if mime_type.startswith("image/") or suffix in {".png", ".jpg", ".jpeg", ".webp"}:
            return self._extract_image(file_path)
        raise AppError(f"Unsupported file type: {mime_type}", status_code=415, code="unsupported_media")

    def _extract_pdf(self, file_path: Path) -> str:
        from pypdf import PdfReader

        reader = PdfReader(str(file_path))
        parts = [page.extract_text() or "" for page in reader.pages]
        text = "\n".join(parts).strip()
        if not text:
            raise AppError("PDF does not contain extractable text", status_code=422, code="empty_extraction")
        return text

    def _extract_docx(self, file_path: Path) -> str:
        from docx import Document

        document = Document(str(file_path))
        parts = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
        text = "\n".join(parts).strip()
        if not text:
            raise AppError("DOCX does not contain extractable text", status_code=422, code="empty_extraction")
        return text

    def _extract_text(self, file_path: Path) -> str:
        text = file_path.read_text(encoding="utf-8", errors="ignore").strip()
        if not text:
            raise AppError("Text file is empty", status_code=422, code="empty_extraction")
        return text

    def _extract_image(self, file_path: Path) -> str:
        try:
            import pytesseract
            from PIL import Image
        except ImportError as exc:
            raise AppError(
                "Image OCR is not available on this server",
                status_code=503,
                code="ocr_unavailable",
            ) from exc

        image = Image.open(file_path)
        text = pytesseract.image_to_string(image, lang="spa+eng").strip()
        if not text:
            raise AppError("Image does not contain recognizable text", status_code=422, code="empty_extraction")
        return text
