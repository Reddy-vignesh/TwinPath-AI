import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Target, 
  Briefcase, 
  Lightbulb, 
  LineChart,
  BrainCircuit,
  LogOut
} from 'lucide-react';

import { useAuthStore } from '../../stores/authStore';
import TopBar from './TopBar';

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
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
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none'
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
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <div style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
          <button 
            className="btn"
            style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}
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
