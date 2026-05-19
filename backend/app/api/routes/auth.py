from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.user import GoogleLoginRequest, TokenResponse, UserLogin, UserRead, UserRegister
from app.services.auth_service import AuthService, get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserRegister,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserRead:
    return auth_service.register(payload)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLogin,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    user = auth_service.authenticate(payload)
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/google", response_model=TokenResponse)
def login_with_google(
    payload: GoogleLoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    user = auth_service.login_with_google(payload.id_token)
    token = auth_service.create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserRead)
def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserRead:
    return UserRead.model_validate(current_user)
