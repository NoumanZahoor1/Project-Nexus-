import { useState, useEffect } from 'react'

/**
 * Returns a time-aware greeting string (e.g. "Good Morning", "Good Afternoon")
 * Updates every minute to stay accurate
 */
export default function useGreeting() {
  const getGreetingText = () => {
    const hour = new Date().getHours()
    if (hour < 5)  return 'Good Night'
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    if (hour < 21) return 'Good Evening'
    return 'Good Night'
  }

  const [greeting, setGreeting] = useState(getGreetingText)

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreetingText()), 60000)
    return () => clearInterval(interval)
  }, [])

  return greeting
}
