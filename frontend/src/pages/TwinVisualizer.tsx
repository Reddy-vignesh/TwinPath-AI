import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip
} from 'recharts';
import { useTwinStore } from '../stores/twinStore';
import { useProfileStore } from '../stores/profileStore';
import { ShieldAlert, Crosshair, BrainCircuit, Download, ArrowRight, Loader2, Info } from 'lucide-react';

const STANDARD_FEATURE_GROUPS = [
  { key: 'skill', label: 'Skill Vector' },
  { key: 'academic', label: 'Academic Baseline' },
  { key: 'career_goal', label: 'Career Intent' },
  { key: 'project', label: 'Project Artifacts' },
  { key: 'certification', label: 'Certifications' },
  { key: 'interest', label: 'Domain Interests' },
];

export default function TwinVisualizer() {
  const navigate = useNavigate();
  const { recommendations, fetchRecommendations, isLoadingRecs } = useTwinStore();
  const { profile, skills, fetchProfile, fetchSkills } = useProfileStore();
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchSkills();
    if (recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [recommendations.length, fetchRecommendations, fetchProfile, fetchSkills]);

  useEffect(() => {
    if (recommendations.length > 0 && !selectedCareer) {
      const firstId = recommendations[0].career_id || String(recommendations[0].rank);
      setSelectedCareer(firstId);
    }
  }, [recommendations, selectedCareer]);

  // Robust active recommendation matching
  const activeRec = recommendations.find(r => (r.career_id || String(r.rank)) === selectedCareer) || recommendations[0];

  const handleDownloadReport = () => {
    window.print();
  };

  const getRadarData = () => {
    if (!activeRec) return [];

    const rawContributions = activeRec.explanation?.feature_contributions || {};

    // Standard 6-axis Radar Geometry covering the entire 216-D Subspace
    return STANDARD_FEATURE_GROUPS.map(({ key, label }) => {
      const impact = rawContributions[key] ?? 0;
      const scorePct = Math.round(Number(impact) * 100);
      return {
        key,
        subject: label,
        A: Math.max(0, Math.min(100, scorePct)),
        fullMark: 100,
      };
    });
  };

  const radarData = getRadarData();
  const totalSkills = profile?.total_skills_count ?? skills.length;
  const hasData = totalSkills > 0 || Boolean(profile?.github_url || profile?.current_major || profile?.career_goal_primary);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: 'var(--micro-border)', paddingBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            AI Vector Latent Space Analysis
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Deconstruct your digital twin's 216-dimensional embedding vectors, feature contributions, and multidimensional radar geometry.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleDownloadReport}
          style={{ fontSize: '0.8125rem', gap: '0.45rem' }}
        >
          <Download size={14} />
          <span>Export Radar Report</span>
        </button>
      </div>

      {isLoadingRecs ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 0', color: 'var(--text-muted)', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
          <span style={{ fontSize: '0.875rem' }}>Calculating vector projections and polar coordinates...</span>
        </div>
      ) : recommendations.length === 0 && !hasData ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <BrainCircuit size={44} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Vector Space Inactive</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Your 216-dimensional feature vector is uncalibrated. Add skills and projects in your profile to initialize your vector geometry.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            <span>Configure Twin Profile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem' }}>
          
          {/* Radar Visualization Card */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: 'var(--micro-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Feature Contribution Geometry
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>
                  Polar weight contributions toward: <b style={{ color: 'var(--text-primary)' }}>{activeRec?.career?.title || 'Selected Career'}</b>
                </p>
              </div>

              <span style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', background: 'rgba(37, 99, 235, 0.1)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(37, 99, 235, 0.25)', fontWeight: 600 }}>
                216-D Subspace
              </span>
            </div>

            <div style={{ width: '100%', height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255, 255, 255, 0.1)" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Radar 
                    name="Contribution Score" 
                    dataKey="A" 
                    stroke="#2563EB" 
                    fill="#2563EB" 
                    fillOpacity={0.25} 
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'var(--micro-border)', borderRadius: '6px', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Impact Weight']} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Geometry Explanation Note */}
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem 0.85rem', 
              background: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-md)', 
              border: 'var(--micro-border)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}>
              <Info size={15} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <b style={{ color: 'var(--text-primary)' }}>Why do some vectors show 0%?</b> Dimensions like <i>Project Artifacts</i>, <i>Certifications</i>, or <i>Domain Interests</i> expand as you link GitHub repositories, complete certificates, or specify academic coursework in your profile.
              </div>
            </div>
          </div>

          {/* Right Controls & Driver Lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Career Selector Card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Select Career Trajectory to Analyze:
              </label>
              <select
                value={selectedCareer || ''}
                onChange={(e) => setSelectedCareer(e.target.value)}
                style={{
                  width: '100%', 
                  padding: '0.65rem 0.85rem', 
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)', 
                  border: 'var(--micro-border)',
                  color: 'var(--text-primary)', 
                  outline: 'none',
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer'
                }}
              >
                {recommendations.map((rec, idx) => {
                  const val = rec.career_id || String(rec.rank || idx + 1);
                  return (
                    <option key={val} value={val}>
                      #{rec.rank || idx + 1} - {rec.career?.title || 'Trajectory Path'} ({Math.round((rec.similarity_score ?? 0) * 100)}% Match)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Match Drivers */}
            <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem', borderBottom: 'var(--micro-border)', paddingBottom: '0.5rem' }}>
                <Crosshair color="var(--success)" size={15} />
                <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Dominant Vector Weights ({activeRec?.career?.title})
                </span>
              </div>
              {radarData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {radarData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0.65rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: 'var(--micro-border)' }}>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>{d.subject}</span>
                      <span style={{ 
                        color: d.A > 0 ? 'var(--success)' : 'var(--text-muted)', 
                        fontWeight: 700, 
                        fontSize: '0.8125rem' 
                      }}>
                        {d.A > 0 ? `+${d.A.toFixed(1)}%` : '+0.0%'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No vector data available.</span>
              )}
            </div>

            {/* Growth Areas */}
            <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem', borderBottom: 'var(--micro-border)', paddingBottom: '0.5rem' }}>
                <ShieldAlert color="var(--warning)" size={15} />
                <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Latent Space Growth Suggestions
                </span>
              </div>
              {activeRec?.explanation?.suggestions_to_improve?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeRec.explanation.suggestions_to_improve.map((s: string, i: number) => (
                    <div key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                      <span style={{ color: 'var(--accent-primary)' }}>→</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Add projects or certifications to discover targeted latent space optimizations.</span>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
