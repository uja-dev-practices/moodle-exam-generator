from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "GenExamenes IA"
    environment: str = "local"
    public_base_url: str = "https://sinbad2.ujaen.es/generadorexamenesllm"
    trusted_hosts: str = "sinbad2.ujaen.es,localhost,127.0.0.1"
    security_hsts_seconds: int = Field(default=31_536_000, ge=0)
    api_prefix: str = ""
    api_key: str = Field(min_length=16)
    database_url: str = "postgresql+psycopg://genexamenes:genexamenes@localhost:5432/genexamenes"
    allowed_origins: str = "https://sinbad2.ujaen.es,http://sinbad2.ujaen.es,http://sinbad2.ujaen.es:8069"
    rate_limit_requests: int = Field(default=60, ge=1)
    rate_limit_window_seconds: int = Field(default=60, ge=1)
    max_request_bytes: int = Field(default=1_048_576, ge=1_024)
    llm_api_key: str | None = None
    llm_base_url: str = ""
    llm_model: str = "qwen3.5:35b"
    llm_timeout_seconds: int = Field(default=180, ge=5)
    jwt_secret_key: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = Field(default=60 * 24, ge=5)
    google_client_id: str | None = None
    upload_dir: str = "/app/uploads"
    max_upload_bytes: int = Field(default=20_971_520, ge=1_024)
    max_materials_per_template: int = Field(default=10, ge=1, le=50)
    max_reference_chars: int = Field(default=12_000, ge=1_000, le=100_000)
    max_image_bytes: int = Field(default=5_242_880, ge=1_024)
    max_images_per_template: int = Field(default=20, ge=1, le=100)
    max_storage_bytes_per_template: int = Field(
        default=52_428_800,
        ge=1_024,
        description="Cupo total por examen (materiales + imágenes). Por defecto 50 MB.",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def trusted_hosts_list(self) -> list[str]:
        return [host.strip() for host in self.trusted_hosts.split(",") if host.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
