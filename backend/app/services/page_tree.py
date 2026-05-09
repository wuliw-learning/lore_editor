from sqlalchemy.orm import Session

from app.models.page import Page
from app.schemas.page import BreadcrumbItem


def build_breadcrumbs(db: Session, page: Page) -> list[BreadcrumbItem]:
    chain: list[BreadcrumbItem] = []
    current: Page | None = page
    while current is not None:
        chain.append(BreadcrumbItem(id=current.id, title=current.title))
        current = db.get(Page, current.parent_id) if current.parent_id else None
    return list(reversed(chain))
