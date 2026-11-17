from fastapi import APIRouter, Depends
from datetime import date
from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Employee,Department,Country, SalaryRecord



router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/overview")
def get_dashboard_overview(
    db: Session = Depends(get_db),
):
    total_employees = db.query(Employee).count()

    active_employees = (
        db.query(Employee)
        .filter(Employee.status == "active")
        .count()
    )

    inactive_employees = (
        db.query(Employee)
        .filter(Employee.status == "inactive")
        .count()
    )

    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "inactive_employees": inactive_employees,
    }

@router.get("/departments")
def get_department_distribution(
    db: Session = Depends(get_db),
):
    results = (
        db.query(
            Department.name,
            func.count(Employee.id).label("employee_count"),
        )
        .outerjoin(Employee, Employee.department_id == Department.id)
        .group_by(Department.id, Department.name)
        .order_by(Department.name)
        .all()
    )

    return [
        {
            "department": name,
            "employee_count": count,
        }
        for name, count in results
    ]

@router.get("/countries")
def get_country_distribution(db: Session = Depends(get_db)):
    results = (
        db.query(
            Country.name,
            Country.code,
            func.count(Employee.id).label("employee_count"),
        )
        .outerjoin(Employee, Employee.country_id == Country.id)
        .group_by(Country.id, Country.name, Country.code)
        .order_by(Country.name)
        .all()
    )

    return [
        {
            "country": name,
            "country_code": code,
            "employee_count": count,
        }
        for name, code, count in results
    ]

@router.get("/salary-by-currency")
def get_salary_by_currency(db: Session = Depends(get_db)):
    results = (
        db.query(
            SalaryRecord.currency,
            func.sum(
                SalaryRecord.basic_salary
                + SalaryRecord.allowances
                + SalaryRecord.bonus
                - SalaryRecord.deductions
            ).label("total_salary"),
            func.count(SalaryRecord.id).label("employee_count"),
        )
        .filter(
            SalaryRecord.effective_from <= date.today(),
            or_(
                SalaryRecord.effective_to.is_(None),
                SalaryRecord.effective_to >= date.today(),
            ),
        )
        .group_by(SalaryRecord.currency)
        .order_by(SalaryRecord.currency)
        .all()
    )

    return [
        {
            "currency": currency,
            "total_salary": total_salary,
            "employee_count": employee_count,
        }
        for currency, total_salary, employee_count in results
    ]