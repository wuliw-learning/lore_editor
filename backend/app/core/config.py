from pathlib import Path

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Lore"
    lore_username: str = Field(default="admin", alias="LORE_USERNAME")
    lore_password: str = Field(default="change_me_strong_password", alias="LORE_PASSWORD")
    secret_key: str = Field(default="change_me_secret_key", alias="SECRET_KEY")
    database_url: str = Field(default="sqlite:///./data/lore.db", alias="DATABASE_URL")
    upload_dir: str = Field(default="./storage/uploads", alias="UPLOAD_DIR")
    max_upload_size_mb: int = Field(default=20, alias="MAX_UPLOAD_SIZE_MB")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8080, alias="APP_PORT")
    cookie_name: str = "lore_session"
    cookie_max_age_seconds: int = 60 * 60 * 24 * 7

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def sqlite_path(self) -> Path | None:
        prefix = "sqlite:///"
        if self.database_url.startswith(prefix):
            return Path(self.database_url.replace(prefix, "", 1))
        return None


settings = Settings()
