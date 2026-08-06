# API Спецификация Авторизации — ФФ Ассистент

Данный файл описывает контракт взаимодействия фронтенда с бэкенд-сервером для модуля авторизации и ролевого доступа.

---

## 1. Базовые настройки
* **Заголовки запросов:** `Content-Type: application/json`, `Accept: application/json`
* **Авторизация:** Передача Bearer токена в заголовке `Authorization: Bearer <accessToken>`

---

## 2. Эндпоинты

### 2.1 Вход в систему (Login)
* **HTTP Метод:** `POST`
* **URL:** `/api/v1/auth/login`

#### Запрос (Request Body):
```json
{
  "username": "operator",
  "password": "secret_password"
}
```

#### Успешный ответ (Response 200 OK):
```json
{
  "user": {
    "id": "usr_op_01",
    "name": "Алексей Смирнов",
    "email": "operator@fulfillment.ru",
    "username": "operator",
    "role": "operator", // Возможные значения: "operator" | "manager" | "client" | "admin"
    "clientId": "cl_9921", // Обязательно только если role === "client"
    "clientName": "ООО \"Модный Гардероб\"" // Название контрагента для роли client
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "d98a7c2f-..."
  }
}
```

#### Ответ при ошибке (Response 401 Unauthorized):
```json
{
  "message": "Неверный логин или пароль"
}
```

---

### 2.2 Получение профиля текущего пользователя (Me)
* **HTTP Метод:** `GET`
* **URL:** `/api/v1/auth/me`
* **Заголовки:** `Authorization: Bearer <accessToken>`

#### Успешный ответ (Response 200 OK):
```json
{
  "id": "usr_op_01",
  "name": "Алексей Смирнов",
  "email": "operator@fulfillment.ru",
  "username": "operator",
  "role": "operator"
}
```

---

## 3. Эндпоинты клиентов (Контрагентов)

### 3.1 Список клиентов
* **HTTP Метод:** `GET`
* **URL:** `/api/v1/clients?q=поисковый_запрос`
* **Заголовки:** `Authorization: Bearer <accessToken>`

#### Ответ (Response 200 OK):
```json
{
  "items": [
    {
      "id": "cl_9921",
      "name": "ООО \"Модный Гардероб\"",
      "status": "active",
      "activeShipmentsCount": 3,
      "totalActsCount": 14,
      "loginUsername": "client",
      "requisites": {
        "legalType": "OOO",
        "shortName": "ООО \"Модный Гардероб\"",
        "fullName": "Общество с ограниченной ответственностью \"Модный Гардероб\"",
        "inn": "7701234567",
        "kpp": "770101001",
        "ogrn": "1157746001122",
        "legalAddress": "г. Москва, ул. Тверская, д. 12, стр. 1, оф. 405",
        "checkingAccount": "40702810938000012345",
        "bankName": "ПАО Сбербанк",
        "bik": "044525225",
        "corrAccount": "30101810400000000225"
      },
      "contact": {
        "contactPerson": "Смирнова Анна Сергеевна",
        "phone": "+7 (999) 123-45-67",
        "email": "seller@fashion-store.ru"
      }
    }
  ]
}
```

### 3.2 Создание контрагента
* **HTTP Метод:** `POST`
* **URL:** `/api/v1/clients`
* **Request Body:** Объект контрагента (без `id`).
* **Response 201 Created:** Созданный объект с проставленным `id`.

### 3.3 Обновление контрагента
* **HTTP Метод:** `PUT`
* **URL:** `/api/v1/clients/:id`

### 3.4 Удаление контрагента
* **HTTP Метод:** `DELETE`
* **URL:** `/api/v1/clients/:id`

---

## 4. Эндпоинты поставок и Сканирования ШК (Приёмка)

### 4.1 Список активных поставок
* **HTTP Метод:** `GET`
* **URL:** `/api/v1/shipments`
* **Заголовки:** `Authorization: Bearer <accessToken>`

### 4.2 Сканирование штрихкода (ТСД / Камера)
* **HTTP Метод:** `POST`
* **URL:** `/api/v1/shipments/:id/scan`
* **Заголовки:** `Authorization: Bearer <accessToken>`
* **Request Body:**
```json
{
  "barcode": "4601234567890"
}
```

#### Успешный ответ (Response 200 OK):
```json
{
  "success": true,
  "item": {
    "id": "item_1",
    "barcode": "4601234567890",
    "sku": "FUT-BLK-M",
    "title": "Футболка базовая оверсайз Черная M",
    "plannedQuantity": 30,
    "scannedQuantity": 25,
    "lastScannedAt": "2026-08-05T15:30:00Z"
  },
  "message": "Отсканировано: Футболка базовая оверсайз Черная M (25/30 шт.)"
}
```

#### Ошибка — Неизвестный ШК (Response 404 / 400):
```json
{
  "success": false,
  "message": "Штрихкод 4609999000111 не найден в плановом списке этой поставки.",
  "isNewItem": true
}
```

### 4.3 Корректировка количества товара вручную
* **HTTP Метод:** `PUT`
* **URL:** `/api/v1/shipments/:id/items/:itemId`
* **Request Body:** `{ "scannedQuantity": 26 }`

---

## 5. Эндпоинты Упаковки в Коробки и Склады WB

### 5.1 Добавление новой коробки
* **HTTP Метод:** `POST`
* **URL:** `/api/v1/shipments/:id/boxes`
* **Request Body:**
```json
{
  "targetWarehouse": "Коледино"
}
```

### 5.2 Назначение склада Wildberries на коробку
* **HTTP Метод:** `PUT`
* **URL:** `/api/v1/shipments/:id/boxes/:boxNumber/warehouse`
* **Request Body:**
```json
{
  "targetWarehouse": "Электросталь"
}
```

### 5.3 Упаковка товара в коробку
* **HTTP Метод:** `POST`
* **URL:** `/api/v1/shipments/:id/boxes/:boxNumber/pack`
* **Request Body:**
```json
{
  "itemId": "item_1",
  "quantity": 5
}
```

### 5.4 Перемещение товара между коробками
* **HTTP Метод:** `POST`
* **URL:** `/api/v1/shipments/:id/boxes/move`
* **Request Body:**
```json
{
  "fromBoxNumber": 1,
  "toBoxNumber": 2,
  "itemId": "item_1",
  "quantity": 3
}
```



