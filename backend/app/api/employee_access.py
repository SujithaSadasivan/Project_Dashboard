from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.employee_access import EmployeeAccess  # SQLAlchemy model
from app.schemas.employee_access import EmployeeAccessCreate  # Pydantic

router = APIRouter(prefix="/employee-access", tags=["Employee Access"])

@router.get("/")
def get_access_rules(db: Session = Depends(get_db)):
    return db.query(EmployeeAccess).all()

@router.post("/")
def create_access(rule: EmployeeAccessCreate, db: Session = Depends(get_db)):
    # Check unique constraint: one rule per employee
    existing = db.query(EmployeeAccess).filter(EmployeeAccess.employee_id == rule.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Access rule for this employee already exists")

    new_rule = EmployeeAccess(
        employee_id=rule.employee_id,
        access_level=rule.access_level,
        modules=rule.modules,
        status=rule.status
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@router.put("/{rule_id}")
def update_access(rule_id: int, rule: EmployeeAccessCreate, db: Session = Depends(get_db)):
    access_rule = db.query(EmployeeAccess).filter(EmployeeAccess.id == rule_id).first()
    if not access_rule:
        raise HTTPException(status_code=404, detail="Access rule not found")
    
    # Unique constraint
    if db.query(EmployeeAccess).filter(EmployeeAccess.employee_id == rule.employee_id, EmployeeAccess.id != rule_id).first():
        raise HTTPException(status_code=400, detail="Another rule for this employee already exists")

    access_rule.employee_id = rule.employee_id
    access_rule.access_level = rule.access_level
    access_rule.modules = rule.modules
    access_rule.status = rule.status

    db.commit()
    db.refresh(access_rule)
    return access_rule

@router.delete("/{rule_id}")
def delete_access(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(EmployeeAccess).filter(EmployeeAccess.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Access rule not found")
    db.delete(rule)
    db.commit()
    return {"success": True}
