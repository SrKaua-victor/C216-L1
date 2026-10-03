from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.schemas.user import UserCreate, UserPatch, UserResponse, UserUpdate
from app.services.user import (
    EmailAlreadyRegisteredError,
    UserNotFoundError,
    UserService,
    user_service,
)

router = APIRouter(prefix="/users", tags=["users"])

def user_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Usuario nao encontrado",
    )


def email_already_registered() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Email ja cadastrado",
    )


def get_user_service() -> UserService:
    return user_service


@router.get("", response_model=list[UserResponse])
def list_users(
    nome: str | None = Query(default=None, min_length=1, description="Filtra por parte do nome"),
    limit: int = Query(default=10, ge=1, le=100, description="Quantidade maxima de usuarios"),
    service: UserService = Depends(get_user_service),
):
    return service.list_users(nome=nome, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int = Path(ge=1),
    service: UserService = Depends(get_user_service),
):
    try:
        return service.get_user(user_id)
    except UserNotFoundError:
        raise user_not_found() from None


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, service: UserService = Depends(get_user_service)):
    try:
        return service.create_user(data)
    except EmailAlreadyRegisteredError:
        raise email_already_registered() from None


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    data: UserUpdate,
    user_id: int = Path(ge=1),
    service: UserService = Depends(get_user_service),
):
    try:
        return service.update_user(user_id, data)
    except UserNotFoundError:
        raise user_not_found() from None
    except EmailAlreadyRegisteredError:
        raise email_already_registered() from None


@router.patch("/{user_id}", response_model=UserResponse)
def patch_user(
    data: UserPatch,
    user_id: int = Path(ge=1),
    service: UserService = Depends(get_user_service),
):
    try:
        return service.patch_user(user_id, data)
    except UserNotFoundError:
        raise user_not_found() from None
    except EmailAlreadyRegisteredError:
        raise email_already_registered() from None


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int = Path(ge=1),
    service: UserService = Depends(get_user_service),
):
    try:
        service.delete_user(user_id)
    except UserNotFoundError:
        raise user_not_found() from None
