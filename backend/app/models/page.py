from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), default="Untitled")
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("pages.id", ondelete="SET NULL"), nullable=True, index=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    parent = relationship("Page", remote_side=[id], back_populates="children")
    children = relationship("Page", back_populates="parent")
    blocks = relationship("Block", back_populates="page", cascade="all, delete-orphan")
