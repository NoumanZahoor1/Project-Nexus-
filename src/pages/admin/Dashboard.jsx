import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Users, FolderKanban, ClipboardList, CheckCircle, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { getProjects, getTasks, getUsers, getActivityByProject } from '../../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import Sparkline from '../../components/common/Sparkline';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, getStatusConfig, formatRelative } from '../../utils/helpers';
import useAnimatedCounter from '../../hooks/useAnimatedCounter';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import api from '../../api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  useDocumentTitle('Admin Dashboard');

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
        <div className="grid-2" style={{ marginTop: '24px' }}>
          {[1,2].map(i => <div key={i} className="card card-pad skeleton" style={{ height: '340px' }}></div>)}
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

  const doughnutData = {
    labels: ['To Do', 'In Progress', 'In Review', 'Completed'],
    datasets: [{
      data: [taskStats.todo, taskStats.inProgress, taskStats.review, taskStats.completed],
      backgroundColor: ['#94a3b8', '#6366f1', '#f59e0b', '#22c55e'],
      borderWidth: 0,
      borderRadius: 4,
    }]
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12, family: 'Inter' },
        }
      }
    }
  };

  // Bar chart: tasks per project (top 5 projects)
  const topProjects = [...projects].slice(0, 6);
  const barData = {
    labels: topProjects.map(p => p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name),
    datasets: [
      {
        label: 'Completed',
        data: topProjects.map(p => tasks.filter(t => t.projectId === p.id && t.status === 'completed').length),
        backgroundColor: '#22c55e',
        borderRadius: 4,
      },
      {
        label: 'In Progress',
        data: topProjects.map(p => tasks.filter(t => t.projectId === p.id && t.status === 'in-progress').length),
        backgroundColor: '#6366f1',
        borderRadius: 4,
      },
      {
        label: 'To Do',
        data: topProjects.map(p => tasks.filter(t => t.projectId === p.id && (t.status === 'todo' || t.status === 'review')).length),
        backgroundColor: '#94a3b8',
        borderRadius: 4,
      },
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12, family: 'Inter' },
        }
      },
      title: { display: false },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { stepSize: 1, font: { size: 11 } },
      }
    }
  };

  const recentProjects = [...projects].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System overview as of {formatDate(new Date())}</p>
        </div>
      </div>

      {/* Stat Cards with animated counters & sparklines */}
      <div className="grid-4" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <StatCard
          icon={<Users size={24} />}
          iconBg="#e0e7ff"
          iconColor="#4f46e5"
          value={users.length}
          label="Total Users"
          trend="+3 this month"
          trendUp
          sparkData={[2, 3, 4, 3, 5, 6, 7]}
          sparkColor="#4f46e5"
        />
        <StatCard
          icon={<FolderKanban size={24} />}
          iconBg="#ede9fe"
          iconColor="#7c3aed"
          value={activeProjects.length}
          label="Active Projects"
          trend={`${completedProjects.length} completed`}
          trendUp
          sparkData={[1, 2, 1, 3, 2, 4, 3]}
          sparkColor="#7c3aed"
        />
        <StatCard
          icon={<ClipboardList size={24} />}
          iconBg="#fef3c7"
          iconColor="#d97706"
          value={tasks.length}
          label="Total Tasks"
          trend={`${taskStats.completed} done`}
          trendUp
          sparkData={[3, 5, 4, 6, 7, 5, 8]}
          sparkColor="#d97706"
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          iconBg="#dcfce7"
          iconColor="#16a34a"
          value={taskStats.completed}
          label="Tasks Completed"
          trend={tasks.length > 0 ? `${Math.round((taskStats.completed / tasks.length) * 100)}% rate` : '0%'}
          trendUp={taskStats.completed > 0}
          sparkData={[1, 2, 3, 2, 4, 5, 6]}
          sparkColor="#16a34a"
        />
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card card-pad animate-in">
          <h2 className="card-title" style={{ marginBottom: '4px' }}>Tasks by Project</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>Stacked breakdown across top projects</p>
          <div style={{ height: '280px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
        
        <div className="card card-pad animate-in">
          <h2 className="card-title" style={{ marginBottom: '4px' }}>Task Distribution</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>Current status breakdown</p>
          <div style={{ height: '280px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        <div className="card card-pad animate-in">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Recent Projects</h2>
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
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {recentProjects.length === 0 && (
                  <tr>
                    <td colSpan="4"><EmptyState type="projects" /></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card card-pad animate-in">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>System Activity</h2>
          {activities.length > 0 ? (
            <div className="timeline">
              {activities.map((act, idx) => (
                <div key={act.id} className="timeline-item">
                  <div className="timeline-line-wrap">
                    <div className="timeline-dot" />
                    {idx < activities.length - 1 && <div className="timeline-connector" />}
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-text">
                      {act.action} by <strong>{act.userName}</strong>
                    </p>
                    <p className="timeline-time">{formatRelative(act.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState type="notifications" title="No recent activity" description="System activity will appear here." />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

/** Stat Card with animated counter & sparkline */
function StatCard({ icon, iconBg, iconColor, value, label, trend, trendUp, sparkData, sparkColor }) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <div className="card stat-card animate-in">
      <div className="stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-info">
        <div className="stat-value">{animatedValue}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </div>
        )}
      </div>
      {sparkData && <Sparkline data={sparkData} color={sparkColor} height={28} width={64} />}
    </div>
  );
}
