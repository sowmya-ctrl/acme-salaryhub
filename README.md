# ACME SalaryHub

Salary management for an organisation of ~10,000 employees across several countries. Built for an HR manager who needs to maintain salary data and answer questions about how the organisation pays people.

| | |
|---|---|
| **Live app** | _add the Render URL after deploying_ |
| **Demo video** | _add the video link after recording_ |
| **Login for reviewers** | `hr@acme.example` (password shared privately) |

* **Requirements and scope decisions:** [docs/requirements.md](docs/requirements.md)
* **Architecture diagrams (system, data model, salary revision, login):** [docs/architecture.md](docs/architecture.md)
* **Planning, product decisions and how the solution evolved:** [docs/design-notes.md](docs/design-notes.md)
* **The prompts used with the AI assistant, with outcomes and corrections:** [docs/prompts.md](docs/prompts.md)
* **How AI was used, trade-offs, performance:** [docs/ai-usage.md](docs/ai-usage.md)

## What it does
* **Login / logout** for the HR manager; every data endpoint requires a token.
* **Dashboard** on one screen: headcount, salary expenditure per currency, department and country distribution, quick actions.
* **Employees:** search by name, ID or email; filter by department, country and status (applied on **Search**); add, edit, deactivate and re-activate; export the filtered list to CSV.
* **Salaries:** full history per employee. A raise closes the current record and adds a new one, so nothing is ever overwritten.
* **Salary analytics:** min / average / max / total *current* pay by department or country, always split by currency (currencies are never added together).
* **10,000 seeded employees** across 5 countries and 5 departments.

## Stack
FastAPI, SQLAlchemy, PostgreSQL, React (Vite), Material UI, Recharts, Pytest, Vitest + React Testing Library.

## Run locally
Prerequisites: Python 3.12, Node 20.19+ (or 22.12+), a PostgreSQL database.

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

### Or run everything in Docker
```bash
docker build -t salaryhub .
docker run -p 8000:8000 -e DATABASE_URL=postgresql+psycopg://user:password@host:5432/db   -e JWT_SECRET=<random> -e ADMIN_PASSWORD=<8+ chars> -e SEED_ON_START=true salaryhub
# open http://localhost:8000  (the API serves the built UI)
```

## Tests
```bash
cd backend && python -m pytest -q      # in-memory SQLite, no database needed, a few seconds
cd backend && python -m pytest -m slow # also seeds the full 10,000 employees (about 8 s)
cd backend && python -m pytest --cov   # with coverage (about 95% of lines)
cd frontend && npm test                # Vitest + React Testing Library
cd frontend && npm run test:coverage   # with coverage (about 92% of lines)
cd frontend && npm run lint            # oxlint: no warnings
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
| `GET /api/employees/{id}` | One employee |
| `GET /api/departments`, `GET /api/countries` | Lists for the filter dropdowns |
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
