from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


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

class SalaryCreate(BaseModel):
    basic_salary: Decimal = Field(gt=0)
    allowances: Decimal = Field(default=Decimal("0.00"), ge=0)
    bonus: Decimal = Field(default=Decimal("0.00"), ge=0)
    deductions: Decimal = Field(default=Decimal("0.00"), ge=0)
    currency: str = Field(min_length=3, max_length=3)
    effective_from: date

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, value):
        return value.upper()