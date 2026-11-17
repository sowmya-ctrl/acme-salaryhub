
# ACME SalaryHub – Requirements Document

## 1. Problem Statement
The organization has 10,000 employees across multiple countries. HR managers need a centralized application to manage employee information, salary records, and salary analytics.

## 2. Primary User
**HR Manager**

The HR Manager needs to:
- View employee and salary information.
- Add, update, search, and filter employees.
- Manage salary details and salary revision history.
- Analyze salary expenditure across departments and countries.
- Ask questions about salary data using a natural-language AI assistant.

## 3. Functional Requirements

### 3.1 Employee Management
- Create, view, update, and deactivate employees.
- Store employee ID, name, email, department, country, designation, and joining date.
- Search employees by name or employee ID.
- Filter by department, country, and employment status.
- Support pagination for large employee lists.

### 3.2 Salary Management
- Store basic salary, allowances, bonus, and deductions.
- Store salary currency and effective dates.
- Maintain salary revision history.
- Never overwrite previous salary records when a revision is made.

### 3.3 HR Dashboard
- Display total employee count.
- Display average salary.
- Display salary expenditure.
- Show employee distribution by country and department.
- Provide salary analytics and visualizations.

### 3.4 Salary Analytics
- Calculate minimum, maximum, and average salary.
- Compare salary data across departments and countries.
- Filter analytics by date range and other relevant criteria.
- Do not combine different currencies without an explicit exchange-rate conversion.

### 3.5 AI Salary Assistant
- Allow HR managers to ask questions in natural language.
- Answer questions using actual application data.
- Use controlled backend analytics functions rather than unrestricted database access.
- Clearly indicate when information is unavailable.

### 3.6 Data Import and Export
- Import employee and salary data through CSV files.
- Export filtered employee and salary records.

### 3.7 Security and Audit
- Provide authenticated access.
- Restrict application functions according to user permissions.
- Record important employee and salary changes in audit logs.
- Store credentials and API keys securely.

## 4. Non-Functional Requirements
- Support approximately 10,000 employee records.
- Provide pagination and database indexing for efficient queries.
- Use a maintainable and modular backend architecture.
- Validate API inputs and handle errors consistently.
- Provide automated backend and frontend tests.
- Deploy the application so it can be accessed through a browser.

## 5. Technology Stack
- Backend: Python, FastAPI
- Frontend: React
- Database: PostgreSQL
- ORM: SQLAlchemy
- Validation: Pydantic
- Testing: Pytest, Vitest, React Testing Library
- Charts: Recharts
- Deployment: Render
- Version Control: Git and GitHub

## 6. Out of Scope
- Actual payroll payments.
- Tax and statutory payroll calculations.
- Attendance and leave management.
- Bank integrations.
- Employee self-service portal.

## 7. Success Criteria
- HR managers can manage employee and salary records.
- The application can handle 10,000 seeded employees.
- Salary history is preserved correctly.
- Dashboard and analytics display database-backed results.
- AI responses are grounded in application data.
- Automated tests pass.
- The application is deployed and accessible.
