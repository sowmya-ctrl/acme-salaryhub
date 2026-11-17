from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee
from app.schemas.employee import EmployeeResponse

router = APIRouter(
    prefix="/api/employees",
    tags=["Employees"],
)


@router.get("/", response_model=list[EmployeeResponse])
def get_employees(
    search: str | None = Query(None, min_length=1, max_length=100),
    department_id: int | None = Query(None, ge=1),
    country_id: int | None = Query(None, ge=1),
    status: str | None = Query(None, pattern="^(active|inactive)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Employee)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (Employee.first_name.ilike(search_term))
            | (Employee.last_name.ilike(search_term))
            | (Employee.employee_code.ilike(search_term))
            | (Employee.email.ilike(search_term))
        )

    if department_id:
        query = query.filter(Employee.department_id == department_id)

    if country_id:
        query = query.filter(Employee.country_id == country_id)

    if status:
        query = query.filter(Employee.status == status)

    return (
        query.order_by(Employee.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

@router.get("/count")
def get_employee_count(db: Session = Depends(get_db)):
    total = db.query(Employee).count()

    return {
        "total_employees": total
    }