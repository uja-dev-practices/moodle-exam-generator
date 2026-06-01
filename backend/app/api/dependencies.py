from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.services.exam_service import ExamService
from app.services.image_service import ImageService
from app.services.llm import LLMClient
from app.services.material_service import MaterialService
from app.services.storage_quota import StorageQuotaService


def get_storage_quota_service(
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> StorageQuotaService:
    return StorageQuotaService(db, settings)


def get_material_service(
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    storage_quota: Annotated[StorageQuotaService, Depends(get_storage_quota_service)],
) -> MaterialService:
    return MaterialService(db, settings, storage_quota)


def get_image_service(
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    storage_quota: Annotated[StorageQuotaService, Depends(get_storage_quota_service)],
) -> ImageService:
    return ImageService(db, settings, storage_quota)


def get_exam_service(
    db: Annotated[Session, Depends(get_db)],
    material_service: Annotated[MaterialService, Depends(get_material_service)],
    image_service: Annotated[ImageService, Depends(get_image_service)],
) -> ExamService:
    return ExamService(db, material_service=material_service, image_service=image_service)


def get_llm_client(settings: Annotated[Settings, Depends(get_settings)]) -> LLMClient:
    return LLMClient(settings)
