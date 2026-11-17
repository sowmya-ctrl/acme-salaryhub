from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    designation = Column(String(100), nullable=True)

    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False, index=True)

    joining_date = Column(Date, nullable=False)
    status = Column(String(20), default="active", nullable=False, index=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    department = relationship("Department", back_populates="employees")
    country = relationship("Country", back_populates="employees")

    salary_records = relationship(
        "SalaryRecord",
        back_populates="employee",
        cascade="all, delete-orphan",
    )

    @property
    def department_name(self):
        return self.department.name if self.department else None

    @property
    def country_name(self):
        return self.country.name if self.country else None