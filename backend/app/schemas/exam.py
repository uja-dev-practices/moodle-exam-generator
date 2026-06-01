import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.exam import Difficulty, ExportFormat, QuestionType


class QuestionTypeSettings(BaseModel):
    type: QuestionType
    count: int = Field(ge=1, le=200)
    options_count: int | None = Field(default=None, ge=2, le=8)
    multiple_correct: bool = False
    score: float = Field(default=1.0, ge=0.0, le=100.0)
    penalty: float = Field(default=0.0, ge=0.0, le=100.0)


class ExamSettings(BaseModel):
    question_types: list[QuestionTypeSettings] = Field(min_length=1, max_length=20)
    shuffle_questions: bool = True
    shuffle_answers: bool = True
    include_feedback: bool = True


class DifficultyProfile(BaseModel):
    easy: int = Field(default=0, ge=0, le=500)
    medium: int = Field(default=0, ge=0, le=500)
    hard: int = Field(default=0, ge=0, le=500)
    very_hard: int = Field(default=0, ge=0, le=500)

    @model_validator(mode="after")
    def require_at_least_one_question(self) -> "DifficultyProfile":
        if self.easy + self.medium + self.hard + self.very_hard <= 0:
            raise ValueError("At least one difficulty bucket must contain questions")
        return self


class ExamTemplateCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    subject: str = Field(min_length=2, max_length=200)
    educational_level: str = Field(min_length=2, max_length=120)
    language: str = Field(default="es", min_length=2, max_length=20)
    settings: ExamSettings
    difficulty_profile: DifficultyProfile


class ExamTemplateRead(ExamTemplateCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    question_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class MatchingPair(BaseModel):
    prompt: str = Field(min_length=1, max_length=1_000)
    answer: str = Field(min_length=1, max_length=1_000)


class QuestionCreate(BaseModel):
    question_type: QuestionType
    statement: str = Field(min_length=3, max_length=8_000)
    correct_answers: list[str] = Field(min_length=1, max_length=20)
    wrong_answers: list[str] = Field(default_factory=list, max_length=20)
    matching_pairs: list[MatchingPair] = Field(default_factory=list, max_length=50)
    image_id: uuid.UUID | None = Field(
        default=None,
        description="ID de imagen de la plantilla que debe mostrarse con la pregunta.",
    )
    difficulty: Difficulty = Difficulty.MEDIUM
    score: float = Field(default=1.0, ge=0.0, le=100.0)
    penalty: float = Field(default=0.0, ge=0.0, le=100.0)
    options: dict[str, object] = Field(default_factory=dict)

    @field_validator("correct_answers", "wrong_answers")
    @classmethod
    def strip_answers(cls, value: list[str]) -> list[str]:
        return [answer.strip() for answer in value if answer.strip()]

    @model_validator(mode="after")
    def validate_question_payload(self) -> "QuestionCreate":
        if self.question_type == QuestionType.MULTICHOICE and not self.wrong_answers:
            raise ValueError("Multichoice questions require wrong_answers")
        if self.question_type == QuestionType.TRUE_FALSE:
            accepted = {"true", "false", "verdadero", "falso"}
            if self.correct_answers[0].lower() not in accepted:
                raise ValueError("True/false questions require a true or false correct answer")
        if self.question_type == QuestionType.MATCHING and not self.matching_pairs:
            raise ValueError("Matching questions require matching_pairs")
        return self


class QuestionRead(QuestionCreate):
    id: uuid.UUID
    template_id: uuid.UUID
    image_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PromptResponse(BaseModel):
    template_id: uuid.UUID
    prompt: str
    expected_format: Literal["json"] = "json"


class BuildPromptRequest(BaseModel):
    topic_prompt: str = Field(min_length=5, max_length=4_000)
    material_ids: list[uuid.UUID] | None = Field(
        default=None,
        description="IDs de materiales a incluir. Si no se indica, se usan todos los procesados.",
    )


class GenerateExamRequest(BaseModel):
    template_id: uuid.UUID
    topic_prompt: str = Field(min_length=5, max_length=4_000)
    material_ids: list[uuid.UUID] | None = Field(
        default=None,
        description="IDs de materiales a incluir. Si no se indica, se usan todos los procesados.",
    )


class ParseRequest(BaseModel):
    raw_output: str = Field(min_length=5, max_length=200_000)
    input_format: Literal["json", "txt"]
    template_id: uuid.UUID


class ParsedQuestionsResponse(BaseModel):
    questions: list[QuestionRead]


class ExportResponse(BaseModel):
    template_id: uuid.UUID
    format: ExportFormat
    content: str


class ExamHistoryItem(BaseModel):
    id: uuid.UUID
    title: str
    subject: str
    educational_level: str
    language: str
    question_count: int
    export_count: int
    last_export_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
