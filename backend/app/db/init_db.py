import shutil
from pathlib import Path

from app.core.config import settings
from app.db.base import *  # noqa: F403
from app.db.session import Base, engine


def migrate_legacy_storage() -> None:
    sqlite_path = settings.sqlite_path
    if sqlite_path:
        legacy_db = settings.project_root / "backend" / "data" / sqlite_path.name
        if legacy_db.exists() and not sqlite_path.exists():
            sqlite_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(legacy_db, sqlite_path)

    legacy_upload_dir = settings.project_root / "backend" / "storage" / "uploads"
    target_upload_dir = settings.resolved_upload_dir
    if legacy_upload_dir.exists() and legacy_upload_dir != target_upload_dir:
        target_upload_dir.mkdir(parents=True, exist_ok=True)
        for item in legacy_upload_dir.iterdir():
            target_item = target_upload_dir / item.name
            if target_item.exists():
                continue
            shutil.move(str(item), str(target_item))


def init_db() -> None:
    migrate_legacy_storage()
    sqlite_path = settings.sqlite_path
    if sqlite_path:
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    settings.resolved_upload_dir.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
