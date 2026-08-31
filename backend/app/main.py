from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_data import seed_database
from app.api.v1.router import api_v1_router

from sqlalchemy import text

# Гарантированное создание таблиц базы данных
Base.metadata.create_all(bind=engine)

# Безопасная автомиграция колонок SQLite
with engine.connect() as conn:
    for col, col_type in [
        ("is_packed", "BOOLEAN DEFAULT 0"),
        ("sealed_at", "DATETIME")
    ]:
        try:
            conn.execute(text(f"ALTER TABLE packing_boxes ADD COLUMN {col} {col_type}"))
        except Exception:
            pass

    for col in ["planned_delivery_date", "driver_info", "gate_number", "manager_comment"]:
        try:
            conn.execute(text(f"ALTER TABLE shipments ADD COLUMN {col} TEXT"))
        except Exception:
            pass
    conn.commit()

def init_db():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

# Запуск первичного сидирования
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение API роутов
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/")
def root():
    return {
        "message": f"Добро пожаловать в API «{settings.PROJECT_NAME}»!",
        "docs_url": "/docs",
        "health_check": "/health"
    }
