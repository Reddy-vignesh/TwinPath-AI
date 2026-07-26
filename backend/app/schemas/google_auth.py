"""
Google OAuth Login Request Schema.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional

class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID Token or Access Token
    email: Optional[EmailStr] = None
    first_name: Optional[str] = "Google"
    last_name: Optional[str] = "User"
