from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ClientRequisitesSchema(BaseModel):
    legalType: str = "OOO"
    fullName: str
    shortName: str
    inn: str
    kpp: Optional[str] = None
    ogrn: Optional[str] = None
    legalAddress: str
    actualAddress: Optional[str] = None
    checkingAccount: Optional[str] = None
    bankName: Optional[str] = None
    bik: Optional[str] = None
    corrAccount: Optional[str] = None
    swiftCode: Optional[str] = None

class ClientContactSchema(BaseModel):
    contactPerson: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class ClientBase(BaseModel):
    name: str
    requisites: ClientRequisitesSchema
    contact: ClientContactSchema
    loginUsername: Optional[str] = None
    status: Optional[str] = "active"

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    requisites: Optional[ClientRequisitesSchema] = None
    contact: Optional[ClientContactSchema] = None
    loginUsername: Optional[str] = None
    status: Optional[str] = None

class ClientResponse(ClientBase):
    id: str
    activeShipmentsCount: Optional[int] = 0
    totalActsCount: Optional[int] = 0
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class ClientListResponse(BaseModel):
    items: List[ClientResponse]
