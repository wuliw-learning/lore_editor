import { useEffect, useMemo, useRef } from 'react'

import { getMatchingBlockOptions } from './blockTypes'

type Props = {
  query: string
  onSelect: (type: string) => void
  activeIndex: number
  onActiveIndexChange: (index: number) => void
}

export function SlashMenu({ query, onSelect, activeIndex, onActiveIndexChange }: Props) {
  const items = useMemo(() => getMatchingBlockOptions(query), [query])
  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (items.length === 0 && activeIndex !== 0) {
      onActiveIndexChange(0)
      return
    }
    if (activeIndex > Math.max(items.length - 1, 0)) {
      onActiveIndexChange(0)
    }
  }, [activeIndex, items.length, onActiveIndexChange, query])

  useEffect(() => {
    const activeItem = itemRefs.current[activeIndex]
    activeItem?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  return (
    <div className="slash-menu">
      {items.length === 0 ? <div className="muted small">No matching blocks</div> : null}
      {items.map((item, itemIndex) => (
        <button
          key={item.type}
          ref={(element) => {
            itemRefs.current[itemIndex] = element
          }}
          className={`slash-item ${itemIndex === activeIndex ? 'active' : ''}`}
          onMouseEnter={() => onActiveIndexChange(itemIndex)}
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
