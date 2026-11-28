from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes.emprestimo import router as emprestimo_router
from app.routes.health import router as health_router
from app.routes.leitor import router as leitor_router
from app.routes.livro import router as livro_router

app = FastAPI(title="Biblioteca - API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(health_router)
app.include_router(livro_router)
app.include_router(leitor_router)
app.include_router(emprestimo_router)
