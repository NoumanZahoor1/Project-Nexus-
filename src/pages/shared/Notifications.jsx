import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, MessageSquare, Clock, AlertTriangle, UserPlus } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Badge from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelative } from '../../utils/helpers';

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markRead(notif.id);
    }
    if (notif.entityType === 'task' && notif.entityId) {
      navigate('/member/tasks');
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'task_assigned': return <UserPlus size={16} />;
      case 'status_updated': return <Check size={16} />;
      case 'comment_added': return <MessageSquare size={16} />;
      case 'deadline_approaching':
      case 'deadline': return <AlertTriangle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.type === filter;
  });

  return (
    <AppLayout>
      <div className="page-header flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Notifications</h1>
          {unreadCount > 0 && <Badge variant="primary">{unreadCount} Unread</Badge>}
        </div>
        <button 
          className="btn btn-secondary"
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          Mark All as Read
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'task_assigned', label: 'Task Assigned' },
            { id: 'status_updated', label: 'Status Updated' },
            { id: 'comment_added', label: 'Comments' },
            { id: 'deadline_approaching', label: 'Deadlines' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-ghost ${filter === tab.id ? 'active' : ''}`}
              style={{ 
                borderBottom: filter === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                borderRadius: 0,
                padding: '12px 20px',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '0' }}>
          {filteredNotifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredNotifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    cursor: 'pointer',
                    backgroundColor: notif.isRead ? 'transparent' : 'var(--bg-secondary)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div 
                    className="notification-icon-wrap" 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--primary-600)',
                      flexShrink: 0
                    }}
                  >
                    {getIconForType(notif.type)}
                  </div>
                  
                  <div className="notification-content" style={{ flex: 1 }}>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: notif.isRead ? '500' : '600' }}>
                        {notif.title}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {formatRelative(notif.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {notif.message}
                    </p>
                  </div>
                  
                  {!notif.isRead && (
                    <div 
                      className="notification-unread-dot"
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-600)',
                        marginTop: '6px'
                      }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <Bell size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
              <h3>No notifications</h3>
              <p>You're all caught up! No notifications to show.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

