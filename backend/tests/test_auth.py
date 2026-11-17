from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.services import auth
from app.services.auth import create_access_token, hash_password, verify_password

LOGIN = "/api/auth/login"
GOOD = {"email": "hr@acme.example", "password": "correct-horse"}


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_password_is_hashed_and_verifiable():
    hashed = hash_password("s3cret-pass")

    assert hashed != "s3cret-pass"
    assert verify_password("s3cret-pass", hashed)
    assert not verify_password("wrong", hashed)


def test_over_long_password_is_rejected_not_crashing():
    assert not verify_password("x" * 100, hash_password("short-one"))


def test_login_success_returns_token_and_user(raw_client, hr_user):
    response = raw_client.post(LOGIN, json=GOOD)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"] == {"id": hr_user.id, "email": "hr@acme.example", "full_name": "Hannah Roe"}
    assert "password" not in str(body)


def test_login_email_is_case_and_space_insensitive(raw_client, hr_user):
    response = raw_client.post(LOGIN, json={**GOOD, "email": "  HR@Acme.Example "})

    assert response.status_code == 200


@pytest.mark.parametrize(
    "payload",
    [
        {"email": "hr@acme.example", "password": "wrong-password"},
        {"email": "nobody@acme.example", "password": "correct-horse"},
        {"email": "hr@acme.example", "password": "x" * 200},
    ],
)
def test_bad_credentials_get_the_same_generic_401(raw_client, hr_user, payload):
    response = raw_client.post(LOGIN, json=payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_deactivated_user_cannot_log_in(raw_client, hr_user, db_session):
    hr_user.is_active = False
    db_session.commit()

    assert raw_client.post(LOGIN, json=GOOD).status_code == 401


def test_me_returns_current_user(raw_client, hr_user):
    token = raw_client.post(LOGIN, json=GOOD).json()["access_token"]

    response = raw_client.get("/api/auth/me", headers=bearer(token))

    assert response.status_code == 200
    assert response.json()["email"] == "hr@acme.example"


PROTECTED = [
    ("GET", "/api/employees/"),
    ("GET", "/api/employees/count"),
    ("GET", "/api/employees/export"),
    ("GET", "/api/employees/1"),
    ("POST", "/api/employees/"),
    ("PATCH", "/api/employees/1"),
    ("DELETE", "/api/employees/1"),
    ("GET", "/api/employees/1/salaries"),
    ("POST", "/api/employees/1/salaries"),
    ("GET", "/api/dashboard/overview"),
    ("GET", "/api/dashboard/departments"),
    ("GET", "/api/dashboard/countries"),
    ("GET", "/api/dashboard/salary-by-currency"),
    ("GET", "/api/departments"),
    ("GET", "/api/countries"),
    ("GET", "/api/analytics/salary-summary"),
    ("GET", "/api/auth/me"),
]


@pytest.mark.parametrize("method,path", PROTECTED)
def test_every_data_route_rejects_anonymous_requests(raw_client, seeded, method, path):
    assert raw_client.request(method, path).status_code == 401


@pytest.mark.parametrize("method,path", PROTECTED)
def test_every_data_route_rejects_a_garbage_token(raw_client, seeded, method, path):
    assert raw_client.request(method, path, headers=bearer("not.a.token")).status_code == 401


def test_health_stays_public(raw_client):
    assert raw_client.get("/health").status_code == 200


def test_valid_token_unlocks_data(raw_client, hr_user, seeded):
    token = raw_client.post(LOGIN, json=GOOD).json()["access_token"]

    response = raw_client.get("/api/employees/count", headers=bearer(token))

    assert response.status_code == 200
    assert response.json() == {"total_employees": 4}


def test_expired_token_is_rejected(raw_client, hr_user):
    old = datetime.now(timezone.utc) - timedelta(hours=24)
    token = create_access_token(hr_user, now=old)

    assert raw_client.get("/api/auth/me", headers=bearer(token)).status_code == 401


def test_token_signed_with_another_secret_is_rejected(raw_client, hr_user):
    forged = jwt.encode(
        {"sub": str(hr_user.id), "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        "attacker-secret",
        algorithm=auth.ALGORITHM,
    )

    assert raw_client.get("/api/auth/me", headers=bearer(forged)).status_code == 401


def test_token_stops_working_when_user_is_deactivated_or_deleted(raw_client, hr_user, db_session):
    token = raw_client.post(LOGIN, json=GOOD).json()["access_token"]

    hr_user.is_active = False
    db_session.commit()
    assert raw_client.get("/api/auth/me", headers=bearer(token)).status_code == 401

    db_session.delete(hr_user)
    db_session.commit()
    assert raw_client.get("/api/auth/me", headers=bearer(token)).status_code == 401
