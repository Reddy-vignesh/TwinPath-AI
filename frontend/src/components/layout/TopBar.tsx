import { useState } from 'react';
import { useProfileStore } from '../../stores/profileStore';
import { useThemeStore } from '../../stores/themeStore';
import { Bell, Sparkles, Sun, Moon, Info, PanelLeft } from 'lucide-react';
import { ProjectInfoModal } from '../ProjectInfoModal';
import { NotificationsModal } from '../NotificationsModal';

interface TopBarProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function TopBar({ isSidebarCollapsed = false, onToggleSidebar }: TopBarProps) {
  const { profile } = useProfileStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const completeness = profile?.twin_completeness_score || 0;
  const isComplete = completeness >= 0.8;

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="sidebar-toggle-btn"
            title={isSidebarCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
            aria-label="Toggle Sidebar Menu"
            style={{ marginRight: '0.25rem' }}
          >
            <PanelLeft size={18} color="var(--text-secondary)" />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            width: '7px', 
            height: '7px', 
            borderRadius: '50%', 
            background: 'var(--success)', 
            display: 'inline-block' 
          }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Twin Engine
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>/</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Vector Workspace
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* About Project Button (Linear-Grade Action) */}
        <button 
          onClick={() => setIsInfoModalOpen(true)}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
            borderRadius: 'var(--radius-md)',
            whiteSpace: 'nowrap'
          }}
        >
          <Info size={14} color="var(--text-secondary)" />
          <span>About Project</span>
        </button>

        {/* Theme Switcher */}
        <label className="theme-switch" title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
          <input 
            type="checkbox" 
            checked={theme === 'light'} 
            onChange={toggleTheme} 
          />
          <span className="theme-slider">
            <span className="theme-slider-knob">
              {theme === 'light' ? <Sun size={12} color="#0284c7" /> : <Moon size={12} color="#3B82F6" />}
            </span>
          </span>
        </label>

        {/* Completeness Badge (Crisp Data Pill) */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            background: isComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${isComplete ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
          }}
        >
          <Sparkles size={13} color={isComplete ? 'var(--success)' : 'var(--warning)'} />
          <span style={{ fontSize: '0.78125rem', fontWeight: 600, color: isComplete ? 'var(--success)' : 'var(--warning)' }}>
            Fidelity {Math.round(completeness * 100)}%
          </span>
        </div>

        {/* Interactive Notifications Button */}
        <button 
          onClick={() => setIsNotificationsOpen(true)}
          className="btn btn-secondary" 
          style={{ 
            padding: '0.4rem', 
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            cursor: 'pointer'
          }}
          aria-label="Notifications"
          title="View System Alerts & Notifications"
        >
          <Bell size={15} color="var(--text-secondary)" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              boxShadow: '0 0 6px var(--accent-primary)'
            }} />
          )}
        </button>

        {/* Modals */}
        <ProjectInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        <NotificationsModal 
          isOpen={isNotificationsOpen} 
          onClose={() => setIsNotificationsOpen(false)} 
          onUnreadChange={setUnreadCount} 
        />
      </div>
    </header>
  );
}
