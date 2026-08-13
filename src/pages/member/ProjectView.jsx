import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Clock, Users, Activity } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../api';

export default function ProjectView() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { createNotification } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('my-tasks');
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const [projectData, tasksData, teamData, activityData] = await Promise.all([
          api.getProject(id),
          api.getTasks({ projectId: id }),
          api.getUsers(), // Need to filter by project.memberIds
          api.getActivityLogs({ projectId: id })
        ]);
        
        setProject(projectData);
        setTasks(tasksData || []);
        setTeam(teamData ? teamData.filter(u => projectData.memberIds?.includes(u.id)) : []);
        setActivities(activityData || []);
      } catch (err) {
        showToast('Failed to load project details', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProjectData();
  }, [id, showToast]);

  const fetchComments = async (taskId) => {
    try {
      const data = await api.getComments({ taskId });
      setComments(data || []);
    } catch (err) {
      showToast('Failed to load comments', 'error');
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    fetchComments(task.id);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      
      const task = tasks.find(t => t.id === taskId);
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }

      await api.createActivityLog({
        projectId: id,
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
          link: `/manager/projects/${id}/tasks/${taskId}`
        });
      }
      showToast('Task status updated', 'success');
    } catch (err) {
      showToast('Failed to update task status', 'error');
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

      if (project?.managerId) {
        createNotification({
          userId: project.managerId,
          title: 'New Comment',
          message: `${user.name} commented on "${selectedTask.title}"`,
          type: 'comment_added',
          link: `/manager/projects/${id}/tasks/${selectedTask.id}`
        });
      }
      showToast('Comment added', 'success');
    } catch (err) {
      showToast('Failed to add comment', 'error');
    }
  };

  if (loading) return <AppLayout><div className="flex-center" style={{height: '100%'}}><div className="spinner"></div></div></AppLayout>;
  if (!project) return <AppLayout><div className="empty-state">Project not found</div></AppLayout>;

  const myTasks = tasks.filter(t => t.assigneeId === user.id);

  return (
    <AppLayout>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/member/projects" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ChevronLeft size={16} /> Back to Projects
        </Link>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="page-title">{project.name}</h1>
            <Badge variant={project.status === 'completed' ? 'success' : 'violet'}>{project.status}</Badge>
          </div>
          <p className="page-subtitle">{project.description}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {[
            { id: 'my-tasks', label: 'My Tasks', icon: <Clock size={16} /> },
            { id: 'all-tasks', label: 'All Tasks', icon: <MessageSquare size={16} /> },
            { id: 'team', label: 'Team', icon: <Users size={16} /> },
            { id: 'activity', label: 'Activity', icon: <Activity size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-ghost ${activeTab === tab.id ? 'active' : ''}`}
              style={{ 
                borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                borderRadius: 0,
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card-pad">
          {activeTab === 'my-tasks' && (
            <div>
              {myTasks.length > 0 ? (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTasks.map(task => (
                        <tr key={task.id}>
                          <td style={{ fontWeight: '500' }}>{task.title}</td>
                          <td>
                            <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'primary'}>
                              {task.priority}
                            </Badge>
                          </td>
                          <td>
                            <select 
                              className="form-control" 
                              style={{ padding: '4px 8px', width: 'auto', minWidth: '120px' }}
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="in-review">In Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <button className="btn btn-sm btn-ghost" onClick={() => handleTaskClick(task)}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">You have no tasks assigned in this project.</div>
              )}
            </div>
          )}

          {activeTab === 'all-tasks' && (
            <div>
              {tasks.length > 0 ? (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Assignee</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map(task => (
                        <tr key={task.id}>
                          <td>{task.title}</td>
                          <td>
                            {team.find(u => u.id === task.assigneeId)?.name || 'Unassigned'}
                          </td>
                          <td>
                            <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'violet' : 'neutral'}>
                              {task.status}
                            </Badge>
                          </td>
                          <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">No tasks in this project yet.</div>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="grid-3">
              {team.map(member => (
                <div key={member.id} className="card card-pad-sm flex-between" style={{ border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={member.name} />
                    <div>
                      <div style={{ fontWeight: '500' }}>{member.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              {activities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activities.map(act => (
                    <div key={act.id} style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', marginTop: '6px' }}></div>
                      <div>
                        <div style={{ fontSize: '14px' }}>{act.details}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(act.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No activity recorded yet.</div>
              )}
            </div>
          )}
        </div>
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
