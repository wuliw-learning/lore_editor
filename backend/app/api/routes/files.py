import mimetypes
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_auth
from app.core.config import settings
from app.models.uploaded_file import UploadedFileModel
from app.schemas.file import FileItem


router = APIRouter()


@router.get("", response_model=list[FileItem])
def list_files(
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> list[FileItem]:
    files = db.scalars(select(UploadedFileModel).order_by(UploadedFileModel.created_at.desc())).all()
    return [FileItem.model_validate(item) for item in files]


@router.post("", response_model=FileItem, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> FileItem:
    data = await file.read()
    size_limit = settings.max_upload_size_mb * 1024 * 1024
    if len(data) > size_limit:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File exceeds upload limit")

    upload_dir = settings.resolved_upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "").suffix
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    full_path = upload_dir / stored_name
    full_path.write_bytes(data)

    mime_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    model = UploadedFileModel(
        original_name=file.filename or stored_name,
        stored_name=stored_name,
        size=len(data),
        mime_type=mime_type,
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return FileItem.model_validate(model)


@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> FileResponse:
    item = db.get(UploadedFileModel, file_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    file_path = settings.resolved_upload_dir / item.stored_name
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")

    return FileResponse(path=file_path, filename=item.original_name, media_type=item.mime_type)


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> dict[str, str]:
    item = db.get(UploadedFileModel, file_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    file_path = settings.resolved_upload_dir / item.stored_name
    if file_path.exists():
        os.remove(file_path)
    db.delete(item)
    db.commit()
    return {"status": "ok"}
