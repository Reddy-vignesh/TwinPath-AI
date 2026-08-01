import { useProfileStore } from '../../stores/profileStore';
import { Bell, Sparkles } from 'lucide-react';

export default function TopBar() {
  const { profile } = useProfileStore();

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
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
