import uvicorn
import os
import sys

# Добавляем корневую папку backend в sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"🚀 Запуск бэкенда ФФ Ассистент на http://{host}:{port}")
    print(f"📖 Swagger документация доступна на http://localhost:{port}/docs")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
