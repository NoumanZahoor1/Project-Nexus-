import React, { useState, useEffect } from 'react';
import { Briefcase, CheckSquare, Clock, AlertCircle, Activity, ArrowUpRight } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProjectsByManager, getTasks, getActivityByProject } from '../../api';
import { isDueSoon, isOverdue, formatRelative, calcProjectProgress, getStatusConfig, formatDate, getTaskStatusConfig } from '../../utils/helpers';
import ProgressBar from '../../components/common/ProgressBar';
import Badge from '../../components/common/Badge';
import Sparkline from '../../components/common/Sparkline';
import EmptyState from '../../components/common/EmptyState';
import useAnimatedCounter from '../../hooks/useAnimatedCounter';
import useGreeting from '../../hooks/useGreeting';
import useDocumentTitle from '../../hooks/useDocumentTitle';

function AnimatedStatValue({ value }) {
  const animatedValue = useAnimatedCounter(value, 1000);
  return <span>{animatedValue}</span>;
}

const Dashboard = () => {
  useDocumentTitle('Manager Dashboard');
  const greeting = useGreeting();
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
          <div className="skeleton-line" style={{ height: '32px', width: '250px', marginBottom: '8px' }}></div>
          <div className="skeleton-line" style={{ height: '18px', width: '180px', marginBottom: '24px' }}></div>
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-card" style={{ height: '110px' }}></div>
            ))}
          </div>
          <div className="grid-2">
            <div className="skeleton-card" style={{ height: '300px' }}></div>
            <div className="skeleton-card" style={{ height: '300px' }}></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="app-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">{greeting}, {user?.name}!</h1>
            <p className="page-subtitle">{formatDate(new Date().toISOString())} • Manager Overview</p>
          </div>
        </div>

        <div className="grid-4 staggered-fade" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
              <Briefcase size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value"><AnimatedStatValue value={projects.length} /></div>
              <div className="stat-label">Assigned Projects</div>
            </div>
            <Sparkline data={[2, 3, 4, 3, 5, 4, projects.length]} color="#3b82f6" />
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value"><AnimatedStatValue value={activeTasks.length} /></div>
              <div className="stat-label">Active Tasks</div>
            </div>
            <Sparkline data={[5, 8, 6, 9, 7, 10, activeTasks.length]} color="#f59e0b" />
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
              <AlertCircle size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value"><AnimatedStatValue value={dueSoonTasks.length} /></div>
              <div className="stat-label">Tasks Due Soon</div>
            </div>
            <Sparkline data={[1, 2, 1, 3, 2, dueSoonTasks.length]} color="#ef4444" />
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}>
              <CheckSquare size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value"><AnimatedStatValue value={completedTasks.length} /></div>
              <div className="stat-label">Completed Tasks</div>
            </div>
            <Sparkline data={[10, 12, 15, 14, 18, completedTasks.length]} color="#22c55e" />
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-pad border-bottom flex-between">
              <h2 className="card-title m-0">My Projects</h2>
              <span className="badge badge-neutral">{projects.length} Total</span>
            </div>
            <div className="card-pad">
              {projects.length === 0 ? (
                <EmptyState icon="FolderKanban" title="No assigned projects" description="You currently don't have any projects assigned to manage." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {projects.map(p => {
                    const pTasks = tasks.filter(t => t.projectId === p.id);
                    const progress = calcProjectProgress(pTasks);
                    return (
                      <div key={p.id} className="flex-between card-interactive" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ flex: 1 }}>
                          <div className="flex-between" style={{ marginBottom: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '15px' }}>{p.name}</span>
                            <Badge {...getStatusConfig(p.status)} />
                          </div>
                          <div className="flex-between" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            <span>Progress</span>
                            <span>{progress}% ({pTasks.filter(t => t.status === 'completed').length}/{pTasks.length} tasks)</span>
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
            <div className="card-pad border-bottom flex-between">
              <h2 className="card-title m-0">Upcoming Deadlines</h2>
              <span className="badge badge-warning">{dueSoonTasks.length} Urgent</span>
            </div>
            <div className="card-pad">
              {activeTasks.length === 0 ? (
                <EmptyState icon="ClipboardList" title="No upcoming deadlines" description="All clear! There are no pending tasks due soon." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[...activeTasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5).map(t => {
                    const overdue = isOverdue(t.dueDate);
                    const dueSoon = isDueSoon(t.dueDate);
                    const color = overdue ? 'var(--danger-500)' : dueSoon ? 'var(--warning-500)' : 'var(--text-secondary)';
                    return (
                      <div key={t.id} className="flex-between card-interactive" style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: '4px' }}>{t.title}</div>
                          <div style={{ fontSize: '12px', color, fontWeight: overdue || dueSoon ? '600' : 'normal' }}>
                            Due: {formatDate(t.dueDate)} {overdue ? '(Overdue)' : ''}
                          </div>
                        </div>
                        <Badge {...getTaskStatusConfig(t.status)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-pad border-bottom flex-between">
            <h2 className="card-title m-0">Recent Team Activity</h2>
            <span className="badge badge-neutral">Live Feed</span>
          </div>
          <div className="card-pad">
            {activities.length === 0 ? (
              <EmptyState icon="Bell" title="No activity recorded" description="Team actions will appear here in real time." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activities.map(act => (
                  <div key={act.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-50)',
                      color: 'var(--primary-600)',
                      display: 'flex'
                    }}>
                      <Activity size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>{act.action} - <span style={{ color: 'var(--primary-600)' }}>{act.entityType}</span></div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{formatRelative(act.createdAt)}</div>
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
