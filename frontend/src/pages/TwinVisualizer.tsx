import { useEffect, useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip
} from 'recharts';
import { useTwinStore } from '../stores/twinStore';
import { ShieldAlert, Crosshair, BrainCircuit } from 'lucide-react';

export default function TwinVisualizer() {
  const { recommendations, fetchRecommendations, isLoadingRecs } = useTwinStore();
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  useEffect(() => {
    if (recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [recommendations.length, fetchRecommendations]);

  useEffect(() => {
    if (recommendations.length > 0 && !selectedCareer) {
      setSelectedCareer(recommendations[0].career_id);
    }
  }, [recommendations, selectedCareer]);

  const activeRec = recommendations.find(r => r.career_id === selectedCareer);

  // Transform data into radar chart data.
  // Primary source: feature_contributions from explanation (SHAP values).
  // Fallback: build radar from skill categories in skill_gap (works for new users).
  const getRadarData = () => {
    if (!activeRec) return [];

    // Primary: use SHAP feature contributions if available
    if (activeRec.explanation?.feature_contributions && Object.keys(activeRec.explanation.feature_contributions).length > 0) {
      return Object.entries(activeRec.explanation.feature_contributions).map(([feature, impact]) => {
        const name = feature.replace('feature_', '').replace(/_/g, ' ');
        const impactValue = impact as number;
        return {
          subject: name.charAt(0).toUpperCase() + name.slice(1),
          A: Math.max(0, Math.min(100, impactValue * 100)),
          fullMark: 100,
        };
      }).sort((a, b) => b.A - a.A).slice(0, 6);
    }

    // Fallback: build from skill gap data + overall match score
    const skillGap = activeRec.skill_gap;
    if (skillGap) {
      const matchPct = Math.round((skillGap.match_score ?? 0) * 100);
      // Aggregate strengths and gaps by skill category
      const categories: Record<string, number> = {};
      (skillGap.strengths ?? []).forEach(s => {
        categories[s] = Math.min(100, (categories[s] ?? 0) + 20);
      });
      (skillGap.gaps ?? []).forEach(g => {
        const cat = g.name ?? 'Skill';
        const partial = g.current_level > 0 ? Math.round((g.current_level / Math.max(g.required_level, 1)) * 100) : 10;
        categories[cat] = Math.min(100, (categories[cat] ?? 0) + partial);
      });
      if (Object.keys(categories).length > 0) {
        return Object.entries(categories)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([name, value]) => ({ subject: name, A: value, fullMark: 100 }));
      }
      // Last resort: single match score dot
      return [{ subject: 'Overall Match', A: matchPct, fullMark: 100 }];
    }

    return [];
  };


  const radarData = getRadarData();

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2>216D Vector Projection</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Visualize how your Digital Twin's latent features align with different career profiles.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-lg">
        {/* Chart Area */}
        <div className="card" style={{ gridColumn: 'span 2', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit color="var(--accent-purple)" />
              Feature Alignment Radar
            </h3>
            
            <select 
              className="input-field" 
              style={{ width: '250px', padding: '0.5rem' }}
              value={selectedCareer || ''}
              onChange={(e) => setSelectedCareer(e.target.value)}
            >
              {recommendations.map((r: any) => (
                <option key={r.career_id} value={r.career_id}>
                  {r.career?.title || 'Unknown'} ({((r.similarity_score || 0) * 100).toFixed(0)}%)
                </option>
              ))}
            </select>
          </div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2>AI Vector Analysis</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Deconstruct how your Digital Twin maps to target careers in 216-dimensional latent space.
          </p>
        </div>
      </div>

      {isLoadingRecs ? (
        <div style={{ color: 'var(--text-muted)', padding: '4rem', textAlign: 'center' }}>
          Loading vector breakdown...
        </div>
      ) : recommendations.length === 0 || (recommendations.length > 0 && (recommendations[0].similarity_score ?? 0) < 0.1) ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <BrainCircuit size={48} style={{ color: 'var(--accent-purple)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.75rem' }}>Vector Space Inactive ⚡</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', maxWidth: '500px', margin: '0 auto var(--spacing-xl)' }}>
            Your 216-dimensional feature vector is currently empty. Add your skills, degree, or career goals in your profile to initialize your AI vector visualization.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/profile'}>
            Initialize Vector Profile →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-lg">
          {/* Left: Radar Chart */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Feature Vector Radar</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--spacing-lg)' }}>
              Breakdown of feature group weights driving match for <b>{activeRec?.career?.title}</b>.
            </p>

            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-muted)" />
                  <Radar name="Feature Contribution" dataKey="A" stroke="var(--accent-purple)" fill="var(--accent-purple)" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Impact Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: SHAP Feature Attributions & Growth Areas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Top Career Selector */}
            <div className="card">
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                Select Career Target to Analyze:
              </label>
              <select
                value={selectedCareer || ''}
                onChange={(e) => setSelectedCareer(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)', outline: 'none'
                }}
              >
                {recommendations.map((rec) => (
                  <option key={rec.career_id} value={rec.career_id}>
                    #{rec.rank} - {rec.career?.title} ({Math.round((rec.similarity_score ?? 0) * 100)}% Match)
                  </option>
                ))}
              </select>
            </div>

            {/* Drivers */}
            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-md)' }}>
                <Crosshair color="var(--success)" size={20} />
                Key Match Drivers
              </h3>
              {radarData.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {radarData.map((d, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>{d.subject}</span>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>+{d.A.toFixed(1)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No data</span>
              )}
            </div>

            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-md)' }}>
                <ShieldAlert color="var(--warning)" size={20} />
                Growth Areas
              </h3>
              {activeRec?.explanation?.suggestions_to_improve?.length ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {activeRec.explanation.suggestions_to_improve.map((s: string, i: number) => (
                    <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No explanations generated.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
