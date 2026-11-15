from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories.item import ItemRepository
from app.schemas.item import ItemCreate, ItemResponse
from app.services.item import ItemAlreadyExistsError, ItemNotFoundError, ItemService

router = APIRouter(prefix="/items", tags=["items"])


def get_item_service(db: Session = Depends(get_db)) -> ItemService:
    return ItemService(ItemRepository(db))


@router.get("/", response_model=list[ItemResponse])
def list_items(service: ItemService = Depends(get_item_service)):
    return service.list_items()


@router.post("/", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(data: ItemCreate, service: ItemService = Depends(get_item_service)):
    try:
        return service.create_item(data)
    except ItemAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe um item com esse nome.",
        ) from None


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int = Path(ge=1),
    service: ItemService = Depends(get_item_service),
):
    try:
        service.delete_item(item_id)
    except ItemNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item não encontrado.",
        ) from None
