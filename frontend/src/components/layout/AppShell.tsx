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
  LogOut,
  PanelLeftClose,
  ShieldCheck
} from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import TopBar from './TopBar';
import FeedbackModal from '../FeedbackModal';
import { LegalModal } from '../LegalModal';
import PageLoader from '../PageLoader';
import mainBg from '../../assets/main-bg.jpg';

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
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  // Persistent sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('twinpath_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('twinpath_sidebar_collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

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
    <div 
      className="app-layout"
      style={{
        backgroundImage: `url(${mainBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#061118'
      }}
    >
      {/* Page Transition Star Loader */}
      {isPageTransitioning && <PageLoader text="Syncing Digital Twin..." />}

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Legal & Compliance Modal */}
      <LegalModal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />

      {/* Linear-Grade Collapsible Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div style={{ 
          padding: isSidebarCollapsed ? '0.25rem 0 1.25rem 0' : '0.25rem 0.25rem 1.25rem 0.25rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          gap: '0.5rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <button
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Expand Navigation Menu" : "TwinPath AI Dashboard"}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.9rem',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
              }}
            >
              T
            </button>
            {!isSidebarCollapsed && (
              <div className="sidebar-label" style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  TwinPath AI
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
                  Decision Intelligence
                </div>
              </div>
            )}
          </div>

          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-btn"
              title="Collapse Navigation Menu"
              aria-label="Collapse Navigation Menu"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                title={item.label}
                onClick={() => navigate(item.path)}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!isSidebarCollapsed && (
                  <span className="sidebar-label" style={{ fontSize: '0.8125rem' }}>{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: 'var(--micro-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            className="sidebar-nav-btn btn btn-secondary"
            title="Feedback & Support"
            style={{ 
              width: '100%', 
              fontSize: '0.8125rem',
              padding: isSidebarCollapsed ? '0.55rem 0' : '0.45rem 0.75rem',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: isSidebarCollapsed ? '0' : '0.5rem'
            }}
            onClick={() => setIsFeedbackOpen(true)}
          >
            <MessageSquarePlus size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            {!isSidebarCollapsed && <span className="sidebar-label">Feedback & Support</span>}
          </button>

          <button 
            className="sidebar-nav-btn btn btn-secondary"
            title="Privacy & Compliance"
            style={{ 
              width: '100%', 
              fontSize: '0.8125rem',
              padding: isSidebarCollapsed ? '0.55rem 0' : '0.45rem 0.75rem',
              justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
              gap: isSidebarCollapsed ? '0' : '0.5rem'
            }}
            onClick={() => setIsLegalOpen(true)}
          >
            <ShieldCheck size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
            {!isSidebarCollapsed && <span className="sidebar-label">Privacy & Legal</span>}
          </button>

          {/* User Account Tile */}
          <div style={{ 
            padding: isSidebarCollapsed ? '0.4rem 0.2rem' : '0.5rem 0.65rem',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)',
            border: 'var(--micro-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
            gap: '0.5rem'
          }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}
              title={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'User'}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.6875rem',
                color: '#FFFFFF',
                flexShrink: 0
              }}>
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
              {!isSidebarCollapsed && (
                <div className="sidebar-label" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'User'}
                  </div>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
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
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <TopBar isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} />
        <div className="content-area animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
