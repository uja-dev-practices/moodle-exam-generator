import time
from collections import defaultdict, deque
from threading import Lock
from uuid import UUID

from app.core.config import Settings
from app.core.errors import AppError

_lock = Lock()
_buckets: dict[str, deque[float]] = defaultdict(deque)


class LLMRateLimitError(AppError):
    def __init__(self, retry_after: int) -> None:
        super().__init__(
            message="Too many AI generation requests. Try again later.",
            status_code=429,
            code="llm_rate_limited",
        )
        self.retry_after = retry_after


def enforce_llm_rate_limit(user_id: UUID, settings: Settings) -> None:
    key = str(user_id)
    now = time.monotonic()
    limit = settings.llm_generate_rate_limit_requests
    window = settings.llm_generate_rate_limit_window_seconds

    with _lock:
        bucket = _buckets[key]
        while bucket and now - bucket[0] > window:
            bucket.popleft()
        if len(bucket) >= limit:
            raise LLMRateLimitError(retry_after=window)
        bucket.append(now)
