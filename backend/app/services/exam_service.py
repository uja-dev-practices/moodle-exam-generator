import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ForbiddenError, NotFoundError
from app.core.security import clean_text
from app.models.exam import ExamTemplate, ExportFormat, ExportJob, ExportStatus, Question
from app.schemas.exam import (
    ExamHistoryItem,
    ExamTemplateCreate,
    ExamTemplateRead,
    ExportResponse,
    ParsedQuestionsResponse,
    ParseRequest,
    PromptResponse,
    QuestionCreate,
    QuestionRead,
)
from app.services.llm import LLMClient
from app.services.moodle_exporter import MoodleXMLExporter
from app.services.parser import AIQuestionParser
from app.services.prompt_builder import PromptBuilder


class ExamService:
    def __init__(
        self,
        db: Session,
        prompt_builder: PromptBuilder | None = None,
        parser: AIQuestionParser | None = None,
        exporter: MoodleXMLExporter | None = None,
    ) -> None:
        self.db = db
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.parser = parser or AIQuestionParser()
        self.exporter = exporter or MoodleXMLExporter()

    def create_template(self, user_id: uuid.UUID, payload: ExamTemplateCreate) -> ExamTemplateRead:
        template = ExamTemplate(
            user_id=user_id,
            title=clean_text(payload.title, max_length=200),
            subject=clean_text(payload.subject, max_length=200),
            educational_level=clean_text(payload.educational_level, max_length=120),
            language=clean_text(payload.language, max_length=20),
            settings=payload.settings.model_dump(mode="json"),
            difficulty_profile=payload.difficulty_profile.model_dump(mode="json"),
        )
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return self._template_read(template)

    def list_templates(self, user_id: uuid.UUID) -> list[ExamTemplateRead]:
        templates = self.db.scalars(
            select(ExamTemplate)
            .where(ExamTemplate.user_id == user_id)
            .order_by(ExamTemplate.created_at.desc())
        ).all()
        return [self._template_read(template) for template in templates]

    def list_history(self, user_id: uuid.UUID) -> list[ExamHistoryItem]:
        templates = self.db.scalars(
            select(ExamTemplate)
            .where(ExamTemplate.user_id == user_id)
            .order_by(ExamTemplate.updated_at.desc())
        ).all()
        history: list[ExamHistoryItem] = []
        for template in templates:
            export_jobs = sorted(template.export_jobs, key=lambda job: job.created_at, reverse=True)
            history.append(
                ExamHistoryItem(
                    id=template.id,
                    title=template.title,
                    subject=template.subject,
                    educational_level=template.educational_level,
                    language=template.language,
                    question_count=len(template.questions),
                    export_count=len(export_jobs),
                    last_export_at=export_jobs[0].created_at if export_jobs else None,
                    created_at=template.created_at,
                    updated_at=template.updated_at,
                )
            )
        return history

    def get_template(self, user_id: uuid.UUID, template_id: uuid.UUID) -> ExamTemplateRead:
        return self._template_read(self._get_user_template_or_404(user_id, template_id))

    def build_prompt(self, user_id: uuid.UUID, template_id: uuid.UUID, topic_prompt: str) -> PromptResponse:
        template = self._get_user_template_or_404(user_id, template_id)
        prompt = self.prompt_builder.build_prompt(template, topic_prompt)
        return PromptResponse(template_id=template.id, prompt=prompt)

    async def generate_with_llm(
        self,
        user_id: uuid.UUID,
        template_id: uuid.UUID,
        topic_prompt: str,
        llm_client: LLMClient,
    ) -> ParsedQuestionsResponse:
        template = self._get_user_template_or_404(user_id, template_id)
        prompt = self.prompt_builder.build_prompt(template, topic_prompt)
        raw_output = await llm_client.generate(prompt)
        questions = self.parser.parse_json(raw_output)
        return self._persist_questions(template.id, questions)

    def parse_and_persist(self, user_id: uuid.UUID, payload: ParseRequest) -> ParsedQuestionsResponse:
        self._get_user_template_or_404(user_id, payload.template_id)
        questions = self.parser.parse(payload.raw_output, payload.input_format)
        return self._persist_questions(payload.template_id, questions)

    def export(self, user_id: uuid.UUID, template_id: uuid.UUID, export_format: ExportFormat) -> ExportResponse:
        template = self._get_user_template_or_404(user_id, template_id)
        questions = list(template.questions)
        if not questions:
            raise NotFoundError("Template does not contain questions to export")

        if export_format == ExportFormat.XML:
            content = self.exporter.export_xml(questions)
        elif export_format == ExportFormat.TXT:
            content = self.exporter.export_txt(questions)
        else:
            content = self.exporter.export_json(questions)

        self.db.add(
            ExportJob(
                template_id=template.id,
                status=ExportStatus.COMPLETED,
                format=export_format,
                content=content,
            )
        )
        self.db.commit()
        return ExportResponse(template_id=template.id, format=export_format, content=content)

    def _persist_questions(self, template_id: uuid.UUID, questions: list[QuestionCreate]) -> ParsedQuestionsResponse:
        persisted: list[Question] = []
        for payload in questions:
            question = Question(
                template_id=template_id,
                question_type=payload.question_type,
                statement=clean_text(payload.statement),
                correct_answers=[clean_text(answer, max_length=1_000) for answer in payload.correct_answers],
                wrong_answers=[clean_text(answer, max_length=1_000) for answer in payload.wrong_answers],
                matching_pairs=[pair.model_dump() for pair in payload.matching_pairs],
                difficulty=payload.difficulty,
                score=payload.score,
                penalty=payload.penalty,
                options=payload.options,
            )
            self.db.add(question)
            persisted.append(question)

        self.db.commit()
        for question in persisted:
            self.db.refresh(question)

        return ParsedQuestionsResponse(questions=[QuestionRead.model_validate(question) for question in persisted])

    def _get_user_template_or_404(self, user_id: uuid.UUID, template_id: uuid.UUID) -> ExamTemplate:
        template = self.db.get(ExamTemplate, template_id)
        if template is None:
            raise NotFoundError("Exam template not found")
        if template.user_id != user_id:
            raise ForbiddenError("You do not have access to this exam template")
        return template

    def _template_read(self, template: ExamTemplate) -> ExamTemplateRead:
        return ExamTemplateRead(
            id=template.id,
            title=template.title,
            subject=template.subject,
            educational_level=template.educational_level,
            language=template.language,
            settings=template.settings,
            difficulty_profile=template.difficulty_profile,
            created_at=template.created_at,
            updated_at=template.updated_at,
            question_count=len(template.questions),
        )
