from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_employees():
    response = client.get("/api/employees/")

    assert response.status_code == 200
    assert len(response.json()) == 20


def test_employee_pagination():
    response = client.get("/api/employees/?skip=20&limit=10")

    assert response.status_code == 200
    assert len(response.json()) == 10


def test_search_employee():
    response = client.get("/api/employees/?search=ACME00001")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["employee_code"] == "ACME00001"


def test_employee_count():
    response = client.get("/api/employees/count")

    assert response.status_code == 200
    assert response.json()["total_employees"] == 10000