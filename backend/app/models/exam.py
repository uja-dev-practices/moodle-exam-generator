import enum
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class QuestionType(str, enum.Enum):
    MULTICHOICE = "multichoice"
    TRUE_FALSE = "truefalse"
    SHORT_ANSWER = "shortanswer"
    MATCHING = "matching"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"


class ExportStatus(str, enum.Enum):
    COMPLETED = "completed"
    FAILED = "failed"


class ExportFormat(str, enum.Enum):
    XML = "xml"
    TXT = "txt"
    JSON = "json"


class MaterialStatus(str, enum.Enum):
    PROCESSED = "processed"
    FAILED = "failed"


class ExamTemplate(Base):
    __tablename__ = "exam_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    educational_level: Mapped[str] = mapped_column(String(120), nullable=False)
    language: Mapped[str] = mapped_column(String(20), nullable=False, default="es")
    settings: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    difficulty_profile: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner: Mapped["User"] = relationship(back_populates="exam_templates")

    questions: Mapped[list["Question"]] = relationship(
        back_populates="template",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    export_jobs: Mapped[list["ExportJob"]] = relationship(
        back_populates="template",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    materials: Mapped[list["ExamMaterial"]] = relationship(
        back_populates="template",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    images: Mapped[list["ExamImage"]] = relationship(
        back_populates="template",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exam_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_type: Mapped[QuestionType] = mapped_column(Enum(QuestionType), nullable=False)
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    correct_answers: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    wrong_answers: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    matching_pairs: Mapped[list[dict[str, str]]] = mapped_column(JSONB, nullable=False, default=list)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty), nullable=False, default=Difficulty.MEDIUM)
    score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    penalty: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    options: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    image_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exam_images.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    template: Mapped[ExamTemplate] = relationship(back_populates="questions")
    image: Mapped["ExamImage | None"] = relationship(back_populates="questions")


class ExportJob(Base):
    __tablename__ = "export_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exam_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[ExportStatus] = mapped_column(Enum(ExportStatus), nullable=False)
    format: Mapped[ExportFormat] = mapped_column(Enum(ExportFormat), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    template: Mapped[ExamTemplate] = relationship(back_populates="export_jobs")


class ExamMaterial(Base):
    __tablename__ = "exam_materials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exam_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[MaterialStatus] = mapped_column(Enum(MaterialStatus), nullable=False)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    template: Mapped[ExamTemplate] = relationship(back_populates="materials")


class ExamImage(Base):
    __tablename__ = "exam_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("exam_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    template: Mapped[ExamTemplate] = relationship(back_populates="images")
    questions: Mapped[list["Question"]] = relationship(back_populates="image")
