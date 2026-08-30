from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base

class ShipmentModel(Base):
    __tablename__ = "shipments"

    id = Column(String, primary_key=True, default=lambda: f"shp_{uuid.uuid4().hex[:6]}")
    shipment_number = Column(String, nullable=False, unique=True, index=True)
    client_id = Column(String, nullable=False, index=True)
    client_name = Column(String, nullable=False)
    target_warehouses = Column(JSON, default=list) # e.g. ["Коледино", "Тула"]
    status = Column(String, default="receiving") # draft, receiving, packing, completed, shipped, ready_to_ship
    operator_id = Column(String, nullable=True)
    operator_name = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("ShipmentItemModel", back_populates="shipment", cascade="all, delete-orphan", lazy="joined")
    boxes = relationship("PackingBoxModel", back_populates="shipment", cascade="all, delete-orphan", lazy="joined")

class ShipmentItemModel(Base):
    __tablename__ = "shipment_items"

    id = Column(String, primary_key=True, default=lambda: f"item_{uuid.uuid4().hex[:6]}")
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=False, index=True)
    barcode = Column(String, nullable=False, index=True)
    sku = Column(String, nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=True)
    article = Column(String, nullable=True)
    size = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    planned_quantity = Column(Integer, default=0)
    scanned_quantity = Column(Integer, default=0)
    last_scanned_at = Column(DateTime, nullable=True)

    shipment = relationship("ShipmentModel", back_populates="items")

class PackingBoxModel(Base):
    __tablename__ = "packing_boxes"

    id = Column(String, primary_key=True, default=lambda: f"box_{uuid.uuid4().hex[:6]}")
    shipment_id = Column(String, ForeignKey("shipments.id"), nullable=False, index=True)
    box_number = Column(Integer, nullable=False)
    target_warehouse = Column(String, nullable=False) # e.g. "Коледино"
    is_packed = Column(Boolean, default=False)
    sealed_at = Column(DateTime, nullable=True)
    items = Column(JSON, default=list) # list of {itemId, barcode, title, quantity}

    shipment = relationship("ShipmentModel", back_populates="boxes")
