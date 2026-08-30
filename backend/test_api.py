import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def test_full_api_workflow():
    client = TestClient(app)
    
    print("\n🔍 1. Проверка /health:")
    r = client.get("/health")
    assert r.status_code == 200, f"Failed health check: {r.text}"
    print("   ✅ Health check OK:", r.json())

    print("\n🔍 2. Тестирование Авторизации (/api/v1/auth/login):")
    r = client.post("/api/v1/auth/login", json={"username": "operator", "password": "123456"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    data = r.json()
    token = data["tokens"]["accessToken"]
    user = data["user"]
    assert user["role"] == "operator"
    print(f"   ✅ Вход успешен! Пользователь: {user['name']} (роль: {user['role']})")
    
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/api/v1/auth/me", headers=headers)
    assert r.status_code == 200
    print("   ✅ /auth/me OK:", r.json()["username"])

    print("\n🔍 3. Тестирование Контрагентов (/api/v1/clients):")
    r = client.get("/api/v1/clients", headers=headers)
    assert r.status_code == 200
    clients_list = r.json()
    assert len(clients_list) >= 2
    print(f"   ✅ Список клиентов получен: {len(clients_list)} контрагентов (первый: {clients_list[0]['name']})")

    # Создание нового клиента
    new_client_payload = {
        "name": "ИП Тестовый Селлер",
        "status": "active",
        "requisites": {
            "legalType": "IP",
            "shortName": "ИП Тестовый",
            "fullName": "Индивидуальный Предприниматель Тестовый Т.Т.",
            "inn": "771234567890",
            "legalAddress": "г. Москва, ул. Ленина, д. 1",
            "checkingAccount": "40802810999990001111",
            "bankName": "ПАО Сбербанк",
            "bik": "044525225",
            "corrAccount": "30101810400000000225"
        },
        "contact": {
            "contactPerson": "Тестов Тест",
            "phone": "+7 999 000 00 00",
            "email": "test@seller.ru"
        }
    }
    r = client.post("/api/v1/clients", json=new_client_payload, headers=headers)
    assert r.status_code == 201, f"Create client failed: {r.text}"
    created_client = r.json()
    print(f"   ✅ Новый клиент создан! ID: {created_client['id']}, ИНН: {created_client['requisites']['inn']}")

    print("\n🔍 4. Тестирование Поставок и Сканирования ШК (/api/v1/shipments):")
    r = client.get("/api/v1/shipments", headers=headers)
    assert r.status_code == 200
    shipments = r.json()
    assert len(shipments) > 0
    shipment_with_items = next((s for s in shipments if len(s["items"]) > 0), shipments[0])
    shipment_id = shipment_with_items["id"]
    test_barcode = shipment_with_items["items"][0]["barcode"] if len(shipment_with_items["items"]) > 0 else "4601234567890"
    print(f"   ✅ Список поставок OK: Поставка № {shipment_with_items['shipmentNumber']} (Склады WB: {shipment_with_items['targetWarehouses']})")

    # Сканирование штрихкода
    r = client.post(f"/api/v1/shipments/{shipment_id}/scan", json={"barcode": test_barcode}, headers=headers)
    assert r.status_code == 200
    scan_res = r.json()
    assert scan_res["success"] is True
    print(f"   ✅ Сканирование ШК успешно: {scan_res['message']}")

    print("\n🔍 5. Тестирование Упаковки в Коробки (/api/v1/shipments/.../boxes):")
    r = client.post(f"/api/v1/shipments/{shipment_id}/boxes", json={"targetWarehouse": "Электросталь"}, headers=headers)
    assert r.status_code == 200
    updated_shipment = r.json()
    print(f"   ✅ Коробка добавлена! Всего коробок в поставке: {len(updated_shipment['boxes'])}")

    print("\n🔍 6. Тестирование Актов выполненных работ (/api/v1/acts):")
    r = client.get("/api/v1/acts", headers=headers)
    assert r.status_code == 200
    acts = r.json()
    print(f"   ✅ Реестр актов OK: Найдено {len(acts)} актов (первый: {acts[0]['actNumber']}, сумма: {acts[0]['totalSum']})")

    # Создание Акта
    import uuid
    new_act_payload = {
        "actNumber": f"АКТ-TEST-{uuid.uuid4().hex[:6]}",
        "date": "2026-08-30",
        "operatorName": "Алексей Смирнов",
        "clientId": created_client["id"],
        "clientName": created_client["name"],
        "clientRequisitesText": f"Заказчик: {created_client['requisites']['fullName']}, ИНН: {created_client['requisites']['inn']}",
        "executorRequisites": {
            "companyName": 'ОсОО "КРЕАТИВ ВЕЙВ БИШКЕК"',
            "legalAddress": "Кыргызская Республика, г. Бишкек, Октябрьский р-н, мкр 10, д. 2, кв 59",
            "innKpp": "01904202310427 / 019001001",
            "checkingAccount": "1033220002348631",
            "corrAccount": "30111810400000073672",
            "bankName": 'ОАО "МБАНК"',
            "bik": "103032"
        },
        "items": [
            {"code": "srv_1", "name": "Прием товара", "price": 4, "quantity": 100, "amount": 400, "enabled": True},
            {"code": "srv_2", "name": "Укладка в короб", "price": 2, "quantity": 100, "amount": 200, "enabled": True},
            {"code": "srv_8", "name": "Короб", "price": 180, "quantity": 5, "amount": 900, "enabled": True},
            {"code": "srv_12", "name": "Доставка до Москвы", "price": 6000, "quantity": 1, "amount": 6000, "enabled": True}
        ],
        "totalSum": 7500.0,
        "status": "signed"
    }
    r = client.post("/api/v1/acts", json=new_act_payload, headers=headers)
    assert r.status_code == 201, f"Create act failed: {r.text}"
    created_act = r.json()
    print(f"   ✅ Акт создан успешно! Номер: {created_act['actNumber']}, ИТОГО: {created_act['totalSum']} сом/руб.")

    print("\n🔍 7. Тестирование блокировки изменений для отгруженной поставки:")
    # Переводим поставку в статус 'shipped'
    r = client.put(f"/api/v1/shipments/{shipment_id}", json={"status": "shipped"}, headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "shipped"

    # Попытка сканирования отгруженной поставки
    r = client.post(f"/api/v1/shipments/{shipment_id}/scan", json={"barcode": test_barcode}, headers=headers)
    assert r.status_code == 200
    assert r.json()["success"] is False
    print("   ✅ Сканирование отгруженной поставки заблокировано!")

    # Попытка добавления коробки в отгруженную поставку
    r = client.post(f"/api/v1/shipments/{shipment_id}/boxes", json={"targetWarehouse": "Коледино"}, headers=headers)
    assert r.status_code == 400
    print("   ✅ Добавление коробок в отгруженную поставку заблокировано (400 Bad Request)!")

    print("\n🎉 ВСЕ ТЕСТЫ API И ЗАЩИТЫ БЛОКИРОВКИ ПРОШЛИ УСПЕШНО НА 100%!\n")

if __name__ == "__main__":
    test_full_api_workflow()
