import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTwinStore, type Recommendation } from '../stores/twinStore';
import { useProfileStore } from '../stores/profileStore';
import { Target, TrendingUp, Zap, ChevronDown, ChevronUp, DollarSign, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

function confidenceBadge(level: string | undefined) {
  const c = (level || 'medium').toLowerCase();
  const colors: Record<string, { bg: string; color: string }> = {
    high: { bg: 'rgba(16,185,129,0.15)', color: 'var(--success)' },
    medium: { bg: 'rgba(245,158,11,0.15)', color: 'var(--warning)' },
    low: { bg: 'rgba(239,68,68,0.15)', color: 'var(--error)' },
  };
  return colors[c] ?? colors.medium;
}

function SkillGapBar({ label, current, required }: { label: string; current: number; required: number }) {
  const fill = Math.min(current / Math.max(required, 1), 1);
  const isMet = current >= required;
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
        <span>{label}</span>
        <span style={{ color: isMet ? 'var(--success)' : 'var(--error)' }}>
          {current}/{required} {isMet ? '✓' : '↑'}
        </span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
        <div style={{
          width: `${fill * 100}%`, height: '100%', borderRadius: '3px',
          background: isMet ? 'var(--success)' : 'var(--accent-blue)',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

function RecommendationCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const { bg: confidenceBg, color: confidenceColor } = confidenceBadge(rec.explanation?.confidence_level);
  const matchPct = Math.round((rec.similarity_score ?? 0) * 100);
  const gaps = rec.skill_gap?.gaps ?? [];
  const strengths = rec.skill_gap?.strengths ?? [];
  const topReasons = rec.explanation?.top_reasons ?? [];
  const suggestions = rec.explanation?.suggestions_to_improve ?? [];

  return (
    <div className="card" style={{
      borderLeft: `4px solid ${rank === 1 ? 'var(--accent-purple)' : rank <= 3 ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'}`,
      transition: 'box-shadow 0.2s',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
        {/* Rank bubble */}
        <div style={{
          minWidth: '44px', height: '44px', borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem',
          background: rank === 1 ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))' : 'var(--bg-elevated)',
          color: rank === 1 ? '#fff' : 'var(--text-secondary)',
        }}>
          #{rank}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>{rec.career?.title ?? 'Unknown'}</h3>
            {/* Match badge */}
            <span style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', padding: '2px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
              {matchPct}% Match
            </span>
            {/* Confidence */}
            <span style={{ background: confidenceBg, color: confidenceColor, padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              {rec.explanation?.confidence_level ?? 'medium'} confidence
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0', textTransform: 'capitalize' }}>
            {rec.career?.category?.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Salary + controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {rec.career?.median_salary_usd && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>
              <DollarSign size={14} />
              ${(rec.career.median_salary_usd / 1000).toFixed(0)}k/yr
            </div>
          )}
          {rec.career?.market_demand && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {rec.career.market_demand} demand
            </span>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="btn"
            style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-elevated)' }}
          >
            {expanded ? <><ChevronUp size={14} /> Less</> : <><ChevronDown size={14} /> Details</>}
          </button>
        </div>
      </div>

      {/* Match score bar */}
      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
          <div style={{
            width: `${matchPct}%`, height: '100%', borderRadius: '3px',
            background: matchPct >= 70 ? 'var(--success)' : matchPct >= 40 ? 'var(--accent-blue)' : 'var(--warning)',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {rec.career?.description && (
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              {rec.career.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-lg">
            {/* Why recommended */}
            {topReasons.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} color="var(--success)" /> Why Recommended
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topReasons.map((r, i) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: 'var(--success)', marginTop: '2px' }}>✓</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={16} color="var(--accent-blue)" /> Your Strengths
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {strengths.map((s, i) => (
                    <span key={i} style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skill Gaps */}
          {gaps.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} color="var(--warning)" /> Skill Gaps to Close
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--spacing-md)' }}>
                {gaps.slice(0, 6).map((g, i) => (
                  <SkillGapBar key={i} label={g.name} current={g.current_level} required={g.required_level} />
                ))}
              </div>
              {gaps.length > 6 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>+{gaps.length - 6} more gaps…</p>}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="var(--accent-purple)" /> How to Improve
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {suggestions.map((s, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent-purple)', marginTop: '2px' }}>→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const { recommendations, fetchRecommendations, isLoadingRecs } = useTwinStore();
  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    fetchProfile();
    fetchRecommendations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSkills = profile?.total_skills_count ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2>Career Recommendations</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your Digital Twin has analyzed {recommendations.length} top career matches ranked by similarity to your profile.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchRecommendations()}
          disabled={isLoadingRecs}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isLoadingRecs ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
          Refresh
        </button>
      </div>

      {isLoadingRecs ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem', color: 'var(--text-muted)', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: 'var(--accent-blue)', animation: 'spin 0.8s linear infinite' }} />
          Analyzing your Digital Twin in 216-dimensional space…
        </div>
      ) : recommendations.length === 0 || totalSkills === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Target size={48} style={{ color: 'var(--accent-purple)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.75rem' }}>No Profile Data Yet 🎯</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', maxWidth: '500px', margin: '0 auto var(--spacing-xl)' }}>
            Your Digital Twin needs your profile details to generate accurate career matches. Add your skills, academic major, or target career goals in your profile.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            Set Up Your Profile →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          {recommendations.map((rec, i) => (
            <RecommendationCard key={`${rec.career_id}-${i}`} rec={rec} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
