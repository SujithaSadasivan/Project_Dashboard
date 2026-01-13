import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Login System API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to import auth router
try:
    from api.routes.auth import router as auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
except ImportError as e:
    print(f"Warning: Could not import auth router: {e}")
    print("Running in simple mode...")

@app.get("/")
def root():
    return {"message": "Login System API", "status": "running"}

@app.get("/api/auth/demo-users")
def demo_users():
    return [
        {"email": "admin@example.com", "password": "admin123", "role": "admin"},
        {"email": "user@example.com", "password": "user123", "role": "user"}
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)