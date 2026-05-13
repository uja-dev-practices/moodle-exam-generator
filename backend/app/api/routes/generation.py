import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_exam_service, get_llm_client
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
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> PromptResponse:
    return service.build_prompt(template_id, payload.topic_prompt)


@router.post("/generate", response_model=ParsedQuestionsResponse)
async def generate_exam(
    payload: GenerateExamRequest,
    service: Annotated[ExamService, Depends(get_exam_service)],
    llm_client: Annotated[LLMClient, Depends(get_llm_client)],
) -> ParsedQuestionsResponse:
    return await service.generate_with_llm(payload.template_id, payload.topic_prompt, llm_client)


@router.post("/parse", response_model=ParsedQuestionsResponse)
def parse_ai_output(
    payload: ParseRequest,
    service: Annotated[ExamService, Depends(get_exam_service)],
) -> ParsedQuestionsResponse:
    return service.parse_and_persist(payload)
