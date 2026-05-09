from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BlockBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    type: str = "text"
    content: str = ""
    metadata: dict = Field(default_factory=dict, validation_alias="meta")
    sort_order: int = 0


class BlockCreate(BlockBase):
    pass


class BlockUpdate(BaseModel):
    type: str | None = None
    content: str | None = None
    metadata: dict | None = None
    sort_order: int | None = None


class BlockListItem(BlockBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    page_id: int
    created_at: datetime
    updated_at: datetime


class BlockReorderItem(BaseModel):
    id: int
    sort_order: int


class BlockReorderRequest(BaseModel):
    items: list[BlockReorderItem]
