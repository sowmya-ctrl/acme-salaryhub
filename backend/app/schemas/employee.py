from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.salary import SalaryCreate


class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    designation: str | None
    department_id: int
    country_id: int
    department_name: str | None = None
    country_name: str | None = None
    joining_date: date
    status: str
    created_at: datetime | None
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class EmployeeCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    designation: str | None = Field(default=None, max_length=100)
    department_id: int = Field(ge=1)
    country_id: int = Field(ge=1)
    joining_date: date
    # Optional: record the starting salary in the same request.
    salary: SalaryCreate | None = None


class EmployeeUpdate(BaseModel):
    """Partial update; only supplied fields change."""

    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    designation: str | None = Field(default=None, max_length=100)
    department_id: int | None = Field(default=None, ge=1)
    country_id: int | None = Field(default=None, ge=1)
    status: Literal["active", "inactive"] | None = None
