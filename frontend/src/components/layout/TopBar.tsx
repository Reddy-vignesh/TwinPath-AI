import { useProfileStore } from '../../stores/profileStore';
import { useThemeStore } from '../../stores/themeStore';
import { Bell, Sparkles, Sun, Moon } from 'lucide-react';

export default function TopBar() {
  const { profile } = useProfileStore();
  const { theme, toggleTheme } = useThemeStore();

  const completeness = profile?.twin_completeness_score || 0;
  const isComplete = completeness >= 0.8;

  return (
    <header className="topbar">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: 'var(--accent-blue)', 
            boxShadow: '0 0 10px var(--accent-blue)',
            display: 'inline-block' 
          }} />
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Digital Twin Portal</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
          Real-time Career Vectors & Market Predictions Active
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        {/* Theme Switcher Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: theme === 'light' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(6, 182, 212, 0.12)',
            border: theme === 'light' ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid rgba(6, 182, 212, 0.4)',
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 12px var(--shadow-glow)'
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <>
              <Moon size={15} color="#0284C7" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={15} color="#06B6D4" />
              <span>Light Mode</span>
            </>
          )}
        </button>

        {/* Completeness Badge */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: isComplete ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${isComplete ? 'var(--success)' : 'var(--warning)'}`
          }}
        >
          <Sparkles size={16} color={isComplete ? 'var(--success)' : 'var(--warning)'} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isComplete ? 'var(--success)' : 'var(--warning)' }}>
            Twin Completeness: {Math.round(completeness * 100)}%
          </span>
        </div>

        <button className="btn" style={{ background: 'transparent', padding: '0.5rem' }}>
          <Bell size={20} color="var(--text-secondary)" />
        </button>
      </div>
    </header>
  );
}
