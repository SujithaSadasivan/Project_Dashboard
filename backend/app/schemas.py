from pydantic import BaseModel, EmailStr, ConfigDict

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    
    model_config = ConfigDict(from_attributes=True)  # Pydantic v2 syntax

class Token(BaseModel):
    access_token: str
    token_type: str