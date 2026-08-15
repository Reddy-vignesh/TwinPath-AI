// AppShell layout wrapper with PageLoader transition support
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
import PageLoader from '../PageLoader';

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

  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const prevPathRef = React.useRef(location.pathname);

  React.useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setIsPageTransitioning(true);
      const timer = setTimeout(() => {
        setIsPageTransitioning(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Page Transition Star Loader */}
      {isPageTransitioning && <PageLoader text="Syncing Digital Twin..." />}

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Linear-Grade Clean Sidebar */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div style={{ padding: '0.25rem 0.5rem 1.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.875rem'
          }}>
            T
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              TwinPath AI
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
              Decision Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.path}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: '-0.01em',
                  border: '1px solid transparent',
                  width: '100%',
                  gap: '0.65rem'
                }}
                onClick={() => navigate(item.path)}
              >
                <Icon size={16} color={isActive ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: 'var(--micro-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary"
            style={{ 
              width: '100%', 
              fontSize: '0.8125rem',
              padding: '0.45rem 0.75rem',
              justifyContent: 'flex-start',
              gap: '0.5rem'
            }}
            onClick={() => setIsFeedbackOpen(true)}
          >
            <MessageSquarePlus size={15} color="var(--text-secondary)" />
            <span>Feedback & Support</span>
          </button>

          {/* User Account Tile */}
          <div style={{ 
            padding: '0.5rem 0.65rem',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: 'var(--micro-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.6875rem',
                color: '#FFFFFF'
              }}>
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'User'}
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '0.2rem'
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
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
