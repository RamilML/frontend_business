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

## 3. Настройка в приложении
Во фронтенд-приложении включена кнопка **«API Конфиг»**, позволяющая бэкендеру или тестировщику переключаться между:
1. **Mock Mode** — фронтенд эмулирует бэкенд на клиенте.
2. **Real REST API** — фронтенд отправляет реальные запросы на указанный `Base API URL` (например, `http://localhost:8000/api/v1`).
