from pydantic import BaseModel
from typing import List

class EmployeeAccessBase(BaseModel):
    employee_id: int
    access_level: str
    status: str
    modules: List[str]

class EmployeeAccessCreate(EmployeeAccessBase):
    pass

class EmployeeAccessUpdate(EmployeeAccessBase):
    pass

class EmployeeAccessOut(EmployeeAccessBase):
    id: int

    class Config:
        from_attributes = True
