from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def raiz():
    return {"mensagem": "Backend C216 L1 no ar"}


@router.get("/health")
def health():
    return {"status": "ok"}
