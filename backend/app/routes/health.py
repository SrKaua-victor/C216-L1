from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def raiz():
    return {"mensagem": "API da Biblioteca no ar"}


@router.get("/health")
def health():
    return {"status": "ok"}
