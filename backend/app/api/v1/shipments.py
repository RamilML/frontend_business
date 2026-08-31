from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.shipment import ShipmentModel, ShipmentItemModel, PackingBoxModel
from app.models.client import ClientModel
from app.schemas.shipment import (
    ShipmentCreate, ShipmentUpdate, ShipmentResponse, ShipmentItemResponse, ShipmentItemBase,
    ScanRequest, ScanResponse, UpdateItemQtyRequest, UpdateItemDetailsRequest,
    CreateBoxRequest, UpdateBoxWarehouseRequest, PackItemRequest, MoveItemRequest,
    UpdateBoxItemQuantityRequest, ApproveShipmentRequest, PackingBoxSchema, BoxItemSchema, CatalogProductSchema
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

    # Sort boxes by ID and assign strictly sequential unique boxNumber (1, 2, 3...)
    sorted_boxes = sorted(s.boxes or [], key=lambda b: getattr(b, 'id', 0) or 0)
    boxes_resp = [
        PackingBoxSchema(
            boxNumber=idx + 1,
            targetWarehouse=b.target_warehouse,
            isPacked=bool(b.is_packed),
            sealedAt=b.sealed_at,
            items=[
                BoxItemSchema(
                    itemId=bi.get("itemId", ""),
                    barcode=bi.get("barcode", ""),
                    title=bi.get("title", ""),
                    quantity=bi.get("quantity", 0)
                ) for bi in (b.items or [])
            ]
        ) for idx, b in enumerate(sorted_boxes)
    ]

    return ShipmentResponse(
        id=s.id,
        shipmentNumber=s.shipment_number,
        clientId=s.client_id,
        clientName=s.client_name,
        targetWarehouses=s.target_warehouses or [],
        status=s.status,
        plannedDeliveryDate=s.planned_delivery_date,
        driverInfo=s.driver_info,
        gateNumber=s.gate_number,
        managerComment=s.manager_comment,
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

@router.put("/{id}", response_model=ShipmentResponse)
def update_shipment(id: str, dto: ShipmentUpdate = Body(...), db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if dto.shipmentNumber is not None and dto.shipmentNumber.strip():
        shipment.shipment_number = dto.shipmentNumber.strip()
    if dto.clientId is not None and dto.clientId.strip():
        shipment.client_id = dto.clientId.strip()
        client = db.query(ClientModel).filter(ClientModel.id == shipment.client_id).first()
        if client:
            shipment.client_name = client.name
    if dto.clientName is not None and dto.clientName.strip():
        shipment.client_name = dto.clientName.strip()
    if dto.targetWarehouses is not None:
        shipment.target_warehouses = dto.targetWarehouses
    if dto.status is not None and dto.status.strip():
        shipment.status = dto.status.strip()
    if dto.plannedDeliveryDate is not None:
        shipment.planned_delivery_date = dto.plannedDeliveryDate
    if dto.driverInfo is not None:
        shipment.driver_info = dto.driverInfo
    if dto.gateNumber is not None:
        shipment.gate_number = dto.gateNumber
    if dto.managerComment is not None:
        shipment.manager_comment = dto.managerComment
    if dto.operatorId is not None:
        shipment.operator_id = dto.operatorId
    if dto.operatorName is not None:
        shipment.operator_name = dto.operatorName

    shipment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shipment)
    return format_shipment_response(shipment)

@router.post("/{id}/approve", response_model=ShipmentResponse)
def approve_shipment(id: str, req: ApproveShipmentRequest = Body(...), db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    shipment.status = "approved"
    if req.gateNumber:
        shipment.gate_number = req.gateNumber
    if req.managerComment:
        shipment.manager_comment = req.managerComment
    if req.plannedDeliveryDate:
        shipment.planned_delivery_date = req.plannedDeliveryDate

    shipment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shipment)
    return format_shipment_response(shipment)

@router.post("/{id}/start-receiving", response_model=ShipmentResponse)
def start_receiving_shipment(id: str, db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    shipment.status = "receiving"
    shipment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shipment)
    return format_shipment_response(shipment)

@router.delete("/{id}")
def delete_shipment(id: str, db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    db.delete(shipment)
    db.commit()
    return {"success": True, "message": f"Поставка {shipment.shipment_number} успешно удалена"}

@router.post("", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED)
def create_shipment(dto: ShipmentCreate = Body(...), db: Session = Depends(get_db)):
    client = db.query(ClientModel).filter(ClientModel.id == dto.clientId).first()
    client_name = client.name if client else dto.clientId

    shipment = ShipmentModel(
        shipment_number=dto.shipmentNumber,
        client_id=dto.clientId,
        client_name=client_name,
        target_warehouses=dto.targetWarehouses,
        status=dto.status or "draft",
        planned_delivery_date=dto.plannedDeliveryDate,
        driver_info=dto.driverInfo,
        gate_number=dto.gateNumber,
        manager_comment=dto.managerComment
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

    if shipment.status in ["shipped", "completed"]:
        return ScanResponse(
            success=False,
            message=f"Поставка уже {shipment.status}. Сканирование и приёмка заблокированы."
        )

    item = db.query(ShipmentItemModel).filter(
        ShipmentItemModel.shipment_id == id,
        (ShipmentItemModel.barcode == barcode) | (ShipmentItemModel.sku.ilike(barcode))
    ).first()

    if item:
        item.scanned_quantity += 1
        item.last_scanned_at = datetime.utcnow()
        if shipment.status == "draft":
            shipment.status = "receiving"
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
        # Поиск информации о товаре в глобальной базе / прошлых поставках
        catalog_item = db.query(ShipmentItemModel).filter(
            (ShipmentItemModel.barcode == barcode) | (ShipmentItemModel.sku.ilike(barcode))
        ).order_by(ShipmentItemModel.id.desc()).first()

        catalog_product = None
        if catalog_item:
            catalog_product = CatalogProductSchema(
                barcode=catalog_item.barcode,
                title=catalog_item.title,
                sku=catalog_item.sku,
                article=catalog_item.article,
                size=catalog_item.size,
                brand=catalog_item.brand,
                category=catalog_item.category
            )

        msg = f"Товар распознан из каталога: {catalog_item.title}" if catalog_item else f"Штрихкод {barcode} не найден в плане этой поставки."

        return ScanResponse(
            success=False,
            message=msg,
            isNewItem=True,
            catalogProduct=catalog_product
        )

@router.put("/{id}/items/{itemId}", response_model=ShipmentItemResponse)
def update_item_details(id: str, itemId: str, req: UpdateItemDetailsRequest = Body(...), db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Изменение количества и параметров товаров заблокировано."
        )

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
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Удаление товаров заблокировано."
        )

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

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Добавление товаров заблокировано."
        )

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
    if shipment.status == "draft":
        shipment.status = "receiving"
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

def get_box_by_number(shipment_id: str, box_number: int, db: Session) -> PackingBoxModel:
    boxes = db.query(PackingBoxModel).filter(PackingBoxModel.shipment_id == shipment_id).order_by(PackingBoxModel.id.asc()).all()
    # Normalize box_number in database to strictly sequential 1, 2, 3...
    for idx, b in enumerate(boxes):
        if b.box_number != idx + 1:
            b.box_number = idx + 1
    db.commit()

    if 1 <= box_number <= len(boxes):
        return boxes[box_number - 1]
    return next((b for b in boxes if b.box_number == box_number), None)

@router.post("/{id}/boxes")
def create_box(id: str, req: CreateBoxRequest = Body(...), db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Добавление коробок заблокировано."
        )

    existing_boxes = db.query(PackingBoxModel).filter(PackingBoxModel.shipment_id == id).order_by(PackingBoxModel.id.asc()).all()
    for idx, b in enumerate(existing_boxes):
        b.box_number = idx + 1

    next_num = len(existing_boxes) + 1
    new_box = PackingBoxModel(
        shipment_id=id,
        box_number=next_num,
        target_warehouse=req.targetWarehouse,
        is_packed=False,
        items=[]
    )
    db.add(new_box)
    db.commit()
    db.expire_all()
    
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)

@router.put("/{id}/boxes/{boxNumber}/warehouse")
def update_box_warehouse(id: str, boxNumber: int, req: UpdateBoxWarehouseRequest = Body(...), db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Изменение склада коробки заблокировано."
        )

    box = get_box_by_number(id, boxNumber, db)
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")

    box.target_warehouse = req.targetWarehouse
    db.commit()
    return {"success": True, "boxNumber": box.box_number, "targetWarehouse": box.target_warehouse}

@router.post("/{id}/boxes/{boxNumber}/pack")
def pack_item_to_box(id: str, boxNumber: int, req: PackItemRequest = Body(...), db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Укладка товаров заблокирована."
        )

    box = get_box_by_number(id, boxNumber, db)
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")

    item = db.query(ShipmentItemModel).filter(
        ShipmentItemModel.shipment_id == id,
        ShipmentItemModel.id == req.itemId
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

    # Count how many of this item are already packed across all boxes
    all_boxes = db.query(PackingBoxModel).filter(PackingBoxModel.shipment_id == id).all()
    already_packed = 0
    for b in all_boxes:
        for bi in (b.items or []):
            if bi.get("itemId") == req.itemId:
                already_packed += bi.get("quantity", 0)

    remaining_available = max(0, item.scanned_quantity - already_packed)
    if req.quantity > remaining_available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Нельзя положить {req.quantity} шт. товара «{item.title}». В наличии принято сканером {item.scanned_quantity} шт., уже уложено {already_packed} шт. (осталось {remaining_available} шт.)."
        )

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
    flag_modified(box, "items")
    if shipment.status in ["draft", "receiving", "ready_to_ship"]:
        shipment.status = "packing"
    shipment.updated_at = datetime.utcnow()
    db.commit()
    
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)

