import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTwinStore, type Recommendation } from '../stores/twinStore';
import { useProfileStore } from '../stores/profileStore';
import { 
  Target, 
  TrendingUp, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  Compass,
  AlertCircle
} from 'lucide-react';

function confidenceBadge(level: string | undefined) {
  const c = (level || 'medium').toLowerCase();
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    high: { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: 'rgba(16, 185, 129, 0.25)' },
    medium: { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: 'rgba(245, 158, 11, 0.25)' },
    low: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: 'rgba(239, 68, 68, 0.25)' },
  };
  return colors[c] ?? colors.medium;
}

function SkillGapBar({ label, current, required }: { label: string; current: number; required: number }) {
  const safeReq = Math.max(required || 1, 1);
  const safeCur = Math.max(current || 0, 0);
  const fill = Math.min(safeCur / safeReq, 1);
  const isMet = safeCur >= safeReq;

  return (
    <div style={{ background: 'var(--bg-elevated)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: 'var(--micro-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}>
        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ color: isMet ? 'var(--success)' : 'var(--warning)' }}>
          Lvl {safeCur} / {safeReq} {isMet ? '✓' : '↑'}
        </span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{
          width: `${fill * 100}%`, 
          height: '100%', 
          borderRadius: 'var(--radius-full)',
          background: isMet ? 'var(--success)' : 'var(--accent-primary)',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function RecommendationCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(rank === 1);
  const { bg: confidenceBg, color: confidenceColor, border: confidenceBorder } = confidenceBadge(rec.explanation?.confidence_level);
  const matchPct = Math.round((rec.similarity_score ?? 0) * 100);

  // Safe extraction of arrays to prevent object rendering crashes in React
  const gaps = rec.skill_gap?.gaps ?? [];
  const rawStrengths = rec.skill_gap?.strengths ?? [];
  const strengths: string[] = rawStrengths.map(s => {
    if (typeof s === 'string') return s;
    if (typeof s === 'object' && s !== null) return s.skill || s.name || JSON.stringify(s);
    return String(s);
  }).filter(Boolean);

  const topReasons: string[] = (rec.explanation?.top_reasons ?? []).map(r => String(r)).filter(Boolean);
  const suggestions: string[] = (rec.explanation?.suggestions_to_improve ?? []).map(s => String(s)).filter(Boolean);

  const careerTitle = rec.career?.title || 'Career Trajectory Path';
  const category = rec.career?.category ? rec.career.category.replace(/_/g, ' ') : 'Technology';

  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem', position: 'relative' }}>
      
      {/* Top Summary Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        
        {/* Left Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
          {/* Rank Badge */}
          <div style={{
            width: '36px', 
            height: '36px', 
            borderRadius: 'var(--radius-md)', 
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 700, 
            fontSize: '0.9375rem',
            background: rank === 1 ? 'var(--accent-primary)' : 'var(--bg-elevated)',
            color: '#FFFFFF',
            border: rank === 1 ? '1px solid rgba(255, 255, 255, 0.2)' : 'var(--micro-border)',
            flexShrink: 0
          }}>
            #{rank}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {careerTitle}
              </h3>
              
              {/* Match Badge */}
              <span style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: 'var(--success)', 
                padding: '0.15rem 0.55rem', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '0.75rem', 
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                {matchPct}% Match
              </span>

              {/* Confidence Badge */}
              <span style={{ 
                background: confidenceBg, 
                color: confidenceColor, 
                border: `1px solid ${confidenceBorder}`,
                padding: '0.15rem 0.55rem', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '0.6875rem', 
                fontWeight: 600, 
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {rec.explanation?.confidence_level ?? 'medium'} confidence
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0, textTransform: 'capitalize' }}>
              {category}
            </p>
          </div>
        </div>

        {/* Right Salary & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {rec.career?.median_salary_usd ? (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{(rec.career.median_salary_usd / 10000).toFixed(1)} LPA
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {rec.career.market_demand || 'High'} Demand
              </div>
            </div>
          ) : null}

          <button
            onClick={() => setExpanded(e => !e)}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', gap: '0.35rem' }}
          >
            <span>{expanded ? 'Hide Analysis' : 'Vector Breakdown'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

      </div>

      {/* Cosine Match Progress Bar */}
      <div style={{ marginTop: '1rem' }}>
        <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{
            width: `${matchPct}%`, 
            height: '100%', 
            borderRadius: 'var(--radius-full)',
            background: matchPct >= 70 ? 'var(--success)' : matchPct >= 40 ? 'var(--accent-primary)' : 'var(--warning)',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Expanded Breakdown */}
      {expanded && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: 'var(--micro-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {rec.career?.description && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.875rem', margin: 0 }}>
              {rec.career.description}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            
            {/* Why Recommended */}
            {topReasons.length > 0 && (
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'var(--micro-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>
                  <CheckCircle2 size={14} color="var(--success)" />
                  <span>Why Recommended</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {topReasons.map((r, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--success)' }}>✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'var(--micro-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>
                  <Zap size={14} color="var(--accent-blue)" />
                  <span>Profile Strengths Overlap</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {strengths.map((s, i) => (
                    <span key={i} style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 500 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Skill Gaps */}
          {gaps.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                <AlertTriangle size={14} color="var(--warning)" />
                <span>Skill Gaps to Close</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.65rem' }}>
                {gaps.slice(0, 6).map((g, i) => {
                  const label = g.skill || g.name || 'Required Skill';
                  const required = g.required_level || g.preferred_level || 5;
                  const current = g.current_level ?? 0;
                  return (
                    <SkillGapBar key={i} label={label} current={current} required={required} />
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'var(--micro-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>
                <TrendingUp size={14} color="var(--accent-primary)" />
                <span>Actionable Trajectory Optimization</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {suggestions.map((s, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '0.75rem', borderTop: 'var(--micro-border)' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/careers')}
              style={{ fontSize: '0.8125rem', gap: '0.4rem' }}
            >
              <Compass size={14} />
              <span>Explore Career Profile</span>
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/simulation')}
              style={{ fontSize: '0.8125rem', gap: '0.4rem' }}
            >
              <TrendingUp size={14} />
              <span>Simulate What-If Path</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const { recommendations, fetchRecommendations, isLoadingRecs, recsError } = useTwinStore();
  const { profile, skills, fetchProfile, fetchSkills } = useProfileStore();

  useEffect(() => {
    fetchProfile();
    fetchSkills();
    fetchRecommendations();
  }, [fetchProfile, fetchSkills, fetchRecommendations]);

  const totalSkills = profile?.total_skills_count ?? skills.length;
  const hasData = totalSkills > 0 || Boolean(profile?.github_url || profile?.current_major || profile?.career_goal_primary);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: 'var(--micro-border)', paddingBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Career Trajectory Recommendations
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            216-dimensional vector embedding matches ranked by cosine similarity and skill coverage.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => fetchRecommendations()}
          disabled={isLoadingRecs}
          style={{ fontSize: '0.8125rem', gap: '0.45rem' }}
        >
          {isLoadingRecs ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span>Recalculate Vectors</span>
        </button>
      </div>

      {/* Error state */}
      {recsError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertCircle size={18} color="var(--error)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--error)' }}>{recsError}</span>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={() => fetchRecommendations()}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Loading / Empty / List */}
      {isLoadingRecs ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 0', color: 'var(--text-muted)', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
          <span style={{ fontSize: '0.875rem' }}>Analyzing vector cosine distances in embedding space...</span>
        </div>
      ) : recommendations.length === 0 && !hasData ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Target size={44} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>No Profile Vectors Established</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Your digital twin needs skill and project attributes to calculate vector similarity distances.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            <span>Configure Twin Profile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Target size={44} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Generating Trajectories...</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Click recalculate to match your profile attributes against our 216-D career embeddings.
          </p>
          <button className="btn btn-primary" onClick={() => fetchRecommendations()}>
            <RefreshCw size={14} />
            <span>Calculate Career Matches</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recommendations.map((rec, i) => (
            <RecommendationCard key={rec.career_id ? `${rec.career_id}-${i}` : `rec-${i}`} rec={rec} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
