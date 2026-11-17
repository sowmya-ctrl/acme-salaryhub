"""Hermetic test setup: every test gets a fresh in-memory SQLite database.

The app's module-level engine reads DATABASE_URL at import time, so we point it
at SQLite *before* importing the app. Tests never touch the real Postgres.
"""
import os
from datetime import date

os.environ["DATABASE_URL"] = "sqlite://"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Country, Department, Employee, SalaryRecord


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine, autoflush=False)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def seeded(db_session):
    """Small, known dataset: 2 countries, 2 departments, 4 employees.

    ACME00001 Asha Rao     Eng  India  active   INR 100000 (+20000 allow -10000 ded = 110000)
    ACME00002 Ben Smith    Eng  USA    active   USD 120000
    ACME00003 Cara Jones   HR   USA    active   USD  80000
    ACME00004 Dev Patel    HR   India  inactive INR  60000
    """
    india = Country(name="India", code="IND", currency_code="INR")
    usa = Country(name="United States", code="USA", currency_code="USD")
    eng = Department(name="Engineering")
    hr = Department(name="Human Resources")
    db_session.add_all([india, usa, eng, hr])
    db_session.flush()

    rows = [
        ("ACME00001", "Asha", "Rao", eng, india, "active", "INR", 100000, 20000, 0, 10000),
        ("ACME00002", "Ben", "Smith", eng, usa, "active", "USD", 120000, 0, 0, 0),
        ("ACME00003", "Cara", "Jones", hr, usa, "active", "USD", 80000, 0, 0, 0),
        ("ACME00004", "Dev", "Patel", hr, india, "inactive", "INR", 60000, 0, 0, 0),
    ]
    for code, first, last, dept, country, status, cur, basic, allow, bonus, ded in rows:
        emp = Employee(
            employee_code=code,
            first_name=first,
            last_name=last,
            email=f"{code.lower()}@example.com",
            designation="Engineer",
            department_id=dept.id,
            country_id=country.id,
            joining_date=date(2020, 1, 1),
            status=status,
        )
        db_session.add(emp)
        db_session.flush()
        db_session.add(
            SalaryRecord(
                employee_id=emp.id,
                basic_salary=basic,
                allowances=allow,
                bonus=bonus,
                deductions=ded,
                currency=cur,
                effective_from=date(2020, 1, 1),
            )
        )
    db_session.commit()
    return {"india": india, "usa": usa, "eng": eng, "hr": hr}
