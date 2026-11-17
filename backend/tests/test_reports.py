import csv
import io

URL = "/api/reports/employees"


def codes(body):
    return [r["employee_code"] for r in body["items"]]


def test_unfiltered_report_has_totals_and_rows(client, seeded):
    body = client.get(URL).json()

    assert (body["total"], body["active"], body["inactive"]) == (4, 3, 1)
    assert codes(body) == ["ACME00001", "ACME00002", "ACME00003", "ACME00004"]
    first = body["items"][0]
    assert first["name"] == "Asha Rao"
    assert first["department"] == "Engineering"
    assert first["currency"] == "INR"
    assert first["net_salary"] == 110000


def test_summary_is_split_by_currency(client, seeded):
    summary = {s["currency"]: s for s in client.get(URL).json()["salary_summary"]}

    assert set(summary) == {"INR", "USD"}
    assert summary["INR"]["headcount"] == 2
    assert summary["INR"]["min_salary"] == 60000
    assert summary["INR"]["max_salary"] == 110000
    assert summary["INR"]["avg_salary"] == 85000
    assert summary["USD"]["total_salary"] == 200000


def test_filters_combine(client, seeded):
    body = client.get(f"{URL}?department_id={seeded['hr'].id}&status=active").json()

    assert codes(body) == ["ACME00003"]
    assert body["total"] == 1


def test_joining_date_range(client, seeded):
    assert client.get(f"{URL}?joined_from=2020-01-01&joined_to=2020-12-31").json()["total"] == 4
    assert client.get(f"{URL}?joined_from=2021-01-01").json()["total"] == 0


def test_salary_range_requires_currency_and_filters_by_it(client, seeded):
    assert client.get(f"{URL}?min_salary=1000").status_code == 422

    body = client.get(f"{URL}?currency=usd&min_salary=100000").json()
    assert codes(body) == ["ACME00002"]


def test_invalid_ranges_rejected(client, seeded):
    assert client.get(f"{URL}?joined_from=2024-01-02&joined_to=2024-01-01").status_code == 422
    assert client.get(f"{URL}?currency=USD&min_salary=10&max_salary=5").status_code == 422


def test_pagination_keeps_full_total(client, seeded):
    body = client.get(f"{URL}?skip=1&limit=2").json()

    assert body["total"] == 4
    assert codes(body) == ["ACME00002", "ACME00003"]


def test_empty_result_is_not_an_error(client, seeded):
    body = client.get(f"{URL}?currency=GBP").json()

    assert body["total"] == 0
    assert body["items"] == []
    assert body["salary_summary"] == []


def test_employee_without_salary_is_listed_with_blank_pay(client, seeded):
    client.post(
        "/api/employees/",
        json={
            "first_name": "No", "last_name": "Pay", "email": "nopay@example.com",
            "department_id": seeded["eng"].id, "country_id": seeded["usa"].id,
            "joining_date": "2024-01-01",
        },
    )

    body = client.get(f"{URL}?limit=100").json()
    nopay = next(r for r in body["items"] if r["name"] == "No Pay")
    assert nopay["net_salary"] is None
    assert body["total"] == 5


def test_csv_export_contains_all_matching_rows(client, seeded):
    response = client.get(f"{URL}/export?country_id={seeded['india'].id}")

    assert response.headers["content-type"].startswith("text/csv")
    rows = list(csv.DictReader(io.StringIO(response.text)))
    assert [r["employee_code"] for r in rows] == ["ACME00001", "ACME00004"]
    assert rows[0]["net_salary"] == "110000.0"
