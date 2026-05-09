from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_auth
from app.models.block import Block
from app.models.page import Page
from app.schemas.search import SearchResult


router = APIRouter()


@router.get("", response_model=list[SearchResult])
def search(
    q: str = Query(min_length=1),
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> list[SearchResult]:
    term = f"%{q}%"
    page_results = db.scalars(select(Page).where(Page.title.ilike(term)).order_by(Page.updated_at.desc()).limit(20)).all()
    block_results = db.execute(
        select(Block, Page.title)
        .join(Page, Page.id == Block.page_id)
        .where(or_(Block.content.ilike(term), Page.title.ilike(term)))
        .order_by(Block.updated_at.desc())
        .limit(50)
    ).all()

    results: list[SearchResult] = []
    seen: set[tuple[int, str]] = set()

    for page in page_results:
        key = (page.id, "title")
        if key not in seen:
            seen.add(key)
            results.append(
                SearchResult(page_id=page.id, page_title=page.title, snippet=page.title, match_type="title")
            )

    for block, page_title in block_results:
        match_type = "title" if q.lower() in page_title.lower() else "block"
        key = (block.page_id, f"{match_type}:{block.id}")
        if key in seen:
            continue
        seen.add(key)
        text = block.content or ""
        snippet = text[:140] if text else page_title
        results.append(
            SearchResult(page_id=block.page_id, page_title=page_title, snippet=snippet, match_type=match_type)
        )

    return results[:50]
