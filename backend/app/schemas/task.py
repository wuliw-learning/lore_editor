from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TaskStatus = Literal["active", "completed", "backlog"]


class TaskCreate(BaseModel):
    task_date: date
    title: str = "Untitled"
    description: str = ""


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    sort_order: int | None = None


class TaskListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_date: date
    title: str
    description: str
    status: TaskStatus
    origin_created_at: datetime
    previous_entry_id: int | None
    sort_order: int
    created_at: datetime
    updated_at: datetime


class TaskDayResponse(BaseModel):
    task_date: date
    items: list[TaskListItem]


class TaskCalendarDay(BaseModel):
    task_date: date
    total_count: int
    completed_count: int
    active_count: int
    backlog_count: int


class TaskCalendarResponse(BaseModel):
    month: str
    days: list[TaskCalendarDay]


class TaskSyncRequest(BaseModel):
    task_date: date


class TaskSyncResponse(BaseModel):
    status: str
    task_date: date
    created_entries: int
