from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.act import ActModel
from app.schemas.act import ActCreate, ActResponse, ActExecutorRequisitesSchema, ActServiceItemSchema

router = APIRouter(prefix="/acts", tags=["Acts"])

def format_act_response(a: ActModel) -> ActResponse:
    exec_req = a.executor_requisites or {}
    items_list = a.items or []

    return ActResponse(
        id=a.id,
        actNumber=a.act_number,
        shipmentId=a.shipment_id,
        shipmentNumber=a.shipment_number,
        date=a.date,
        operatorName=a.operator_name,
        clientId=a.client_id,
        clientName=a.client_name,
        clientRequisitesText=a.client_requisites_text,
        executorRequisites=ActExecutorRequisitesSchema(
            companyName=exec_req.get("companyName", 'ОсОО "КРЕАТИВ ВЕЙВ БИШКЕК"'),
            legalAddress=exec_req.get("legalAddress", ""),
            innKpp=exec_req.get("innKpp", ""),
            checkingAccount=exec_req.get("checkingAccount", ""),
            corrAccount=exec_req.get("corrAccount", ""),
            bankName=exec_req.get("bankName", ""),
            bik=exec_req.get("bik", ""),
            corrBank=exec_req.get("corrBank"),
            corrBankBik=exec_req.get("corrBankBik"),
            corrBankKs=exec_req.get("corrBankKs"),
            swiftCode=exec_req.get("swiftCode")
        ),
        items=[
            ActServiceItemSchema(
                id=it.get("id"),
                code=it.get("code", "custom"),
                name=it.get("name", ""),
                price=float(it.get("price", 0)),
                quantity=int(it.get("quantity", 0)),
                amount=float(it.get("amount", 0)),
                enabled=bool(it.get("enabled", True)),
                isCustom=it.get("isCustom", False)
            ) for it in items_list
        ],
        totalSum=a.total_sum,
        status=a.status,
        createdAt=a.created_at,
        updatedAt=a.updated_at
    )

@router.get("", response_model=List[ActResponse])
def get_acts(db: Session = Depends(get_db)):
    acts = db.query(ActModel).order_by(ActModel.created_at.desc()).all()
    return [format_act_response(a) for a in acts]

@router.get("/{id}", response_model=ActResponse)
def get_act_by_id(id: str, db: Session = Depends(get_db)):
    act = db.query(ActModel).filter(ActModel.id == id).first()
    if not act:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Акт не найден")
    return format_act_response(act)

@router.post("", response_model=ActResponse, status_code=status.HTTP_201_CREATED)
def create_act(dto: ActCreate, db: Session = Depends(get_db)):
    act = ActModel(
        act_number=dto.actNumber,
        shipment_id=dto.shipmentId,
        shipment_number=dto.shipmentNumber,
        date=dto.date,
        operator_name=dto.operatorName,
        client_id=dto.clientId,
        client_name=dto.clientName,
        client_requisites_text=dto.clientRequisitesText,
        executor_requisites=dto.executorRequisites.model_dump(),
        items=[it.model_dump() for it in dto.items],
        total_sum=dto.totalSum,
        status=dto.status or "signed"
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return format_act_response(act)

@router.put("/{id}", response_model=ActResponse)
def update_act(id: str, dto: ActCreate, db: Session = Depends(get_db)):
    act = db.query(ActModel).filter(ActModel.id == id).first()
    if not act:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Акт не найден")

    act.act_number = dto.actNumber
    act.date = dto.date
    act.operator_name = dto.operatorName
    act.client_id = dto.clientId
    act.client_name = dto.clientName
    act.client_requisites_text = dto.clientRequisitesText
    act.executor_requisites = dto.executorRequisites.model_dump()
    act.items = [it.model_dump() for it in dto.items]
    act.total_sum = dto.totalSum
    act.status = dto.status or "signed"

    db.commit()
    db.refresh(act)
    return format_act_response(act)

@router.delete("/{id}")
def delete_act(id: str, db: Session = Depends(get_db)):
    act = db.query(ActModel).filter(ActModel.id == id).first()
    if not act:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Акт не найден")
    db.delete(act)
    db.commit()
    return {"success": True, "message": "Акт удален"}
