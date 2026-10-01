import { useEffect, useCallback } from 'react'

/**
 * Registers a keyboard shortcut
 * @param {string} key - The key to listen for (e.g., 'k', 'n', 'Escape')
 * @param {Function} callback - Function to call when shortcut is triggered
 * @param {{ ctrl?: boolean, shift?: boolean, alt?: boolean }} modifiers - Modifier keys
 */
export default function useKeyboardShortcut(key, callback, modifiers = {}) {
  const { ctrl = false, shift = false, alt = false } = modifiers

  const handleKeyDown = useCallback((e) => {
    // Don't trigger when typing in inputs
    const tag = e.target.tagName.toLowerCase()
    if (['input', 'textarea', 'select'].includes(tag) && key !== 'Escape') return

    const match =
      e.key.toLowerCase() === key.toLowerCase() &&
      e.ctrlKey === ctrl &&
      e.shiftKey === shift &&
      e.altKey === alt

    if (match) {
      e.preventDefault()
      callback(e)
    }
  }, [key, callback, ctrl, shift, alt])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
