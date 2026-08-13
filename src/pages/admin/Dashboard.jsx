import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Users, FolderKanban, ClipboardList, CheckCircle } from 'lucide-react';
import { getProjects, getTasks, getUsers, getActivityByProject } from '../../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import { formatDate, getStatusConfig, formatRelative } from '../../utils/helpers';
import api from '../../api';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [data, setData] = useState({
    projects: [],
    tasks: [],
    users: [],
    activities: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projRes, taskRes, userRes, actRes] = await Promise.all([
          getProjects(),
          getTasks(),
          getUsers(),
          api.get('/activityLogs?_sort=createdAt&_order=desc&_limit=10') // Used api directly to fetch all logs instead of by project
        ]);
        
        setData({
          projects: projRes.data,
          tasks: taskRes.data,
          users: userRes.data,
          activities: actRes.data,
        });
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="page-header">
          <div>
            <h1 className="page-title skeleton" style={{ width: '200px', height: '32px' }}></h1>
          </div>
        </div>
        <div className="grid-4" style={{ marginTop: '24px' }}>
          {[1,2,3,4].map(i => <div key={i} className="card card-pad skeleton" style={{ height: '100px' }}></div>)}
        </div>
      </AppLayout>
    );
  }

  const { projects, tasks, users, activities } = data;
  
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
  const completedProjects = projects.filter(p => p.status === 'completed');
  
  const taskStats = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const chartData = {
    labels: ['To Do', 'In Progress', 'In Review', 'Completed'],
    datasets: [{
      data: [taskStats.todo, taskStats.inProgress, taskStats.review, taskStats.completed],
      backgroundColor: ['#94a3b8', '#3b82f6', '#f59e0b', '#22c55e'],
      borderWidth: 0,
    }]
  };

  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Overview of system activity as of {formatDate(new Date())}</p>
        </div>
      </div>

      <div className="grid-4" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
            <FolderKanban size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{activeProjects.length}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <ClipboardList size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{completedProjects.length}</div>
            <div className="stat-label">Completed Projects</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card card-pad">
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Recent Projects</h2>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map(proj => {
                  const manager = users.find(u => u.id === proj.managerId);
                  const statusConf = getStatusConfig(proj.status);
                  const projTasks = tasks.filter(t => t.projectId === proj.id);
                  const completedTasks = projTasks.filter(t => t.status === 'completed').length;
                  const progress = projTasks.length ? Math.round((completedTasks / projTasks.length) * 100) : 0;
                  
                  return (
                    <tr key={proj.id}>
                      <td style={{ fontWeight: 500 }}>{proj.name}</td>
                      <td>{manager ? manager.name : 'Unassigned'}</td>
                      <td>
                        <Badge variant={statusConf.className.replace('badge-', '')}>{statusConf.label}</Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ProgressBar progress={progress} color={statusConf.dotColor} />
                          <span style={{ fontSize: '12px' }}>{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {recentProjects.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-state">No recent projects</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card card-pad">
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Task Overview</h2>
          <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>System Activity</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activities.length > 0 ? activities.map(act => (
            <div key={act.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4f46e5', marginTop: '6px' }} />
              <div>
                <p style={{ margin: 0 }}>{act.action} by <span style={{ fontWeight: 500 }}>{act.userName}</span></p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{formatRelative(act.createdAt)}</p>
              </div>
            </div>
          )) : (
            <div className="empty-state">No recent activity</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
