import { useEffect } from 'react'

type HotkeyHandler = (event: KeyboardEvent) => void

export function useHotkeys(bindings: Array<{ combo: string; handler: HotkeyHandler }>) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const combo = [event.ctrlKey ? 'ctrl' : '', event.metaKey ? 'meta' : '', event.key.toLowerCase()]
        .filter(Boolean)
        .join('+')

      const match = bindings.find((binding) => binding.combo === combo)
      if (match) {
        event.preventDefault()
        match.handler(event)
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [bindings])
}
