def test_dashboard_overview(client, seeded):
    data = client.get("/api/dashboard/overview").json()

    assert data == {"total_employees": 4, "active_employees": 3, "inactive_employees": 1}


def test_department_distribution(client, seeded):
    data = client.get("/api/dashboard/departments").json()

    assert {d["department"]: d["employee_count"] for d in data} == {
        "Engineering": 2,
        "Human Resources": 2,
    }


def test_country_distribution(client, seeded):
    data = client.get("/api/dashboard/countries").json()

    assert {c["country_code"]: c["employee_count"] for c in data} == {"IND": 2, "USA": 2}


def test_salary_by_currency_never_mixes_currencies(client, seeded):
    data = {r["currency"]: r for r in client.get("/api/dashboard/salary-by-currency").json()}

    assert set(data) == {"INR", "USD"}
    assert float(data["INR"]["total_salary"]) == 110000 + 60000  # 100k+20k-10k, 60k
    assert float(data["USD"]["total_salary"]) == 200000
    assert data["USD"]["employee_count"] == 2


def test_reference_lists(client, seeded):
    departments = client.get("/api/departments").json()
    countries = client.get("/api/countries").json()

    assert [d["name"] for d in departments] == ["Engineering", "Human Resources"]
    assert {c["code"]: c["currency_code"] for c in countries} == {"IND": "INR", "USA": "USD"}
