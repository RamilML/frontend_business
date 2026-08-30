from sqlalchemy import Column, String, DateTime, Float, JSON
from datetime import datetime
import uuid

from app.core.database import Base

class ActModel(Base):
    __tablename__ = "acts"

    id = Column(String, primary_key=True, default=lambda: f"act_{uuid.uuid4().hex[:6]}")
    act_number = Column(String, nullable=False, unique=True, index=True)
    shipment_id = Column(String, nullable=True, index=True)
    shipment_number = Column(String, nullable=True)
    date = Column(String, nullable=False) # e.g. "2026-08-30"
    operator_name = Column(String, nullable=False)
    client_id = Column(String, nullable=False, index=True)
    client_name = Column(String, nullable=False)
    client_requisites_text = Column(String, nullable=False)
    executor_requisites = Column(JSON, nullable=False) # Dictionary with Bishkek company requisites
    items = Column(JSON, nullable=False) # List of 13 fulfillment service items
    total_sum = Column(Float, default=0.0)
    status = Column(String, default="signed") # draft, signed, paid
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
