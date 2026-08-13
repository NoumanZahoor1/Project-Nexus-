import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api';

export default function MyTasks() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { createNotification } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksData, projectsData] = await Promise.all([
          api.getTasks({ assigneeId: user.id }),
          api.getProjects({ memberIds_like: user.id })
        ]);
        setTasks(tasksData || []);
        setProjects(projectsData || []);
      } catch (err) {
        showToast('Failed to load tasks', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user, showToast]);

  const fetchComments = async (taskId) => {
    try {
      const data = await api.getComments({ taskId });
      setComments(data || []);
    } catch (err) {
      showToast('Failed to load comments', 'error');
    }
  };

  const handleViewClick = (task) => {
    setSelectedTask(task);
    fetchComments(task.id);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }

      const task = tasks.find(t => t.id === taskId);
      const project = projects.find(p => p.id === task.projectId);

      await api.createActivityLog({
        projectId: task.projectId,
        userId: user.id,
        action: 'status_updated',
        entityType: 'task',
        entityId: taskId,
        details: `Updated task status to ${newStatus}`
      });

      if (project?.managerId) {
        createNotification({
          userId: project.managerId,
          title: 'Task Status Updated',
          message: `${user.name} updated task "${task.title}" to ${newStatus}`,
          type: 'status_updated',
          link: `/manager/projects/${project.id}/tasks/${taskId}`
        });
      }
      showToast('Status updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    
    try {
      const comment = {
        taskId: selectedTask.id,
        userId: user.id,
        content: newComment,
        createdAt: new Date().toISOString()
      };
      
      const saved = await api.createComment(comment);
      setComments([...comments, { ...saved, user }]);
      setNewComment('');

      const project = projects.find(p => p.id === selectedTask.projectId);

      if (project?.managerId) {
        createNotification({
          userId: project.managerId,
          title: 'New Comment',
          message: `${user.name} commented on "${selectedTask.title}"`,
          type: 'comment_added',
          link: `/manager/projects/${project.id}/tasks/${selectedTask.id}`
        });
      }
      showToast('Comment added', 'success');
    } catch (err) {
      showToast('Failed to add comment', 'error');
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    const matchesProject = projectFilter ? t.projectId === projectFilter : true;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  }).sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const isOverdue = (date) => date && new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  const isDueSoon = (date) => {
    if (!date) return false;
    const today = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
      </div>

      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{todoCount}</div>
            <div className="stat-label">To Do</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{inProgressCount}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-value">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-search" style={{ position: 'relative', flex: 1, maxWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select className="form-control filter-select" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="form-control filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="completed">Completed</option>
        </select>
        <select className="form-control filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex-center" style={{ height: '200px' }}><div className="spinner"></div></div>
        ) : filteredTasks.length > 0 ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <tr key={task.id}>
                      <td style={{ fontWeight: '500' }}>{task.title}</td>
                      <td>{project?.name || 'Unknown'}</td>
                      <td>
                        <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'primary'}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td>
                        <select 
                          className="form-control" 
                          style={{ padding: '4px 8px', width: 'auto' }}
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="in-review">In Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td style={{ 
                        color: task.status !== 'completed' && isOverdue(task.dueDate) ? 'var(--danger-600)' : 
                               task.status !== 'completed' && isDueSoon(task.dueDate) ? 'var(--warning-600)' : 'inherit',
                        fontWeight: task.status !== 'completed' && (isOverdue(task.dueDate) || isDueSoon(task.dueDate)) ? '600' : 'normal'
                      }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleViewClick(task)}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No tasks found.</div>
        )}
      </div>

      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title={`Task: ${selectedTask?.title}`}>
        {selectedTask && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Description</p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedTask.description || 'No description provided.'}</p>
              </div>
              <div className="grid-2">
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</p>
                  <select 
                    className="form-control" 
                    value={selectedTask.status}
                    onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="in-review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Due Date</p>
                  <div>{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'None'}</div>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <h4 style={{ margin: '0 0 16px 0' }}>Discussion</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
              {comments.map(c => (
                <div key={c.id} style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: '500', fontSize: '13px' }}>{c.user?.name || 'User'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px' }}>{c.content}</p>
                </div>
              ))}
              {comments.length === 0 && <div className="empty-state" style={{ padding: '20px' }}>No comments yet.</div>}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button className="btn btn-primary" onClick={handleAddComment}>Post</button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
