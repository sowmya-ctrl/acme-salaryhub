from fastapi.testclient import TestClient
from app.main import app

Client = TestClient(app)

def test_home_endpoint():
    response  = Client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message":"Welecome to ACME SalaryHub API",
        "status" : "running",
    }


def test_health_endpoint():
    response = Client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status" : "healty",
        "application" : "ACME SalaryHub",
    }