# ACME SalaryHub

Salary management for an organisation of ~10,000 employees across several countries. Built for an HR manager who needs to maintain salary data and answer questions about how the organisation pays people.

* **Requirements and scope decisions:** [docs/requirements.md](docs/requirements.md)
* **Architecture diagrams (system, data model, salary revision, login):** [docs/architecture.md](docs/architecture.md)
* **Planning, product decisions and how the solution evolved:** [docs/design-notes.md](docs/design-notes.md)
* **The prompts used with the AI assistant, with outcomes and corrections:** [docs/prompts.md](docs/prompts.md)
* **How AI was used, trade-offs, performance:** [docs/ai-usage.md](docs/ai-usage.md)

## Stack
FastAPI, SQLAlchemy, PostgreSQL, React (Vite), Material UI, Recharts, Pytest, Vitest + React Testing Library.

## Run locally
Prerequisites: Python 3.12, Node 20+, a PostgreSQL database.

```bash
# backend
cd backend
python -m venv venv && venv/Scripts/activate        # source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
# backend/.env (never commit it):
#   DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/acme_salaryhub
#   JWT_SECRET=<long random string>      # python -c "import secrets; print(secrets.token_urlsafe(48))"
#   ADMIN_EMAIL=hr@acme.example
#   ADMIN_PASSWORD=<at least 8 characters>
python -m app.seed.run_all                           # tables + 10,000 employees + your login (idempotent)
uvicorn app.main:app --reload                        # http://127.0.0.1:8000/docs

# frontend (separate terminal; proxies /api to :8000)
cd frontend
npm install
npm run dev                                          # http://localhost:5173
```

## Signing in
Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your environment. There is no default password. The user is created by the seed script; to add it to an already-seeded database run `python -m app.seed.seed_admin`. An existing user is never overwritten.

* Passwords are stored as bcrypt hashes; sessions are signed JWTs valid for 8 hours (`JWT_EXPIRE_HOURS`).
* Set `JWT_SECRET`. If it is missing the server generates a temporary one, and everyone is logged out on each restart.
* Logout removes the token in the browser. Tokens are stateless, so the server cannot cancel one early (see [docs/ai-usage.md](docs/ai-usage.md)).

## Tests
```bash
cd backend && python -m pytest -q      # in-memory SQLite, no database needed, a few seconds
cd backend && python -m pytest -m slow # also seeds the full 10,000 employees (about 8 s)
cd frontend && npm test                # Vitest + React Testing Library
```

## Deploy
One Docker image serves the API and the built UI (`Dockerfile`). `render.yaml` is a Render blueprint that provisions Postgres and a web service and seeds the 10,000 demo employees on first boot (`SEED_ON_START=true`).

1. Push the repo to GitHub.
2. In Render: New → Blueprint → select the repo.
3. Open the generated URL and sign in as `hr@acme.example`. Render generates `ADMIN_PASSWORD` and `JWT_SECRET`; read the password in the service's **Environment** tab and share it with reviewers privately, not in the repo.

## API overview
| Endpoint | Purpose |
|---|---|
| `POST /api/auth/login`, `GET /api/auth/me` | Sign in / current user. **Every other `/api/*` endpoint requires `Authorization: Bearer <token>`** |
| `GET /api/employees/` | Search, filter, paginate |
| `GET /api/employees/count` | Count for the same filters |
| `POST /api/employees/`, `PATCH /{id}`, `DELETE /{id}` | Create, update, deactivate (history preserved) |
| `GET/POST /api/employees/{id}/salaries` | Salary history; add a revision |
| `GET /api/employees/export` | CSV of the filtered view |
| `GET /api/analytics/salary-summary` | Min/avg/max/total by department or country, per currency |
| `GET /api/dashboard/*` | Overview, department, country and currency breakdowns |

Interactive docs at `/docs`.

## Existing databases
If your database was created before the indexes were added to the models, run once:
```sql
CREATE INDEX IF NOT EXISTS ix_employees_department_id ON employees (department_id);
CREATE INDEX IF NOT EXISTS ix_employees_country_id ON employees (country_id);
CREATE INDEX IF NOT EXISTS ix_employees_status ON employees (status);
CREATE INDEX IF NOT EXISTS ix_salary_records_employee_id ON salary_records (employee_id);
```
