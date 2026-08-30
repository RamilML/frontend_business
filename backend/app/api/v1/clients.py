from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.models.client import ClientModel
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse, ClientRequisitesSchema, ClientContactSchema

router = APIRouter(prefix="/clients", tags=["Clients"])

def model_to_schema(c: ClientModel) -> ClientResponse:
    return ClientResponse(
        id=c.id,
        name=c.name,
        status=c.status,
        loginUsername=c.login_username,
        activeShipmentsCount=c.active_shipments_count,
        totalActsCount=c.total_acts_count,
        createdAt=c.created_at,
        updatedAt=c.updated_at,
        requisites=ClientRequisitesSchema(
            legalType=c.legal_type or "OOO",
            fullName=c.full_name or c.name,
            shortName=c.short_name or c.name,
            inn=c.inn,
            kpp=c.kpp,
            ogrn=c.ogrn,
            legalAddress=c.legal_address,
            actualAddress=c.actual_address,
            checkingAccount=c.checking_account,
            bankName=c.bank_name,
            bik=c.bik,
            corrAccount=c.corr_account,
            swiftCode=c.swift_code
        ),
        contact=ClientContactSchema(
            contactPerson=c.contact_person,
            phone=c.phone,
            email=c.email
        )
    )

@router.get("", response_model=List[ClientResponse])
def get_clients(q: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(ClientModel)
    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(
            (ClientModel.name.ilike(search)) |
            (ClientModel.inn.ilike(search)) |
            (ClientModel.contact_person.ilike(search))
        )
    clients = query.order_by(ClientModel.created_at.desc()).all()
    return [model_to_schema(c) for c in clients]

@router.get("/{id}", response_model=ClientResponse)
def get_client_by_id(id: str, db: Session = Depends(get_db)):
    client = db.query(ClientModel).filter(ClientModel.id == id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контрагент не найден")
    return model_to_schema(client)

@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(dto: ClientCreate, db: Session = Depends(get_db)):
    req = dto.requisites
    cont = dto.contact
    
    client = ClientModel(
        name=dto.name,
        status=dto.status or "active",
        legal_type=req.legalType,
        short_name=req.shortName,
        full_name=req.fullName,
        inn=req.inn,
        kpp=req.kpp,
        ogrn=req.ogrn,
        legal_address=req.legalAddress,
        actual_address=req.actualAddress,
        checking_account=req.checkingAccount,
        bank_name=req.bankName,
        bik=req.bik,
        corr_account=req.corrAccount,
        swift_code=req.swiftCode,
        contact_person=cont.contactPerson,
        phone=cont.phone,
        email=cont.email,
        login_username=dto.loginUsername
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return model_to_schema(client)

@router.put("/{id}", response_model=ClientResponse)
def update_client(id: str, dto: ClientUpdate, db: Session = Depends(get_db)):
    client = db.query(ClientModel).filter(ClientModel.id == id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контрагент не найден")
    
    if dto.name is not None:
        client.name = dto.name
    if dto.status is not None:
        client.status = dto.status
    if dto.loginUsername is not None:
        client.login_username = dto.loginUsername
        
    if dto.requisites is not None:
        req = dto.requisites
        client.legal_type = req.legalType
        client.short_name = req.shortName
        client.full_name = req.fullName
        client.inn = req.inn
        client.kpp = req.kpp
        client.ogrn = req.ogrn
        client.legal_address = req.legalAddress
        client.actual_address = req.actualAddress
        client.checking_account = req.checkingAccount
        client.bank_name = req.bankName
        client.bik = req.bik
        client.corr_account = req.corrAccount
        client.swift_code = req.swiftCode
        
    if dto.contact is not None:
        cont = dto.contact
        client.contact_person = cont.contactPerson
        client.phone = cont.phone
        client.email = cont.email
        
    db.commit()
    db.refresh(client)
    return model_to_schema(client)

@router.delete("/{id}")
def delete_client(id: str, db: Session = Depends(get_db)):
    client = db.query(ClientModel).filter(ClientModel.id == id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Контрагент не найден")
    db.delete(client)
    db.commit()
    return {"success": True, "message": "Контрагент удален"}
