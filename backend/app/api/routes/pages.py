from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_auth
from app.models.block import Block
from app.models.page import Page
from app.schemas.page import FavoritePageResponse, PageCreate, PageDetail, PageListItem, PageUpdate
from app.services.page_tree import build_breadcrumbs


router = APIRouter()


@router.get("", response_model=list[PageListItem])
def list_pages(
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> list[PageListItem]:
    pages = db.scalars(select(Page).order_by(Page.parent_id.is_not(None), Page.sort_order, Page.updated_at.desc())).all()
    return [PageListItem.model_validate(page) for page in pages]


@router.post("", response_model=PageDetail, status_code=status.HTTP_201_CREATED)
def create_page(
    payload: PageCreate,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> PageDetail:
    if payload.parent_id is not None:
        parent = db.get(Page, payload.parent_id)
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent page not found")

    sibling_query = select(Page).where(Page.parent_id == payload.parent_id).order_by(Page.sort_order.desc())
    last_sibling = db.scalars(sibling_query).first()
    sort_order = (last_sibling.sort_order + 1) if last_sibling else 0

    page = Page(title=payload.title.strip() or "Untitled", parent_id=payload.parent_id, sort_order=sort_order)
    db.add(page)
    db.flush()

    block = Block(page_id=page.id, type="text", content="", meta={}, sort_order=0)
    db.add(block)
    db.commit()
    db.refresh(page)
    return PageDetail(
        **PageListItem.model_validate(page).model_dump(),
        breadcrumbs=build_breadcrumbs(db, page),
    )


@router.get("/{page_id}", response_model=PageDetail)
def get_page(
    page_id: int,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> PageDetail:
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    return PageDetail(
        **PageListItem.model_validate(page).model_dump(),
        breadcrumbs=build_breadcrumbs(db, page),
    )


@router.patch("/{page_id}", response_model=PageDetail)
def update_page(
    page_id: int,
    payload: PageUpdate,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> PageDetail:
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if key == "title" and isinstance(value, str):
            value = value.strip() or "Untitled"
        setattr(page, key, value)

    db.commit()
    db.refresh(page)
    return PageDetail(
        **PageListItem.model_validate(page).model_dump(),
        breadcrumbs=build_breadcrumbs(db, page),
    )


@router.delete("/{page_id}")
def delete_page(
    page_id: int,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> dict[str, str]:
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    child_exists = db.scalar(select(Page.id).where(Page.parent_id == page_id).limit(1))
    if child_exists is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete a page with child pages")

    linked_blocks = db.scalars(select(Block).where(Block.type == "page_link")).all()
    for block in linked_blocks:
        linked_page_id = block.meta.get("linked_page_id") if isinstance(block.meta, dict) else None
        if linked_page_id == page_id:
            block.type = "text"
            block.content = (block.content or page.title or "Deleted page").strip() or "Deleted page"
            block.meta = {"broken_page_reference": True}

    db.delete(page)
    db.commit()
    return {"status": "ok"}


@router.post("/{page_id}/favorite", response_model=FavoritePageResponse)
def favorite_page(
    page_id: int,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> FavoritePageResponse:
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    page.is_favorite = True
    db.commit()
    return FavoritePageResponse(status="ok", page_id=page_id, is_favorite=True)


@router.delete("/{page_id}/favorite", response_model=FavoritePageResponse)
def unfavorite_page(
    page_id: int,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> FavoritePageResponse:
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    page.is_favorite = False
    db.commit()
    return FavoritePageResponse(status="ok", page_id=page_id, is_favorite=False)
