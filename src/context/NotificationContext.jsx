import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getNotificationsByUser, markNotificationRead, markAllNotificationsRead, createNotification as apiCreateNotification } from '../api'
import { useAuth } from './AuthContext'
import { generateId } from '../utils/helpers'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await getNotificationsByUser(user.id)
      setNotifications(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000) // poll every 15s
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user) return
    await markAllNotificationsRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }, [user])

  const createNotif = useCallback(async (payload) => {
    let notifObj = {}
    if (typeof payload === 'object' && payload !== null) {
      notifObj = {
        id: payload.id || `notif-${generateId()}`,
        userId: payload.userId,
        type: payload.type || 'info',
        title: payload.title,
        message: payload.message,
        entityId: payload.entityId || payload.link || '',
        entityType: payload.entityType || 'task',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    } else {
      const [userId, type, title, message, entityId, entityType] = arguments
      notifObj = {
        id: `notif-${generateId()}`,
        userId, type, title, message, entityId, entityType,
        isRead: false,
        createdAt: new Date().toISOString()
      }
    }

    try {
      await apiCreateNotification(notifObj)
      if (user && notifObj.userId === user.id) {
        setNotifications(prev => [notifObj, ...prev])
      }
    } catch (err) {
      console.error('Failed to create notification', err)
    }
  }, [user])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading,
      markRead, markAllRead, markAsRead: markRead, markAllAsRead: markAllRead,
      addNotification: createNotif, createNotification: createNotif, refresh: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

export default NotificationContext

