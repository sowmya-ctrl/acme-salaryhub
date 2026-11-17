"""Create the first HR manager login: python -m app.seed.seed_admin

Reads ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME from the environment. There is deliberately
no default password. An existing user is never modified, so re-running is safe.
"""
import os

from app.database import Base, SessionLocal, engine
from app.models import User
from app.services.auth import hash_password

MIN_PASSWORD_LENGTH = 8


def seed_admin() -> None:
    password = os.getenv("ADMIN_PASSWORD")
    if not password:
        print("ADMIN_PASSWORD is not set: skipping admin user (nobody will be able to log in).")
        return
    if len(password) < MIN_PASSWORD_LENGTH:
        raise SystemExit(f"ADMIN_PASSWORD must be at least {MIN_PASSWORD_LENGTH} characters.")

    email = os.getenv("ADMIN_EMAIL", "hr@acme.example").strip().lower()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            print(f"Admin user {email} already exists; left unchanged.")
            return
        db.add(
            User(
                email=email,
                full_name=os.getenv("ADMIN_NAME", "HR Manager"),
                password_hash=hash_password(password),
            )
        )
        db.commit()
        print(f"Created admin user {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
