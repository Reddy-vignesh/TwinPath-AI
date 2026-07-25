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

          {isLoadingRecs ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Projecting latent space...
            </div>
          ) : radarData.length > 0 ? (
            <div style={{ flex: 1, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar 
                    name="Your Profile" 
                    dataKey="A" 
                    stroke="var(--accent-blue)" 
                    fill="var(--accent-blue)" 
                    fillOpacity={0.5} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Insufficient data for projection.
            </div>
          )}
        </div>

        {/* Explainability Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-md)' }}>
              <Crosshair color="var(--success)" size={20} />
              Key Strengths
            </h3>
            {radarData.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {radarData.slice(0, 3).map((d, i) => (
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
    </div>
  );
}
