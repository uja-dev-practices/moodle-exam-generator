import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=200)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GoogleLoginRequest(BaseModel):
    """ID token obtenido en el frontend con Google Identity Services (Sign in with Google)."""

    id_token: str = Field(min_length=10, max_length=8_000)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
