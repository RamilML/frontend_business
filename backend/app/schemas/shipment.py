from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ShipmentItemBase(BaseModel):
    barcode: str
    sku: Optional[str] = None
    title: str
    category: Optional[str] = None
    article: Optional[str] = None
    size: Optional[str] = None
    brand: Optional[str] = None
    plannedQuantity: Optional[int] = 1

class ShipmentItemResponse(BaseModel):
    id: str
    barcode: str
    sku: str
    title: str
    category: Optional[str] = None
    article: Optional[str] = None
    size: Optional[str] = None
    brand: Optional[str] = None
    plannedQuantity: int = 1
    scannedQuantity: int = 0
    lastScannedAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class BoxItemSchema(BaseModel):
    itemId: str
    barcode: str
    title: str
    quantity: int

class PackingBoxSchema(BaseModel):
    boxNumber: int
    targetWarehouse: str
    items: List[BoxItemSchema] = []

class ShipmentCreate(BaseModel):
    shipmentNumber: str
    clientId: str
    targetWarehouses: List[str]
    initialItems: Optional[List[ShipmentItemBase]] = []

class ShipmentResponse(BaseModel):
    id: str
    shipmentNumber: str
    clientId: str
    clientName: str
    targetWarehouses: List[str]
    status: str
    operatorId: Optional[str] = None
    operatorName: Optional[str] = None
    items: List[ShipmentItemResponse] = []
    boxes: List[PackingBoxSchema] = []
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class ScanRequest(BaseModel):
    barcode: str

class ScanResponse(BaseModel):
    success: bool
    item: Optional[ShipmentItemResponse] = None
    message: str
    isNewItem: Optional[bool] = False

class UpdateItemQtyRequest(BaseModel):
    scannedQuantity: int

class CreateBoxRequest(BaseModel):
    targetWarehouse: str

class UpdateBoxWarehouseRequest(BaseModel):
    targetWarehouse: str

class PackItemRequest(BaseModel):
    itemId: str
    quantity: int

class MoveItemRequest(BaseModel):
    fromBoxNumber: int
    toBoxNumber: int
    itemId: str
    quantity: int
