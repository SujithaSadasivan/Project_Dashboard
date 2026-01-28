from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
)
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------- LOGIN ----------
@router.post("/login")
def login(data: dict, db: Session = Depends(get_db)):
    # 1️⃣ Find user by email
    user = (
        db.query(User)
        .filter(User.email == data["email"])
        .first()
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2️⃣ Verify password
    if not verify_password(data["password"], user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3️⃣ Create tokens
    access_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
    })

    refresh_token = create_refresh_token(str(user.id))

    # 4️⃣ Return response frontend expects
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "employee_id": user.employee_id,
        },
    }



# ---------- ME ----------
@router.get("/me")
def me(user=Depends(get_current_user)):
    return user
