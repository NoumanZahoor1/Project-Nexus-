import { useEffect } from 'react'

/**
 * Sets the document title dynamically per page
 * @param {string} title - The page-specific title
 * @param {boolean} restoreOnUnmount - Whether to restore original title on unmount
 */
export default function useDocumentTitle(title, restoreOnUnmount = true) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title ? `${title} — ProjectNexus` : 'ProjectNexus | Where Teams Converge, Projects Thrive'

    return () => {
      if (restoreOnUnmount) document.title = prevTitle
    }
  }, [title, restoreOnUnmount])
}
