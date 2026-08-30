from sqlalchemy import Column, String, DateTime, Integer
from datetime import datetime
import uuid

from app.core.database import Base

class ClientModel(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, default=lambda: f"cl_{uuid.uuid4().hex[:6]}")
    name = Column(String, nullable=False, index=True)
    status = Column(String, default="active")  # active, inactive, archived
    
    # Реквизиты
    legal_type = Column(String, default="OOO") # OOO, IP, OsOO, AO
    short_name = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    inn = Column(String, nullable=False, index=True)
    kpp = Column(String, nullable=True)
    ogrn = Column(String, nullable=True)
    legal_address = Column(String, nullable=False)
    actual_address = Column(String, nullable=True)
    checking_account = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    bik = Column(String, nullable=True)
    corr_account = Column(String, nullable=True)
    swift_code = Column(String, nullable=True)
    
    # Контакты
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    login_username = Column(String, nullable=True)
    
    # Статистика
    active_shipments_count = Column(Integer, default=0)
    total_acts_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
