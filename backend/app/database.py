import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


#load environment variables from backenc/.env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE URL not configured")

# Hosted Postgres providers hand out "postgres://" / "postgresql://" URLs;
# normalise them to the psycopg (v3) driver we ship.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

#create postgresql engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping = True,
)

#Create Database Sessions
SessionLocal = sessionmaker(
    autocommit = False,
    autoflush = False,
    bind = engine,
)

# Base Class For Database Models
Base = declarative_base()

#Database dependency for FastAPI endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()