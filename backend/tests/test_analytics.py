def by_group(rows):
    return {(r["group"], r["currency"]): r for r in rows}


def test_summary_by_department_splits_currency_and_defaults_to_active(client, seeded):
    rows = by_group(client.get("/api/analytics/salary-summary").json())

    # Engineering has one INR and one USD employee -> two separate rows, never summed.
    assert set(rows) == {
        ("Engineering", "INR"),
        ("Engineering", "USD"),
        ("Human Resources", "USD"),
    }  # inactive Dev Patel (HR, INR) excluded by default
    assert rows[("Engineering", "INR")]["avg_salary"] == 110000


def test_summary_min_max_avg_total(client, seeded):
    rows = by_group(
        client.get("/api/analytics/salary-summary?group_by=country&status=active").json()
    )

    usd = rows[("United States", "USD")]
    assert usd["headcount"] == 2
    assert usd["min_salary"] == 80000
    assert usd["max_salary"] == 120000
    assert usd["avg_salary"] == 100000
    assert usd["total_salary"] == 200000


def test_summary_includes_inactive_when_asked(client, seeded):
    rows = by_group(
        client.get("/api/analytics/salary-summary?group_by=country&status=inactive").json()
    )

    assert set(rows) == {("India", "INR")}
    assert rows[("India", "INR")]["total_salary"] == 60000


def test_summary_currency_filter_and_validation(client, seeded):
    rows = client.get("/api/analytics/salary-summary?currency=usd").json()
    assert {r["currency"] for r in rows} == {"USD"}

    assert client.get("/api/analytics/salary-summary?group_by=planet").status_code == 422
