"""Salary helpers shared by the dashboard, analytics and export routers."""
from datetime import date

from sqlalchemy import or_

from app.models import SalaryRecord

# Net pay as the product defines it: basic + allowances + bonus - deductions.
NET_SALARY = (
    SalaryRecord.basic_salary
    + SalaryRecord.allowances
    + SalaryRecord.bonus
    - SalaryRecord.deductions
)


def is_current(on: date | None = None):
    """SQL conditions selecting the salary record in force on `on` (default today)."""
    on = on or date.today()
    return (
        SalaryRecord.effective_from <= on,
        or_(SalaryRecord.effective_to.is_(None), SalaryRecord.effective_to >= on),
    )
