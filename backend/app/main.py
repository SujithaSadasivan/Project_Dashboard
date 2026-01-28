from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.core.config import FRONTEND_URL, API_PREFIX
from app.api.auth import router as auth_router

# IMPORT MODELS (REQUIRED FOR TABLE CREATION)
from app.models import user  # noqa: F401
#route paths for backend modules
from app.api.employees import router as employee_router
from app.api.employee_access import router as employee_access_router
from app.api import part as part_router
from app.api import project as project_router
from app.api import department as department_router
from app.api.datasets import router as datasets_router



@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("Database tables checked/created")

    yield
    print("Application shutdown")


app = FastAPI(
    title="MyFastAPIApp",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(employee_router, prefix="/api")
app.include_router(employee_access_router, prefix=API_PREFIX)
app.include_router(part_router.router, prefix=API_PREFIX)
app.include_router(project_router.router, prefix=API_PREFIX)
app.include_router(department_router.router, prefix=API_PREFIX)
app.include_router(datasets_router, prefix=API_PREFIX)
