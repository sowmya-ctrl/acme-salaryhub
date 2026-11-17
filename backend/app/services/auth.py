"""Authentication: password hashing, JWT access tokens and the request guard.

Design notes
* Passwords are hashed with bcrypt directly (passlib is unmaintained and breaks on bcrypt 5).
* Tokens are short-lived, stateless JWTs. "Logout" therefore discards the token on the client;
  the server cannot revoke an issued token before it expires (see docs/ai-usage.md).
* The signing secret comes from JWT_SECRET. If it is not set we generate a random one for this
  process, so there is never a hard-coded secret, but tokens stop working on restart.
"""
import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(hours=int(os.getenv("JWT_EXPIRE_HOURS", "8")))
BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))
MAX_PASSWORD_BYTES = 72  # bcrypt ignores (and bcrypt 5 rejects) anything longer

_secret = os.getenv("JWT_SECRET")
if not _secret:
    _secret = secrets.token_urlsafe(48)
    logger.warning("JWT_SECRET is not set: using a random per-process secret; logins reset on restart.")

_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode()


# Verified when the email is unknown, so response time does not reveal which emails exist.
_DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def verify_password(password: str, password_hash: str) -> bool:
    raw = password.encode()
    if len(raw) > MAX_PASSWORD_BYTES:
        return False
    try:
        return bcrypt.checkpw(raw, password_hash.encode())
    except ValueError:
        return False


def create_access_token(user: User, now: datetime | None = None) -> str:
    now = now or datetime.now(timezone.utc)
    claims = {"sub": str(user.id), "iat": now, "exp": now + TOKEN_LIFETIME}
    return jwt.encode(claims, _secret, algorithm=ALGORITHM)


def authenticate(db: Session, email: str, password: str) -> User | None:
    """Return the user for valid credentials, otherwise None (never says which part was wrong)."""
    user = db.query(User).filter(User.email == email.strip().lower()).first()
    if user is None:
        verify_password(password, _DUMMY_HASH)
        return None
    if not verify_password(password, user.password_hash) or not user.is_active:
        return None
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        claims = jwt.decode(credentials.credentials, _secret, algorithms=[ALGORITHM])
        user_id = int(claims["sub"])
    except (JWTError, KeyError, ValueError):
        raise unauthorized
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user
