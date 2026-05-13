from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.services.exam_service import ExamService
from app.services.llm import LLMClient


def get_exam_service(db: Annotated[Session, Depends(get_db)]) -> ExamService:
    return ExamService(db)


def get_llm_client(settings: Annotated[Settings, Depends(get_settings)]) -> LLMClient:
    return LLMClient(settings)
