import { useEffect, type DependencyList } from 'react'

export function useDebouncedEffect(effect: () => void, deps: DependencyList, delay: number) {
  useEffect(() => {
    const timer = window.setTimeout(effect, delay)
    return () => window.clearTimeout(timer)
  }, deps)
}
