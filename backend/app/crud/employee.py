# app/crud/employee.py
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from typing import List, Optional

def get_employees(db: Session, skip: int = 0, limit: int = 1000) -> List[Employee]:
    """Get all employees"""
    return db.query(Employee).offset(skip).limit(limit).all()

def get_employee(db: Session, employee_id: int) -> Optional[Employee]:
    """Get a single employee by ID"""
    return db.query(Employee).filter(Employee.id == employee_id).first()

def get_employee_by_email(db: Session, email: str) -> Optional[Employee]:
    """Get employee by email"""
    return db.query(Employee).filter(Employee.email == email).first()

def create_employee(db: Session, employee: EmployeeCreate) -> Employee:
    """Create a new employee"""
    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def update_employee(db: Session, employee_id: int, employee: EmployeeUpdate) -> Optional[Employee]:
    """Update an existing employee"""
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None
    
    update_data = employee.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_employee, field, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

def delete_employee(db: Session, employee_id: int) -> bool:
    """Delete an employee"""
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return False
    
    db.delete(db_employee)
    db.commit()
    return True
