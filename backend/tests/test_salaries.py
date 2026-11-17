from fastapi.testclient import TestClient

from app.main import app
from datetime import date, timedelta
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


# def test_create_salary_revision():
#     response = client.post(
#         "/api/employees/1/salaries",
#         json={
#             "basic_salary": 100000,
#             "allowances": 15000,
#             "bonus": 10000,
#             "deductions": 5000,
#             "currency": "INR",
#             "effective_from": "2027-01-01",
#         },
#     )
#     print("API response:", response.json())

#     assert response.status_code == 201

#     data = response.json()

#     assert data["employee_id"] == 1
#     assert float(data["basic_salary"]) == 100000
#     assert data["currency"] == "INR"
#     assert data["effective_to"] is None

def test_create_salary_revision():
    history_response = client.get("/api/employees/1/salaries")
    assert history_response.status_code == 200

    salary_history = history_response.json()

    latest_salary = max(
        salary_history,
        key=lambda salary: salary["effective_from"],
    )

    latest_date = date.fromisoformat(
        latest_salary["effective_from"]
    )

    next_date = latest_date + timedelta(days=1)

    response = client.post(
        "/api/employees/1/salaries",
        json={
            "basic_salary": 100000,
            "allowances": 15000,
            "bonus": 10000,
            "deductions": 5000,
            "currency": latest_salary["currency"],
            "effective_from": next_date.isoformat(),
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["employee_id"] == 1
    assert float(data["basic_salary"]) == 100000
    assert data["currency"] == latest_salary["currency"]
    assert data["effective_to"] is None
def test_salary_revision_for_invalid_employee():
    response = client.post(
        "/api/employees/999999/salaries",
        json={
            "basic_salary": 100000,
            "allowances": 15000,
            "bonus": 10000,
            "deductions": 5000,
            "currency": "INR",
            "effective_from": "2027-01-01",
        },
    )

    assert response.status_code == 404