from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app FIRST
app = FastAPI(title="Team Management API", version="1.0.0")

# Configure CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import database and models AFTER creating app to avoid circular imports
from .database import get_db, engine, Base
from .models import User
from . import schemas
from . import auth

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables initialized successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not create tables: {e}")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Dependency to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "Team Management API",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "degraded",
            "database": "disconnected",
            "error": str(e)
        }

# Auth endpoints
@app.post("/api/signup", response_model=schemas.UserResponse)
async def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        db_user = db.query(User).filter(
            (User.email == user.email) | (User.username == user.username)
        ).first()
        
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email or username already registered"
            )
        
        # Additional password validation
        password_bytes = user.password.encode('utf-8')
        if len(password_bytes) > 72:
            # Auto-truncate for bcrypt compatibility
            truncated_bytes = password_bytes[:72]
            while True:
                try:
                    truncated_password = truncated_bytes.decode('utf-8')
                    break
                except UnicodeDecodeError:
                    truncated_bytes = truncated_bytes[:-1]
            user.password = truncated_password
        
        # Create new user
        hashed_password = auth.get_password_hash(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            hashed_password=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during signup"
        )

@app.post("/api/login")
async def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.username == user.username).first()
        
        if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create token
        access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth.create_access_token(
            data={"sub": db_user.username}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": db_user.id,
                "email": db_user.email,
                "username": db_user.username
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@app.get("/api/dashboard-data")
async def get_dashboard_data(current_user: User = Depends(get_current_user)):
    # Tree hierarchy data
    teams = {
        "Teams": {
            "R&D": ["Research Team", "Development Team", "Innovation Lab"],
            "Market Research": ["Survey Team", "Analysis Team", "Competitor Research"],
            "Prototype and Testing": ["Prototype Development", "QA Team", "Testing Lab"],
            "Procurement": ["Vendor Management", "Supply Chain", "Inventory"],
            "Planning and Testing": ["Strategic Planning", "Project Management", "Performance Testing"]
        }
    }
    
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username
        },
        "teams": teams
    }

@app.get("/api/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Add this to handle favicon requests
@app.get("/favicon.ico")
async def favicon():
    return {}