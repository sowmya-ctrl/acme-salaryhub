from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee, SalaryRecord
from app.schemas.salary import SalaryResponse

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