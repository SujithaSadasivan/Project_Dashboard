# app/schemas/employee.py
from pydantic import BaseModel, EmailStr

class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    department: str | None = None
    role: str | None = None
    status: str = "Active"

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(EmployeeBase):
    pass

class EmployeeOut(EmployeeBase):
    id: int

    class Config:
        from_attributes = True
