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
    isPacked: Optional[bool] = False
    sealedAt: Optional[datetime] = None
    items: List[BoxItemSchema] = []

class ShipmentCreate(BaseModel):
    shipmentNumber: str
    clientId: str
    targetWarehouses: List[str]
    status: Optional[str] = "draft"
    plannedDeliveryDate: Optional[str] = None
    driverInfo: Optional[str] = None
    gateNumber: Optional[str] = None
    managerComment: Optional[str] = None
    initialItems: Optional[List[ShipmentItemBase]] = []

class ShipmentUpdate(BaseModel):
    shipmentNumber: Optional[str] = None
    clientId: Optional[str] = None
    clientName: Optional[str] = None
    targetWarehouses: Optional[List[str]] = None
    status: Optional[str] = None
    plannedDeliveryDate: Optional[str] = None
    driverInfo: Optional[str] = None
    gateNumber: Optional[str] = None
    managerComment: Optional[str] = None
    operatorId: Optional[str] = None
    operatorName: Optional[str] = None

class ApproveShipmentRequest(BaseModel):
    gateNumber: Optional[str] = "Ворота № 1"
    managerComment: Optional[str] = None
    plannedDeliveryDate: Optional[str] = None

class ShipmentResponse(BaseModel):
    id: str
    shipmentNumber: str
    clientId: str
    clientName: str
    targetWarehouses: List[str]
    status: str
    plannedDeliveryDate: Optional[str] = None
    driverInfo: Optional[str] = None
    gateNumber: Optional[str] = None
    managerComment: Optional[str] = None
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

class CatalogProductSchema(BaseModel):
    barcode: str
    title: str
    sku: Optional[str] = None
    article: Optional[str] = None
    size: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None

class ScanResponse(BaseModel):
    success: bool
    item: Optional[ShipmentItemResponse] = None
    message: str
    isNewItem: Optional[bool] = False
    catalogProduct: Optional[CatalogProductSchema] = None

class UpdateItemQtyRequest(BaseModel):
    scannedQuantity: Optional[int] = None

class UpdateItemDetailsRequest(BaseModel):
    title: Optional[str] = None
    sku: Optional[str] = None
    article: Optional[str] = None
    size: Optional[str] = None
    plannedQuantity: Optional[int] = None
    scannedQuantity: Optional[int] = None

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

class UpdateBoxItemQuantityRequest(BaseModel):
    quantity: int
