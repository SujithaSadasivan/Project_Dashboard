# app/schemas/employee.py
from pydantic import BaseModel, EmailStr
from datetime import datetime

class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    department: str | None = None
    role: str | None = None
    status: str = "Active"
    custom_fields: dict = {}

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    department: str | None = None
    role: str | None = None
    status: str | None = None
    custom_fields: dict | None = None

class EmployeeOut(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
