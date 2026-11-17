# Prompt log

The author's instructions to the AI coding assistant (Claude Code), quoted **verbatim**, typos included, in the order given, with what each led to and what review of the output found.

Scope of this log: it covers the Claude Code session that completed the project. Work committed before that session (the initial requirements, models, seed script and first APIs) is not recorded here. Some prompts had a screenshot attached; this is noted but the images are not stored.

## How the collaboration worked
* The author gave **short, outcome-focused** instructions and judged results visually and by use.
* The assistant first read the repo and ran the tests, then proposed and implemented, then verified (tests, build, and a smoke test against the seeded 10,000-row database).
* Several prompts were **corrections** of the assistant's work. Those are the most informative rows below.

## The prompts

| # | Prompt (verbatim) | What it led to | Review / correction |
|---|---|---|---|
| 1 | *Pasted the assessment brief,* "somewhat i have created please help me for remaining" | Audit of the repo against the brief; backend gaps filled (employee CRUD, salary analytics, CSV export), hermetic tests, Docker + Render files, employee/salary UI, docs | Audit found the employee **count ignored filters** (wrong pagination totals), hard-coded dropdown IDs, and tests that depended on, and wrote to, the live database. All fixed |
| 2 | "we need this is an application wise like side bar, dashboard and all" | App shell: sidebar, routing, Dashboard / Employees / Salary Analytics pages | Used hash routing so deep links work when FastAPI serves the built files |
| 3 | "I want single page dashboard without scrolling" | Dashboard laid out as a fixed grid that fills the viewport | Later needed two more rounds (rows 9 and 10 below) because the first layout overflowed on real screens |
| 4 | "that emplyees report also make it quite good like when they click submit then only we need to get report" | A separate **Reports** page that generates on submit, with summary, paging and export | **Misread.** The author meant the Employees screen itself. See next row |
| 5 | *(screenshot)* "why created extra already Employees is there remove reports" | Reports page and its backend endpoint **deleted**; the Employees page now applies filters only when **Search** is clicked | The author was right: it was duplicate functionality. Also found that MUI v9 silently ignores shorthand props (`display`, `gap`, `fontWeight`), which had stacked the filters; fixed everywhere |
| 6 | "What we did in this project from beginning to end" | Written summary of the whole project | Used to re-check the story against the commit history |
| 7 | *Pasted the brief again,* "is this requirement fulfilled" | Honest gap list: deployment, demo video, repo link missing; prompts section was illustrative | Led directly to this log and the docs work |
| 8 | *(mockup image)* "i want like this" | Dashboard and shell redesigned to the mockup: dark sidebar, search bar, KPI cards, donut, currency bars, quick actions | Parts of the mockup were **deliberately not built** (trend arrows, "Last 12 months", notifications, world map, a single "$120.5M" total) because no data or feature backed them; the total was replaced with per-currency figures because currencies cannot be summed |
| 9 | *(screenshot)* "please make dashboard clear ... Dashboard Overview of your workforce and compensation is looking big" | Compact theme, smaller heading and top bar, tighter cards | Root cause was overall scale, so one theme file was introduced instead of resizing each element |
| 10 | *(screenshot)* "i dont need scroll bar?" | Cards clipped to their grid cells; scrolling disabled on the dashboard page only | The screenshot showed overlapping cards, i.e. content taller than its cell |
| 11 | *(screenshot)* "why i am unable to see active button" | **Activate** button for inactive employees | A gap in the earlier work: the UI could deactivate but never reactivate. The backend already supported it |
| 12 | "give me toggle button for sidebar" | Collapsible icon-only sidebar, remembered across visits | Storage access is wrapped in try/catch so it degrades safely |
| 13 | "Can we add login and logout" | Email + password login, signed tokens, route guards, protected API, logout | Replaced `passlib` with `bcrypt` (incompatible with the installed version); no default password; generic 401 message; plain CSV download links would have broken without the token, so exports were reworked. Limits documented |
| 14 | "what are the username and password" | Explained there is deliberately no default; steps to create the first user | Confirms the design: credentials come from environment variables, not the repo |
| 15 | "still what incomplete" | Updated checklist; checked repo state and Docker availability | Docker Desktop was not running, so the container build is **still unverified** |
| 16 | "just check all ... is there?" *(pasted the artifacts list)* | Audit of artifacts; this log, architecture diagrams and design notes written | Found the old prompt list was illustrative, a leftover to-do section, and a template README |

Other messages in the session were deployment and git how-to questions (GitHub, Render) and did not change the code.

## Patterns worth noting
* **The author's screenshots were the best test oracle.** Rows 5, 9, 10 and 11 were found by looking at the running app, which unit tests did not catch.
* **Two assistant mistakes were product mistakes, not coding mistakes** (rows 4 and 11): building a new page for what was a behaviour change, and shipping a one-way action. Both were caught by the author using the product.
* **When a requirement and the data disagreed, the data won** (row 8): features the data could not support were omitted and the reason written down.
