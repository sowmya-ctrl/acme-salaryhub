import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app import models
from app.database import Base, engine
from app.routers.employees import router as employee_router
from app.routers.salaries import router as salary_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reference import router as reference_router
from app.routers.analytics import router as analytics_router
from app.routers.reports import router as reports_router

app = FastAPI(
    title = "ACME SalaryHub API",
    description = "Employee and Salary Management System",
    version = "1.0.0",
)

Base.metadata.create_all(bind=engine)
app.include_router(employee_router)
app.include_router(salary_router)
app.include_router(dashboard_router)
app.include_router(reference_router)
app.include_router(analytics_router)
app.include_router(reports_router)


@app.get("/api/status")
def home():
    return {
        "message":"Welecome to ACME SalaryHub API",
        "status" : "running",
    }

@app.get("/health")
def health_check():
    return {
        "status" : "healty",
        "application" : "ACME SalaryHub",
    }


# In production the built React app is served by the same process (single deploy unit).
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
