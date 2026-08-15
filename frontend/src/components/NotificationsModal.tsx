import { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, Zap, TrendingUp, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'system' | 'vector' | 'market' | 'opportunity';
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Vector Calibration Complete',
    description: 'Your Digital Twin 216-D latent space embedding is calibrated with 95% vector accuracy.',
    time: '10m ago',
    type: 'vector',
    read: false,
  },
  {
    id: '2',
    title: 'Market CTC Baseline Calibrated',
    description: 'Live Indian tech CTC benchmarks updated for AI Systems & Distributed Engineering trajectories.',
    time: '2h ago',
    type: 'market',
    read: false,
  },
  {
    id: '3',
    title: 'Trajectory Opportunity Detected',
    description: "Adding 'Cloud Architecture' proficiency unlocks an estimated +14.2% salary trajectory gain.",
    time: '1d ago',
    type: 'opportunity',
    read: false,
  },
  {
    id: '4',
    title: 'Monte Carlo Sandbox Ready',
    description: 'What-If Simulation engine initialized for speculative skill mutation testing.',
    time: '2d ago',
    type: 'system',
    read: true,
  },
];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (unreadCount: number) => void;
}

export function NotificationsModal({ isOpen, onClose, onUnreadChange }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    onUnreadChange?.(unread);
  }, [notifications, onUnreadChange]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'vector':
        return <Zap size={14} color="var(--accent-primary)" />;
      case 'market':
        return <TrendingUp size={14} color="var(--success)" />;
      case 'opportunity':
        return <Sparkles size={14} color="var(--accent-purple)" />;
      default:
        return <ShieldCheck size={14} color="var(--text-secondary)" />;
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 8, 15, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '20px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          position: 'relative',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-surface)',
          border: 'var(--micro-border)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingRight: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Bell size={18} color="var(--accent-primary)" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                System Alerts & Notifications
              </h2>
              {unreadCount > 0 && (
                <span style={{
                  background: 'rgba(37, 99, 235, 0.15)',
                  color: 'var(--accent-primary)',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.6875rem',
                  fontWeight: 700
                }}>
                  {unreadCount} New
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>
              Live telemetry notifications from your Digital Twin and market econometrics.
            </p>
          </div>

          {/* Close (X) Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'var(--bg-elevated)',
              border: 'var(--micro-border)',
              borderRadius: 'var(--radius-sm)',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            aria-label="Close Modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Controls Bar */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: 'var(--micro-border)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              {notifications.length} Total Alerts
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.2rem 0.4rem'
                  }}
                >
                  <CheckCheck size={13} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={clearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.4rem'
                }}
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications Feed List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--text-secondary)' }}>All clear!</p>
              <p style={{ margin: 0, fontSize: '0.8125rem' }}>No pending twin alerts or market notifications.</p>
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '0.85rem 1rem',
                  background: item.read ? 'var(--bg-elevated)' : 'rgba(37, 99, 235, 0.06)',
                  borderRadius: 'var(--radius-md)',
                  border: item.read ? 'var(--micro-border)' : '1px solid rgba(37, 99, 235, 0.25)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ 
                  background: 'var(--bg-surface)', 
                  border: 'var(--micro-border)', 
                  padding: '0.4rem', 
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '0.1rem',
                  flexShrink: 0
                }}>
                  {getTypeIcon(item.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {item.time}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: 'var(--micro-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
