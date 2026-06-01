import httpx

from app.core.config import Settings
from app.core.errors import LLMUnavailableError


class LLMClient:
    """Cliente para el API de chat de Sinbad2IA (Ollama-compatible en UJA)."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _chat_url(self) -> str:
        base = self.settings.llm_base_url.rstrip("/")
        if base.endswith("/api/chat"):
            return base
        return f"{base}/api/chat"

    async def generate(self, prompt: str) -> str:
        payload = {
            "model": self.settings.llm_model,
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "Genera preguntas de examen en formato JSON válido para importar en Moodle. "
                        "Responde únicamente con el JSON solicitado, sin texto adicional ni bloques markdown.\n\n"
                        f"{prompt}"
                    ),
                },
            ],
            "stream": False,
        }

        headers = {"Content-Type": "application/json"}
        if self.settings.llm_api_key:
            headers["Authorization"] = f"Bearer {self.settings.llm_api_key}"

        try:
            async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
                response = await client.post(self._chat_url(), json=payload, headers=headers)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise LLMUnavailableError("LLM request failed") from exc

        content = _extract_assistant_content(response.json())
        if not content.strip():
            raise LLMUnavailableError("LLM returned empty content")
        return content


def _extract_assistant_content(data: object) -> str:
    """Soporta respuesta Sinbad2IA/Ollama (`message.content`) y OpenAI (`choices`)."""
    if not isinstance(data, dict):
        raise LLMUnavailableError("LLM response is not a JSON object")

    message = data.get("message")
    if isinstance(message, dict):
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            return content

    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0]
        if isinstance(first, dict):
            msg = first.get("message")
            if isinstance(msg, dict):
                content = msg.get("content")
                if isinstance(content, str) and content.strip():
                    return content

    raise LLMUnavailableError("LLM response did not include message content")
