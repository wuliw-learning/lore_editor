from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_auth
from app.models.task import TaskEntry
from app.schemas.task import (
    TaskCalendarDay,
    TaskCalendarResponse,
    TaskCreate,
    TaskDayResponse,
    TaskListItem,
    TaskSyncRequest,
    TaskSyncResponse,
    TaskUpdate,
)
from app.services.tasks import (
    TASK_STATUSES,
    ensure_day_entries,
    list_backlog_tasks,
    list_tasks_for_day,
    month_summary,
    next_sort_order_for_day,
    normalize_task_description,
    normalize_task_title,
    serialize_month,
)


router = APIRouter()


@router.post("/sync", response_model=TaskSyncResponse)
def sync_tasks_for_day(
    payload: TaskSyncRequest,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> TaskSyncResponse:
    created_entries = ensure_day_entries(db, payload.task_date)
    return TaskSyncResponse(status="ok", task_date=payload.task_date, created_entries=created_entries)


@router.get("/day/{task_date}", response_model=TaskDayResponse)
def get_tasks_for_day(
    task_date: str,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> TaskDayResponse:
    try:
        parsed_date = datetime.strptime(task_date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task date") from exc

    items = [TaskListItem.model_validate(item) for item in list_tasks_for_day(db, parsed_date)]
    return TaskDayResponse(task_date=parsed_date, items=items)


@router.post("", response_model=TaskListItem, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> TaskListItem:
    task = TaskEntry(
        task_date=payload.task_date,
        title=normalize_task_title(payload.title),
        description=normalize_task_description(payload.description),
        status="active",
        sort_order=next_sort_order_for_day(db, payload.task_date),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskListItem.model_validate(task)


@router.patch("/{task_id}", response_model=TaskListItem)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> TaskListItem:
    task = db.get(TaskEntry, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        if key == "title" and isinstance(value, str):
            value = normalize_task_title(value)
        elif key == "description" and isinstance(value, str):
            value = normalize_task_description(value)
        elif key == "status":
            if value not in TASK_STATUSES:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task status")
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return TaskListItem.model_validate(task)


@router.get("/backlog", response_model=list[TaskListItem])
def get_backlog_tasks(
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> list[TaskListItem]:
    return [TaskListItem.model_validate(item) for item in list_backlog_tasks(db)]


@router.get("/calendar", response_model=TaskCalendarResponse)
def get_task_calendar(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    _user: dict[str, str] = Depends(require_auth),
) -> TaskCalendarResponse:
    try:
        parsed_month = datetime.strptime(month, "%Y-%m").date()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid month") from exc

    return TaskCalendarResponse(
        month=serialize_month(parsed_month),
        days=[TaskCalendarDay.model_validate(item) for item in month_summary(db, month)],
    )
