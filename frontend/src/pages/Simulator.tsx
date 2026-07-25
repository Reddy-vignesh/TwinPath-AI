import { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useTwinStore } from '../stores/twinStore';
import { Sliders, RefreshCw, TrendingUp, Zap } from 'lucide-react';

export default function Simulator() {
  const { runSimulation, isLoadingSim, simulationImpact, simulatedRecommendations } = useTwinStore();
  
  const [targetSkill, setTargetSkill] = useState('');
  const [targetLevel, setTargetLevel] = useState(8);
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [isSalaryLoading, setIsSalaryLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState('');

  const handleSimulate = async () => {
    setError('');
    setHasRun(false);
    setSalaryData([]);

    // 1. Run What-If simulation — get result directly (fixes B5)
    const result = await runSimulation([
      { type: 'upgrade_skill', params: { name: targetSkill, proficiency_level: targetLevel } }
    ]);

    setHasRun(true);

    if (!result) {
      setError('Simulation failed. Make sure your profile has some data to simulate on.');
      return;
    }

    // 2. Get salary prediction — use simulated careers first, fall back to general predictions
    setIsSalaryLoading(true);
    try {
      const { apiClient } = await import('../api/client');
      const topCareers = result.simulated?.top_careers ?? [];
      const careerIds = topCareers
        .slice(0, 3)
        .map((c: any) => c.career_id || c.career?.id)
        .filter(Boolean);

      // Always call salary-predictions — with career IDs if available, or general top-5
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

  // Simulation top career — response uses flat {title, rank, similarity_score} not nested career object
  const topSimCareer = simulatedRecommendations?.[0] as any;
  const topSimTitle = topSimCareer?.title || topSimCareer?.career?.title || '';

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2>What-If Simulator</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Simulate changes to your Twin (e.g., learning a new skill) and instantly forecast the impact on your career trajectory and salary.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-lg">
        
        {/* Controls Sidebar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} color="var(--accent-teal)" />
            Mutation Parameters
          </h3>

          <div className="input-group">
            <label className="input-label">Skill to Upgrade / Add</label>
            <input 
              className="input-field" 
              value={targetSkill}
              onChange={(e) => setTargetSkill(e.target.value)}
              placeholder="Python, React, SQL…"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Target Proficiency (1–10): <strong>{targetLevel}</strong></label>
            <input 
              type="range"
              min="1" max="10"
              value={targetLevel}
              onChange={(e) => setTargetLevel(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-teal)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Beginner</span><span>Expert</span>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleSimulate}
            disabled={isLoadingSim || isSalaryLoading || !targetSkill.trim()}
            style={{ marginTop: 'auto', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            {isLoadingSim ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
            {isLoadingSim ? 'Simulating…' : 'Run Simulation'}
          </button>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>
          )}
        </div>

        {/* Results Area */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          
          {/* Impact Summary */}
          {hasRun && simulationImpact && (
            <div className="card animate-fade-in" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-lg)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>+{simulationImpact.careers_gained || simulationImpact.careers_improved || 0}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Careers Unlocked / Improved</div>
              </div>
              <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                  {(simulationImpact as any).skill_gaps_closed ?? 0}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Skill Gaps Closed</div>
              </div>
              <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: (simulationImpact as any).total_score_delta > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                  {((simulationImpact as any).total_score_delta ?? 0) > 0 ? '+' : ''}{(((simulationImpact as any).total_score_delta ?? 0) * 100).toFixed(1)}%
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Score Boost</div>
              </div>
              {topSimCareer && topSimTitle && (
                <>
                  <div style={{ width: '1px', height: '50px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-purple)' }}>{topSimTitle}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Top Match After Simulation</div>
                  </div>
                </>
              )}
            </div>
          )}

          {!hasRun && !isLoadingSim && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Zap size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Enter a skill and click <strong>Run Simulation</strong> to see the impact on your career trajectory.</p>
            </div>
          )}

          {/* Salary Curve */}
          {(hasRun || isSalaryLoading || salaryData.length > 0) && (
            <div className="card" style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-lg)' }}>
                <TrendingUp size={20} color="var(--success)" />
                5-Year Salary Projection — Post-Simulation
                {topSimTitle && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>({topSimTitle})</span>}
              </h3>

              {isSalaryLoading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.75rem' }}>
                  <RefreshCw className="animate-spin" size={20} /> Running monte-carlo wage models…
                </div>
              ) : salaryData.length > 0 ? (
                <div style={{ flex: 1, width: '100%', minHeight: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <AreaChart data={salaryData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.1} />
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
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Salary chart will appear after simulation completes.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
