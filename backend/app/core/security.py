from datetime import datetime, timedelta
from typing import Optional, Any
import jwt
import hashlib

from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Хеширование пароля SHA-256 с солью для простоты и надежности"""
    salt = settings.SECRET_KEY[:8]
    return hashlib.sha256(f"{salt}{password}".encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля с хешем или прямым совпадением для демо"""
    if plain_password == hashed_password:
        return True
    return get_password_hash(plain_password) == hashed_password

def create_access_token(subject: str | Any, extra_claims: Optional[dict] = None, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject)
    }
    if extra_claims:
        to_encode.update(extra_claims)
        
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
