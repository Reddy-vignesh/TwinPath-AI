import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, DollarSign, Globe, BarChart2, X, ChevronRight } from 'lucide-react';

import { apiClient } from '../api/client';

interface Career {
  id: string;
  title: string;
  category: string;
  short_description: string | null;
  description: string | null;
  median_salary_usd: number | null;
  salary_range_low: number | null;
  salary_range_high: number | null;
  market_demand: string | null;
  growth_rate_percent: number | null;
  automation_risk_percent: number | null;
  required_skills: Record<string, number> | null;
  preferred_skills: Record<string, number> | null;
  required_education: string | null;
  typical_experience_years: number | null;
}

const CATEGORIES = [
  'All', 'software_engineering', 'data_science', 'product_management',
  'design', 'marketing', 'finance', 'consulting', 'healthcare',
  'education', 'research', 'engineering', 'entrepreneurship',
];

function demandColor(demand: string | null) {
  if (demand === 'high') return 'var(--success)';
  if (demand === 'medium') return 'var(--warning)';
  return 'var(--error)';
}

function demandBg(demand: string | null) {
  if (demand === 'high') return 'rgba(16,185,129,0.1)';
  if (demand === 'medium') return 'rgba(245,158,11,0.1)';
  return 'rgba(239,68,68,0.1)';
}

function formatSalary(val: number | null) {
  if (!val) return 'N/A';
  return `$${(val / 1000).toFixed(0)}k`;
}

function CareerModal({ career, onClose }: { career: Career; onClose: () => void }) {
  const reqSkills = Object.keys(career.required_skills ?? {});
  const prefSkills = Object.keys(career.preferred_skills ?? {});

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--spacing-lg)',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{ maxWidth: '640px', width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: '4px' }}>{career.title}</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{career.category?.replace(/_/g, ' ')}</span>
        </div>

        {/* Metrics row */}
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', flex: 1, minWidth: '130px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Median Salary</div>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.25rem' }}>{formatSalary(career.median_salary_usd)}</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', flex: 1, minWidth: '130px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Growth Rate</div>
            <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '1.25rem' }}>
              {career.growth_rate_percent ? `${career.growth_rate_percent}%` : 'N/A'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', flex: 1, minWidth: '130px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Automation Risk</div>
            <div style={{ fontWeight: 700, color: career.automation_risk_percent && career.automation_risk_percent > 25 ? 'var(--error)' : 'var(--warning)', fontSize: '1.25rem' }}>
              {career.automation_risk_percent ? `${career.automation_risk_percent}%` : 'N/A'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', flex: 1, minWidth: '130px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>Experience Needed</div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>
              {career.typical_experience_years ? `${career.typical_experience_years} yrs` : 'N/A'}
            </div>
          </div>
        </div>

        {career.description && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h4 style={{ marginBottom: '8px' }}>Overview</h4>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{career.description}</p>
          </div>
        )}

        {reqSkills.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <h4 style={{ marginBottom: '8px' }}>Required Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {reqSkills.map(s => (
                <span key={s} style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {prefSkills.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <h4 style={{ marginBottom: '8px' }}>Preferred Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {prefSkills.map(s => (
                <span key={s} style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {career.required_education && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 'var(--spacing-md)' }}>
            <strong>Education Required:</strong> {career.required_education}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CareerExplorer() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  const loadCareers = useCallback(async (q: string, category: string) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q) params.q = q;
      if (category !== 'All') params.category = category;
      const response = await apiClient.get('/careers', { params });
      setCareers(response.data.data ?? []);
    } catch (err) {
      console.error('Failed to load careers', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCareers('', 'All');
  }, [loadCareers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCareers(searchQuery, activeCategory);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory, loadCareers]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2>Career Explorer</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Browse {careers.length > 0 ? careers.length : ''} career paths — click any card for full requirements, salary data, and growth outlook.
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '44px', fontSize: '1rem' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search careers: Software Engineer, Data Scientist, Designer…"
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="btn"
              style={{
                padding: '5px 14px', fontSize: '0.8rem',
                background: activeCategory === cat ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${activeCategory === cat ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {cat === 'All' ? 'All' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Career Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', color: 'var(--text-muted)', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: 'var(--accent-blue)', animation: 'spin 0.8s linear infinite' }} />
          Searching career database…
        </div>
      ) : careers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <Globe size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>No careers found. Try a different search or category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
          {careers.map(career => (
            <div
              key={career.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative' }}
              onClick={() => setSelectedCareer(career)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(59,130,246,0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              {/* Demand badge */}
              {career.market_demand && (
                <span style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: demandBg(career.market_demand), color: demandColor(career.market_demand),
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                }}>
                  {career.market_demand} demand
                </span>
              )}

              <h3 style={{ marginBottom: '4px', paddingRight: '80px' }}>{career.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 'var(--spacing-md)', textTransform: 'capitalize' }}>
                {career.category?.replace(/_/g, ' ')}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {career.short_description || career.description || 'No description available.'}
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.85rem' }}>
                  <DollarSign size={14} />
                  {career.median_salary_usd ? `${formatSalary(career.salary_range_low)} – ${formatSalary(career.salary_range_high)}` : formatSalary(career.median_salary_usd)}
                </div>
                {career.growth_rate_percent !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontSize: '0.85rem' }}>
                    <TrendingUp size={14} />
                    {career.growth_rate_percent}% growth
                  </div>
                )}
                {career.automation_risk_percent !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <BarChart2 size={14} />
                    {career.automation_risk_percent}% auto-risk
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)', fontSize: '0.85rem' }}>
                View details <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Career Detail Modal */}
      {selectedCareer && (
        <CareerModal career={selectedCareer} onClose={() => setSelectedCareer(null)} />
      )}
    </div>
  );
}
