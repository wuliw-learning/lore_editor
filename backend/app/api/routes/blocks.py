from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_auth
from app.models.block import Block
from app.models.page import Page
from app.schemas.block import BlockCreate, BlockListItem, BlockReorderRequest, BlockUpdate


router = APIRouter()


@router.get("/pages/{page_id}/blocks", response_model=list[BlockListItem])
def list_blocks(
    page_id: int,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> list[BlockListItem]:
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    blocks = db.scalars(select(Block).where(Block.page_id == page_id).order_by(Block.sort_order, Block.id)).all()
    return [BlockListItem.model_validate(block) for block in blocks]


@router.post("/pages/{page_id}/blocks", response_model=BlockListItem, status_code=status.HTTP_201_CREATED)
def create_block(
    page_id: int,
    payload: BlockCreate,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> BlockListItem:
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    block = Block(
        page_id=page_id,
        type=payload.type,
        content=payload.content,
        meta=payload.metadata,
        sort_order=payload.sort_order,
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return BlockListItem.model_validate(block)


@router.patch("/blocks/{block_id}", response_model=BlockListItem)
def update_block(
    block_id: int,
    payload: BlockUpdate,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> BlockListItem:
    block = db.get(Block, block_id)
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(block, "meta" if key == "metadata" else key, value)

    db.commit()
    db.refresh(block)
    return BlockListItem.model_validate(block)


@router.delete("/blocks/{block_id}")
def delete_block(
    block_id: int,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> dict[str, str]:
    block = db.get(Block, block_id)
    if not block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block not found")

    sibling_count = db.scalar(select(func.count()).select_from(Block).where(Block.page_id == block.page_id))
    if sibling_count == 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Page must contain at least one block")

    db.delete(block)
    db.commit()
    return {"status": "ok"}


@router.patch("/pages/{page_id}/blocks/reorder")
def reorder_blocks(
    page_id: int,
    payload: BlockReorderRequest,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> dict[str, str]:
    page = db.get(Page, page_id)
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

    block_ids = [item.id for item in payload.items]
    blocks = db.scalars(select(Block).where(Block.page_id == page_id, Block.id.in_(block_ids))).all()
    block_map = {block.id: block for block in blocks}

    for item in payload.items:
        block = block_map.get(item.id)
        if block:
            block.sort_order = item.sort_order

    db.commit()
    return {"status": "ok"}
