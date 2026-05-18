import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getBacklogTasks } from '../api/tasks'
import { Modal } from '../components/Modal'
import type { TaskEntry } from '../types'

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

function formatTaskDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('ru-RU')
}

export function TodoBacklogPage() {
  const [tasks, setTasks] = useState<TaskEntry[]>([])
  const [error, setError] = useState('')
  const [activeTask, setActiveTask] = useState<TaskEntry | null>(null)

  const refresh = async () => {
    try {
      setTasks(await getBacklogTasks())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backlog')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <div className="section-page todo-backlog-page">
      <div className="section-header">
        <div>
          <h2>Backlog</h2>
          <p className="muted">Tasks removed from the daily list stay here until you bring them back.</p>
        </div>
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      <div className="todo-list">
        {tasks.map((task) => (
          <div key={task.id} className="todo-task-card" onClick={() => setActiveTask(task)}>
            <div className="todo-task-main">
              <strong>{task.title}</strong>
              <span className="muted small">Moved from {formatTaskDate(task.task_date)}</span>
              {task.description ? <p className="todo-task-preview">{task.description}</p> : null}
            </div>
          </div>
        ))}
        {tasks.length === 0 ? <div className="muted">Backlog is empty.</div> : null}
      </div>
      {activeTask ? (
        <Modal title={activeTask.title} onClose={() => setActiveTask(null)}>
          <div className="task-modal-content">
            <div className="field-group">
              <span className="field-label">Description</span>
              <div className="task-description-rendered">
                {activeTask.description ? renderDescriptionWithLinks(activeTask.description) : <span className="muted">No description</span>}
              </div>
            </div>
            {activeTask.description.includes('/pages/') ? <div className="muted small">Notebook links stay active inside backlog.</div> : null}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