@router.put("/{id}/boxes/{boxNumber}/items/{itemId}")
def update_box_item_quantity(
    id: str,
    boxNumber: int,
    itemId: str,
    req: UpdateBoxItemQuantityRequest = Body(...),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm.attributes import flag_modified
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Корректировка коробок заблокирована."
        )

    box = get_box_by_number(id, boxNumber, db)
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")

    if box.is_packed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Коробка запечатана. Вскройте её для изменения состава.")

    item = db.query(ShipmentItemModel).filter(
        ShipmentItemModel.shipment_id == id,
        (ShipmentItemModel.id == itemId) | (ShipmentItemModel.barcode == itemId)
    ).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

    # Count how many are packed in OTHER boxes
    all_boxes = db.query(PackingBoxModel).filter(PackingBoxModel.shipment_id == id).all()
    packed_in_other_boxes = 0
    for b in all_boxes:
        if b.box_number != boxNumber:
            for bi in (b.items or []):
                if bi.get("itemId") == item.id or bi.get("barcode") == item.barcode or bi.get("itemId") == itemId:
                    packed_in_other_boxes += bi.get("quantity", 0)

    max_allowed_in_this_box = max(0, item.scanned_quantity - packed_in_other_boxes)
    if req.quantity > max_allowed_in_this_box:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Нельзя установить {req.quantity} шт. Максимум доступно: {max_allowed_in_this_box} шт."
        )

    current_items = list(box.items or [])
    if req.quantity <= 0:
        current_items = [
            bi for bi in current_items
            if bi.get("itemId") != item.id and bi.get("barcode") != item.barcode and bi.get("itemId") != itemId
        ]
    else:
        found = False
        for bi in current_items:
            if bi.get("itemId") == item.id or bi.get("barcode") == item.barcode or bi.get("itemId") == itemId:
                bi["quantity"] = req.quantity
                bi["itemId"] = item.id
                bi["barcode"] = item.barcode
                bi["title"] = item.title
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
    flag_modified(box, "items")
    if shipment.status in ["draft", "receiving", "ready_to_ship"]:
        shipment.status = "packing"
    shipment.updated_at = datetime.utcnow()
    db.commit()

    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)

