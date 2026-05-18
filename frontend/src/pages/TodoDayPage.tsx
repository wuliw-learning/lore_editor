import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { createTask, getTaskCalendar, getTasksForDay, syncTasks, updateTask } from '../api/tasks'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import type { Page, TaskCalendarDay, TaskEntry, TaskStatus } from '../types'

type Props = {
  pages: Page[]
}

type TaskModalState = {
  mode: 'create' | 'edit'
  task: TaskEntry | null
} | null

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' })
const DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

function getTodayDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toDateString(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toMonthString(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
}

function addDays(value: string, delta: number) {
  const date = parseDateString(value)
  date.setDate(date.getDate() + delta)
  return toDateString(date)
}

function diffInDays(from: string, to: string) {
  const start = parseDateString(from)
  const end = parseDateString(to)
  const milliseconds = end.getTime() - start.getTime()
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24))
}

function sortVisibleTasks(items: TaskEntry[]) {
  return [...items].sort((left, right) => {
    if (left.status === right.status) {
      return left.sort_order - right.sort_order || left.id - right.id
    }
    if (left.status === 'completed') return 1
    if (right.status === 'completed') return -1
    return left.sort_order - right.sort_order || left.id - right.id
  })
}

function renderDescriptionWithLinks(description: string) {
  const parts = description.split(/(\[[^\]]+\]\(\/pages\/\d+\))/g)
  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\((\/pages\/(\d+))\)$/)
    if (!match) {
      return <span key={`${part}-${index}`}>{part}</span>
    }

    return (
      <Link key={`${part}-${index}`} to={match[2]} className="task-description-link">
        {match[1]}
      </Link>
    )
  })
}

function TaskDescription({ description }: { description: string }) {
  return <div className="task-description-rendered">{description ? renderDescriptionWithLinks(description) : <span className="muted">No description</span>}</div>
}

