import csv
import io


def codes(response):
    return [e["employee_code"] for e in response.json()]


def test_list_returns_all_with_names(client, seeded):
    response = client.get("/api/employees/")

    assert response.status_code == 200
    assert codes(response) == ["ACME00001", "ACME00002", "ACME00003", "ACME00004"]
    first = response.json()[0]
    assert first["department_name"] == "Engineering"
    assert first["country_name"] == "India"


def test_pagination(client, seeded):
    response = client.get("/api/employees/?skip=1&limit=2")

    assert codes(response) == ["ACME00002", "ACME00003"]


def test_search_by_code_name_and_email(client, seeded):
    assert codes(client.get("/api/employees/?search=ACME00003")) == ["ACME00003"]
    assert codes(client.get("/api/employees/?search=ben")) == ["ACME00002"]
    assert codes(client.get("/api/employees/?search=acme00004@")) == ["ACME00004"]


def test_filters_combine(client, seeded):
    response = client.get(
        f"/api/employees/?department_id={seeded['hr'].id}&country_id={seeded['usa'].id}"
    )
    assert codes(response) == ["ACME00003"]
    assert codes(client.get("/api/employees/?status=inactive")) == ["ACME00004"]


def test_invalid_status_rejected(client, seeded):
    assert client.get("/api/employees/?status=retired").status_code == 422


def test_count_respects_filters(client, seeded):
    assert client.get("/api/employees/count").json() == {"total_employees": 4}
    filtered = client.get(f"/api/employees/count?country_id={seeded['usa'].id}")
    assert filtered.json() == {"total_employees": 2}


def test_get_single_employee_and_404(client, seeded):
    assert client.get("/api/employees/1").json()["employee_code"] == "ACME00001"
    assert client.get("/api/employees/999").status_code == 404


def test_create_employee_generates_code_and_initial_salary(client, seeded):
    response = client.post(
        "/api/employees/",
        json={
            "first_name": "Eve",
            "last_name": "Miller",
            "email": "eve@example.com",
            "department_id": seeded["eng"].id,
            "country_id": seeded["usa"].id,
            "joining_date": "2024-03-01",
            "salary": {
                "basic_salary": 90000,
                "currency": "usd",
                "effective_from": "2024-03-01",
            },
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["employee_code"] == "ACME00005"
    assert body["status"] == "active"

    history = client.get(f"/api/employees/{body['id']}/salaries").json()
    assert len(history) == 1
    assert history[0]["currency"] == "USD"
    assert history[0]["effective_to"] is None


def test_create_rejects_duplicate_email(client, seeded):
    payload = {
        "first_name": "Dup",
        "last_name": "Licate",
        "email": "acme00001@example.com",
        "department_id": seeded["eng"].id,
        "country_id": seeded["usa"].id,
        "joining_date": "2024-03-01",
    }
    assert client.post("/api/employees/", json=payload).status_code == 409


def test_create_rejects_unknown_department_and_bad_email(client, seeded):
    base = {
        "first_name": "X",
        "last_name": "Y",
        "email": "x@example.com",
        "department_id": 999,
        "country_id": seeded["usa"].id,
        "joining_date": "2024-03-01",
    }
    assert client.post("/api/employees/", json=base).status_code == 400
    assert client.post("/api/employees/", json={**base, "email": "nope"}).status_code == 422


def test_partial_update_changes_only_given_fields(client, seeded):
    response = client.patch(
        "/api/employees/1",
        json={"designation": "Staff Engineer", "department_id": seeded["hr"].id},
    )

    body = response.json()
    assert response.status_code == 200
    assert body["designation"] == "Staff Engineer"
    assert body["department_name"] == "Human Resources"
    assert body["first_name"] == "Asha"


def test_delete_deactivates_and_keeps_salary_history(client, seeded):
    response = client.delete("/api/employees/1")

    assert response.status_code == 200
    assert response.json()["status"] == "inactive"
    assert len(client.get("/api/employees/1/salaries").json()) == 1


def test_export_csv_respects_filters_and_includes_salary(client, seeded):
    response = client.get(f"/api/employees/export?country_id={seeded['india'].id}")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    rows = list(csv.DictReader(io.StringIO(response.text)))
    assert [r["employee_code"] for r in rows] == ["ACME00001", "ACME00004"]
    assert rows[0]["currency"] == "INR"
    assert float(rows[0]["basic_salary"]) == 100000
