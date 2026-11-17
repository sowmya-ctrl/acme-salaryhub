# ACME SalaryHub: Requirements (one page)

## Goal
ACME's HR manager currently keeps salary data for ~10,000 employees in country-specific Excel files. SalaryHub replaces that with one web app so the HR manager can **maintain** salary data safely and **answer "how do we pay people?"** in seconds, without pivot tables.

**Persona:** one HR Manager (trusted, full access).

## Scope: what is built
| Area | Features |
|---|---|
| Employees | List with search (name / code / email), filters (department, country, status), pagination; add, edit, deactivate |
| Salaries | Basic, allowances, bonus, deductions, currency. **Revisions append a new record** and close the previous one the day before; history is never overwritten. Optional starting salary when adding an employee |
| Dashboard | Headcount (total / active / inactive); employees by department and country; total pay by currency |
| Analytics | Min / average / max / total *current* net pay by department or country, active employees by default |
| Export | CSV of the current filtered view, including current salary |
| Data | Seed script for 10,000 employees across 5 countries / 5 departments, deterministic (fixed random seed) and idempotent |
| Access control | Email + password login (bcrypt, signed 8-hour tokens); every HR data endpoint requires a valid token; logout; first user created by the seed script from environment variables |
| Delivery | Single Docker image (API + built UI), Render blueprint, automated backend and frontend tests |

Net pay = basic + allowances + bonus - deductions.

## Deliberately left out (and why)
| Not built | Reason |
|---|---|
| **Currency conversion / "org-wide total"** | Needs a trustworthy, dated exchange-rate source; a wrong rate silently produces wrong answers. We show every figure *per currency* and never add INR to USD. First follow-up feature. |
| **SSO, multiple roles / permissions, password reset, user management UI** | One persona (HR manager), so one role. Basic login protects the data; the rest matters once more than one kind of user exists. Users are created by the seed script, not in the UI. Salary data is sensitive, so the demo still uses synthetic data only. |
| **Audit log** | Salary history already answers "what changed and when" for salaries. A general "who changed what" trail is the natural next step now that users exist. |
| **CSV import** | Valuable for migrating from Excel, but needs a validation / preview / error-report flow to be safe. Out of scope for the time box; the seed script covers bulk loading for the demo. |
| **AI natural-language assistant** | Risk of confident wrong answers on salary data. Analytics endpoints are structured so an assistant could call them as controlled tools later. |
| **Payroll, tax, payslips, attendance, bank integration** | Different problem (executing payments); not needed to answer pay questions. |
| **Hard delete of employees** | Would destroy salary history. Deactivation keeps it. |
| **Date-range analytics / point-in-time reports** | The history model supports it (effective dates), but the UI reports *today's* pay only. |

## Key decisions
* **Effective-dated salary records** (not an "updated salary" column) so history, back-dating and future-dated raises are first-class.
* **Per-currency aggregation** everywhere, enforced in the backend, so the UI cannot get it wrong.
* **Filtering logic lives in one function** shared by list, count and CSV export, so totals always match what is shown.
* **Postgres in production, in-memory SQLite in tests**: tests are fast (<1 s), deterministic and independent of any seeded database.
* **Server-side pagination and indexes** on filter columns (department, country, status) and salary foreign keys keep 10k-row screens responsive.

## Success criteria
1. HR can find any employee, change their details and record a raise in under a minute.
2. A raise never loses the previous salary.
3. Every number on a dashboard can be reproduced from the database, and no figure mixes currencies.
4. 10,000 seeded employees load and page without noticeable delay.
5. Tests pass; the app is deployable from one `docker build`.
