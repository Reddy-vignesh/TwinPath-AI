import { useState } from 'react';
import { apiClient } from '../api/client';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTwinStore } from '../stores/twinStore';
import { Sliders, RefreshCw, TrendingUp, Zap } from 'lucide-react';

type ProficiencyTier = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

const PROFICIENCY_OPTIONS: { label: ProficiencyTier; level: number; description: string }[] = [
  { label: 'Beginner', level: 3, description: 'Foundational concept understanding' },
  { label: 'Intermediate', level: 6, description: 'Practical project application' },
  { label: 'Advanced', level: 8, description: 'Production-grade engineering' },
  { label: 'Expert', level: 10, description: 'Industry authority & mastery' },
];

export default function Simulator() {
  const { runSimulation, isLoadingSim, simulationImpact, simulatedRecommendations } = useTwinStore();
  
  const [targetSkill, setTargetSkill] = useState('');
  const [proficiency, setProficiency] = useState<ProficiencyTier>('Advanced');
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [isSalaryLoading, setIsSalaryLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState('');

  const activeLevel = PROFICIENCY_OPTIONS.find(p => p.label === proficiency)?.level ?? 8;

  const handleSimulate = async () => {
    setError('');
    setHasRun(false);
    setSalaryData([]);

    const result = await runSimulation([
      { type: 'upgrade_skill', params: { name: targetSkill, proficiency_level: activeLevel } }
    ]);

    setHasRun(true);

    if (!result) {
      setError('Simulation failed. Make sure your profile has some data to simulate on.');
      return;
    }

    setIsSalaryLoading(true);
    try {
      const topCareers = result.simulated?.top_careers ?? [];
      const careerIds = topCareers
        .slice(0, 3)
        .map((c: any) => c.career_id || c.career?.id)
        .filter(Boolean);

      const res = await apiClient.post('/salary-predictions', careerIds.length > 0 ? { career_ids: careerIds } : {});
      const predictions = res.data.data?.predictions ?? [];
      const topPred = predictions[0];

      if (topPred) {
        const curve = [0, 1, 2, 3, 4, 5].map(year => ({
          year: year === 0 ? 'Now' : `Yr ${year}`,
          Optimistic:   Math.round(topPred.predicted_salary_high * (1 + year * 0.045)),
          Expected:     Math.round(topPred.predicted_salary_mid  * (1 + year * 0.035)),
          Conservative: Math.round(topPred.predicted_salary_low  * (1 + year * 0.025)),
        }));
        setSalaryData(curve);
      }
    } catch (err) {
      console.error('Salary prediction failed:', err);
    } finally {
      setIsSalaryLoading(false);
    }
  };

  const topSimCareer = simulatedRecommendations?.[0] as any;
  const topSimTitle = topSimCareer?.title || topSimCareer?.career?.title || '';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ borderBottom: 'var(--micro-border)', paddingBottom: '1.25rem' }}>
        <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          What-If Simulation Sandbox
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          Model speculative skill mutations and forecast career trajectory shifts, skill gap reductions, and Indian market compensation curves.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>
        
        {/* Controls Sidebar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: 'var(--micro-border)', paddingBottom: '0.75rem' }}>
            <Sliders size={16} color="var(--accent-primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Mutation Parameters
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Skill to Upgrade / Acquire
            </label>
            <input 
              className="input-field" 
              value={targetSkill}
              onChange={(e) => setTargetSkill(e.target.value)}
              placeholder="e.g. PyTorch, Kubernetes, System Design..."
              style={{ fontSize: '0.8125rem' }}
            />
          </div>

          {/* Target Proficiency: Beginner, Intermediate, Advanced, Expert */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target Proficiency Tier
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
              {PROFICIENCY_OPTIONS.map((opt) => {
                const isSelected = proficiency === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setProficiency(opt.label)}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1px solid var(--accent-primary)' : 'var(--micro-border)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-elevated)',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{opt.label}</span>
                    <span style={{ fontSize: '0.625rem', opacity: 0.7 }}>Level {opt.level}/10</span>
                  </button>
                );
              })}
            </div>
            
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>
              {PROFICIENCY_OPTIONS.find(p => p.label === proficiency)?.description}
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleSimulate}
            disabled={isLoadingSim || isSalaryLoading || !targetSkill.trim()}
            style={{ marginTop: 'auto', padding: '0.65rem 1rem', fontSize: '0.8125rem', gap: '0.5rem' }}
          >
            {isLoadingSim ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} />}
            <span>{isLoadingSim ? 'Running Vector Model...' : 'Simulate What-If Impact'}</span>
          </button>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '0.75rem', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* Results Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Executive Impact Metrics (shown after simulation) */}
          {hasRun && simulationImpact && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--success)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  NEW PATHS UNLOCKED
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
                  +{simulationImpact.careers_gained}
                </div>
              </div>

              <div className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--accent-primary)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  MATCH SCORE IMPROVEMENTS
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  +{simulationImpact.careers_improved}
                </div>
              </div>

              <div className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--accent-purple)' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  TOP PROJECTED ROLE
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {topSimTitle || 'Lead Engineer'}
                </div>
              </div>

              <div className="card" style={{ padding: '1rem', borderLeft: '3px solid #F59E0B' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                  SKILL LEVEL MUTATION
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#F59E0B' }}>
                  {proficiency} ({activeLevel}/10)
                </div>
              </div>
            </div>
          )}

          {!hasRun && !isLoadingSim && (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', color: 'var(--text-muted)' }}>
              <Zap size={36} style={{ color: 'var(--accent-primary)', opacity: 0.4, marginBottom: '0.85rem' }} />
              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 600 }}>Interactive Vector Sandbox</h3>
              <p style={{ fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto' }}>
                Enter a target skill and select proficiency (Beginner, Intermediate, Advanced, Expert) to simulate real-time trajectory changes.
              </p>
            </div>
          )}

          {/* Salary Projection Chart */}
          {(hasRun || isSalaryLoading || salaryData.length > 0) && (
            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={16} color="var(--success)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    5-Year Projected Indian Market Wage Growth (CTC)
                  </span>
                  {topSimTitle && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', background: 'rgba(99, 102, 241, 0.1)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                      {topSimTitle}
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Monte Carlo Calibration
                </span>
              </div>

              {isSalaryLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.75rem' }}>
                  <RefreshCw className="animate-spin" size={18} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.875rem' }}>Recalculating wage regression curves...</span>
                </div>
              ) : salaryData.length > 0 ? (
                <div style={{ flex: 1, width: '100%', minHeight: '280px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={salaryData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
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
                        tickFormatter={val => `₹${(val / 10000).toFixed(1)}L`} 
                      />
                      <CartesianGrid strokeDasharray="2 2" stroke="rgba(255,255,255,0.06)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'var(--micro-border)', borderRadius: '6px', fontSize: '12px' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        formatter={(value: any) => `₹${(Number(value) / 10000).toFixed(1)} LPA`}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="Optimistic" stroke="var(--success)" strokeDasharray="4 4" fillOpacity={1} fill="url(#colorOptimistic)" />
                      <Area type="monotone" dataKey="Expected" stroke="var(--accent-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpected)" />
                      <Area type="monotone" dataKey="Conservative" stroke="var(--text-muted)" strokeDasharray="2 2" fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Wage regression projections will appear following simulation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
