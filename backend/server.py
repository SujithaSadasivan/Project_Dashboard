from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Login System API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hardcoded users
USERS = {
    "admin@example.com": "admin123",
    "user@example.com": "user123",
    "manager@example.com": "manager123"
}

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(login_data: LoginRequest):
    if login_data.email in USERS and USERS[login_data.email] == login_data.password:
        return {
            "access_token": "dummy-token-123",
            "token_type": "bearer",
            "user": {
                "email": login_data.email,
                "full_name": "Demo User",
                "role": "admin" if "admin" in login_data.email else "user",
                "is_active": True
            }
        }
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.get("/api/auth/demo-users")
def demo_users():
    return [
        {"email": "admin@example.com", "password": "admin123", "role": "admin"},
        {"email": "user@example.com", "password": "user123", "role": "user"},
        {"email": "manager@example.com", "password": "manager123", "role": "manager"}
    ]

@app.get("/")
def root():
    return {"message": "Login System API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)