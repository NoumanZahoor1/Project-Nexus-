import { useEffect, useState } from 'react'

/**
 * PageTransition — Wraps page content with a smooth fade-slide-in animation.
 */
export default function PageTransition({ children }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on next frame for CSS transition
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => {
      cancelAnimationFrame(frame)
      setVisible(false)
    }
  }, [])

  return (
    <div
      className={`page-transition ${visible ? 'page-transition-enter' : ''}`}
    >
      {children}
    </div>
  )
}
