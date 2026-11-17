from fastapi import FastAPI
from app import models
from app.database import Base, engine
from app.routers.employees import router as employee_router
from app.routers.salaries import router as salary_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reference import router as reference_router
from app.routers.analytics import router as analytics_router

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


@app.get("/")
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
