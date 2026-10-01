import { useState, useEffect, useRef } from 'react'

/**
 * Animates a number from 0 to the target value
 * @param {number} target - The target number to count to
 * @param {number} duration - Animation duration in ms (default 1200)
 * @param {boolean} enabled - Whether animation should run
 * @returns {number} The current animated value
 */
export default function useAnimatedCounter(target, duration = 1200, enabled = true) {
  const [count, setCount] = useState(0)
  const frameRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (!enabled || target === 0) {
      setCount(target)
      return
    }

    setCount(0)
    startTimeRef.current = null

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, enabled])

  return count
}
