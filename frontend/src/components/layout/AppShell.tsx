import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Target, 
  Briefcase, 
  Lightbulb, 
  LineChart,
  BrainCircuit,
  MessageSquarePlus,
  LogOut
} from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import TopBar from './TopBar';
import FeedbackModal from '../FeedbackModal';

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Twin Profile', path: '/profile', icon: User },
  { label: 'Career Explorer', path: '/careers', icon: Briefcase },
  { label: 'Recommendations', path: '/recommendations', icon: Target },
  { label: 'AI Vector Analysis', path: '/twin', icon: BrainCircuit },
  { label: 'What-If Simulator', path: '/simulation', icon: Lightbulb },
  { label: 'Salary Predictions', path: '/salary', icon: LineChart },
];


export default function AppShell({ children }: AppShellProps) {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: 'var(--spacing-md) 0', marginBottom: 'var(--spacing-xl)' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>⚡</span>
            TwinPath AI
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                  borderTop: '1px solid transparent',
                  borderRight: '1px solid transparent',
                  borderBottom: '1px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 12px var(--shadow-glow)' : 'none'
                }}
                onClick={() => navigate(item.path)}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 'var(--spacing-lg)', borderTop: 'var(--glass-border)' }}>
          <button 
            className="btn"
            style={{ 
              width: '100%', 
              marginBottom: 'var(--spacing-md)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: 'var(--accent-purple)',
              fontWeight: 600
            }}
            onClick={() => setIsFeedbackOpen(true)}
          >
            <MessageSquarePlus size={18} color="var(--accent-purple)" />
            Feedback & Support
          </button>

          <div style={{ marginBottom: 'var(--spacing-md)', padding: '0.25rem 0.5rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'User Profile'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || ''}
            </div>
          </div>
          <button 
            className="btn"
            style={{ 
              width: '100%', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error)',
              fontWeight: 600
            }}
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <TopBar />
        <div className="content-area animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
