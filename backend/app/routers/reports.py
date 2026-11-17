import csv
import io
from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Employee, SalaryRecord
from app.services.salary import NET_SALARY, is_current

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _report_filters(
    department_id: int | None = Query(None, ge=1),
    country_id: int | None = Query(None, ge=1),
    status: Literal["active", "inactive"] | None = None,
    joined_from: date | None = None,
    joined_to: date | None = None,
    currency: str | None = Query(None, min_length=3, max_length=3),
    min_salary: float | None = Query(None, ge=0),
    max_salary: float | None = Query(None, ge=0),
) -> dict:
    if joined_from and joined_to and joined_from > joined_to:
        raise HTTPException(status_code=422, detail="'Joined from' must not be after 'Joined to'")
    if min_salary is not None and max_salary is not None and min_salary > max_salary:
        raise HTTPException(status_code=422, detail="Minimum salary must not exceed maximum salary")
    if (min_salary is not None or max_salary is not None) and not currency:
        # Amounts in different currencies are not comparable, so a range needs a currency.
        raise HTTPException(status_code=422, detail="Choose a currency to filter by salary range")
    return dict(
        department_id=department_id,
        country_id=country_id,
        status=status,
        joined_from=joined_from,
        joined_to=joined_to,
        currency=currency.upper() if currency else None,
        min_salary=min_salary,
        max_salary=max_salary,
    )


def _base_query(db: Session, f: dict):
    """Employees with their *current* salary (outer join: no salary -> NULL columns)."""
    query = db.query(Employee, SalaryRecord, NET_SALARY.label("net_salary")).outerjoin(
        SalaryRecord,
        and_(SalaryRecord.employee_id == Employee.id, *is_current()),
    )
    if f["department_id"]:
        query = query.filter(Employee.department_id == f["department_id"])
    if f["country_id"]:
        query = query.filter(Employee.country_id == f["country_id"])
    if f["status"]:
        query = query.filter(Employee.status == f["status"])
    if f["joined_from"]:
        query = query.filter(Employee.joining_date >= f["joined_from"])
    if f["joined_to"]:
        query = query.filter(Employee.joining_date <= f["joined_to"])
    if f["currency"]:
        query = query.filter(SalaryRecord.currency == f["currency"])
    if f["min_salary"] is not None:
        query = query.filter(NET_SALARY >= f["min_salary"])
    if f["max_salary"] is not None:
        query = query.filter(NET_SALARY <= f["max_salary"])
    return query


def _row(employee: Employee, salary: SalaryRecord | None, net) -> dict:
    return {
        "id": employee.id,
        "employee_code": employee.employee_code,
        "name": f"{employee.first_name} {employee.last_name}",
        "email": employee.email,
        "designation": employee.designation,
        "department": employee.department_name,
        "country": employee.country_name,
        "joining_date": employee.joining_date,
        "status": employee.status,
        "currency": salary.currency if salary else None,
        "net_salary": float(net) if salary else None,
    }


@router.get("/employees")
def employee_report(
    filters: dict = Depends(_report_filters),
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Filtered employee report: headline numbers, per-currency pay summary and one page of rows."""
    base = _base_query(db, filters)

    total = base.count()
    active = base.filter(Employee.status == "active").count()

    summary_rows = (
        base.with_entities(
            SalaryRecord.currency,
            func.count(Employee.id),
            func.min(NET_SALARY),
            func.avg(NET_SALARY),
            func.max(NET_SALARY),
            func.sum(NET_SALARY),
        )
        .filter(SalaryRecord.id.isnot(None))
        .group_by(SalaryRecord.currency)
        .order_by(SalaryRecord.currency)
        .all()
    )

    items = (
        base.options(joinedload(Employee.department), joinedload(Employee.country))
        .order_by(Employee.id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "active": active,
        "inactive": total - active,
        "salary_summary": [
            {
                "currency": cur,
                "headcount": count,
                "min_salary": float(mn),
                "avg_salary": round(float(avg), 2),
                "max_salary": float(mx),
                "total_salary": float(tot),
            }
            for cur, count, mn, avg, mx, tot in summary_rows
        ],
        "items": [_row(*r) for r in items],
    }


@router.get("/employees/export")
def employee_report_csv(
    filters: dict = Depends(_report_filters),
    db: Session = Depends(get_db),
):
    """The same report as CSV (all matching rows, not just one page)."""
    query = (
        _base_query(db, filters)
        .options(joinedload(Employee.department), joinedload(Employee.country))
        .order_by(Employee.id)
    )

    def rows():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow([
            "employee_code", "name", "email", "designation", "department",
            "country", "joining_date", "status", "currency", "net_salary",
        ])
        yield buffer.getvalue()
        for employee, salary, net in query:
            r = _row(employee, salary, net)
            buffer.seek(0)
            buffer.truncate()
            writer.writerow([
                r["employee_code"], r["name"], r["email"], r["designation"],
                r["department"], r["country"], r["joining_date"], r["status"],
                r["currency"] or "", r["net_salary"] if r["net_salary"] is not None else "",
            ])
            yield buffer.getvalue()

    return StreamingResponse(
        rows(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="employee-report.csv"'},
    )
