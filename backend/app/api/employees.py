from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.employee import Employee

router = APIRouter(prefix="/employees", tags=["Employees"])

# GET all employees
@router.get("")
def get_employees(db: Session = Depends(get_db)):
    return db.query(Employee).all()

# CREATE new employee
@router.post("")
def create_employee(employee: dict, db: Session = Depends(get_db)):
    try:
        new_emp = Employee(**employee)  # keys must match Employee columns
        db.add(new_emp)
        db.commit()
        db.refresh(new_emp)
        return new_emp
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
