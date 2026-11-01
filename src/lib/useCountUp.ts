import { useEffect, useState } from 'react'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

// Animates a number from 0 to its value over ~700ms, as the prototype's metric cards did.
// Users who ask for reduced motion see the final value immediately.
export function useCountUp(target: number, durationMs = 700): number {
  const [reduced] = useState(prefersReducedMotion)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (reduced) return

    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs, reduced])

  return reduced ? target : value
}
