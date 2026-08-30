from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.shipment import ShipmentModel, ShipmentItemModel, PackingBoxModel
from app.models.client import ClientModel
from app.schemas.shipment import (
    ShipmentCreate, ShipmentResponse, ShipmentItemResponse, ShipmentItemBase,
    ScanRequest, ScanResponse, UpdateItemQtyRequest,
    CreateBoxRequest, UpdateBoxWarehouseRequest, PackItemRequest, MoveItemRequest,
    PackingBoxSchema, BoxItemSchema
)

router = APIRouter(prefix="/shipments", tags=["Shipments"])

def format_shipment_response(s: ShipmentModel) -> ShipmentResponse:
    items_resp = [
        ShipmentItemResponse(
            id=it.id,
            barcode=it.barcode,
            sku=it.sku,
            title=it.title,
            category=it.category,
            article=it.article,
            size=it.size,
            brand=it.brand,
            plannedQuantity=it.planned_quantity,
            scannedQuantity=it.scanned_quantity,
            lastScannedAt=it.last_scanned_at
        ) for it in s.items
    ]

    boxes_resp = [
        PackingBoxSchema(
            boxNumber=b.box_number,
            targetWarehouse=b.target_warehouse,
            items=[
                BoxItemSchema(
                    itemId=bi.get("itemId", ""),
                    barcode=bi.get("barcode", ""),
                    title=bi.get("title", ""),
                    quantity=bi.get("quantity", 0)
                ) for bi in (b.items or [])
            ]
        ) for b in s.boxes
    ]

    return ShipmentResponse(
        id=s.id,
        shipmentNumber=s.shipment_number,
        clientId=s.client_id,
        clientName=s.client_name,
        targetWarehouses=s.target_warehouses or [],
        status=s.status,
        operatorId=s.operator_id,
        operatorName=s.operator_name,
        items=items_resp,
        boxes=boxes_resp,
        createdAt=s.created_at,
        updatedAt=s.updated_at
    )

@router.get("", response_model=List[ShipmentResponse])
def get_shipments(db: Session = Depends(get_db)):
    shipments = db.query(ShipmentModel).order_by(ShipmentModel.created_at.desc()).all()
    return [format_shipment_response(s) for s in shipments]

