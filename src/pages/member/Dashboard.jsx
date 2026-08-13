import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, ClipboardList, Calendar, CheckCircle, Clock } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function MemberDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Note: Assuming api handles the memberIds_like query appropriately based on instructions
        const [projectsRes, tasksRes] = await Promise.all([
          api.getProjects({ memberIds_like: user.id }),
          api.getTasks({ assigneeId: user.id })
        ]);
        setProjects(projectsRes || []);
        setTasks(tasksRes || []);
      } catch (err) {
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user, showToast]);

  const activeTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  
  // Calculate upcoming deadlines (next 7 days)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingTasks = tasks
    .filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) <= nextWeek)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-center" style={{ height: '100%' }}>
          <div className="spinner"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {user?.name}!</h1>
          <p className="page-subtitle">{user?.role === 'member' ? 'Team Member' : user?.role}</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--indigo-600)', backgroundColor: 'var(--indigo-50)' }}>
            <FolderKanban />
          </div>
          <div className="stat-info">
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">My Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--violet-600)', backgroundColor: 'var(--violet-50)' }}>
            <ClipboardList />
          </div>
          <div className="stat-info">
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">My Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--amber-600)', backgroundColor: 'var(--amber-50)' }}>
            <Calendar />
          </div>
          <div className="stat-info">
            <div className="stat-value">{upcomingTasks.length}</div>
            <div className="stat-label">Tasks Due Soon</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--green-600)', backgroundColor: 'var(--green-50)' }}>
            <CheckCircle />
          </div>
          <div>
            <div className="stat-value">{completedTasks.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card card-pad">
          <div className="flex-between" style={{ marginBottom: '16px' }}>
            <h3>My Active Tasks</h3>
            <Link to="/member/tasks" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {activeTasks.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTasks.slice(0, 5).map(task => (
                    <tr key={task.id} onClick={() => navigate('/member/tasks')} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: '500' }}>{task.title}</td>
                      <td>
                        <Badge variant={task.status === 'in-progress' ? 'violet' : 'neutral'}>
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
            <div className="empty-state">No active tasks right now.</div>
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ marginBottom: '16px' }}>Upcoming Deadlines</h3>
          {upcomingTasks.length > 0 ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingTasks.slice(0, 5).map(task => (
                    <tr key={task.id}>
                      <td style={{ fontWeight: '500' }}>{task.title}</td>
                      <td>
                        <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'primary'}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td style={{ color: 'var(--danger-600)', fontWeight: '500' }}>
                        <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No upcoming deadlines.</div>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3>My Projects</h3>
          <Link to="/member/projects" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        {projects.length > 0 ? (
          <div className="grid-3">
            {projects.slice(0, 3).map(project => (
              <div key={project.id} className="card card-pad-sm" style={{ border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => navigate(`/member/projects/${project.id}`)}>
                <div className="flex-between">
                  <h4 style={{ margin: '0 0 8px 0' }}>{project.name}</h4>
                  <Badge variant={project.status === 'completed' ? 'success' : project.status === 'in-progress' ? 'violet' : 'neutral'}>
                    {project.status}
                  </Badge>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {project.description?.substring(0, 50)}...
                </p>
                <div style={{ marginTop: 'auto' }}>
                  <div className="flex-between" style={{ fontSize: '12px', marginBottom: '4px' }}>
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${project.progress || 0}%`, backgroundColor: 'var(--primary-color)' }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">You are not part of any projects yet.</div>
        )}
      </div>
    </AppLayout>
  );
}