@router.delete("/{id}/boxes/{boxNumber}/items/{itemId}")
def remove_item_from_box(
    id: str,
    boxNumber: int,
    itemId: str,
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm.attributes import flag_modified
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Удаление из коробок заблокировано."
        )

    box = get_box_by_number(id, boxNumber, db)
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")

    if box.is_packed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Коробка запечатана. Вскройте её для изменения состава.")

    item = db.query(ShipmentItemModel).filter(
        ShipmentItemModel.shipment_id == id,
        (ShipmentItemModel.id == itemId) | (ShipmentItemModel.barcode == itemId)
    ).first()

    box.items = [
        bi for bi in (box.items or [])
        if bi.get("itemId") != itemId and (not item or (bi.get("itemId") != item.id and bi.get("barcode") != item.barcode))
    ]
    flag_modified(box, "items")
    if shipment.status in ["draft", "receiving", "ready_to_ship"]:
        shipment.status = "packing"
    shipment.updated_at = datetime.utcnow()
    db.commit()

    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)

@router.post("/{id}/boxes/move")
def move_items_between_boxes(id: str, req: MoveItemRequest = Body(...), db: Session = Depends(get_db)):
    from sqlalchemy.orm.attributes import flag_modified
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Перемещение товаров заблокировано."
        )

    from_box = get_box_by_number(id, req.fromBoxNumber, db)
    to_box = get_box_by_number(id, req.toBoxNumber, db)
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
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Удаление коробок заблокировано."
        )

    box = get_box_by_number(id, boxNumber, db)
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")
    db.delete(box)
    db.commit()
    db.expire_all()
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)