@router.get("/{id}", response_model=ShipmentResponse)
def get_shipment_by_id(id: str, db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")
    return format_shipment_response(shipment)

@router.post("", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(dto: ShipmentCreate = Body(...), db: Session = Depends(get_db)):
    client = db.query(ClientModel).filter(ClientModel.id == dto.clientId).first()
    client_name = client.name if client else dto.clientId

    shipment = ShipmentModel(
        shipment_number=dto.shipmentNumber,
        client_id=dto.clientId,
        client_name=client_name,
        target_warehouses=dto.targetWarehouses,
        status="receiving"
    )
    db.add(shipment)
    db.flush()

    if dto.initialItems:
        for idx, it in enumerate(dto.initialItems):
            item_model = ShipmentItemModel(
                shipment_id=shipment.id,
                barcode=it.barcode,
                sku=it.sku or f"SKU-{it.barcode}",
                title=it.title,
                category=it.category,
                article=it.article,
                size=it.size,
                brand=it.brand,
                planned_quantity=it.plannedQuantity or 1,
                scanned_quantity=0
            )
            db.add(item_model)

    db.commit()
    db.refresh(shipment)
    return format_shipment_response(shipment)

@router.post("/{id}/scan", response_model=ScanResponse)
def process_barcode_scan(id: str, req: ScanRequest = Body(...), db: Session = Depends(get_db)):
    barcode = req.barcode.strip()
    if not barcode:
        return ScanResponse(success=False, message="Пустой штрихкод")

    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    item = db.query(ShipmentItemModel).filter(
        ShipmentItemModel.shipment_id == id,
        (ShipmentItemModel.barcode == barcode) | (ShipmentItemModel.sku.ilike(barcode))
    ).first()

    if item:
        item.scanned_quantity += 1
        item.last_scanned_at = datetime.utcnow()
        shipment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(item)

        item_resp = ShipmentItemResponse(
            id=item.id,
            barcode=item.barcode,
            sku=item.sku,
            title=item.title,
            category=item.category,
            article=item.article,
            size=item.size,
            brand=item.brand,
            plannedQuantity=item.planned_quantity,
            scannedQuantity=item.scanned_quantity,
            lastScannedAt=item.last_scanned_at
        )

        return ScanResponse(
            success=True,
            item=item_resp,
            message=f"Отсканировано: {item.title} ({item.scanned_quantity}/{item.planned_quantity} шт.)"
        )
    else:
        return ScanResponse(
            success=False,
            message=f"Штрихкод {barcode} не найден в плановом списке этой поставки.",
            isNewItem=True
        )

@router.put("/{id}/items/{itemId}", response_model=ShipmentItemResponse)
def update_item_details(id: str, itemId: str, req: UpdateItemDetailsRequest = Body(...), db: Session = Depends(get_db)):
    item = db.query(ShipmentItemModel).filter(
        ShipmentItemModel.shipment_id == id,
        ShipmentItemModel.id == itemId
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

    if req.title is not None and req.title.strip():
        item.title = req.title.strip()
    if req.sku is not None and req.sku.strip():
        item.sku = req.sku.strip()
    if req.article is not None:
        item.article = req.article.strip() if req.article.strip() else None
    if req.size is not None:
        item.size = req.size.strip() if req.size.strip() else None
    if req.plannedQuantity is not None:
        item.planned_quantity = max(1, req.plannedQuantity)
    if req.scannedQuantity is not None:
        item.scanned_quantity = max(0, req.scannedQuantity)
        item.last_scanned_at = datetime.utcnow()

    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if shipment:
        shipment.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    return ShipmentItemResponse(
        id=item.id,
        barcode=item.barcode,
        sku=item.sku,
        title=item.title,
        category=item.category,
        article=item.article,
        size=item.size,
        brand=item.brand,
        plannedQuantity=item.planned_quantity,
        scannedQuantity=item.scanned_quantity,
        lastScannedAt=item.last_scanned_at
    )

@router.delete("/{id}/items/{itemId}")
def delete_item_from_shipment(id: str, itemId: str, db: Session = Depends(get_db)):
    item = db.query(ShipmentItemModel).filter(
        ShipmentItemModel.shipment_id == id,
        ShipmentItemModel.id == itemId
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

    # Удаляем ссылки на этот товар из коробок
    boxes = db.query(PackingBoxModel).filter(PackingBoxModel.shipment_id == id).all()
    for box in boxes:
        if box.items:
            box.items = [bi for bi in box.items if bi.get("itemId") != itemId]

    db.delete(item)
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if shipment:
        shipment.updated_at = datetime.utcnow()

    db.commit()
    return {"success": True, "message": "Товар удален из поставки"}

@router.post("/{id}/items", response_model=ShipmentItemResponse, status_code=status.HTTP_201_CREATED)
def add_item_to_shipment(id: str, it: ShipmentItemBase = Body(...), db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    barcode_clean = it.barcode.strip()
    sku_val = it.sku.strip() if it.sku else f"SKU-{barcode_clean}"
    title_val = it.title.strip() if it.title else f"Товар {barcode_clean}"
    plan_val = max(1, int(it.plannedQuantity or 1))

    item_model = ShipmentItemModel(
        shipment_id=shipment.id,
        barcode=barcode_clean,
        sku=sku_val,
        title=title_val,
        category=it.category,
        article=it.article,
        size=it.size,
        brand=it.brand,
        planned_quantity=plan_val,
        scanned_quantity=1,
        last_scanned_at=datetime.utcnow()
    )
    db.add(item_model)
    shipment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item_model)
    
    return ShipmentItemResponse(
        id=item_model.id,
        barcode=item_model.barcode,
        sku=item_model.sku,
        title=item_model.title,
        category=item_model.category,
        article=item_model.article,
        size=item_model.size,
        brand=item_model.brand,
        plannedQuantity=item_model.planned_quantity,
        scannedQuantity=item_model.scanned_quantity,
        lastScannedAt=item_model.last_scanned_at
    )

@router.post("/{id}/boxes")
def create_box(id: str, req: CreateBoxRequest = Body(...), db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    next_num = (max([b.box_number for b in shipment.boxes]) if shipment.boxes else 0) + 1
    new_box = PackingBoxModel(
        shipment_id=id,
        box_number=next_num,
        target_warehouse=req.targetWarehouse,
        items=[]
    )
    db.add(new_box)
    db.commit()
    db.refresh(shipment)
    return format_shipment_response(shipment)

@router.put("/{id}/boxes/{boxNumber}/warehouse")
def update_box_warehouse(id: str, boxNumber: int, req: UpdateBoxWarehouseRequest = Body(...), db: Session = Depends(get_db)):
    box = db.query(PackingBoxModel).filter(
        PackingBoxModel.shipment_id == id,
        PackingBoxModel.box_number == boxNumber
    ).first()
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")

    box.target_warehouse = req.targetWarehouse
    db.commit()
    return {"success": True, "boxNumber": boxNumber, "targetWarehouse": box.target_warehouse}

@router.post("/{id}/boxes/{boxNumber}/pack")
def pack_item_to_box(id: str, boxNumber: int, req: PackItemRequest = Body(...), db: Session = Depends(get_db)):
    box = db.query(PackingBoxModel).filter(
        PackingBoxModel.shipment_id == id,
        PackingBoxModel.box_number == boxNumber
    ).first()
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")

    item = db.query(ShipmentItemModel).filter(
        ShipmentItemModel.shipment_id == id,
        ShipmentItemModel.id == req.itemId
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

    current_items = list(box.items or [])
    found = False
    for bi in current_items:
        if bi.get("itemId") == req.itemId:
            bi["quantity"] = bi.get("quantity", 0) + req.quantity
            found = True
            break
    if not found:
        current_items.append({
            "itemId": item.id,
            "barcode": item.barcode,
            "title": item.title,
            "quantity": req.quantity
        })

    box.items = current_items
    db.commit()
    
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)

@router.post("/{id}/boxes/move")
def move_items_between_boxes(id: str, req: MoveItemRequest = Body(...), db: Session = Depends(get_db)):
    from_box = db.query(PackingBoxModel).filter(PackingBoxModel.shipment_id == id, PackingBoxModel.box_number == req.fromBoxNumber).first()
    to_box = db.query(PackingBoxModel).filter(PackingBoxModel.shipment_id == id, PackingBoxModel.box_number == req.toBoxNumber).first()
    if not from_box or not to_box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")

    from_items = list(from_box.items or [])
    to_items = list(to_box.items or [])

    target_item = None
    for bi in from_items:
        if bi.get("itemId") == req.itemId:
            target_item = bi
            break

    if not target_item or target_item.get("quantity", 0) < req.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Недостаточно товара в исходной коробке")

    target_item["quantity"] -= req.quantity
    if target_item["quantity"] <= 0:
        from_items = [bi for bi in from_items if bi.get("itemId") != req.itemId]

    found_to = False
    for bi in to_items:
        if bi.get("itemId") == req.itemId:
            bi["quantity"] = bi.get("quantity", 0) + req.quantity
            found_to = True
            break
    if not found_to:
        to_items.append({
            "itemId": target_item.get("itemId"),
            "barcode": target_item.get("barcode"),
            "title": target_item.get("title"),
            "quantity": req.quantity
        })

    from_box.items = from_items
    to_box.items = to_items
    db.commit()

    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)

@router.delete("/{id}/boxes/{boxNumber}")
def delete_box(id: str, boxNumber: int, db: Session = Depends(get_db)):
    box = db.query(PackingBoxModel).filter(PackingBoxModel.shipment_id == id, PackingBoxModel.box_number == boxNumber).first()
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")
    db.delete(box)
    db.commit()
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)
