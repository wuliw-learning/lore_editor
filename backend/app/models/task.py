from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TaskEntry(Base):
    __tablename__ = "task_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_date: Mapped[date] = mapped_column(Date, index=True)
    title: Mapped[str] = mapped_column(String(255), default="Untitled")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    origin_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    previous_entry_id: Mapped[int | None] = mapped_column(ForeignKey("task_entries.id", ondelete="SET NULL"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    previous_entry = relationship("TaskEntry", remote_side=[id])
