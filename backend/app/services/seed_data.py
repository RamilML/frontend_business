from sqlalchemy.orm import Session
from app.models.user import UserModel
from app.models.client import ClientModel
from app.models.shipment import ShipmentModel, ShipmentItemModel, PackingBoxModel
from app.models.act import ActModel
from app.core.security import get_password_hash

OFFICIAL_EXECUTOR_REQUISITES = {
    "companyName": 'ОсОО "КРЕАТИВ ВЕЙВ БИШКЕК"',
    "legalAddress": "Кыргызская Республика, г. Бишкек, Октябрьский р-н, мкр 10, д. 2, кв 59",
    "innKpp": "01904202310427 / 019001001",
    "checkingAccount": "1033220002348631",
    "corrAccount": "30111810400000073672",
    "bankName": 'ОАО "МБАНК"',
    "bik": "103032",
    "corrBank": "АО ПЕРВОУРАЛЬСК БАНК",
    "corrBankBik": "046577402",
    "corrBankKs": "0101810565770000402",
    "swiftCode": "KYRSKG22 / PVRBRU4V"
}

def seed_database(db: Session):
    # 1. Users
    if db.query(UserModel).count() == 0:
        users = [
            UserModel(
                id="usr_op_01",
                username="operator",
                password_hash=get_password_hash("123456"),
                name="Алексей Смирнов",
                email="operator@fulfillment.ru",
                role="operator"
            ),
            UserModel(
                id="usr_mg_01",
                username="manager",
                password_hash=get_password_hash("123456"),
                name="Елена Ковалева",
                email="manager@fulfillment.ru",
                role="manager"
            ),
            UserModel(
                id="usr_cl_01",
                username="client",
                password_hash=get_password_hash("123456"),
                name='ООО "Модный Гардероб"',
                email="seller@fashion-store.ru",
                role="client",
                client_id="cl_9921",
                client_name='ООО "Модный Гардероб"'
            ),
            UserModel(
                id="usr_ad_01",
                username="admin",
                password_hash=get_password_hash("123456"),
                name="Иван Администратор",
                email="admin@fulfillment.ru",
                role="admin"
            )
        ]
        db.add_all(users)
        db.commit()

    # 2. Clients (2 аккуратных контрагента)
    if db.query(ClientModel).count() == 0:
        clients = [
            ClientModel(
                id="cl_9921",
                name='ООО "Модный Гардероб"',
                status="active",
                legal_type="OOO",
                short_name='ООО "Модный Гардероб"',
                full_name='Общество с ограниченной ответственностью "Модный Гардероб"',
                inn="7701234567",
                kpp="770101001",
                ogrn="1157746001122",
                legal_address="г. Москва, ул. Тверская, д. 12, стр. 1, оф. 405",
                actual_address="г. Москва, Складской проезд, д. 8",
                checking_account="40702810938000012345",
                bank_name="ПАО Сбербанк",
                bik="044525225",
                corr_account="30101810400000000225",
                contact_person="Смирнова Анна Сергеевна",
                phone="+7 (999) 123-45-67",
                email="seller@fashion-store.ru",
                login_username="client",
                active_shipments_count=1,
                total_acts_count=1
            ),
            ClientModel(
                id="cl_9922",
                name="ИП Смирнов В.А. (KidsWear)",
                status="active",
                legal_type="IP",
                short_name="ИП Смирнов В.А.",
                full_name="Индивидуальный Предприниматель Смирнов Виктор Александрович",
                inn="503212345678",
                ogrn="321503200044556",
                legal_address="Московская обл., г. Одинцово, ул. Можайское ш., д. 45, кв. 12",
                checking_account="40802810500000098765",
                bank_name='АО "Тинькофф Банк"',
                bik="044525974",
                corr_account="30101810145250000974",
                contact_person="Смирнов Виктор Александрович",
                phone="+7 (916) 987-65-43",
                email="info@kidswear-wb.ru",
                login_username="smirnov_kidswear",
                active_shipments_count=0,
                total_acts_count=0
            )
        ]
        db.add_all(clients)
        db.commit()

    # 3. Shipments (1 чистая поставка на приёмку)
    if db.query(ShipmentModel).count() == 0:
        shipment = ShipmentModel(
            id="shp_1001",
            shipment_number="WB-2026-0830-01",
            client_id="cl_9921",
            client_name='ООО "Модный Гардероб"',
            target_warehouses=["Коледино"],
            status="receiving",
            operator_id="usr_op_01",
            operator_name="Алексей Смирнов"
        )
        db.add(shipment)
        db.flush()

        items = [
            ShipmentItemModel(
                id="item_1",
                shipment_id=shipment.id,
                barcode="4601234567890",
                sku="FUT-BLK-M",
                title="Футболка базовая Черная M",
                category="Одежда",
                article="WB-FUT-01",
                size="M",
                planned_quantity=10,
                scanned_quantity=0
            ),
            ShipmentItemModel(
                id="item_2",
                shipment_id=shipment.id,
                barcode="4601234567891",
                sku="HOOD-GRY-L",
                title="Худи утепленное Серый L",
                category="Одежда",
                article="WB-HD-02",
                size="L",
                planned_quantity=5,
                scanned_quantity=0
            )
        ]
        db.add_all(items)

        boxes = [
            PackingBoxModel(
                id="box_1",
                shipment_id=shipment.id,
                box_number=1,
                target_warehouse="Коледино",
                is_packed=False,
                items=[]
            )
        ]
        db.add_all(boxes)
        db.commit()

    # 4. Acts (1 готовый эталонный Акт)
    if db.query(ActModel).count() == 0:
        act = ActModel(
            id="act_7001",
            act_number="АКТ-2026-0830-01",
            shipment_id="shp_1001",
            shipment_number="WB-2026-0830-01",
            date="2026-08-30",
            operator_name="Алексей Смирнов",
            client_id="cl_9921",
            client_name='ООО "Модный Гардероб"',
            client_requisites_text='Заказчик: ООО "Модный Гардероб", ИНН: 7701234567, КПП: 770101001, Адрес: г. Москва, ул. Тверская, д. 12, р/с: 40702810938000012345 в ПАО Сбербанк, БИК: 044525225',
            executor_requisites=OFFICIAL_EXECUTOR_REQUISITES,
            items=[
                {"id": "item_act_1", "code": "srv_1", "name": "Прием товара", "price": 4, "quantity": 15, "amount": 60, "enabled": True},
                {"id": "item_act_2", "code": "srv_2", "name": "Укладка в короб", "price": 2, "quantity": 15, "amount": 30, "enabled": True},
                {"id": "item_act_3", "code": "srv_3", "name": "Маркировка ШК", "price": 8, "quantity": 15, "amount": 120, "enabled": True},
                {"id": "item_act_7", "code": "srv_7", "name": "Упаковка", "price": 5, "quantity": 15, "amount": 75, "enabled": True},
                {"id": "item_act_8", "code": "srv_8", "name": "Короб", "price": 180, "quantity": 1, "amount": 180, "enabled": True},
                {"id": "item_act_12", "code": "srv_12", "name": "Доставка до Москвы", "price": 5000, "quantity": 1, "amount": 5000, "enabled": True},
                {"id": "item_act_13", "code": "srv_13", "name": "Отгрузка на склад", "price": 1500, "quantity": 1, "amount": 1500, "enabled": True}
            ],
            total_sum=6965.0,
            status="signed"
        )
        db.add(act)
        db.commit()
