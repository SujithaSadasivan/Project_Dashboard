from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt

router = APIRouter()

# Hardcoded users
USERS = {
    "admin@example.com": {
        "id": 1,
        "email": "admin@example.com",
        "password": "admin123",
        "full_name": "Admin User",
        "role": "admin",
        "is_active": True
    },
    "user@example.com": {
        "id": 2,
        "email": "user@example.com",
        "password": "user123",
        "full_name": "Regular User",
        "role": "user",
        "is_active": True
    },
    "manager@example.com": {
        "id": 3,
        "email": "manager@example.com",
        "password": "manager123",
        "full_name": "Project Manager",
        "role": "manager",
        "is_active": True
    }
}

SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class LoginRequest(BaseModel):
    email: str
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
def login(login_data: LoginRequest):
    user = USERS.get(login_data.email)
    
    if not user or user["password"] != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    access_token = create_access_token(data={"sub": user["email"]})
    
    # Remove password from response
    user_response = user.copy()
    user_response.pop("password", None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@router.get("/me")
def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            return {"error": "Invalid token"}
        
        user = USERS.get(email)
        if not user:
            return {"error": "User not found"}
        
        # Remove password
        user_response = user.copy()
        user_response.pop("password", None)
        return user_response
    except jwt.PyJWTError:
        return {"error": "Invalid token"}

@router.get("/demo-users")
def demo_users():
    users_list = []
    for email, user in USERS.items():
        user_copy = user.copy()
        user_copy.pop("password", None)
        users_list.append(user_copy)
    return users_list