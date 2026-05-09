from fastapi import APIRouter, Depends

from app.api.deps import require_auth
from app.core.config import settings


router = APIRouter()


@router.get("/info")
def app_info(_user: dict[str, str] = Depends(require_auth)) -> dict[str, str | int]:
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "description": "Compact self-hosted notebook for one user.",
        "max_upload_size_mb": settings.max_upload_size_mb,
        "username": settings.lore_username,
    }
