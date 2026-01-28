from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL

# Convert to async URL
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Async engine with SSL (required for Supabase)
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=True,
    connect_args={"sslmode": "require"}
)

# Async session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()


# Dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
