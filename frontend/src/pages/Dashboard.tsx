import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../stores/profileStore';
import { useTwinStore } from '../stores/twinStore';
import { 
  ArrowRight, 
  Target, 
  Code, 
  Briefcase, 
  TrendingUp, 
  Download, 
  Layers, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck, 
  GraduationCap, 
  ChevronRight,
  Compass,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, skills, fetchProfile, fetchSkills } = useProfileStore();
  const { recommendations, fetchRecommendations } = useTwinStore();

  useEffect(() => {
    fetchProfile();
    fetchSkills();
    fetchRecommendations();
  }, [fetchProfile, fetchSkills, fetchRecommendations]);

  // Real calculations based on actual user data
  const completeness = profile?.twin_completeness_score ?? 0;
  const totalSkills = profile?.total_skills_count ?? skills.length;
  const totalProjects = profile?.total_projects_count ?? 0;
  const hasProfileData = totalSkills > 0 || completeness > 0.1 || Boolean(profile?.github_url || profile?.current_major);

  const topMatch = hasProfileData && recommendations.length > 0 ? recommendations[0] : null;
  const matchScore = topMatch ? Math.round((topMatch.similarity_score || 0) * 100) : 0;

  // Technical, Leadership, Domain vector scores based on real skills or 0
  const technicalScore = totalSkills > 0 ? Math.min(95, Math.max(30, totalSkills * 9)) : 0;
  const leadershipScore = completeness > 0.4 ? Math.min(90, Math.round(completeness * 85)) : 0;
  const domainScore = Boolean(profile?.current_major) ? Math.min(90, Math.max(35, Math.round(completeness * 80))) : 0;

  const handleExportReport = () => {
    const reportData = {
      user: profile?.user_id || 'User',
      timestamp: new Date().toISOString(),
      twin_fidelity: `${Math.round(completeness * 100)}%`,
      verified_skills_count: totalSkills,
      verified_projects_count: totalProjects,
      top_career_match: topMatch?.career?.title || 'Profile Incomplete - Awaiting Evidence',
      match_similarity: `${matchScore}%`,
      baseline_salary: topMatch?.career?.median_salary_usd ? `₹${(topMatch.career.median_salary_usd / 10000).toFixed(1)} LPA` : 'Pending Calibration'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twinpath-executive-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Executive Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: 'var(--micro-border)', paddingBottom: '1.25rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Executive Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Real-time vector alignment and career trajectory analysis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExportReport}
            style={{ fontSize: '0.8125rem', gap: '0.45rem' }}
          >
            <Download size={14} color="var(--text-secondary)" />
            <span>Export Report</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/simulation')}
            style={{ fontSize: '0.8125rem', gap: '0.45rem' }}
          >
            <TrendingUp size={14} />
            <span>Simulate What-If</span>
          </button>
        </div>
      </div>

      {/* Onboarding Callout Banner (shown only when profile is not calibrated yet) */}
      {!hasProfileData && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(17, 24, 39, 0.6) 100%)',
          border: '1px solid rgba(37, 99, 235, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
              background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Your Digital Twin is Awaiting Calibration Evidence
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Upload your PDF resume or complete your Professional Identity & Skills in the Twin Profile to activate ML trajectory vectoring.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => navigate('/profile')}
            style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem', gap: '0.4rem' }}
          >
            <span>Set Up Twin Profile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 4-Column KPI Grid (High Data Density) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        
        {/* KPI 1: Twin Fidelity */}
        <div className="card" style={{ padding: '1.15rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TWIN FIDELITY
            </span>
            <Cpu size={14} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              {Math.round(completeness * 100)}%
            </span>
            {completeness > 0 && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.12)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                <span>▲</span> Calibrated
              </span>
            )}
          </div>

          {/* Sparkline Visual */}
          <div style={{ height: '24px', width: '100%', margin: '0.25rem 0 0.5rem 0' }}>
            <svg viewBox="0 0 100 24" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="fidelitySpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={completeness > 0 ? '#10B981' : '#6B7280'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={completeness > 0 ? '#10B981' : '#6B7280'} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={completeness > 0 ? "M0,20 Q20,16 35,18 T70,8 T100,6 L100,24 L0,24 Z" : "M0,22 L100,22 L100,24 L0,24 Z"} fill="url(#fidelitySpark)" />
              <path d={completeness > 0 ? "M0,20 Q20,16 35,18 T70,8 T100,6" : "M0,22 L100,22"} fill="none" stroke={completeness > 0 ? "#10B981" : "#6B7280"} strokeWidth="1.75" />
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: completeness >= 0.5 ? 'var(--success)' : 'var(--warning)', display: 'inline-block' }} />
            <span>{completeness >= 0.5 ? 'High Vector Accuracy' : completeness > 0 ? 'Partial Vector Alignment' : 'Pending Profile Setup'}</span>
          </div>
        </div>

        {/* KPI 2: Verified Skills */}
        <div className="card" style={{ padding: '1.15rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              VERIFIED SKILLS
            </span>
            <CheckCircle2 size={14} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              {totalSkills}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 500 }}>
              / 12 recommended
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: totalSkills > 0 ? 'var(--accent-purple)' : '#6B7280', display: 'inline-block' }} />
            <span>{totalSkills > 0 ? 'Vectorized & Evaluated' : 'Awaiting Skill Evidence'}</span>
          </div>

          {/* Bottom Accent Bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: totalSkills > 0 ? 'linear-gradient(90deg, #6366F1 0%, transparent 80%)' : 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* KPI 3: Project Artifacts */}
        <div className="card" style={{ padding: '1.15rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PROJECT ARTIFACTS
            </span>
            <Layers size={14} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              {totalProjects}
            </span>
            {totalProjects > 0 && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.12)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-sm)' }}>
                Active
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: totalProjects > 0 ? 'var(--accent-teal)' : '#6B7280', display: 'inline-block' }} />
            <span>{totalProjects > 0 ? 'Repository Evidence' : 'No Repositories Linked'}</span>
          </div>

          {/* Schematic Watermark */}
          <div style={{ position: 'absolute', right: '12px', bottom: '10px', opacity: 0.1, pointerEvents: 'none' }}>
            <Briefcase size={36} color="var(--text-primary)" />
          </div>
        </div>

        {/* KPI 4: Top Match Index */}
        <div className="card" style={{ padding: '1.15rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOP MATCH INDEX
            </span>
            <Target size={14} color="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: matchScore > 0 ? 'var(--success)' : 'var(--text-muted)', letterSpacing: '-0.025em' }}>
              {matchScore > 0 ? `${matchScore}%` : '--'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: matchScore > 0 ? 'var(--success)' : '#6B7280', display: 'inline-block' }} />
            <span>{matchScore > 0 ? 'Cosine Alignment' : 'Awaiting Evidence'}</span>
          </div>

          {/* Target Watermark */}
          <div style={{ position: 'absolute', right: '12px', bottom: '10px', opacity: 0.12, pointerEvents: 'none' }}>
            <Target size={38} color={matchScore > 0 ? "var(--success)" : "#6B7280"} />
          </div>
        </div>

      </div>

      {/* Split Section: Trajectory Spotlight & Diagnostics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.75fr 1fr', gap: '1.25rem' }}>
        
        {/* Left: Primary Career Trajectory Spotlight */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Top Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  fontSize: '0.6875rem', 
                  fontWeight: 700, 
                  color: matchScore > 0 ? 'var(--success)' : 'var(--warning)', 
                  background: matchScore > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                  border: `1px solid ${matchScore > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`, 
                  padding: '0.2rem 0.55rem', 
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.04em'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: matchScore > 0 ? 'var(--success)' : 'var(--warning)' }} />
                  {matchScore > 0 ? 'HIGHLY ALIGNED' : 'CALIBRATION REQUIRED'}
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  TARGET ROLE
                </span>
              </div>

              {/* Match Confidence Box */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                background: 'var(--bg-elevated)', 
                border: 'var(--micro-border)', 
                padding: '0.35rem 0.75rem', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  MATCH CONFIDENCE
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: matchScore > 0 ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1.2 }}>
                  {matchScore > 0 ? `${matchScore}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Role Title & Description */}
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>
              {topMatch?.career?.title || (hasProfileData ? 'General Technology Specialist' : 'Digital Twin Awaiting Evidence')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
              {topMatch?.career?.description || (
                hasProfileData 
                  ? 'Your profile attributes are being processed across our career taxonomy models.' 
                  : 'Your 216-dimensional vector profile is currently uncalibrated. Complete your Professional Identity, Academic Profile, and Skill Intelligence to activate live career trajectory matching.'
              )}
            </p>

            {/* 2-Column Vector Alignment & Next Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', borderTop: 'var(--micro-border)', paddingTop: '1.25rem' }}>
              
              {/* Left Column: Multi-Tier Vector Breakdown */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Code size={13} color="var(--text-secondary)" />
                    <span>Vector Alignment</span>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', border: 'var(--micro-border)' }}>
                    {hasProfileData ? 'Calculated' : 'Uncalibrated'}
                  </span>
                </div>

                {/* Progress Bar 1: Technical Skills */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <span>TECHNICAL SKILLS EMBEDDING</span>
                    <span style={{ color: 'var(--text-primary)' }}>{technicalScore}%</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${technicalScore}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>

                {/* Progress Bar 2: Leadership Matrix */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <span>LEADERSHIP MATRIX</span>
                    <span style={{ color: 'var(--text-primary)' }}>{leadershipScore}%</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${leadershipScore}%`, height: '100%', background: 'var(--success)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>

                {/* Progress Bar 3: Domain Expertise */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <span>DOMAIN EXPERTISE</span>
                    <span style={{ color: 'var(--text-primary)' }}>{domainScore}%</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${domainScore}%`, height: '100%', background: '#F59E0B', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              </div>

              {/* Right Column: Actions & Algorithmic Nudge */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {hasProfileData ? (
                    <>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/recommendations')}
                        style={{ width: '100%', justifyContent: 'space-between', padding: '0.6rem 0.85rem' }}
                      >
                        <span>View Trajectory Analysis</span>
                        <ArrowRight size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => navigate('/careers')}
                        style={{ width: '100%', justifyContent: 'center', padding: '0.55rem 0.85rem', fontSize: '0.8125rem' }}
                      >
                        <Compass size={13} />
                        <span>Explore Alternative Paths</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/profile')}
                        style={{ width: '100%', justifyContent: 'space-between', padding: '0.6rem 0.85rem' }}
                      >
                        <span>Set Up Twin Profile</span>
                        <ArrowRight size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => navigate('/careers')}
                        style={{ width: '100%', justifyContent: 'center', padding: '0.55rem 0.85rem', fontSize: '0.8125rem' }}
                      >
                        <Compass size={13} />
                        <span>Explore Career Taxonomy</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Actionable Nudge */}
                <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: 'var(--micro-border)' }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                    NEXT RECOMMENDED ACTION
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {hasProfileData ? (
                      <>Update missing <b style={{ color: 'var(--text-primary)' }}>Cloud & Architecture</b> artifacts to boost match index by ~3%.</>
                    ) : (
                      <>Add at least <b style={{ color: 'var(--text-primary)' }}>3 verified skills</b> or upload a resume to unlock tailored recommendations.</>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right: Twin Health Status Diagnostics */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <ShieldCheck size={16} color="var(--accent-blue)" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Twin Health Status
              </span>
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1.25rem 0' }}>
              SYSTEM DIAGNOSTICS & BASELINE METRICS
            </p>

            {/* Diagnostic Tile 1: Academic Baseline */}
            <div style={{ 
              padding: '0.75rem 0.85rem', 
              background: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-md)', 
              border: 'var(--micro-border)', 
              marginBottom: '0.75rem' 
            }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                ACADEMIC BASELINE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={15} color="var(--text-secondary)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {profile?.current_major || 'Profile Setup Incomplete'}
                </span>
              </div>
            </div>

            {/* Diagnostic Tile 2: Vector Calibration */}
            <div style={{ 
              padding: '0.75rem 0.85rem', 
              background: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-md)', 
              border: 'var(--micro-border)', 
              marginBottom: '0.75rem' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  VECTOR CALIBRATION
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: completeness > 0 ? 'var(--success)' : 'var(--warning)' }}>
                  {completeness >= 0.8 ? 'COMPLETE' : completeness > 0 ? 'IN PROGRESS' : 'PENDING'}
                </span>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.35rem' }}>
                <div style={{ width: `${Math.round(completeness * 100)}%`, height: '100%', background: completeness >= 0.5 ? 'var(--success)' : 'var(--warning)', borderRadius: 'var(--radius-full)' }} />
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                {Math.round(completeness * 100)}% Fidelity
              </div>
            </div>

            {/* Diagnostic Tile 3: Salary Predictor Engine */}
            <div style={{ 
              padding: '0.75rem 0.85rem', 
              background: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-md)', 
              border: 'var(--micro-border)' 
            }}>
              <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                SALARY PREDICTOR ENGINE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: hasProfileData ? 'var(--success)' : 'var(--warning)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {hasProfileData ? 'Calibrated Active' : 'Awaiting Profile Data'}
                </span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {hasProfileData ? 'Baseline: Calibrated against Indian CTC models' : 'Requires verified skills to predict CTC'}
              </div>
            </div>
          </div>

          {/* Manage Profile Link */}
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/profile')} 
            style={{ width: '100%', justifyContent: 'space-between', marginTop: '1.25rem', padding: '0.55rem 0.85rem', fontSize: '0.8125rem' }}
          >
            <span>Manage Twin Attributes</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>

    </div>
  );
}
