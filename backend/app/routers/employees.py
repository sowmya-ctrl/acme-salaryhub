import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Country, Department, Employee, SalaryRecord
from app.schemas.employee import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from app.services.employee_filters import apply_employee_filters
from app.services.salary import is_current

router = APIRouter(
    prefix="/api/employees",
    tags=["Employees"],
)


def _filters(
    search: str | None = Query(None, min_length=1, max_length=100),
    department_id: int | None = Query(None, ge=1),
    country_id: int | None = Query(None, ge=1),
    status: str | None = Query(None, pattern="^(active|inactive)$"),
) -> dict:
    return dict(
        search=search,
        department_id=department_id,
        country_id=country_id,
        status=status,
    )


def _get_or_404(db: Session, employee_id: int) -> Employee:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


def _check_references(db: Session, department_id, country_id):
    if department_id is not None and not db.get(Department, department_id):
        raise HTTPException(status_code=400, detail="Unknown department")
    if country_id is not None and not db.get(Country, country_id):
        raise HTTPException(status_code=400, detail="Unknown country")


def _next_employee_code(db: Session) -> str:
    last = (
        db.query(Employee.employee_code)
        .order_by(Employee.employee_code.desc())
        .first()
    )
    number = int(last[0].removeprefix("ACME")) + 1 if last else 1
    return f"ACME{number:05d}"


@router.get("/", response_model=list[EmployeeResponse])
def get_employees(
    filters: dict = Depends(_filters),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Employee).options(
        joinedload(Employee.department), joinedload(Employee.country)
    )
    return (
        apply_employee_filters(query, **filters)
        .order_by(Employee.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/count")
def get_employee_count(
    filters: dict = Depends(_filters),
    db: Session = Depends(get_db),
):
    """Count honours the same filters as the list so pagination totals are right."""
    total = apply_employee_filters(db.query(Employee), **filters).count()
    return {"total_employees": total}


@router.get("/export")
def export_employees_csv(
    filters: dict = Depends(_filters),
    db: Session = Depends(get_db),
):
    """Export the filtered employees with their current salary as CSV."""
    query = (
        apply_employee_filters(db.query(Employee), **filters)
        .options(joinedload(Employee.department), joinedload(Employee.country))
        .order_by(Employee.id)
    )
    current = {
        s.employee_id: s for s in db.query(SalaryRecord).filter(*is_current()).all()
    }

    def rows():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow([
            "employee_code", "first_name", "last_name", "email", "designation",
            "department", "country", "joining_date", "status",
            "currency", "basic_salary", "allowances", "bonus", "deductions",
        ])
        yield buffer.getvalue()
        for e in query:
            s = current.get(e.id)
            buffer.seek(0)
            buffer.truncate()
            writer.writerow([
                e.employee_code, e.first_name, e.last_name, e.email, e.designation,
                e.department_name, e.country_name, e.joining_date, e.status,
                s.currency if s else "", s.basic_salary if s else "",
                s.allowances if s else "", s.bonus if s else "",
                s.deductions if s else "",
            ])
            yield buffer.getvalue()

    return StreamingResponse(
        rows(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="employees.csv"'},
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, employee_id)


@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    _check_references(db, payload.department_id, payload.country_id)

    employee = Employee(
        employee_code=_next_employee_code(db),
        **payload.model_dump(exclude={"salary"}),
    )
    try:
        db.add(employee)
        db.flush()
        if payload.salary:
            db.add(
                SalaryRecord(
                    employee_id=employee.id,
                    effective_to=None,
                    **payload.salary.model_dump(),
                )
            )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already in use")
    db.refresh(employee)
    return employee


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
):
    employee = _get_or_404(db, employee_id)
    changes = payload.model_dump(exclude_unset=True)
    _check_references(db, changes.get("department_id"), changes.get("country_id"))

    for field, value in changes.items():
        setattr(employee, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already in use")
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", response_model=EmployeeResponse)
def deactivate_employee(employee_id: int, db: Session = Depends(get_db)):
    """Soft delete: salary history must be preserved, so we only mark inactive."""
    employee = _get_or_404(db, employee_id)
    employee.status = "inactive"
    db.commit()
    db.refresh(employee)
    return employee
