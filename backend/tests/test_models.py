from app.database import Base
from app.models import Country, Department, Employee, SalaryRecord


def test_all_models_are_registered():
    expected_tables = {
        "countries",
        "departments",
        "employees",
        "salary_records",
    }

    assert expected_tables.issubset(Base.metadata.tables.keys())


def test_employee_relationships():
    assert hasattr(Employee, "country")
    assert hasattr(Employee, "department")
    assert hasattr(Employee, "salary_records")


def test_salary_record_relationship():
    assert hasattr(SalaryRecord, "employee")