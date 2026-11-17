from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_employee_salaries():
    response = client.get("/api/employees/1/salaries")

    assert response.status_code == 200

    salaries = response.json()

    assert isinstance(salaries, list)
    assert len(salaries) >= 1

    salary = salaries[0]

    assert salary["employee_id"] == 1
    assert "basic_salary" in salary
    assert "allowances" in salary
    assert "bonus" in salary
    assert "deductions" in salary
    assert "currency" in salary


def test_get_salaries_for_non_existing_employee():
    response = client.get("/api/employees/999999/salaries")

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"