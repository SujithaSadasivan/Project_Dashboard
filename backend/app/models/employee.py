# app/models/employee.py
from sqlalchemy import Column, String, Integer, DateTime
from app.core.database import Base
from datetime import datetime

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    department = Column(String, nullable=True)
    role = Column(String, nullable=True)
    status = Column(String, nullable=True, default="Active")
    #created_at = Column(DateTime, default=datetime.utcnow)
