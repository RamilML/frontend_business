from pydantic import BaseModel, Field
from typing import Optional

class UserBase(BaseModel):
    id: str
    username: str
    name: str
    email: str
    role: str
    clientId: Optional[str] = Field(default=None, alias="client_id")
    clientName: Optional[str] = Field(default=None, alias="client_name")

    class Config:
        populate_by_name = True
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = None
    role: Optional[str] = None

class AuthTokens(BaseModel):
    accessToken: str
    refreshToken: Optional[str] = None
    expiresIn: Optional[int] = 3600

class AuthResponse(BaseModel):
    user: UserBase
    tokens: AuthTokens
