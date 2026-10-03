from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class UserBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    email: str = Field(max_length=255, pattern=EMAIL_PATTERN)


class UserCreate(UserBase):
    pass


class UserUpdate(UserBase):
    pass


class UserPatch(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=100)
    email: str | None = Field(default=None, max_length=255, pattern=EMAIL_PATTERN)


class UserResponse(UserBase):
    id: int
