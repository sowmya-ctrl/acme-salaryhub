"""Seed everything (idempotent): python -m app.seed.run_all

Creates tables, then reference data, 10,000 employees, their salaries and the admin login.
Safe to re-run: each step skips rows that already exist.
"""
from app.database import Base, engine
from app import models  # noqa: F401  (registers tables)
from app.seed.seed_data import seed_reference_data
from app.seed.seed_employees import seed_employees
from app.seed.seed_salaries import seed_salaries
from app.seed.seed_admin import seed_admin


def main():
    Base.metadata.create_all(bind=engine)
    seed_reference_data()
    seed_employees()
    seed_salaries()
    seed_admin()


if __name__ == "__main__":
    main()
