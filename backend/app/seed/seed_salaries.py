import random
from decimal import Decimal

from app.database import SessionLocal
from app.models import Employee, SalaryRecord


SALARY_RANGES = {
    "INR": (30000, 180000),
    "USD": (3000, 12000),
    "GBP": (2500, 9000),
    "EUR": (2800, 8500),
    "CAD": (3000, 10000),
}


def seed_salaries():
    db = SessionLocal()
    rng = random.Random(42)

    try:
        employees = (
            db.query(Employee)
            .join(Employee.country)
            .all()
        )

        existing_employee_ids = {
            employee_id
            for (employee_id,) in db.query(
                SalaryRecord.employee_id
            ).filter(
                SalaryRecord.effective_to.is_(None)
            ).all()
        }

        salary_records = []

        for employee in employees:
            if employee.id in existing_employee_ids:
                continue

            currency = employee.country.currency_code
            minimum, maximum = SALARY_RANGES[currency]

            basic_salary = Decimal(
                str(rng.randint(minimum, maximum))
            )

            allowances = (basic_salary * Decimal("0.15")).quantize(
                Decimal("0.01")
            )
            bonus = (basic_salary * Decimal("0.10")).quantize(
                Decimal("0.01")
            )
            deductions = (basic_salary * Decimal("0.05")).quantize(
                Decimal("0.01")
            )

            salary_records.append(
                SalaryRecord(
                    employee_id=employee.id,
                    basic_salary=basic_salary,
                    allowances=allowances,
                    bonus=bonus,
                    deductions=deductions,
                    currency=currency,
                    effective_from=employee.joining_date,
                    effective_to=None,
                )
            )

            if len(salary_records) == 1000:
                db.add_all(salary_records)
                db.commit()
                salary_records.clear()

        if salary_records:
            db.add_all(salary_records)
            db.commit()

        total = db.query(SalaryRecord).count()
        print(f"Salary seeding completed. Total records: {total}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_salaries()