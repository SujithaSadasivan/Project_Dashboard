# Configuration settings
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Hardcoded users (no database)
USERS = {
    "admin@example.com": {
        "id": 1,
        "email": "admin@example.com",
        "password": "admin123",  # Plain text for demo
        "full_name": "Admin User",
        "role": "admin",
        "is_active": True
    },
    "user@example.com": {
        "id": 2,
        "email": "user@example.com",
        "password": "user123",  # Plain text for demo
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