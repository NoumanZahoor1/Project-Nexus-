import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getUsers, createUser, updateUser } from '../api'
import { generateId } from '../utils/helpers'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('nexus_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('nexus_user') }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data: users } = await getUsers()
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
    if (!found) throw new Error('Invalid email or password')
    if (!found.isActive) throw new Error('Your account has been deactivated. Please contact an administrator.')
    const loggedIn = { ...found }
    // Update lastLogin
    await updateUser(found.id, { lastLogin: new Date().toISOString() })
    localStorage.setItem('nexus_user', JSON.stringify(loggedIn))
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(async ({ name, email, password, department, phone }) => {
    const { data: users } = await getUsers()
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (exists) throw new Error('An account with this email already exists')
    const newUser = {
      id: `user-${generateId()}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'member',
      department: department || 'General',
      phone: phone || '',
      avatar: name.trim().slice(0, 2).toUpperCase(),
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
    await createUser(newUser)
    localStorage.setItem('nexus_user', JSON.stringify(newUser))
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nexus_user')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (updates) => {
    if (!user) return
    await updateUser(user.id, updates)
    const updated = { ...user, ...updates }
    localStorage.setItem('nexus_user', JSON.stringify(updated))
    setUser(updated)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
