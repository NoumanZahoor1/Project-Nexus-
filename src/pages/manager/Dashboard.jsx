import React, { useState, useEffect } from 'react';
import { Briefcase, CheckSquare, Clock, AlertCircle, Activity } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProjectsByManager, getTasks, getActivityByProject } from '../../api';
import { isDueSoon, isOverdue, formatRelative, calcProjectProgress, getStatusConfig, formatDate, getTaskStatusConfig } from '../../utils/helpers';
import ProgressBar from '../../components/common/ProgressBar';
import Badge from '../../components/common/Badge';

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: projs } = await getProjectsByManager(user.id);
        setProjects(projs);
        
        const { data: allTasks } = await getTasks();
        const managerProjectIds = projs.map(p => p.id);
        const myTasks = allTasks.filter(t => managerProjectIds.includes(t.projectId));
        setTasks(myTasks);

        const acts = [];
        for (const p of projs) {
          const { data: pActs } = await getActivityByProject(p.id);
          acts.push(...pActs);
        }
        acts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivities(acts.slice(0, 5));
      } catch (err) {
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user, showToast]);

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const dueSoonTasks = activeTasks.filter(t => isDueSoon(t.dueDate));

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
        <div className="page-header">
          <div>
            <h1 className="page-title">Good Morning, {user?.name}!</h1>
            <p className="page-subtitle">{formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <Briefcase size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{projects.length}</div>
              <div className="stat-label">Assigned Projects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{activeTasks.length}</div>
              <div className="stat-label">Active Tasks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <AlertCircle size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{dueSoonTasks.length}</div>
              <div className="stat-label">Tasks Due This Week</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
              <CheckSquare size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{completedTasks.length}</div>
              <div className="stat-label">Completed Tasks</div>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-pad border-bottom">
              <h2 className="card-title m-0">My Projects</h2>
            </div>
            <div className="card-pad">
              {projects.length === 0 ? (
                <div className="empty-state">No projects assigned to you.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {projects.map(p => {
                    const pTasks = tasks.filter(t => t.projectId === p.id);
                    const progress = calcProjectProgress(pTasks);
                    return (
                      <div key={p.id} className="flex-between">
                        <div style={{ flex: 1 }}>
                          <div className="flex-between" style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                            <Badge {...getStatusConfig(p.status)} />
                          </div>
                          <ProgressBar progress={progress} color={getStatusConfig(p.status).dotColor} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-pad border-bottom">
              <h2 className="card-title m-0">Upcoming Deadlines</h2>
            </div>
            <div className="card-pad">
              {activeTasks.length === 0 ? (
                <div className="empty-state">No upcoming deadlines.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[...activeTasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5).map(t => {
                    const overdue = isOverdue(t.dueDate);
                    const dueSoon = isDueSoon(t.dueDate);
                    const color = overdue ? '#ef4444' : dueSoon ? '#f59e0b' : '#64748b';
                    return (
                      <div key={t.id} className="flex-between" style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{t.title}</div>
                          <div style={{ fontSize: '12px', color }}>Due: {formatDate(t.dueDate)}</div>
                        </div>
                        <Badge {...getTaskStatusConfig(t.status)} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-pad border-bottom">
            <h2 className="card-title m-0">Recent Team Activity</h2>
          </div>
          <div className="card-pad">
            {activities.length === 0 ? (
              <div className="empty-state">No recent activity.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ color: '#94a3b8' }}><Activity size={16} /></div>
                    <div>
                      <div style={{ fontSize: '14px' }}>{act.action} - {act.entityType}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{formatRelative(act.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
export default Dashboard;
