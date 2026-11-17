# How AI was used, and engineering notes

Companion documents: [prompts.md](prompts.md) (the actual prompts), [design-notes.md](design-notes.md) (planning and evolution), [architecture.md](architecture.md) (diagrams), [requirements.md](requirements.md).

## Workflow
Claude Code (agentic CLI in VS Code) did the implementation; the author set direction and judged results by using the running app.

1. **Audit before building.** The assistant read the repo, ran the tests and listed gaps against the brief before writing code.
2. **Vertical slices, one commit each,** so the history reads as a story (see design-notes.md, section 3).
3. **Tests alongside features.** Tests assert behaviour ("a revision closes the previous record the day before"), not implementation.
4. **Verify beyond the tests.** After tests passed, endpoints were exercised against the seeded 10,000-row Postgres and the production build was run; the author then reviewed screenshots of the running UI.
5. **Disagree with the AI.** The author's corrections are recorded in [prompts.md](prompts.md); several were more valuable than the first AI attempt.

## Issues found while reviewing AI-assisted code
| Finding | Fix |
|---|---|
| `/employees/count` ignored search / filters, so pagination totals were wrong | Count shares `apply_employee_filters` with list and export |
| Backend tests depended on a seeded live database, and the revision test wrote to it | In-memory SQLite fixture with a 4-employee dataset (`tests/conftest.py`); tests run in about 2 s anywhere |
| Department / country dropdown IDs hard-coded in the UI | Loaded from `/api/departments` and `/api/countries` |
| MUI v9 `Grid item xs=` props are legacy and silently lay out incorrectly | Migrated to `size={{ ... }}` |
| MUI v9 also silently ignores shorthand props (`display`, `gap`, `mb`, `fontWeight`) on `Box` / `Typography`: filters stacked, headings lost bold | Moved to `sx` everywhere (found by the author from a screenshot, not by tests) |
| Hosted Postgres URLs use `postgres://`, which SQLAlchemy + psycopg3 rejects | Normalised in `database.py` |
| A separate Reports page was built for a request that was really a behaviour change to Employees | Page and endpoint removed; Employees filters now apply on **Search** |
| Employees could be deactivated but never reactivated | Added **Activate** |
| `passlib` (listed in requirements) is incompatible with the installed `bcrypt` 5 | Use `bcrypt` directly |
| Plain `<a href>` CSV links cannot send the auth token | Exports fetch with the token and save the blob |

## Authentication decisions
| Decision | Why |
|---|---|
| Short-lived stateless JWT (8 h) | Simple and needs no session table. **Cost: logout is client-side only**; a stolen token works until it expires. Fix when it matters: a token denylist, or short access tokens plus refresh tokens |
| Token in `sessionStorage` | Survives refresh, ends with the tab. Any script on the page can read it (XSS). An httpOnly cookie would be safer but needs CSRF protection, so it was left as a follow-up |
| One generic 401 message + dummy hash check for unknown emails | Does not reveal which emails have accounts, in the message or the response time |
| Guard applied once, at router level | Individual routes cannot forget it; a parametrised test asserts all 17 data routes return 401 anonymously and with a forged token |
| No default password; first user from `ADMIN_PASSWORD` | A default credential in a public repo is a vulnerability |

**Known gaps (deliberate):** no login rate limiting or lockout (a reverse proxy or `slowapi` would add it), no password reset or change, no roles beyond "logged in".

## Trade-offs
* **Net pay formula** (basic + allowances + bonus - deductions) is computed in SQL so aggregates and per-employee values agree.
* **No currency conversion.** Wrong silently is worse than absent; the UI shows per-currency totals. First follow-up.
* **Soft delete only.** Salary records reference employees; deactivating preserves history.
* **Employee code generation** uses max code + 1. Fine for a single HR user; under concurrent writes it should become a database sequence.
* **`create_all` instead of migrations (Alembic).** Acceptable for a time-boxed demo; the README lists the one-off index SQL, and Alembic is the next step for a real rollout.
* **Single service, single image.** Simplest to deploy and no CORS to manage; a CDN-hosted UI would scale better but is unnecessary at this size.
* **Hash routing (`/#/employees`).** Lets the API serve the static build without server-side fallback rules; costs slightly uglier URLs.
* **Fixed-grid, no-scroll dashboard on desktop.** Great for an at-a-glance screen; charts compress on very short windows, and phones fall back to a scrolling stack.

## Performance considerations
* Server-side pagination (max 100 rows per request); the UI never loads all 10,000 employees.
* Indexes on `employees.department_id`, `country_id`, `status` and `salary_records.employee_id`.
* Dashboard and analytics use single `GROUP BY` queries (no per-row loops); department / country names are eager-loaded with `joinedload` to avoid N+1 queries on the list.
* CSV export streams rows rather than building the file in memory. It loads current salary records into a dict first (about 10k small rows), which is fine at this size; for much larger data, join in SQL.
* Employee seeding inserts in batches of 1,000.
* Known limitation: `ILIKE '%term%'` search cannot use a b-tree index; at 10k rows it is instant. At a much larger scale, use `pg_trgm`.
* One-off spot check (not a benchmark): an aggregate query joining employees and salary records over the 10,000 seeded rows returned in about 0.5 s.

## Scope corrections
The first draft of the requirements listed authentication, audit logging, CSV import and an AI assistant before any of them existed. The document was rewritten to claim only what was built and to list the rest under "Deliberately left out" with reasons. Authentication was then built later and moved into scope; the others remain out.
