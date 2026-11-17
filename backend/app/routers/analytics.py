from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Country, Department, Employee, SalaryRecord
from app.services.salary import NET_SALARY, is_current

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/salary-summary")
def salary_summary(
    group_by: Literal["department", "country"] = "department",
    currency: str | None = Query(None, min_length=3, max_length=3),
    status: Literal["active", "inactive"] | None = "active",
    db: Session = Depends(get_db),
):
    """Min / max / average / total *current* net salary per group.

    Rows are always split by currency: we never add INR to USD without an
    explicit exchange rate (see docs/requirements.md).
    """
    group_col = Department.name if group_by == "department" else Country.name
    query = (
        db.query(
            group_col.label("group"),
            SalaryRecord.currency,
            func.count(SalaryRecord.id).label("headcount"),
            func.min(NET_SALARY).label("min_salary"),
            func.max(NET_SALARY).label("max_salary"),
            func.avg(NET_SALARY).label("avg_salary"),
            func.sum(NET_SALARY).label("total_salary"),
        )
        .join(Employee, Employee.id == SalaryRecord.employee_id)
        .join(Department, Department.id == Employee.department_id)
        .join(Country, Country.id == Employee.country_id)
        .filter(*is_current())
    )
    if status:
        query = query.filter(Employee.status == status)
    if currency:
        query = query.filter(SalaryRecord.currency == currency.upper())

    rows = (
        query.group_by(group_col, SalaryRecord.currency)
        .order_by(group_col, SalaryRecord.currency)
        .all()
    )
    return [
        {
            "group": r.group,
            "currency": r.currency,
            "headcount": r.headcount,
            "min_salary": float(r.min_salary),
            "max_salary": float(r.max_salary),
            "avg_salary": round(float(r.avg_salary), 2),
            "total_salary": float(r.total_salary),
        }
        for r in rows
    ]
