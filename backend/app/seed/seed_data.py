from app.database import SessionLocal
from app.models import Country, Department


def seed_reference_data():
    db = SessionLocal()

    try:
        countries = [
            Country(name="India", code="IND", currency_code="INR"),
            Country(name="United States", code="USA", currency_code="USD"),
            Country(name="United Kingdom", code="GBR", currency_code="GBP"),
            Country(name="Germany", code="DEU", currency_code="EUR"),
            Country(name="Canada", code="CAN", currency_code="CAD"),
        ]

        departments = [
            Department(name="Engineering", description="Software development"),
            Department(name="Human Resources", description="People management"),
            Department(name="Finance", description="Financial operations"),
            Department(name="Sales", description="Business development"),
            Department(name="Marketing", description="Marketing operations"),
        ]

        for country in countries:
            exists = db.query(Country).filter_by(code=country.code).first()
            if not exists:
                db.add(country)

        for department in departments:
            exists = db.query(Department).filter_by(name=department.name).first()
            if not exists:
                db.add(department)

        db.commit()
        print("Reference data seeded successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_reference_data()