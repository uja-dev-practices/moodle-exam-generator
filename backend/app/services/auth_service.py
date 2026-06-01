import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends
from jose import JWTError, jwt
import bcrypt
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.errors import AppError, ConflictError, NotFoundError, UnauthorizedError
from app.core.security import clean_text
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserRead, UserRegister

def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


class AuthService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings

    def register(self, payload: UserRegister) -> UserRead:
        email = payload.email.lower().strip()
        existing = self.db.scalar(select(User).where(User.email == email))
        if existing is not None:
            raise ConflictError("Email is already registered")

        user = User(
            email=email,
            password_hash=_hash_password(payload.password),
            full_name=clean_text(payload.full_name, max_length=200) if payload.full_name else None,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return UserRead.model_validate(user)

    def authenticate(self, payload: UserLogin) -> User:
        email = payload.email.lower().strip()
        user = self.db.scalar(select(User).where(User.email == email))
        if user is None or user.password_hash is None:
            raise UnauthorizedError("Invalid email or password")
        if not _verify_password(payload.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        return user

    def login_with_google(self, id_token_value: str) -> User:
        if not self.settings.google_client_id:
            raise AppError(
                message="Google login is not configured",
                status_code=503,
                code="google_not_configured",
            )

        try:
            idinfo = google_id_token.verify_oauth2_token(
                id_token_value,
                google_requests.Request(),
                self.settings.google_client_id,
            )
        except ValueError as exc:
            raise UnauthorizedError("Invalid Google ID token") from exc

        google_sub = idinfo.get("sub")
        email = (idinfo.get("email") or "").lower().strip()
        if not google_sub or not email:
            raise UnauthorizedError("Google token does not include required user information")
        if not idinfo.get("email_verified", False):
            raise UnauthorizedError("Google email is not verified")

        user = self.db.scalar(select(User).where(User.google_sub == google_sub))
        if user is not None:
            return user

        user = self.db.scalar(select(User).where(User.email == email))
        if user is not None:
            if user.google_sub is not None and user.google_sub != google_sub:
                raise ConflictError("Email is linked to another Google account")
            user.google_sub = google_sub
            if not user.full_name and idinfo.get("name"):
                user.full_name = clean_text(idinfo["name"], max_length=200)
            self.db.commit()
            self.db.refresh(user)
            return user

        user = User(
            email=email,
            password_hash=None,
            google_sub=google_sub,
            full_name=clean_text(idinfo["name"], max_length=200) if idinfo.get("name") else None,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user_by_id(self, user_id: uuid.UUID) -> User:
        user = self.db.get(User, user_id)
        if user is None:
            raise NotFoundError("User not found")
        return user

    def create_access_token(self, user_id: uuid.UUID) -> str:
        expire = datetime.now(UTC) + timedelta(minutes=self.settings.jwt_expire_minutes)
        payload = {"sub": str(user_id), "exp": expire}
        return jwt.encode(payload, self.settings.jwt_secret_key, algorithm=self.settings.jwt_algorithm)

    def decode_user_id(self, token: str) -> uuid.UUID:
        try:
            payload = jwt.decode(
                token,
                self.settings.jwt_secret_key,
                algorithms=[self.settings.jwt_algorithm],
            )
            user_id = uuid.UUID(payload["sub"])
        except (JWTError, KeyError, ValueError) as exc:
            raise UnauthorizedError("Invalid or expired token") from exc
        return user_id


def get_auth_service(
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthService:
    return AuthService(db, settings)
