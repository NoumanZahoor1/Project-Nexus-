import axios from 'axios'

const BASE_URL = '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ===== USERS =====
export const getUsers = () => api.get('/users')
export const getUserById = (id) => api.get(`/users/${id}`)
export const createUser = (data) => api.post('/users', data)
export const updateUser = (id, data) => api.patch(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

// ===== PROJECTS =====
export const getProjects = (params) => {
  if (params?.memberIds_like) return getProjectsByMember(params.memberIds_like)
  if (params?.managerId) return getProjectsByManager(params.managerId)
  return api.get('/projects')
}
export const getProjectById = (id) => api.get(`/projects/${id}`)
export const getProject = getProjectById
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.patch(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)
export const getProjectsByManager = (managerId) => api.get(`/projects?managerId=${managerId}`)
export const getProjectsByMember = async (memberId) => {
  const { data } = await api.get('/projects')
  return { data: data.filter(p => Array.isArray(p.memberIds) && p.memberIds.includes(memberId)) }
}

// ===== TASKS =====
export const getTasks = (params) => {
  if (params?.assigneeId) return getTasksByAssignee(params.assigneeId)
  if (params?.projectId) return getTasksByProject(params.projectId)
  return api.get('/tasks')
}
export const getTaskById = (id) => api.get(`/tasks/${id}`)
export const getTasksByProject = (projectId) => api.get(`/tasks?projectId=${projectId}`)
export const getTasksByAssignee = (assigneeId) => api.get(`/tasks?assigneeId=${assigneeId}`)
export const createTask = (data) => api.post('/tasks', data)
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)

// ===== TASK COMMENTS =====
export const getCommentsByTask = (taskId) => api.get(`/taskComments?taskId=${taskId}&_sort=createdAt&_order=asc`)
export const getComments = ({ taskId }) => getCommentsByTask(taskId)
export const createComment = (data) => api.post('/taskComments', data)
export const updateComment = (id, data) => api.patch(`/taskComments/${id}`, data)
export const deleteComment = (id) => api.delete(`/taskComments/${id}`)

// ===== NOTIFICATIONS =====
export const getNotificationsByUser = (userId) => api.get(`/notifications?userId=${userId}&_sort=createdAt&_order=desc`)
export const markNotificationRead = (id) => api.patch(`/notifications/${id}`, { isRead: true })
export const markAllNotificationsRead = async (userId) => {
  const { data } = await api.get(`/notifications?userId=${userId}&isRead=false`)
  await Promise.all(data.map(n => api.patch(`/notifications/${n.id}`, { isRead: true })))
}
export const createNotification = (data) => api.post('/notifications', data)

// ===== ACTIVITY LOGS =====
export const getActivityByProject = (projectId) => api.get(`/activityLogs?projectId=${projectId}&_sort=createdAt&_order=desc`)
export const getActivityLogs = ({ projectId }) => getActivityByProject(projectId)
export const getAllActivityLogs = () => api.get('/activityLogs?_sort=createdAt&_order=desc')
export const createActivityLog = (data) => api.post('/activityLogs', data)

// Attach method helpers onto api default object for backward compatibility
api.getUsers = getUsers
api.getUserById = getUserById
api.createUser = createUser
api.updateUser = updateUser
api.deleteUser = deleteUser

api.getProjects = async (params) => {
  const res = await getProjects(params)
  return res.data
}
api.getProject = async (id) => {
  const res = await getProjectById(id)
  return res.data
}
api.getProjectById = getProjectById
api.createProject = createProject
api.updateProject = updateProject
api.deleteProject = deleteProject

api.getTasks = async (params) => {
  const res = await getTasks(params)
  return res.data
}
api.getTaskById = getTaskById
api.createTask = createTask
api.updateTask = updateTask
api.deleteTask = deleteTask

api.getComments = async ({ taskId }) => {
  const res = await getCommentsByTask(taskId)
  return res.data
}
api.createComment = async (data) => {
  const res = await createComment(data)
  return res.data
}

api.getActivityLogs = async ({ projectId }) => {
  const res = await getActivityByProject(projectId)
  return res.data
}
api.createActivityLog = async (data) => {
  const res = await createActivityLog(data)
  return res.data
}

export default api

