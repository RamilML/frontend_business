from sqlalchemy import Column, String, DateTime
from datetime import datetime
import uuid

from app.core.database import Base

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: f"usr_{uuid.uuid4().hex[:8]}")
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False)  # operator, manager, client, admin
    client_id = Column(String, nullable=True)
    client_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
