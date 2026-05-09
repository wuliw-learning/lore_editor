import { useEffect, useMemo, useRef, useState } from 'react'

import { blockOptions } from './blockTypes'

type Props = {
  query: string
  onSelect: (type: string) => void
  onClose: () => void
}

export function SlashMenu({ query, onSelect, onClose }: Props) {
  const items = useMemo(() => blockOptions.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())), [query])
  const [index, setIndex] = useState(0)
  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({})

  useEffect(() => {
    setIndex(0)
  }, [query])

  useEffect(() => {
    const activeItem = itemRefs.current[index]
    activeItem?.scrollIntoView({ block: 'nearest' })
  }, [index])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setIndex((current) => (current + 1) % Math.max(items.length, 1))
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setIndex((current) => (current - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1))
      }
      if (event.key === 'Enter' && items[index]) {
        event.preventDefault()
        onSelect(items[index].type)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [index, items, onClose, onSelect])

  return (
    <div className="slash-menu">
      {items.length === 0 ? <div className="muted small">No matching blocks</div> : null}
      {items.map((item, itemIndex) => (
        <button
          key={item.type}
          ref={(element) => {
            itemRefs.current[itemIndex] = element
          }}
          className={`slash-item ${itemIndex === index ? 'active' : ''}`}
          onMouseEnter={() => setIndex(itemIndex)}
          onMouseDown={(event) => {
            event.preventDefault()
            onSelect(item.type)
          }}
        >
          <strong>{item.label}</strong>
          <span className="slash-hint">/{item.label.toLowerCase()}</span>
        </button>
      ))}
    </div>
  )
}
