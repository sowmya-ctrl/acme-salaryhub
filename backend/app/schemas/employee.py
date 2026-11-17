from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    designation: str | None
    department_id: int
    country_id: int
    joining_date: date
    status: str
    created_at: datetime | None
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)