def validate_shipment_ready_for_shipping(shipment: ShipmentModel):
    total_scanned = sum(it.scanned_quantity for it in shipment.items)
    if total_scanned == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя отгрузить поставку: ни один товар ещё не принят сканером."
        )

    total_packed = sum(sum(bi.get("quantity", 0) for bi in (b.items or [])) for b in shipment.boxes)
    if total_packed < total_scanned:
        remaining = total_scanned - total_packed
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Нельзя отгрузить: не все принятые товары уложены в коробки (осталось уложить: {remaining} шт.)."
        )

    if not shipment.boxes or len(shipment.boxes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя отгрузить: в поставке нет созданных коробок."
        )

    for b in shipment.boxes:
        if not b.items or len(b.items) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Коробка №{b.box_number} пуста. Заполните или удалите её перед отгрузкой."
            )
        if not b.is_packed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Коробка №{b.box_number} не запечатана. Все коробки должны быть запечатаны и заклеены перед отгрузкой."
            )

@router.put("/{id}/boxes/{boxNumber}/seal")
def seal_box(id: str, boxNumber: int, db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    if shipment.status in ["shipped", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Поставка уже {shipment.status}. Запечатывание/вскрытие коробок заблокировано."
        )

    box = get_box_by_number(id, boxNumber, db)
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Коробка не найдена")

    # Toggle sealed status
    box.is_packed = not bool(box.is_packed)
    box.sealed_at = datetime.utcnow() if box.is_packed else None

    # If unsealed, shipment cannot remain in 'ready_to_ship'
    if not box.is_packed and shipment.status == "ready_to_ship":
        shipment.status = "packing"

    shipment.updated_at = datetime.utcnow()
    db.commit()

    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    return format_shipment_response(shipment)

@router.post("/{id}/finalize-packing")
def finalize_packing(id: str, db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    # Validate that all items are packed, all boxes non-empty and sealed
    validate_shipment_ready_for_shipping(shipment)

    # Move shipment status to ready_to_ship
    shipment.status = "ready_to_ship"
    shipment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shipment)

    return format_shipment_response(shipment)

@router.post("/{id}/ship")
def ship_shipment(id: str, db: Session = Depends(get_db)):
    shipment = db.query(ShipmentModel).filter(ShipmentModel.id == id).first()
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Поставка не найдена")

    # Validate before shipping to driver
    validate_shipment_ready_for_shipping(shipment)

    shipment.status = "shipped"
    shipment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(shipment)

    return format_shipment_response(shipment)
