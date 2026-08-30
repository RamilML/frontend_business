from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ActServiceItemSchema(BaseModel):
    id: Optional[str] = None
    code: str
    name: str
    price: float
    quantity: int
    amount: float
    enabled: bool
    isCustom: Optional[bool] = False

class ActExecutorRequisitesSchema(BaseModel):
    companyName: str
    legalAddress: str
    innKpp: str
    checkingAccount: str
    corrAccount: str
    bankName: str
    bik: str
    corrBank: Optional[str] = None
    corrBankBik: Optional[str] = None
    corrBankKs: Optional[str] = None
    swiftCode: Optional[str] = None

class ActCreate(BaseModel):
    actNumber: str
    shipmentId: Optional[str] = None
    shipmentNumber: Optional[str] = None
    date: str
    operatorName: str
    clientId: str
    clientName: str
    clientRequisitesText: str
    executorRequisites: ActExecutorRequisitesSchema
    items: List[ActServiceItemSchema]
    totalSum: float
    status: Optional[str] = "signed"

class ActResponse(ActCreate):
    id: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
