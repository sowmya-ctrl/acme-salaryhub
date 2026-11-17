# Architecture

Diagrams are [Mermaid](https://mermaid.js.org/) and render directly on GitHub.

## 1. System overview
One deployable unit: a single Docker container serves the REST API and the built React app. PostgreSQL is the only other moving part.

```mermaid
flowchart LR
    subgraph Browser
        SPA["React SPA (Vite + Material UI)<br/>HashRouter, AuthContext,<br/>axios client with token interceptor"]
    end

    subgraph Container["Docker container (Render web service)"]
        STATIC["Static files<br/>(built React app)"]
        subgraph API["FastAPI"]
            GUARD["get_current_user<br/>JWT check on every data route"]
            ROUTERS["Routers<br/>auth · employees · salaries ·<br/>dashboard · analytics · reference"]
            SERVICES["Services<br/>employee_filters · salary (net pay,<br/>current record) · auth"]
            MODELS["SQLAlchemy models"]
        end
    end

    DB[("PostgreSQL")]

    SPA -- "GET / (HTML, JS, CSS)" --> STATIC
    SPA -- "/api/* + Bearer token" --> GUARD --> ROUTERS --> SERVICES --> MODELS --> DB
    SPA -- "POST /api/auth/login (public)" --> ROUTERS
```

**Why one container:** simplest thing to deploy and demo, no CORS configuration, one URL. The trade-off is that the UI cannot scale independently of the API; irrelevant at this size.

## 2. Data model
Salary is **effective-dated history**, not a single "salary" column. The current salary is the record whose date range contains today.

```mermaid
erDiagram
    COUNTRY ||--o{ EMPLOYEE : "works in"
    DEPARTMENT ||--o{ EMPLOYEE : "belongs to"
    EMPLOYEE ||--o{ SALARY_RECORD : "has history of"

    COUNTRY {
        int id PK
        string name
        string code "IND, USA, ..."
        string currency_code "INR, USD, ..."
    }
    DEPARTMENT {
        int id PK
        string name
    }
    EMPLOYEE {
        int id PK
        string employee_code "ACME00001 (unique)"
        string first_name
        string last_name
        string email "unique"
        string designation
        date joining_date
        string status "active | inactive (soft delete)"
    }
    SALARY_RECORD {
        int id PK
        int employee_id FK "indexed"
        decimal basic_salary
        decimal allowances
        decimal bonus
        decimal deductions
        string currency "3-letter code"
        date effective_from
        date effective_to "NULL = current"
    }
    USER {
        int id PK
        string email "unique"
        string full_name
        string password_hash "bcrypt"
        bool is_active
    }
```

`USER` is intentionally unrelated to `EMPLOYEE`: it is a login for an HR manager, not a person on the payroll.

Indexes: `employees.department_id`, `employees.country_id`, `employees.status`, `salary_records.employee_id`, `users.email`.

## 3. Salary revision (the core business rule)
A raise never overwrites anything: it closes the open record and appends a new one, in one transaction.

```mermaid
sequenceDiagram
    actor HR as HR manager
    participant UI as React UI
    participant API as FastAPI
    participant DB as PostgreSQL

    HR->>UI: Enter new salary + effective date
    UI->>API: POST /api/employees/{id}/salaries (Bearer token)
    API->>API: Validate token and input (amounts > 0, 3-letter currency)
    API->>DB: Find open record (effective_to IS NULL)
    alt new effective_from <= open record's effective_from
        API-->>UI: 400 "New salary must have a later effective date"
    else
        API->>DB: Set open record effective_to = new effective_from - 1 day
        API->>DB: Insert new record (effective_to = NULL)
        API->>DB: COMMIT (rolled back on any error)
        API-->>UI: 201 new record
        UI->>API: GET /api/employees/{id}/salaries
        API-->>UI: Full history, newest first
    end
```

## 4. Login and session
```mermaid
sequenceDiagram
    actor HR as HR manager
    participant UI as React UI
    participant API as FastAPI
    participant DB as PostgreSQL

    HR->>UI: Email + password
    UI->>API: POST /api/auth/login
    API->>DB: Find user by email (lower-cased)
    API->>API: bcrypt verify (dummy hash if email unknown)
    alt invalid, unknown or inactive
        API-->>UI: 401 "Invalid email or password" (same message for all)
    else valid
        API-->>UI: 200 signed JWT (8 h) + user
        UI->>UI: Keep in sessionStorage
    end
    Note over UI,API: Every later request carries Authorization: Bearer token
    API-->>UI: 401 if token is missing, forged, expired, or user deactivated
    UI->>UI: 401 clears the session and shows the login page
    HR->>UI: Log out
    UI->>UI: Discard token (server-side tokens are stateless)
```

## 5. Frontend structure
```
frontend/src
├── App.jsx               routes: /login (public); everything else behind RequireAuth
├── auth/                 AuthContext (login/logout), RequireAuth guard, storage helpers
├── layout/AppLayout.jsx  dark collapsible sidebar, top-bar search, user card + logout
├── pages/                DashboardPage, EmployeesPage, AnalyticsPage, LoginPage
├── components/           StatCard, ChartCard, charts, EmployeeTable, dialogs, QuickActions
├── services/             api.js (token + 401 handling), download.js (authenticated CSV)
├── utils/format.js       currency formatting (never converts between currencies)
└── theme.js              compact MUI theme
```

## 6. Request-level rules enforced in the backend (not the UI)
| Rule | Where |
|---|---|
| Every data route needs a valid token | `include_router(..., dependencies=[Depends(get_current_user)])` in `main.py`; a test checks all 17 routes |
| Currencies are never added together | `analytics.py` and `dashboard.py` always `GROUP BY currency` |
| "Current" salary = in force today | `services/salary.py::is_current` shared by dashboard, analytics and export |
| List, count and export filter identically | `services/employee_filters.py::apply_employee_filters` |
| Salary history is never deleted | Deactivation is a status change; there is no hard delete endpoint |
