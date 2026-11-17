from datetime import date


def revision(**overrides):
    body = {
        "basic_salary": 120000,
        "allowances": 15000,
        "bonus": 10000,
        "deductions": 5000,
        "currency": "INR",
        "effective_from": "2024-01-01",
    }
    return {**body, **overrides}


def test_get_employee_salaries(client, seeded):
    response = client.get("/api/employees/1/salaries")

    assert response.status_code == 200
    salaries = response.json()
    assert len(salaries) == 1
    assert salaries[0]["employee_id"] == 1
    assert float(salaries[0]["basic_salary"]) == 100000


def test_salaries_for_unknown_employee_404(client, seeded):
    response = client.get("/api/employees/999/salaries")

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found"


def test_revision_closes_previous_record_and_preserves_history(client, seeded):
    response = client.post("/api/employees/1/salaries", json=revision())

    assert response.status_code == 201
    assert response.json()["effective_to"] is None

    history = client.get("/api/employees/1/salaries").json()
    assert len(history) == 2  # nothing overwritten
    newest, oldest = history  # ordered newest first
    assert float(newest["basic_salary"]) == 120000
    assert float(oldest["basic_salary"]) == 100000
    assert oldest["effective_to"] == "2023-12-31"  # day before the revision


def test_revision_must_be_later_than_current(client, seeded):
    response = client.post("/api/employees/1/salaries", json=revision(effective_from="2020-01-01"))

    assert response.status_code == 400


def test_revision_validation(client, seeded):
    assert client.post("/api/employees/1/salaries", json=revision(basic_salary=0)).status_code == 422
    assert client.post("/api/employees/1/salaries", json=revision(currency="RUPEES")).status_code == 422
    assert client.post("/api/employees/1/salaries", json=revision(bonus=-1)).status_code == 422


def test_revision_for_unknown_employee_404(client, seeded):
    assert client.post("/api/employees/999/salaries", json=revision()).status_code == 404


def test_future_dated_revision_is_not_counted_as_current(client, seeded):
    future = date.today().replace(year=date.today().year + 1).isoformat()
    client.post("/api/employees/1/salaries", json=revision(basic_salary=999999, effective_from=future))

    summary = client.get("/api/analytics/salary-summary?group_by=country&currency=INR").json()
    india = next(r for r in summary if r["group"] == "India")
    assert india["max_salary"] == 110000  # still the old record
