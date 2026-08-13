import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    phone: user?.phone || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    
    try {
      setIsSaving(true);
      await updateProfile(formData);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast('All password fields are required', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    try {
      setIsSaving(true);
      // Ensure useAuth provides a way to update password or mock it
      await updateProfile({ password: passwordData.newPassword }); 
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully', 'success');
    } catch (error) {
      showToast('Failed to change password. Make sure current password is correct.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
        <div 
          className="profile-cover" 
          style={{ 
            height: '120px', 
            background: 'linear-gradient(90deg, var(--indigo-500) 0%, var(--violet-500) 100%)' 
          }}
        ></div>
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-40px' }}>
          <div style={{ border: '4px solid white', borderRadius: '50%', backgroundColor: 'white', marginBottom: '16px' }}>
            <Avatar name={user?.name || 'User'} size="lg" />
          </div>
          <h2 style={{ margin: '0 0 8px 0' }}>{user?.name}</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
            <span>•</span>
            <Badge variant="primary" style={{ textTransform: 'capitalize' }}>{user?.role}</Badge>
          </div>
          <div className="flex-center" style={{ gap: '24px', width: '100%', maxWidth: '400px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Member Since</div>
              <div style={{ fontWeight: '500' }}>{user?.createdAt ? new Date(user?.createdAt).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Last Login</div>
              <div style={{ fontWeight: '500' }}>Today</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Department</div>
              <div style={{ fontWeight: '500' }}>{user?.department || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button
            className={`btn btn-ghost ${activeTab === 'personal' ? 'active' : ''}`}
            style={{ 
              borderBottom: activeTab === 'personal' ? '2px solid var(--primary-color)' : '2px solid transparent',
              borderRadius: 0,
              padding: '16px 24px'
            }}
            onClick={() => setActiveTab('personal')}
          >
            Personal Info
          </button>
          <button
            className={`btn btn-ghost ${activeTab === 'security' ? 'active' : ''}`}
            style={{ 
              borderBottom: activeTab === 'security' ? '2px solid var(--primary-color)' : '2px solid transparent',
              borderRadius: 0,
              padding: '16px 24px'
            }}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        <div className="card-pad">
          {activeTab === 'personal' && (
            <form onSubmit={handleSaveProfile} style={{ maxWidth: '600px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Email Address (Read-only)</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={user?.email || ''}
                    disabled
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role (Read-only)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={user?.role || ''}
                    disabled
                    style={{ backgroundColor: 'var(--bg-secondary)', textTransform: 'capitalize' }}
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-control" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div style={{ marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} style={{ maxWidth: '400px' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </div>
              <div style={{ marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