function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function TaskCalendar({ selectedDate, onSelectDate }: { selectedDate: string; onSelectDate: (value: string) => void }) {
  const [month, setMonth] = useState(() => toMonthString(parseDateString(selectedDate)))
  const [days, setDays] = useState<TaskCalendarDay[]>([])
  const today = getTodayDateString()

  useEffect(() => {
    setMonth(toMonthString(parseDateString(selectedDate)))
  }, [selectedDate])

  useEffect(() => {
    const load = async () => {
      const response = await getTaskCalendar(month)
      setDays(response.days)
    }
    void load()
  }, [month])

  const dayMap = useMemo(() => new Map(days.map((day) => [day.task_date, day])), [days])
  const monthDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)
  const monthStartWeekday = (monthDate.getDay() + 6) % 7
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const cells = [] as Array<{ date: string; inMonth: boolean }>

  for (let index = 0; index < monthStartWeekday; index += 1) {
    cells.push({ date: '', inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = toDateString(new Date(monthDate.getFullYear(), monthDate.getMonth(), day))
    cells.push({ date: value, inMonth: true })
  }

  return (
    <div className="todo-calendar">
      <div className="todo-calendar-header">
        <Button className="todo-calendar-nav" onClick={() => setMonth(toMonthString(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)))}>
          Prev
        </Button>
        <strong>{monthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</strong>
        <Button className="todo-calendar-nav" onClick={() => setMonth(toMonthString(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)))}>
          Next
        </Button>
      </div>
      <div className="todo-calendar-weekdays">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="todo-calendar-grid">
        {cells.map((cell, index) => {
          if (!cell.inMonth) {
            return <span key={`blank-${index}`} className="todo-calendar-cell todo-calendar-cell-empty" />
          }

          const info = dayMap.get(cell.date)
          const isSelected = cell.date === selectedDate
          const isFuture = cell.date > today
          const isToday = cell.date === today
          return (
            <button
              key={cell.date}
              className={`todo-calendar-cell${isSelected ? ' is-selected' : ''}${info ? ' has-data' : ''}${isToday ? ' is-today' : ''}`}
              disabled={isFuture}
              onClick={() => onSelectDate(cell.date)}
              title={info ? `${info.total_count} tasks` : 'No tasks'}
            >
              <span>{Number(cell.date.slice(-2))}</span>
              {info ? <small>{info.completed_count}/{info.total_count}</small> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TaskModal({ state, pages, readOnly, onClose, onSubmit }: { state: TaskModalState; pages: Page[]; readOnly: boolean; onClose: () => void; onSubmit: (payload: { title: string; description: string }) => Promise<void> }) {
  const [title, setTitle] = useState(state?.task?.title ?? '')
  const [description, setDescription] = useState(state?.task?.description ?? '')
  const [pageQuery, setPageQuery] = useState('')

  useEffect(() => {
    setTitle(state?.task?.title ?? '')
    setDescription(state?.task?.description ?? '')
    setPageQuery('')
  }, [state])

  if (!state) return null

  const pageOptions = pages.filter((page) => page.title.toLowerCase().includes(pageQuery.trim().toLowerCase()))

  return (
    <Modal title={state.mode === 'create' ? 'New task' : 'Task details'} onClose={onClose}>
      <div className="task-modal-content">
        <label className="field-group">
          <span className="field-label">Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} readOnly={readOnly} />
        </label>
        {readOnly ? (
          <div className="field-group">
            <span className="field-label">Description</span>
            <TaskDescription description={description} />
          </div>
        ) : (
          <label className="field-group">
            <span className="field-label">Description</span>
            <textarea className="task-description-input" value={description} onChange={(event) => setDescription(event.target.value)} readOnly={readOnly} />
          </label>
        )}
        {!readOnly ? (
          <div className="task-link-insert">
            <div className="field-group">
              <span className="field-label">Link to notebook page</span>
              <input placeholder="Find page" value={pageQuery} onChange={(event) => setPageQuery(event.target.value)} />
            </div>
            <div className="task-link-options">
              {pageOptions.slice(0, 8).map((page) => (
                <button
                  key={page.id}
                  className="task-link-option"
                  onClick={() => setDescription((current) => `${current}${current ? '\n' : ''}[${page.title}](/pages/${page.id})`)}
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {!readOnly ? (
          <div className="modal-actions">
            <Button onClick={() => void onSubmit({ title, description })}>Save task</Button>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export function TodoDayPage({ pages }: Props) {
  const navigate = useNavigate()
  const params = useParams()
  const today = getTodayDateString()
  const selectedDate = params.date ?? today
  const hasExplicitDate = Boolean(params.date)
  const isValidDate = isValidDateString(selectedDate)
  const isToday = selectedDate === today
  const [tasks, setTasks] = useState<TaskEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalState, setModalState] = useState<TaskModalState>(null)

  useEffect(() => {
    if (!isValidDate) {
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        if (selectedDate === today) {
          await syncTasks(selectedDate)
        }
        const response = await getTasksForDay(selectedDate)
        setTasks(response.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [isValidDate, selectedDate, today])

  if (!hasExplicitDate) {
    return <Navigate to={`/todo/${today}`} replace />
  }

  if (!isValidDate) {
    return <Navigate to={`/todo/${today}`} replace />
  }

  const visibleTasks = sortVisibleTasks(tasks.filter((task) => task.status !== 'backlog'))
  const selectedDateObject = parseDateString(selectedDate)
  const weekdayLabel = WEEKDAY_FORMATTER.format(selectedDateObject)
  const dateLabel = DATE_FORMATTER.format(selectedDateObject)

  const patchTaskLocally = (taskId: number, patch: Partial<TaskEntry>) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, ...patch } : task)))
  }

  const saveTask = async (taskId: number, payload: { title: string; description: string }) => {
    const saved = await updateTask(taskId, payload)
    setTasks((current) => current.map((task) => (task.id === taskId ? saved : task)))
    setModalState(null)
  }

  const changeTaskStatus = async (taskId: number, status: TaskStatus) => {
    patchTaskLocally(taskId, { status })
    try {
      const saved = await updateTask(taskId, { status })
      setTasks((current) => current.map((task) => (task.id === taskId ? saved : task)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      const response = await getTasksForDay(selectedDate)
      setTasks(response.items)
    }
  }

  return (
    <div className="todo-page">
      <div className="todo-main-column">
        <div className="section-header todo-header">
          <div>
            <div className="page-kicker">Todo</div>
            <h2 className="todo-date-title">{weekdayLabel}</h2>
            <p className="muted">{dateLabel}</p>
          </div>
          <div className="todo-header-actions">
            <Button onClick={() => navigate(`/todo/${addDays(selectedDate, -1)}`)}>Previous day</Button>
            <Button onClick={() => navigate(`/todo/${today}`)}>Today</Button>
            <Button onClick={() => navigate(`/todo/${addDays(selectedDate, 1)}`)} disabled={selectedDate >= today}>Next day</Button>
            {isToday ? <Button onClick={() => setModalState({ mode: 'create', task: null })}>Add task</Button> : null}
          </div>
        </div>
        {error ? <div className="error-box">{error}</div> : null}
        {!isToday ? <div className="todo-readonly-note">Past days are available in read-only mode.</div> : null}
        {loading ? <div className="page-state">Loading tasks...</div> : null}
        {!loading && visibleTasks.length === 0 ? <div className="todo-empty-state muted">No tasks for this day.</div> : null}
        {!loading ? (
          <div className="todo-list">
            {visibleTasks.map((task) => {
              const ageInDays = diffInDays(task.origin_created_at.slice(0, 10), selectedDate)
              const isStale = task.status === 'active' && ageInDays > 3
              return (
                <div key={task.id} className={`todo-task-card${task.status === 'completed' ? ' is-complete' : ''}${isStale ? ' is-stale' : ''}`} onClick={() => setModalState({ mode: 'edit', task })}>
                  <div className="todo-task-main">
                    <strong>{task.title}</strong>
                    <span className="muted small">{task.status === 'completed' ? 'Completed' : ageInDays > 0 ? `${ageInDays} days in progress` : 'Created today'}</span>
                    {task.description ? <p className="todo-task-preview">{task.description}</p> : null}
                  </div>
                  <div className="todo-task-actions" onClick={(event) => event.stopPropagation()}>
                    {isToday ? (
                      <>
                        <Button onClick={() => void changeTaskStatus(task.id, task.status === 'completed' ? 'active' : 'completed')}>
                          {task.status === 'completed' ? 'Reopen' : 'Done'}
                        </Button>
                        <Button variant="ghost" onClick={() => void changeTaskStatus(task.id, 'backlog')}>
                          Backlog
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
      <div className="todo-side-column">
        <TaskCalendar selectedDate={selectedDate} onSelectDate={(value) => navigate(`/todo/${value}`)} />
        <div className="todo-help-card">
          <strong>Backlog</strong>
          <p className="muted">Tasks moved to backlog leave the day list and stay available in the dedicated backlog section.</p>
          <Button onClick={() => navigate('/todo/backlog')}>Open backlog</Button>
        </div>
      </div>
      <TaskModal
        state={modalState}
        pages={pages}
        readOnly={!isToday}
        onClose={() => setModalState(null)}
        onSubmit={async ({ title, description }) => {
          if (modalState?.mode === 'create') {
            const created = await createTask(selectedDate, title, description)
            setTasks((current) => [...current, created])
            setModalState(null)
            return
          }
          if (modalState?.task) {
            await saveTask(modalState.task.id, { title, description })
          }
        }}
      />
    </div>
  )
}
