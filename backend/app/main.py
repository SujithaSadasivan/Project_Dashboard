from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, Base, get_db
from app.core.config import FRONTEND_URL, API_PREFIX

# Import models for table creation
from app.models import user  # noqa: F401

# Import routers
from app.api.auth import router as auth_router
from app.api.employees import router as employee_router
from app.api.employee_access import router as employee_access_router
from app.api import part as part_router
from app.api import project as project_router
from app.api import department as department_router
from app.api.datasets import router as datasets_router

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="MyFastAPIApp",
    version="1.0.0",
    #lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins= [
    "https://automated-manufacturing.vercel.app",   
    "https://automated-manufact-git-6ff091-gokulakrishnans-projects-78c7d2dd.vercel.app",  # preview
    "https://automated-manufacturing-kdmeekg5b.vercel.app", 
    "http://localhost:5173",  # local frontend testing
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(employee_router, prefix="API_PREFIX")
app.include_router(employee_access_router, prefix=API_PREFIX)
app.include_router(part_router.router, prefix=API_PREFIX)
app.include_router(project_router.router, prefix=API_PREFIX)
app.include_router(department_router.router, prefix=API_PREFIX)
app.include_router(datasets_router, prefix=API_PREFIX)

#testing routes
@app.get("/test-db")
async def test_db(db: AsyncSession = Depends(get_db)):
    result = await db.execute("SELECT NOW()")
    current_time = result.scalar()
    return {"current_time": str(current_time)}

@app.get("/healthz")
def health_check():
    return {"status": "ok"}
