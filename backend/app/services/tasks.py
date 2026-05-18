from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.task import TaskEntry


TASK_STATUS_ACTIVE = "active"
TASK_STATUS_COMPLETED = "completed"
TASK_STATUS_BACKLOG = "backlog"
TASK_STATUSES = {TASK_STATUS_ACTIVE, TASK_STATUS_COMPLETED, TASK_STATUS_BACKLOG}


def normalize_task_title(value: str) -> str:
    return value.strip() or "Untitled"


def normalize_task_description(value: str) -> str:
    return value.strip()


def list_tasks_for_day(db: Session, task_date: date) -> list[TaskEntry]:
    return db.scalars(
        select(TaskEntry)
        .where(TaskEntry.task_date == task_date)
        .order_by(TaskEntry.sort_order, TaskEntry.id)
    ).all()


def list_backlog_tasks(db: Session) -> list[TaskEntry]:
    return db.scalars(
        select(TaskEntry)
        .where(TaskEntry.status == TASK_STATUS_BACKLOG)
        .order_by(TaskEntry.updated_at.desc(), TaskEntry.id.desc())
    ).all()


def next_sort_order_for_day(db: Session, task_date: date) -> int:
    max_sort = db.scalar(select(func.max(TaskEntry.sort_order)).where(TaskEntry.task_date == task_date))
    return 0 if max_sort is None else max_sort + 1


def ensure_day_entries(db: Session, target_date: date) -> int:
    distinct_dates = set(db.scalars(select(TaskEntry.task_date).where(TaskEntry.task_date <= target_date).distinct()).all())
    if not distinct_dates:
        return 0

    latest_existing = max(distinct_dates)
    if latest_existing >= target_date:
        return 0

    created_entries = 0
    current_date = latest_existing + timedelta(days=1)
    while current_date <= target_date:
        if current_date in distinct_dates:
            current_date += timedelta(days=1)
            continue

        source_entries = list_tasks_for_day(db, current_date - timedelta(days=1))
        active_entries = [entry for entry in source_entries if entry.status == TASK_STATUS_ACTIVE]
        for sort_order, entry in enumerate(active_entries):
            db.add(
                TaskEntry(
                    task_date=current_date,
                    title=entry.title,
                    description=entry.description,
                    status=TASK_STATUS_ACTIVE,
                    origin_created_at=entry.origin_created_at,
                    previous_entry_id=entry.id,
                    sort_order=sort_order,
                )
            )
            created_entries += 1

        distinct_dates.add(current_date)
        current_date += timedelta(days=1)

    if created_entries > 0:
        db.commit()

    return created_entries


def serialize_month(task_month: date) -> str:
    return task_month.strftime("%Y-%m")


def month_bounds(month_value: str) -> tuple[date, date]:
    start = datetime.strptime(month_value, "%Y-%m").date()
    if start.month == 12:
        end = date(start.year + 1, 1, 1)
    else:
        end = date(start.year, start.month + 1, 1)
    return start, end


def month_summary(db: Session, month_value: str) -> list[dict[str, int | date]]:
    month_start, month_end = month_bounds(month_value)
    rows = db.execute(
        select(
            TaskEntry.task_date,
            func.count(TaskEntry.id),
            func.sum(case((TaskEntry.status == TASK_STATUS_COMPLETED, 1), else_=0)),
            func.sum(case((TaskEntry.status == TASK_STATUS_ACTIVE, 1), else_=0)),
            func.sum(case((TaskEntry.status == TASK_STATUS_BACKLOG, 1), else_=0)),
        )
        .where(TaskEntry.task_date >= month_start, TaskEntry.task_date < month_end)
        .group_by(TaskEntry.task_date)
        .order_by(TaskEntry.task_date)
    ).all()

    return [
        {
            "task_date": row[0],
            "total_count": int(row[1] or 0),
            "completed_count": int(row[2] or 0),
            "active_count": int(row[3] or 0),
            "backlog_count": int(row[4] or 0),
        }
        for row in rows
    ]
