from pathlib import Path

from app.core.config import settings
from app.db.base import *  # noqa: F403
from app.db.session import Base, engine


def init_db() -> None:
    sqlite_path = settings.sqlite_path
    if sqlite_path:
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
