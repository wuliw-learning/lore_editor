from datetime import UTC, datetime, timedelta

import jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, env_password: str) -> bool:
    if env_password.startswith("$2"):
        return pwd_context.verify(plain_password, env_password)
    return plain_password == env_password


def create_token(payload: dict[str, str]) -> str:
    data = payload.copy()
    data["exp"] = datetime.now(UTC) + timedelta(seconds=settings.cookie_max_age_seconds)
    return jwt.encode(data, settings.secret_key, algorithm="HS256")


def decode_token(token: str) -> dict[str, str] | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        sub = payload.get("sub")
        if not sub:
            return None
        return {"sub": sub}
    except jwt.PyJWTError:
        return None
