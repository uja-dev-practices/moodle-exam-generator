import httpx

from app.core.config import Settings
from app.core.errors import LLMUnavailableError


class LLMClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def generate(self, prompt: str) -> str:
        if not self.settings.llm_api_key:
            raise LLMUnavailableError("LLM_API_KEY is not configured")

        url = f"{self.settings.llm_base_url.rstrip('/')}/chat/completions"
        payload = {
            "model": self.settings.llm_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You generate safe, valid JSON exam questions for Moodle imports.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {self.settings.llm_api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise LLMUnavailableError("LLM request failed") from exc

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMUnavailableError("LLM response did not include message content") from exc

        if not isinstance(content, str) or not content.strip():
            raise LLMUnavailableError("LLM returned empty content")
        return content
