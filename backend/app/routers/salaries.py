from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee, SalaryRecord
from app.schemas.salary import SalaryResponse, SalaryCreate
from datetime import timedelta

router = APIRouter(
    prefix="/api/employees",
    tags=["Salaries"],
)


@router.get("/{employee_id}/salaries", response_model=list[SalaryResponse])
def get_employee_salaries(
    employee_id: int,
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    salaries = (
        db.query(SalaryRecord)
        .filter(SalaryRecord.employee_id == employee_id)
        .order_by(SalaryRecord.effective_from.desc())
        .all()
    )

    return salaries

@router.post(
    "/{employee_id}/salaries",
    response_model=SalaryResponse,
    status_code=201,
)
def create_salary_revision(
    employee_id: int,
    salary_data: SalaryCreate,
    db: Session = Depends(get_db),
):
    employee = db.query(Employee).filter(
        Employee.id == employee_id
    ).first()

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    current_salary = (
        db.query(SalaryRecord)
        .filter(
            SalaryRecord.employee_id == employee_id,
            SalaryRecord.effective_to.is_(None),
        )
        .first()
    )

    if current_salary:
        if salary_data.effective_from <= current_salary.effective_from:
            raise HTTPException(
                status_code=400,
                detail="New salary must have a later effective date",
            )

        current_salary.effective_to = (
            salary_data.effective_from -timedelta(days=1)
        )

    new_salary = SalaryRecord(
        employee_id=employee_id,
        basic_salary=salary_data.basic_salary,
        allowances=salary_data.allowances,
        bonus=salary_data.bonus,
        deductions=salary_data.deductions,
        currency=salary_data.currency,
        effective_from=salary_data.effective_from,
        effective_to=None,
    )

    try:
        db.add(new_salary)
        db.commit()
        db.refresh(new_salary)
        return new_salary
    except Exception:
        db.rollback()
        raise