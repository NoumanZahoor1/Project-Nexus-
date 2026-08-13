import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProjectsByManager, getTasks, getUsers, createTask, updateTask, deleteTask, createNotification, createActivityLog } from '../../api';
import { getTaskStatusConfig, getPriorityConfig, isOverdue, formatDate, generateId } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';

const Tasks = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', projectId: '', assigneeId: '', priority: 'medium', status: 'todo', dueDate: '' });

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        getProjectsByManager(user.id),
        getTasks(),
        getUsers()
      ]);
      
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
      
      const managerProjectIds = projectsRes.data.map(p => p.id);
      const myTasks = tasksRes.data.filter(t => managerProjectIds.includes(t.projectId));
      setTasks(myTasks);
    } catch (err) {
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
    // eslint-disable-next-line
  }, [user, showToast]);

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const newTask = {
        ...taskForm,
        id: currentTask?.id || generateId(),
        createdAt: currentTask?.createdAt || new Date().toISOString(),
      };
      
      if (currentTask) {
        await updateTask(newTask.id, newTask);
      } else {
        await createTask(newTask);
        if (newTask.assigneeId) {
          await createNotification({
            id: generateId(),
            userId: newTask.assigneeId,
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned to ${newTask.title}`,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
      
      if (newTask.projectId) {
        await createActivityLog({
          id: generateId(),
          projectId: newTask.projectId,
          action: currentTask ? 'Updated task' : 'Created task',
          entityType: 'Task',
          userId: user.id,
          createdAt: new Date().toISOString()
        });
      }
      
      setShowModal(false);
      fetchData();
      showToast('Task saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save task', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        fetchData();
        showToast('Task deleted', 'success');
      } catch (err) {
        showToast('Failed to delete task', 'error');
      }
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesProject = projectFilter ? t.projectId === projectFilter : true;
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    const matchesAssignee = assigneeFilter ? t.assigneeId === assigneeFilter : true;
    return matchesSearch && matchesProject && matchesStatus && matchesPriority && matchesAssignee;
  });

  const getAvailableAssignees = () => {
    if (!taskForm.projectId) return [];
    const project = projects.find(p => p.id === taskForm.projectId);
    if (!project) return [];
    return users.filter(u => project.memberIds?.includes(u.id));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="app-content">
          <div className="spinner"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="app-content">
        <div className="page-header flex-between">
          <h1 className="page-title m-0">All Tasks</h1>
          <button className="btn btn-primary" onClick={() => { setCurrentTask(null); setTaskForm({ title: '', description: '', projectId: '', assigneeId: '', priority: 'medium', status: 'todo', dueDate: '' }); setShowModal(true); }}>
            Create Task
          </button>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="filter-search form-control"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select form-control" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select className="filter-select form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="review">In Review</option>
            <option value="completed">Completed</option>
          </select>
          <select className="filter-select form-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No tasks found.</td>
                  </tr>
                ) : (
                  filteredTasks.map(t => {
                    const project = projects.find(p => p.id === t.projectId);
                    const assignee = users.find(u => u.id === t.assigneeId);
                    const isTaskOverdue = isOverdue(t.dueDate) && t.status !== 'completed';
                    
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 500 }}>{t.title}</td>
                        <td>{project?.name || '—'}</td>
                        <td>
                          {assignee ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Avatar name={assignee.name} size={24} />
                              <span>{assignee.name}</span>
                            </div>
                          ) : 'Unassigned'}
                        </td>
                        <td><Badge {...getPriorityConfig(t.priority)} /></td>
                        <td><Badge {...getTaskStatusConfig(t.status)} /></td>
                        <td style={{ color: isTaskOverdue ? '#ef4444' : 'inherit' }}>
                          {formatDate(t.dueDate)}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="btn btn-sm btn-ghost" onClick={() => { setCurrentTask(t); setTaskForm(t); setShowModal(true); }}>Edit</button>
                            <button className="btn btn-sm btn-danger btn-ghost" onClick={() => handleDelete(t.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={currentTask ? 'Edit Task' : 'Create Task'}>
          <form onSubmit={handleSaveTask}>
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select className="form-control" value={taskForm.projectId} onChange={e => setTaskForm({...taskForm, projectId: e.target.value, assigneeId: ''})} required>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input type="text" className="form-control" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-control" rows="3" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} required></textarea>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Assignee *</label>
                <select className="form-control" value={taskForm.assigneeId} onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})} required disabled={!taskForm.projectId}>
                  <option value="">Select Assignee</option>
                  {getAvailableAssignees().map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input type="date" className="form-control" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} required />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Priority *</label>
                <select className="form-control" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status *</label>
                <select className="form-control" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})} required>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Task</button>
            </div>
          </form>
        </Modal>

      </div>
    </AppLayout>
  );
};

export default Tasks;
