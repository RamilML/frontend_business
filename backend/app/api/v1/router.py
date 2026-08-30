from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.clients import router as clients_router
from app.api.v1.shipments import router as shipments_router
from app.api.v1.acts import router as acts_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(clients_router)
api_v1_router.include_router(shipments_router)
api_v1_router.include_router(acts_router)
