import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../stores/profileStore';
import { useTwinStore } from '../stores/twinStore';
import { ArrowRight, Activity, Zap } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, fetchProfile } = useProfileStore();
  const { recommendations, fetchRecommendations, isLoadingRecs } = useTwinStore();

  useEffect(() => {
    fetchProfile();
    // Only fetch recommendations if not already loaded (fix B10: no unnecessary re-fetches)
    if (recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [fetchProfile, fetchRecommendations, recommendations.length]);


  const completeness = profile?.twin_completeness_score || 0;
  const topMatch = recommendations[0];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      
      {/* Welcome Banner */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <h2>Dashboard Overview</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Your digital twin is currently tracking <b>{profile?.total_skills_count || 0} skills</b> and <b>{profile?.total_projects_count || 0} projects</b>.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-lg">
        {/* Completeness Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
            <Activity color="var(--accent-blue)" />
            <h3 style={{ margin: 0 }}>Twin Fidelity</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
            <div style={{
              position: 'relative',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(var(--accent-blue) ${completeness * 360}deg, var(--bg-elevated) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{Math.round(completeness * 100)}%</span>
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                {completeness >= 0.8 ? "Excellent! Your twin is highly accurate." : "Add more skills and projects to improve your twin's accuracy."}
              </p>
              <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
                Update Profile
              </button>
            </div>
          </div>
        </div>

        {/* Top Recommendation Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
            <Zap color="var(--accent-purple)" />
            <h3 style={{ margin: 0 }}>Top Career Match</h3>
          </div>
          
          {isLoadingRecs ? (
            <div style={{ color: 'var(--text-muted)' }}>Analyzing vector space...</div>
          ) : topMatch ? (
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                {topMatch.career?.title || 'Unknown Career'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                  {Math.round((topMatch.similarity_score || 0) * 100)}% Match
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Confidence: {(topMatch.explanation?.confidence_level || 'medium').toUpperCase()}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-lg)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {topMatch.career?.description}
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/recommendations')}>
                View Full Analysis <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>
              No recommendations available yet. Update your profile to generate matches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
