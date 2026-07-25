import { useEffect, useState } from 'react';
import { useTwinStore, type SalaryPrediction } from '../stores/twinStore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

function confidenceColor(level: string) {
  if (level === 'high') return 'var(--success)';
  if (level === 'medium') return 'var(--warning)';
  return 'var(--error)';
}

function buildCurve(pred: SalaryPrediction) {
  return [0, 1, 2, 3, 4, 5].map(year => ({
    year: year === 0 ? 'Now' : `Yr ${year}`,
    Optimistic: Math.round(pred.predicted_salary_high * (1 + year * 0.045)),
    Expected: Math.round(pred.predicted_salary_mid * (1 + year * 0.035)),
    Conservative: Math.round(pred.predicted_salary_low * (1 + year * 0.025)),
  }));
}

function SalaryCard({ pred, isSelected, onClick }: { pred: SalaryPrediction; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card"
      style={{
        cursor: 'pointer', textAlign: 'left', width: '100%',
        border: isSelected ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isSelected ? '0 0 0 2px rgba(59,130,246,0.3)' : 'none',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.95rem' }}>{pred.career_title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <DollarSign size={14} color="var(--success)" />
        <span style={{ color: 'var(--success)', fontWeight: 600 }}>${(pred.predicted_salary_mid / 1000).toFixed(0)}k/yr</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          (${(pred.predicted_salary_low / 1000).toFixed(0)}k–${(pred.predicted_salary_high / 1000).toFixed(0)}k)
        </span>
      </div>
      <div style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
        background: `${confidenceColor(pred.confidence)}22`, color: confidenceColor(pred.confidence),
      }}>
        {pred.confidence} confidence
      </div>
    </button>
  );
}

export default function SalaryPredictions() {
  const { salaryPredictions, fetchSalaryPredictions, isLoadingSalary, recommendations } = useTwinStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    // Auto-load using top recommended career IDs
    const topIds = recommendations.slice(0, 5).map(r => r.career_id).filter(Boolean);
    fetchSalaryPredictions(topIds.length > 0 ? topIds : undefined);
  }, [recommendations, fetchSalaryPredictions]);

  useEffect(() => {
    if (salaryPredictions.length > 0 && !selectedId) {
      setSelectedId(salaryPredictions[0].career_id);
    }
  }, [salaryPredictions, selectedId]);

  const activePred = salaryPredictions.find(p => p.career_id === selectedId) ?? salaryPredictions[0] ?? null;
  const curveData = activePred ? buildCurve(activePred) : [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h2>Salary Predictions</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            5-year salary projections for your top career matches, personalized to your current profile.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => fetchSalaryPredictions()}
          disabled={isLoadingSalary}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isLoadingSalary ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {isLoadingSalary ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem', color: 'var(--text-muted)', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: 'var(--accent-blue)', animation: 'spin 0.8s linear infinite' }} />
          Running wage model simulations…
        </div>
      ) : salaryPredictions.length === 0 || (recommendations.length > 0 && (recommendations[0].similarity_score ?? 0) < 0.1) ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <DollarSign size={48} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.75rem' }}>Salary Forecast Inactive 💰</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', maxWidth: '500px', margin: '0 auto var(--spacing-xl)' }}>
            Salary predictions require your skill profile and target career goals. Add skills in your profile to forecast your 5-year earning potential.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/profile'}>
            Set Up Profile →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-lg">
          {/* Left: Career list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Select Career
            </h4>
            {salaryPredictions.map(pred => (
              <SalaryCard
                key={pred.career_id}
                pred={pred}
                isSelected={pred.career_id === selectedId}
                onClick={() => setSelectedId(pred.career_id)}
              />
            ))}
          </div>

          {/* Right: Chart + details */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {activePred && (
              <>
                {/* Summary stats */}
                <div className="card" style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Starting (Year 0)</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                      ${(activePred.predicted_salary_mid / 1000).toFixed(0)}k
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Expected salary</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Range</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--success)' }}>
                      ${(activePred.predicted_salary_low / 1000).toFixed(0)}k–${(activePred.predicted_salary_high / 1000).toFixed(0)}k
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Conservative–Optimistic</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>5-Year Expected</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent-blue)' }}>
                      ${(activePred.predicted_salary_mid * 1.175 / 1000).toFixed(0)}k
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>~3.5% annual growth</div>
                  </div>
                  <div style={{ flex: 1, minWidth: '130px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Confidence</div>
                    <div style={{ fontWeight: 700, fontSize: '1.5rem', textTransform: 'capitalize', color: confidenceColor(activePred.confidence) }}>
                      {activePred.confidence}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Prediction certainty</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="card" style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-lg)' }}>
                    <TrendingUp size={20} color="var(--success)" />
                    5-Year Salary Projection — {activePred.career_title}
                  </h3>

                  <div style={{ flex: 1, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                      <AreaChart data={curveData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="year" stroke="var(--text-muted)" />
                        <YAxis
                          stroke="var(--text-muted)"
                          tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: 'var(--text-primary)' }}
                          formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="Optimistic" stroke="var(--success)" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorOptimistic)" />
                        <Area type="monotone" dataKey="Expected" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorExpected)" />
                        <Area type="monotone" dataKey="Conservative" stroke="var(--text-muted)" strokeDasharray="3 3" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={13} /> Projections are estimates based on your current profile and market data. Actual salaries vary by location, company, and experience.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
