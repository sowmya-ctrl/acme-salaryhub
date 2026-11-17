import random
from datetime import date, timedelta

from app.database import SessionLocal
from app.models import Country, Department, Employee


FIRST_NAMES = [
    "Aarav", "Priya", "Rahul", "Sneha", "Arjun",
    "Ananya", "Vikram", "Kavya", "Rohan", "Meera",
    "Daniel", "Emma", "Oliver", "Sophia", "Liam",
]

LAST_NAMES = [
    "Sharma", "Reddy", "Patel", "Kumar", "Smith",
    "Brown", "Wilson", "Taylor", "Martin", "Clark",
]

DESIGNATIONS = [
    "Software Engineer",
    "Senior Software Engineer",
    "HR Executive",
    "Finance Analyst",
    "Sales Executive",
    "Marketing Manager",
    "Team Lead",
    "Project Manager",
]


def seed_employees():
    db = SessionLocal()
    rng = random.Random(42)

    try:
        countries = db.query(Country).all()
        departments = db.query(Department).all()

        if not countries or not departments:
            raise RuntimeError(
                "Seed countries and departments before employees."
            )

        existing_codes = {
            code
            for (code,) in db.query(Employee.employee_code).all()
        }

        start_date = date(2018, 1, 1)

        for batch_start in range(1, 10001, 1000):
            employees = []

            for number in range(batch_start, min(batch_start + 1000, 10001)):
                employee_code = f"ACME{number:05d}"

                if employee_code in existing_codes:
                    continue

                first_name = rng.choice(FIRST_NAMES)
                last_name = rng.choice(LAST_NAMES)

                joining_date = start_date + timedelta(
                    days=rng.randint(0, 3200)
                )

                country = rng.choice(countries)
                department = rng.choice(departments)

                employees.append(
                    Employee(
                        employee_code=employee_code,
                        first_name=first_name,
                        last_name=last_name,
                        email=f"{employee_code.lower()}@example.com",
                        designation=rng.choice(DESIGNATIONS),
                        department_id=department.id,
                        country_id=country.id,
                        joining_date=joining_date,
                        status=rng.choice(["active", "active", "active", "inactive"]),
                    )
                )

            if employees:
                db.add_all(employees)
                db.commit()

            print(f"Processed employees up to {min(batch_start + 999, 10000)}")

        total = db.query(Employee).count()
        print(f"Employee seeding completed. Total employees: {total}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_employees()