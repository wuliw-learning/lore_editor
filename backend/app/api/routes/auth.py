from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.api.deps import require_auth
from app.core.config import settings
from app.core.security import create_token, verify_password
from app.schemas.auth import LoginRequest, UserInfo


router = APIRouter()


@router.post("/login", response_model=UserInfo)
def login(payload: LoginRequest, response: Response) -> UserInfo:
    if payload.username != settings.lore_username or not verify_password(payload.password, settings.lore_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_token({"sub": settings.lore_username})
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.cookie_max_age_seconds,
        path="/",
    )
    return UserInfo(username=settings.lore_username)


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(key=settings.cookie_name, path="/")
    return {"status": "ok"}


@router.get("/me", response_model=UserInfo)
def me(_user: dict[str, str] = Depends(require_auth)) -> UserInfo:
    return UserInfo(username=settings.lore_username)
