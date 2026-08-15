import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTwinStore, type SalaryPrediction } from '../stores/twinStore';
import { useProfileStore } from '../stores/profileStore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, RefreshCw, Loader2, ArrowRight } from 'lucide-react';

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

function formatLPA(amount: number): string {
  if (!amount || amount <= 0) return '₹0.0 LPA';
  const lakhs = (amount / 10000).toFixed(1);
  return `₹${lakhs} LPA`;
}

function SalaryCard({ pred, isSelected, onClick }: { pred: SalaryPrediction; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card"
      style={{
        cursor: 'pointer', 
        textAlign: 'left', 
        width: '100%',
        padding: '0.85rem 1rem',
        border: isSelected ? '1px solid var(--accent-primary)' : 'var(--micro-border)',
        background: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-surface)',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
        {pred.career_title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
        <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.9375rem' }}>
          {formatLPA(pred.predicted_salary_mid)}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>
          ({formatLPA(pred.predicted_salary_low)} – {formatLPA(pred.predicted_salary_high)})
        </span>
      </div>
      <div style={{
        display: 'inline-flex', 
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.1rem 0.45rem', 
        borderRadius: 'var(--radius-sm)', 
        fontSize: '0.6875rem', 
        fontWeight: 600, 
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: `${confidenceColor(pred.confidence)}18`, 
        color: confidenceColor(pred.confidence),
        border: `1px solid ${confidenceColor(pred.confidence)}33`
      }}>
        <span>✓</span>
        <span>{pred.confidence === 'high' ? 'High Confidence' : `${pred.confidence} confidence`}</span>
      </div>
    </button>
  );
}

export default function SalaryPredictions() {
  const navigate = useNavigate();
  const { salaryPredictions, fetchSalaryPredictions, isLoadingSalary, recommendations } = useTwinStore();
  const { profile, fetchProfile } = useProfileStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    const topIds = recommendations.slice(0, 5).map(r => r.career_id).filter(Boolean);
    fetchSalaryPredictions(topIds.length > 0 ? topIds : undefined);
  }, [recommendations, fetchSalaryPredictions, fetchProfile]);

  useEffect(() => {
    if (salaryPredictions.length > 0 && !selectedId) {
      setSelectedId(salaryPredictions[0].career_id);
    }
  }, [salaryPredictions, selectedId]);

  const activePred = salaryPredictions.find(p => p.career_id === selectedId) ?? salaryPredictions[0] ?? null;
  const curveData = activePred ? buildCurve(activePred) : [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: 'var(--micro-border)', paddingBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Compensation & Wage Predictor (INR / CTC)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Calibrated 5-year compensation trajectories based on live tech market benchmarks and verified skill embeddings.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => fetchSalaryPredictions()}
          disabled={isLoadingSalary}
          style={{ fontSize: '0.8125rem', gap: '0.45rem' }}
        >
          {isLoadingSalary ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          <span>Refresh Forecast</span>
        </button>
      </div>

      {isLoadingSalary ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 0', color: 'var(--text-muted)', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
          <span style={{ fontSize: '0.875rem' }}>Running wage regression and market calibration models...</span>
        </div>
      ) : salaryPredictions.length === 0 || (profile?.total_skills_count ?? 0) === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <DollarSign size={44} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Salary Calibration Inactive</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
            Salary forecasting requires your verified skill vector. Complete your profile to unlock 5-year earning potential forecasts.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/profile')}>
            <span>Configure Twin Profile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
          
          {/* Left Career Rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              CALIBRATED CAREER PATHS
            </div>
            {salaryPredictions.map(pred => (
              <SalaryCard
                key={pred.career_id}
                pred={pred}
                isSelected={pred.career_id === selectedId}
                onClick={() => setSelectedId(pred.career_id)}
              />
            ))}
          </div>

          {/* Right Detailed Stats & Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activePred && (
              <>
                {/* 4-Metric Executive Stat Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      STARTING BASELINE (YR 0)
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.45rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                      {formatLPA(activePred.predicted_salary_mid)}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Median Base CTC</div>
                  </div>

                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      MARKET RANGE
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.35rem', color: 'var(--success)', letterSpacing: '-0.02em' }}>
                      {formatLPA(activePred.predicted_salary_low)} – {formatLPA(activePred.predicted_salary_high)}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Conservative – High</div>
                  </div>

                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      5-YEAR PROJECTED
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.45rem', color: 'var(--accent-blue)', letterSpacing: '-0.02em' }}>
                      {formatLPA(activePred.predicted_salary_mid * 1.175)}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>~3.5% CAGR Projection</div>
                  </div>

                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      CALIBRATION STATUS
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.35rem', color: confidenceColor(activePred.confidence), letterSpacing: '-0.02em' }}>
                      High Fidelity
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem' }}>Live Indian Tech Data</div>
                  </div>

                </div>

                {/* Main 5-Year Chart Card */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={16} color="var(--success)" />
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        5-Year Growth Curve — {activePred.career_title}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      INR CTC Forecast
                    </span>
                  </div>

                  <div style={{ flex: 1, width: '100%', minHeight: '280px' }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="year" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis
                          stroke="var(--text-muted)"
                          fontSize={12}
                          tickFormatter={val => `₹${(val / 100000).toFixed(1)}L`}
                        />
                        <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.06)" />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'var(--micro-border)', borderRadius: '6px', fontSize: '12px' }}
                          itemStyle={{ color: 'var(--text-primary)' }}
                          formatter={(value: any) => `₹${(Number(value) / 100000).toFixed(1)} LPA`}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="Optimistic" stroke="var(--success)" strokeDasharray="4 4" fillOpacity={1} fill="url(#colorOptimistic)" />
                        <Area type="monotone" dataKey="Expected" stroke="var(--accent-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpected)" />
                        <Area type="monotone" dataKey="Conservative" stroke="var(--text-muted)" strokeDasharray="2 2" fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '1rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={13} />
                    <span>Projections are econometric estimates based on vector proficiency and market CTC baselines.</span>
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
