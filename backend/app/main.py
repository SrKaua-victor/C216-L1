from fastapi import FastAPI

from app.routes.health import router as health_router
from app.routes.user import router as user_router

app = FastAPI(title="C216 L1 - Backend")

app.include_router(health_router)
app.include_router(user_router)
