import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getProjectsByManager, getUsers, getTasks } from '../../api';
import { getStatusConfig, getPriorityConfig, calcProjectProgress } from '../../utils/helpers';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';

const Projects = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          getProjectsByManager(user.id),
          getTasks()
        ]);
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        showToast('Failed to load projects', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user, showToast]);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    const matchesPriority = priorityFilter ? p.priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
          <h1 className="page-title">My Projects</h1>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="filter-search form-control"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="filter-select form-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="grid-auto">
          {filteredProjects.length === 0 ? (
            <div className="empty-state">No projects found.</div>
          ) : (
            filteredProjects.map(p => {
              const pTasks = tasks.filter(t => t.projectId === p.id);
              const progress = calcProjectProgress(pTasks);
              return (
                <div key={p.id} className="card">
                  <div className="card-pad">
                    <div className="flex-between" style={{ marginBottom: '16px' }}>
                      <h3 style={{ margin: 0 }}>{p.name}</h3>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px', minHeight: '40px' }}>
                      {p.description?.substring(0, 80) || 'No description'}
                    </p>
                    <div className="flex-between" style={{ marginBottom: '16px' }}>
                      <Badge {...getStatusConfig(p.status)} />
                      <Badge {...getPriorityConfig(p.priority)} />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div className="flex-between" style={{ fontSize: '12px', marginBottom: '4px', color: '#64748b' }}>
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <ProgressBar progress={progress} color={getStatusConfig(p.status).dotColor} />
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => navigate(`/manager/projects/${p.id}/workspace`)}
                    >
                      Open Workspace
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Projects;
