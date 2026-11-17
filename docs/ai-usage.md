# How AI was used, and engineering notes

## Workflow
Claude Code (agentic CLI in VS Code) was used throughout, with me steering scope and reviewing every change.

1. **Requirements first.** Wrote and scoped the requirements document before code, then re-trimmed it to what was actually built so it does not over-promise (see "Scope corrections" below).
2. **Vertical slices, one commit each.** Employee API, then salary history and revisions, then dashboard, country and currency analytics, then the UI, then CRUD / analytics / export, then deployment. `git log` shows the order.
3. **Tests alongside features.** The AI proposed tests; I checked they assert behaviour (for example, "revision closes the previous record the day before") rather than implementation.
4. **Verify against real data.** After tests passed, the API was smoke-tested against the seeded 10,000-row Postgres to catch anything the small fixtures could not.

## Representative prompts
* "Design the data model so salary changes never overwrite history and a future-dated raise is not counted as current pay."
* "Review the existing tests: which depend on live seeded Postgres and mutate it? Replace them with hermetic tests using a small known dataset."
* "The employee table's total count ignores filters, so pagination is wrong when searching. Find the root cause and fix it for list, count and export together."
* "Add salary analytics (min / avg / max / total) by department or country. Never sum across currencies."
* "Write a Dockerfile that builds the React app and serves it from FastAPI, plus a Render blueprint that seeds on first boot."

## Issues found while reviewing the AI-assisted code
| Finding | Fix |
|---|---|
| `/employees/count` ignored search / filters, so pagination totals were wrong | Count shares `apply_employee_filters` with list and export |
| Backend tests depended on a seeded live database, and the revision test wrote to it | In-memory SQLite fixture with a 4-employee dataset (`tests/conftest.py`); tests now run in <1 s anywhere |
| Department / country dropdown IDs hard-coded in the UI | Loaded from `/api/departments` and `/api/countries` |
| MUI v9 `Grid item xs=` props are legacy and silently lay out incorrectly | Migrated to `size={{ ... }}` |
| Hosted Postgres URLs use `postgres://`, which SQLAlchemy + psycopg3 rejects | Normalised in `database.py` |

## Trade-offs
* **Net pay formula** (basic + allowances + bonus - deductions) is computed in SQL so aggregates and per-employee values agree.
* **No currency conversion.** Wrong silently is worse than absent; documented as the first follow-up.
* **Soft delete only.** Salary records reference employees; deactivating preserves history for audit and reporting.
* **Employee code generation** uses max code + 1. Fine for a single HR user; under concurrent writes it should become a database sequence.
* **`create_all` instead of migrations (Alembic).** Acceptable for a time-boxed demo; the README lists the one-off index SQL, and Alembic is the next step for a real rollout.
* **Single service, single image.** Simplest thing to deploy and no CORS to manage; a CDN-hosted UI would scale better but is unnecessary at this size.

## Performance considerations
* Server-side pagination (max 100 rows per request); the UI never loads all 10,000 employees.
* Indexes on `employees.department_id`, `country_id`, `status` and `salary_records.employee_id`.
* Dashboard and analytics use single `GROUP BY` queries (no per-row loops); department / country names are eager-loaded with `joinedload` to avoid N+1 queries on the list.
* CSV export streams rows rather than building the file in memory. The one remaining optimisation: it loads current salary records into a dict first (about 10k small rows). Fine at this size; for much larger data, join in SQL.
* Seeding inserts in batches of 1,000.
* Known limitation: `ILIKE '%term%'` search cannot use a b-tree index; at 10k rows it is instant. At a much larger scale, use `pg_trgm`.

## Scope corrections
The first draft of the requirements listed authentication, audit logging, CSV import and an AI assistant. These were not built, so the document now lists them under "Deliberately left out" with reasons rather than claiming them.

## Still to do by the author (not automatable from here)
* Deploy (Render blueprint is ready) and add the live URL to the README.
* Record a 2-3 minute demo: dashboard, search/filter, add employee, salary revision showing preserved history, analytics toggle, CSV export. Put the link in the README.
