from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Country, Department

router = APIRouter(prefix="/api", tags=["Reference data"])


@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    return [
        {"id": d.id, "name": d.name}
        for d in db.query(Department).order_by(Department.name)
    ]


@router.get("/countries")
def list_countries(db: Session = Depends(get_db)):
    return [
        {"id": c.id, "name": c.name, "code": c.code, "currency_code": c.currency_code}
        for c in db.query(Country).order_by(Country.name)
    ]
