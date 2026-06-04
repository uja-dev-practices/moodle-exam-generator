import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_exam_service, get_llm_client
from app.api.llm_guard import require_llm_generation
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.exam import (
    BuildPromptRequest,
    GenerateExamRequest,
    ParsedQuestionsResponse,
    ParseRequest,
    PromptResponse,
)
from app.services.exam_service import ExamService
from app.services.llm import LLMClient

router = APIRouter(tags=["generation"])


@router.post("/prompts/{template_id}", response_model=PromptResponse)
def build_prompt(
    template_id: uuid.UUID,
    payload: BuildPromptRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> PromptResponse:
    return service.build_prompt(
        current_user.id,
        template_id,
        payload.topic_prompt,
        payload.material_ids,
    )


@router.post("/generate", response_model=ParsedQuestionsResponse)
async def generate_exam(
    payload: GenerateExamRequest,
    current_user: Annotated[User, Depends(require_llm_generation)],
    service: Annotated[ExamService, Depends(get_exam_service)],
    llm_client: Annotated[LLMClient, Depends(get_llm_client)],
) -> ParsedQuestionsResponse:
    return await service.generate_with_llm(
        current_user.id,
        payload.template_id,
        payload.topic_prompt,
        llm_client,
        payload.material_ids,
    )


@router.post("/parse", response_model=ParsedQuestionsResponse)
def parse_ai_output(
    payload: ParseRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> ParsedQuestionsResponse:
    return service.parse_and_persist(current_user.id, payload)
