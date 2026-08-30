from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, decode_access_token
from app.models.user import UserModel
from app.schemas.auth import LoginRequest, AuthResponse, AuthTokens, UserBase

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=AuthResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    # Поиск пользователя по username или роли
    user = None
    if creds.username:
        user = db.query(UserModel).filter(UserModel.username == creds.username).first()
    
    if not user and creds.role:
        user = db.query(UserModel).filter(UserModel.role == creds.role).first()
        
    if not user:
        # Автоматическое создание для демо если не найден
        role = creds.role or "operator"
        user = UserModel(
            username=creds.username,
            password_hash=creds.password or "123456",
            name=creds.username.capitalize(),
            email=f"{creds.username}@fulfillment.ru",
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Проверка пароля (если передан)
    if creds.password and not verify_password(creds.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль"
        )

    token = create_access_token(
        subject=user.id,
        extra_claims={
            "username": user.username,
            "role": user.role,
            "name": user.name
        }
    )

    user_data = UserBase(
        id=user.id,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        clientId=user.client_id,
        clientName=user.client_name
    )

    return AuthResponse(
        user=user_data,
        tokens=AuthTokens(accessToken=token, expiresIn=3600 * 24 * 7)
    )

@router.get("/me", response_model=UserBase)
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Требуется авторизация")
    
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный токен")

    user = db.query(UserModel).filter(UserModel.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    return UserBase(
        id=user.id,
        username=user.username,
        name=user.name,
        email=user.email,
        role=user.role,
        clientId=user.client_id,
        clientName=user.client_name
    )
