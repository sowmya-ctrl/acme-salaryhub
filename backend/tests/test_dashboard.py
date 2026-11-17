from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_dashboard_overview():
    response = client.get("/api/dashboard/overview")

    assert response.status_code == 200

    data = response.json()

    assert data["total_employees"] == 10000
    assert data["active_employees"] + data["inactive_employees"] == 10000


def test_department_distribution():
    response = client.get("/api/dashboard/departments")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 5

    total_employees = sum(
        department["employee_count"]
        for department in data
    )

    assert total_employees == 10000


def test_country_distribution():
    response = client.get("/api/dashboard/countries")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 5

    total_employees = sum(
        country["employee_count"]
        for country in data
    )

    assert total_employees == 10000

    country_codes = {
        country["country_code"]
        for country in data
    }

    assert country_codes == {"CAN", "DEU", "IND", "GBR", "USA"}