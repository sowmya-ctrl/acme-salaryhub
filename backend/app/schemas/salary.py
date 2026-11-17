from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class SalaryResponse(BaseModel):
    id: int
    employee_id: int
    basic_salary: Decimal
    allowances: Decimal
    bonus: Decimal
    deductions: Decimal
    currency: str
    effective_from: date
    effective_to: date | None
    created_at: datetime | None

    model_config = ConfigDict(from_attributes=True)