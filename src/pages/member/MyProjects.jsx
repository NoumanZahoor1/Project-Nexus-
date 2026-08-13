import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function MyProjects() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await api.getProjects({ memberIds_like: user.id });
        setProjects(data || []);
      } catch (err) {
        showToast('Failed to load projects', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchProjects();
  }, [user, showToast]);

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">My Projects</h1>
      </div>

      <div className="filter-bar">
        <div className="filter-search" style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select 
          className="form-control filter-select" 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
      </div>

      {loading ? (
        <div className="flex-center" style={{ height: '200px' }}>
          <div className="spinner"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid-3">
          {filteredProjects.map(project => (
            <div 
              key={project.id} 
              className="card card-pad" 
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onClick={() => navigate(`/member/projects/${project.id}`)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div className="flex-between" style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>{project.name}</h3>
                <Badge variant={
                  project.status === 'completed' ? 'success' : 
                  project.status === 'in-progress' ? 'violet' : 
                  project.status === 'on-hold' ? 'warning' : 'neutral'
                }>
                  {project.status}
                </Badge>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px', height: '40px', overflow: 'hidden' }}>
                {project.description}
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <div className="flex-between" style={{ fontSize: '12px', marginBottom: '4px' }}>
                  <span>Progress</span>
                  <span style={{ fontWeight: '500' }}>{project.progress || 0}%</span>
                </div>
                <ProgressBar progress={project.progress || 0} variant={project.progress === 100 ? 'success' : 'primary'} />
              </div>
              
              <div className="flex-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Mock manager avatar, ideally fetched or populated */}
                  <Avatar name="Project Manager" size="sm" />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manager</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  <div>Due: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No projects found</h3>
          <p>You are not assigned to any projects matching the criteria.</p>
        </div>
      )}
    </AppLayout>
  );
}
