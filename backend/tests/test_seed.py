"""The seed scripts are a deliverable ("seed script with 10,000 employees"), so they are tested too.

Each script opens its own session via `SessionLocal`; we point those at a throwaway in-memory database.
"""
import pytest
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import Country, Department, Employee, SalaryRecord, User
from app.seed import seed_admin as seed_admin_module
from app.seed import seed_data, seed_employees as seed_employees_module, seed_salaries as seed_salaries_module
from app.services.auth import verify_password


@pytest.fixture()
def seed_db(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine)
    for module in (seed_data, seed_employees_module, seed_salaries_module, seed_admin_module):
        monkeypatch.setattr(module, "SessionLocal", factory)
    # seed_admin also calls create_all on the app engine; make that harmless
    monkeypatch.setattr(seed_admin_module, "engine", engine)
    session = factory()
    yield session
    session.close()
    engine.dispose()


def count(session, model):
    return session.query(func.count(model.id)).scalar()


def test_reference_data_has_five_countries_and_departments_with_matching_currencies(seed_db):
    seed_data.seed_reference_data()

    assert count(seed_db, Country) == 5
    assert count(seed_db, Department) == 5
    currencies = {c.code: c.currency_code for c in seed_db.query(Country)}
    assert currencies == {"IND": "INR", "USA": "USD", "GBR": "GBP", "DEU": "EUR", "CAN": "CAD"}


def test_reference_data_is_idempotent(seed_db):
    seed_data.seed_reference_data()
    seed_data.seed_reference_data()

    assert count(seed_db, Country) == 5
    assert count(seed_db, Department) == 5


def test_employees_require_reference_data_first(seed_db):
    with pytest.raises(RuntimeError, match="Seed countries and departments"):
        seed_employees_module.seed_employees(total=10)


def test_employee_seed_creates_unique_sequential_codes_and_valid_rows(seed_db):
    seed_data.seed_reference_data()

    seed_employees_module.seed_employees(total=25)

    codes = [code for (code,) in seed_db.query(Employee.employee_code).order_by(Employee.employee_code)]
    assert codes == [f"ACME{n:05d}" for n in range(1, 26)]
    assert {e.status for e in seed_db.query(Employee)} <= {"active", "inactive"}
    assert all(e.email == f"{e.employee_code.lower()}@example.com" for e in seed_db.query(Employee))


def test_employee_seed_spans_batches(seed_db):
    seed_data.seed_reference_data()

    seed_employees_module.seed_employees(total=2500)  # three batches of up to 1,000

    assert count(seed_db, Employee) == 2500


def test_employee_seed_is_deterministic(seed_db):
    seed_data.seed_reference_data()
    seed_employees_module.seed_employees(total=30)
    first = [(e.first_name, e.country_id, e.department_id, e.joining_date) for e in seed_db.query(Employee).order_by(Employee.id)]
    seed_db.query(Employee).delete()
    seed_db.commit()

    seed_employees_module.seed_employees(total=30)
    second = [(e.first_name, e.country_id, e.department_id, e.joining_date) for e in seed_db.query(Employee).order_by(Employee.id)]

    assert first == second


def test_employee_seed_is_idempotent(seed_db):
    seed_data.seed_reference_data()
    seed_employees_module.seed_employees(total=40)

    seed_employees_module.seed_employees(total=40)

    assert count(seed_db, Employee) == 40


def test_salary_seed_gives_every_employee_one_open_record_in_their_country_currency(seed_db):
    seed_data.seed_reference_data()
    seed_employees_module.seed_employees(total=60)

    seed_salaries_module.seed_salaries()

    assert count(seed_db, SalaryRecord) == 60
    for employee in seed_db.query(Employee):
        records = seed_db.query(SalaryRecord).filter_by(employee_id=employee.id).all()
        assert len(records) == 1
        record = records[0]
        assert record.effective_to is None
        assert record.effective_from == employee.joining_date
        assert record.currency == employee.country.currency_code


def test_salary_seed_amounts_are_positive_and_within_currency_range(seed_db):
    seed_data.seed_reference_data()
    seed_employees_module.seed_employees(total=60)
    seed_salaries_module.seed_salaries()

    for record in seed_db.query(SalaryRecord):
        low, high = seed_salaries_module.SALARY_RANGES[record.currency]
        assert low <= record.basic_salary <= high
        assert record.allowances > 0 and record.bonus > 0 and record.deductions > 0


def test_salary_seed_is_idempotent(seed_db):
    seed_data.seed_reference_data()
    seed_employees_module.seed_employees(total=20)
    seed_salaries_module.seed_salaries()

    seed_salaries_module.seed_salaries()

    assert count(seed_db, SalaryRecord) == 20


@pytest.mark.slow  # ~8 s: run with `pytest -m slow`
def test_default_seed_produces_exactly_10000_employees_with_salaries(seed_db):
    seed_data.seed_reference_data()

    seed_employees_module.seed_employees()
    seed_salaries_module.seed_salaries()

    assert count(seed_db, Employee) == 10_000
    assert count(seed_db, SalaryRecord) == 10_000
    assert seed_db.query(Employee).filter_by(status="inactive").count() > 0  # realistic mix
    assert seed_db.query(Employee).filter_by(status="active").count() > 0


def test_admin_seed_creates_hashed_user_from_environment(seed_db, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", " HR@Acme.Example ")
    monkeypatch.setenv("ADMIN_PASSWORD", "a-strong-password")
    monkeypatch.setenv("ADMIN_NAME", "Hannah Roe")

    seed_admin_module.seed_admin()

    user = seed_db.query(User).one()
    assert user.email == "hr@acme.example"
    assert user.full_name == "Hannah Roe"
    assert user.password_hash != "a-strong-password"
    assert verify_password("a-strong-password", user.password_hash)


def test_admin_seed_never_overwrites_an_existing_user(seed_db, monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "hr@acme.example")
    monkeypatch.setenv("ADMIN_PASSWORD", "first-password")
    seed_admin_module.seed_admin()
    monkeypatch.setenv("ADMIN_PASSWORD", "second-password")

    seed_admin_module.seed_admin()

    user = seed_db.query(User).one()
    assert verify_password("first-password", user.password_hash)
    assert not verify_password("second-password", user.password_hash)


def test_admin_seed_without_a_password_creates_nobody(seed_db, monkeypatch, capsys):
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)

    seed_admin_module.seed_admin()

    assert count(seed_db, User) == 0
    assert "ADMIN_PASSWORD is not set" in capsys.readouterr().out


def test_admin_seed_rejects_a_too_short_password(seed_db, monkeypatch):
    monkeypatch.setenv("ADMIN_PASSWORD", "short")

    with pytest.raises(SystemExit):
        seed_admin_module.seed_admin()

    assert count(seed_db, User) == 0


def test_run_all_seeds_in_dependency_order(monkeypatch):
    """Reference data must exist before employees, and employees before salaries."""
    from app.seed import run_all

    calls = []
    monkeypatch.setattr(run_all.Base.metadata, "create_all", lambda bind: calls.append("tables"))
    for name in ("seed_reference_data", "seed_employees", "seed_salaries", "seed_admin"):
        monkeypatch.setattr(run_all, name, lambda name=name: calls.append(name))

    run_all.main()

    assert calls == ["tables", "seed_reference_data", "seed_employees", "seed_salaries", "seed_admin"]
