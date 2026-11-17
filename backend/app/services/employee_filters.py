from sqlalchemy.orm import Query

from app.models import Employee


def apply_employee_filters(
    query: Query,
    search: str | None = None,
    department_id: int | None = None,
    country_id: int | None = None,
    status: str | None = None,
) -> Query:
    """Single source of truth for employee filtering (list, count and export)."""
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            Employee.first_name.ilike(term)
            | Employee.last_name.ilike(term)
            | Employee.employee_code.ilike(term)
            | Employee.email.ilike(term)
        )
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if country_id:
        query = query.filter(Employee.country_id == country_id)
    if status:
        query = query.filter(Employee.status == status)
    return query
