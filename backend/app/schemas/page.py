from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PageCreate(BaseModel):
    title: str = "Untitled"
    parent_id: int | None = None


class PageUpdate(BaseModel):
    title: str | None = None
    is_favorite: bool | None = None
    sort_order: int | None = None


class BreadcrumbItem(BaseModel):
    id: int
    title: str


class PageListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    parent_id: int | None
    is_favorite: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class PageDetail(PageListItem):
    breadcrumbs: list[BreadcrumbItem]


class FavoritePageResponse(BaseModel):
    status: str
    page_id: int
    is_favorite: bool
