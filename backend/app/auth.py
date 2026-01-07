from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 60))

# Fix bcrypt __about__ issue (workaround for bcrypt version warning)
try:
    import bcrypt as _bcrypt
    if not hasattr(_bcrypt, '__about__'):
        class MockAbout:
            __version__ = '3.2.0'
        _bcrypt.__about__ = MockAbout()
except ImportError:
    pass

# Configure CryptContext to handle bcrypt password limits
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__truncate_error=False  # Changed to False to avoid truncation error
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """
    Hash a password for storing.
    Automatically handles passwords longer than 72 bytes by truncating.
    """
    # Convert to bytes to check length
    password_bytes = password.encode('utf-8')
    
    if len(password_bytes) > 72:
        # Truncate to 72 bytes
        truncated_bytes = password_bytes[:72]
        
        # Safely decode back to string
        # Remove bytes until we get a valid UTF-8 sequence
        while True:
            try:
                truncated_password = truncated_bytes.decode('utf-8')
                break
            except UnicodeDecodeError:
                truncated_bytes = truncated_bytes[:-1]
        
        print(f"Password automatically truncated from {len(password_bytes)} to 72 bytes")
        password = truncated_password
    
    # Hash the (possibly truncated) password
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt