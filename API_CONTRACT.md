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

