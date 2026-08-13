import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  getProjectById, getTasksByProject, getUsers, getActivityByProject, getCommentsByTask,
  updateTask, createTask, createComment, createNotification, createActivityLog, updateProject
} from '../../api';
import { getStatusConfig, getPriorityConfig, getTaskStatusConfig, generateId, isOverdue, formatDate, getRoleConfig, formatDateTime } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { Edit2, Loader2 } from 'lucide-react';

const ProjectWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('kanban');

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Form State
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', priority: 'medium', status: 'todo', dueDate: '' });
  
  // Project Edit State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState(null);
  const [savingProject, setSavingProject] = useState(false);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes, usersRes, actRes] = await Promise.all([
        getProjectById(id),
        getTasksByProject(id),
        getUsers(),
        getActivityByProject(id)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
      setActivities(actRes.data);
    } catch (err) {
      showToast('Failed to load project workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
    // eslint-disable-next-line
  }, [id, user]);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e, status) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== status) {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);
      setTasks(updatedTasks);
      try {
        await updateTask(taskId, { status });
        await createActivityLog({
          id: generateId(),
          projectId: project.id,
          action: 'Updated task status',
          entityType: 'Task',
          userId: user.id,
          createdAt: new Date().toISOString()
        });
        showToast('Task updated successfully', 'success');
      } catch (err) {
        fetchData();
        showToast('Failed to update task', 'error');
      }
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const newTask = {
        ...taskForm,
        id: currentTask?.id || generateId(),
        projectId: project.id,
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
      
      await createActivityLog({
        id: generateId(),
        projectId: project.id,
        action: currentTask ? 'Updated task' : 'Created task',
        entityType: 'Task',
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      
      setShowTaskModal(false);
      fetchData();
      showToast('Task saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save task', 'error');
    }
  };

  const openTaskDetail = async (task) => {
    setCurrentTask(task);
    try {
      const res = await getCommentsByTask(task.id);
      setComments(res.data);
      setShowDetailModal(true);
    } catch (err) {
      showToast('Failed to load comments', 'error');
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setSavingProject(true);
    try {
      const payload = { 
        ...projectForm, 
        tags: typeof projectForm.tags === 'string' ? projectForm.tags.split(',').map(t => t.trim()) : projectForm.tags, 
        updatedAt: new Date().toISOString() 
      };
      await updateProject(project.id, payload);
      await createActivityLog({
        id: generateId(),
        projectId: project.id,
        action: 'Updated project details',
        entityType: 'Project',
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      showToast('Project updated successfully', 'success');
      setShowProjectModal(false);
      fetchData();
    } catch (err) {
      showToast('Failed to update project', 'error');
    } finally {
      setSavingProject(false);
    }
  };

  const openEditProject = () => {
    setProjectForm({ 
      ...project, 
      tags: (project.tags || []).join(', ') 
    });
    setShowProjectModal(true);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const commentData = {
        id: generateId(),
        taskId: currentTask.id,
        userId: user.id,
        content: newComment,
        createdAt: new Date().toISOString()
      };
      await createComment(commentData);
      
      if (currentTask.assigneeId && currentTask.assigneeId !== user.id) {
        await createNotification({
          id: generateId(),
          userId: currentTask.assigneeId,
          type: 'comment_added',
          title: 'New Comment',
          message: `${user.name} commented on ${currentTask.title}`,
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }
      
      setComments([...comments, commentData]);
      setNewComment('');
    } catch (err) {
      showToast('Failed to add comment', 'error');
    }
  };

  const renderKanban = () => {
    const columns = ['todo', 'in-progress', 'review', 'completed'];
    return (
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
        {columns.map(status => (
          <div 
            key={status} 
            style={{ minWidth: '300px', flex: 1, backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>{getTaskStatusConfig(status).label}</h3>
              <Badge className="badge-neutral" label={tasks.filter(t => t.status === status).length} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.filter(t => t.status === status).map(t => {
                const assignee = users.find(u => u.id === t.assigneeId);
                const overdue = isOverdue(t.dueDate) && t.status !== 'completed';
                return (
                  <div 
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    onClick={() => openTaskDetail(t)}
                    style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '8px' }}>{t.title}</div>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <Badge {...getPriorityConfig(t.priority)} />
                      {t.dueDate && <span style={{ fontSize: '12px', color: overdue ? '#ef4444' : '#64748b' }}>{formatDate(t.dueDate)}</span>}
                    </div>
                    {assignee && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar name={assignee.name} size={24} />
                        <span style={{ fontSize: '12px' }}>{assignee.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTaskList = () => (
    <div className="card">
      <div className="card-pad border-bottom flex-between">
        <h3 className="m-0">Task List</h3>
        <button className="btn btn-primary btn-sm" onClick={() => { setCurrentTask(null); setTaskForm({ title: '', description: '', assigneeId: '', priority: 'medium', status: 'todo', dueDate: '' }); setShowTaskModal(true); }}>Add Task</button>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Assignee</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => {
              const assignee = users.find(u => u.id === t.assigneeId);
              return (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Avatar name={assignee.name} size={24} /><span>{assignee.name}</span></div> : '—'}</td>
                  <td><Badge {...getPriorityConfig(t.priority)} /></td>
                  <td>
                    <select 
                      className="form-control" 
                      style={{ padding: '4px', fontSize: '14px', height: 'auto' }}
                      value={t.status}
                      onChange={(e) => handleDrop({ dataTransfer: { getData: () => t.id } }, e.target.value)}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td>{formatDate(t.dueDate)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setCurrentTask(t); setTaskForm(t); setShowTaskModal(true); }}>Edit</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTeam = () => {
    const projectMembers = users.filter(u => project.memberIds?.includes(u.id));
    return (
      <div className="grid-3">
        {projectMembers.map(m => {
          const mTasks = tasks.filter(t => t.assigneeId === m.id).length;
          return (
            <div key={m.id} className="card">
              <div className="card-pad" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <Avatar name={m.name} size={64} />
                </div>
                <h4 style={{ margin: '0 0 4px 0' }}>{m.name}</h4>
                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px' }}>{m.department || '—'}</p>
                <div style={{ marginBottom: '16px' }}><Badge {...getRoleConfig(m.role)} /></div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>{mTasks} Assigned Tasks</div>
              </div>
            </div>
          )
        })}
      </div>
    );
  };

  const renderActivity = () => (
    <div className="card">
      <div className="card-pad">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activities.length === 0 ? <div className="empty-state">No activity yet.</div> : activities.map(act => {
            const actor = users.find(u => u.id === act.userId);
            return (
              <div key={act.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <Avatar name={actor?.name || '?'} size={32} />
                <div>
                  <div style={{ fontSize: '14px' }}><span style={{ fontWeight: 500 }}>{actor?.name}</span> {act.action}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{formatDateTime(act.createdAt)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const dates = Array.from(new Set(tasks.map(t => t.dueDate).filter(Boolean))).sort()
    return (
      <div className="card card-pad">
        <h3 style={{ marginBottom: '16px' }}>Task Calendar & Timeline</h3>
        {dates.length === 0 ? (
          <div className="empty-state">No scheduled task deadlines in this project.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {dates.map(date => {
              const dayTasks = tasks.filter(t => t.dueDate === date)
              return (
                <div key={date} style={{ borderLeft: '3px solid var(--primary-600)', paddingLeft: '16px' }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px', color: 'var(--primary-600)' }}>
                    📅 {formatDate(date)} ({dayTasks.length} task{dayTasks.length > 1 ? 's' : ''})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {dayTasks.map(t => {
                      const assignee = users.find(u => u.id === t.assigneeId)
                      return (
                        <div 
                          key={t.id} 
                          onClick={() => openTaskDetail(t)}
                          style={{
                            padding: '12px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          <div className="flex-between" style={{ marginBottom: '6px' }}>
                            <span style={{ fontWeight: 500, fontSize: '14px' }}>{t.title}</span>
                            <Badge {...getTaskStatusConfig(t.status)} />
                          </div>
                          <div className="flex-between" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span>Priority: {t.priority}</span>
                            {assignee && <span>Assignee: {assignee.name}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (loading) return <AppLayout><div className="app-content"><div className="spinner"></div></div></AppLayout>;
  if (!project) return <AppLayout><div className="app-content"><div className="empty-state">Project not found.</div></div></AppLayout>;

  return (
    <AppLayout>
      <div className="app-content">
        <div style={{ marginBottom: '16px' }}>
          <Link to="/manager/projects" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}>← Back to Projects</Link>
        </div>
        
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-pad">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 className="m-0" style={{ fontSize: '24px' }}>{project.name}</h1>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={openEditProject} title="Edit Project">
                  <Edit2 size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Badge {...getStatusConfig(project.status)} />
                <Badge {...getPriorityConfig(project.priority)} />
              </div>
            </div>
            <p style={{ color: '#64748b' }}>{project.description}</p>
          </div>
          <div className="border-bottom" style={{ display: 'flex', gap: '24px', padding: '0 24px' }}>
            {['kanban', 'list', 'calendar', 'team', 'activity'].map(tab => (
              <div 
                key={tab}
                style={{ 
                  padding: '12px 0', 
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === tab ? '#3b82f6' : '#64748b',
                  fontWeight: activeTab === tab ? 500 : 400,
                  textTransform: 'capitalize'
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'list' ? 'Task List' : tab}
              </div>
            ))}
          </div>
        </div>

        {activeTab === 'kanban' && renderKanban()}
        {activeTab === 'list' && renderTaskList()}
        {activeTab === 'calendar' && renderCalendar()}


        <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Edit Project" size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveProject} disabled={savingProject}>
                {savingProject ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</> : 'Save Changes'}
              </button>
            </>
          }
        >
          {projectForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="form-control" value={projectForm.name} onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-control" value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} rows={3} required />
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input className="form-control" type="date" value={projectForm.startDate} onChange={e => setProjectForm(p => ({ ...p, startDate: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input className="form-control" type="date" value={projectForm.endDate} onChange={e => setProjectForm(p => ({ ...p, endDate: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Priority *</label>
                  <select className="form-control" value={projectForm.priority} onChange={e => setProjectForm(p => ({ ...p, priority: e.target.value }))} required>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select className="form-control" value={projectForm.status} onChange={e => setProjectForm(p => ({ ...p, status: e.target.value }))} required>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Team Members</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxHeight: 180, overflowY: 'auto' }}>
                  {users.filter(u => u.role === 'member' || u.role === 'manager').map(m => (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, background: projectForm.memberIds.includes(m.id) ? 'var(--primary-100)' : 'transparent', border: `1px solid ${projectForm.memberIds.includes(m.id) ? 'var(--primary-300)' : 'transparent'}`, transition: 'all 0.15s', fontSize: 13 }}>
                      <input 
                        type="checkbox" 
                        checked={projectForm.memberIds.includes(m.id)} 
                        onChange={() => {
                          setProjectForm(p => ({ 
                            ...p, 
                            memberIds: p.memberIds.includes(m.id) ? p.memberIds.filter(x => x !== m.id) : [...p.memberIds, m.id] 
                          }));
                        }} 
                      />
                      <Avatar name={m.name} size="xs" />
                      {m.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input className="form-control" value={projectForm.tags} onChange={e => setProjectForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title={currentTask ? 'Edit Task' : 'Create Task'}>
          <form onSubmit={handleSaveTask}>
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
                <select className="form-control" value={taskForm.assigneeId} onChange={e => setTaskForm({...taskForm, assigneeId: e.target.value})} required>
                  <option value="">Select Assignee</option>
                  {users.filter(u => project.memberIds?.includes(u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
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
              <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Task</button>
            </div>
          </form>
        </Modal>

        {showDetailModal && currentTask && (
          <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Task Details">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0' }}>{currentTask.title}</h3>
              <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>{currentTask.description}</p>
              <div className="flex-between" style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Status</div>
                  <Badge {...getTaskStatusConfig(currentTask.status)} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Priority</div>
                  <Badge {...getPriorityConfig(currentTask.priority)} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Due Date</div>
                  <span style={{ fontWeight: 500, color: isOverdue(currentTask.dueDate) && currentTask.status !== 'completed' ? '#ef4444' : 'inherit' }}>
                    {formatDate(currentTask.dueDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-top" style={{ paddingTop: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0' }}>Discussion</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px', maxHeight: '300px', overflowY: 'auto' }}>
                {comments.length === 0 ? <div className="empty-state">No comments yet.</div> : comments.map(c => {
                  const author = users.find(u => u.id === c.userId);
                  return (
                    <div key={c.id} style={{ display: 'flex', gap: '12px' }}>
                      <Avatar name={author?.name || '?'} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500, fontSize: '14px' }}>{author?.name}</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{formatDateTime(c.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: '14px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>{c.content}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ flex: 1 }} 
                  placeholder="Type a comment..." 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>Post</button>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </AppLayout>
  );
};

export default ProjectWorkspace;
