# Design notes: how the solution was planned and evolved

See also: [requirements.md](requirements.md) (what and why), [architecture.md](architecture.md) (how it fits together), [prompts.md](prompts.md) (the AI conversation), [ai-usage.md](ai-usage.md) (AI workflow, trade-offs, performance).

## 1. Framing the problem
The brief says the HR manager must (a) **manage** salary data and (b) **answer questions about how the organisation pays people**. Two consequences shaped everything:

1. **Correctness beats breadth.** Salary data that is silently wrong (a lost raise, rupees added to dollars) is worse than a missing feature. So the design rules that matter most are: history is append-only, currencies are never mixed, and "current salary" is defined once.
2. **The persona is one person.** A single HR manager does not need roles, workflows or approvals. That let the scope stay small and the polish go into the screens they use daily.

## 2. Key product decisions
| Question | Decision | Reasoning |
|---|---|---|
| How is salary stored? | Effective-dated records; a raise closes the open record and adds a new one | Supports history, back-dated and future-dated changes; "what did we pay in March?" is answerable later |
| How are multi-country salaries compared? | Always per currency; no conversion | Needs a trustworthy dated exchange-rate source. A wrong rate gives confident wrong answers, so the UI says "5 currencies" instead of one invented total |
| What does "delete an employee" mean? | Deactivate (and re-activate) | Hard delete would destroy salary history. Found during review that there was no way to reactivate, so it was added |
| Which employees do analytics include? | Active only by default; filterable | The question HR asks is "how do we pay *people*", i.e. current staff |
| What counts as net pay? | basic + allowances + bonus - deductions, computed in SQL | One definition, so per-person and aggregate numbers always agree |
| Auth model | Email + password, signed 8-hour tokens, one role | Protects sensitive data without building user management for a one-person persona; limits documented |

## 3. How it was built: incremental, vertical slices
Each step is one or more commits, so `git log` reads as the story.

| Phase | What | Why this order |
|---|---|---|
| 1. Foundation | Requirements doc, models, seed script (10,000 employees), employee list API with search and pagination | Data and reads first; everything else needs them |
| 2. Core rule | Salary retrieval, then **revisions with preserved history** | The riskiest business logic, done early and tested hard |
| 3. Insight | Dashboard overview, department, country and currency breakdowns | Answers "how do we pay people" |
| 4. UI | React dashboard and employee table | Make the data visible |
| 5. Gaps found in review | Filter-aware count (pagination bug), employee create/edit/deactivate, salary analytics, CSV export, hermetic tests, indexes | A review of the first version found real defects; fixed before adding features |
| 6. Deployment readiness | Single Docker image serving API + UI, Render blueprint, idempotent seed runner | Deployability is a requirement, not an afterthought |
| 7. Product polish | App shell with sidebar; one-screen dashboard; redesign to a supplied mockup; compact theme; sidebar toggle | Feedback from using the screens |
| 8. Security | Login, logout, route guards, protected API, authenticated CSV download | Salary data should not be open |
| 9. Documentation | Architecture diagrams, this file, prompt log | Evidence of the thinking |

## 4. UI decisions driven by feedback
These changed because the first version was wrong for the user, not because the plan said so.

* **Reports page: built, then removed.** The request was "when they click submit, then get the report". I built a separate Reports page. It duplicated the Employees page. The right fix was to make the **Employees page itself** apply filters on a Search button. Lesson: when a request sounds like a new feature, first check whether it is a behaviour change to an existing screen.
* **Dashboard has no scrollbar on desktop.** Cards are clipped to a fixed grid; the page area only scrolls on the long-table pages. On phones it stacks and scrolls, because forcing one screen would make charts unreadable.
* **Mockup-driven redesign, with deliberate omissions.** Parts of the supplied design had no data or feature behind them, so they were left out instead of faked: trend arrows (+2.5%, no history), "Last 12 months" (no date-range reporting), notification bell, world map (needs map data and a library). The "$120.5M total" became "5 currencies" with per-currency totals, for the currency reason above. Logout was omitted until login existed, then added.
* **Compact theme.** Screenshots showed the first redesign too large for common window sizes. One theme file now controls scale.
* **A real bug the user spotted:** shorthand props such as `display="flex"` were silently ignored by the installed Material UI version, which stacked the filters and un-bolded headings. Moved to `sx` everywhere.
* **Missing "Activate" button.** Inactive employees could not be reactivated. Added.

## 5. Testing strategy
* **Backend (98 tests, about 3 s; 95% line coverage):** every test gets a fresh in-memory SQLite database with a 4-employee dataset whose expected values are easy to compute by hand (`tests/conftest.py`). No dependence on the seeded Postgres, no shared state, so tests are deterministic and order-independent.
* **What is covered:** filters and pagination, CRUD, the revision rule (including "previous record closes the day before" and "future-dated raise is not current"), per-currency analytics, CSV content, and authentication (generic failures, expired and forged tokens, deactivated users, and **every data route rejecting anonymous requests**).
* **Frontend (50 tests; 92% line coverage; Vitest + Testing Library):** behaviour the user sees: search applies only on click, reset, activate/deactivate, salary dialog validation messages, dashboard shows per-currency totals, login/logout/route protection, 401 handling, authenticated downloads, sidebar toggle.
* **Seed scripts are tested too:** small seeds for the rules (codes, currencies, idempotence, determinism), plus one `slow`-marked test that seeds the real 10,000 employees (about 8 s, excluded from the default run).
* **Real-data check:** after tests passed, endpoints were exercised against the seeded 10,000-row Postgres, because small fixtures cannot reveal performance or data-shape problems.

## 6. Honest limitations
* **Not hosted at a public URL.** The free hosts that fit this stack asked for payment details. The deliverable is instead runnable with one command (`docker compose up --build`); a Dockerfile and Render blueprint are included but were not exercised on a live host.
* Logout is client-side: tokens are stateless and cannot be revoked early.
* No login rate limiting, password reset, or user-management screen.
* Analytics describe *today's* pay only; the data model supports history, the UI does not expose it yet.
* No currency conversion, CSV import, audit log, or AI assistant (all deliberate; see requirements).
* Schema is created with `create_all`; a real rollout needs migrations (Alembic).
* The frontend layout was checked by tests and by the user's screenshots, not by automated visual tests.

## 7. What would come next
1. Audit log ("who changed what"), now that users exist.
2. Currency conversion with dated exchange rates, to enable an org-wide total.
3. Point-in-time analytics using the existing effective dates.
4. CSV import with a validation preview.
5. Login rate limiting and token revocation.
