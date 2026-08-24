import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, DollarSign, Globe, X, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
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
  if (demand === 'high') return 'rgba(16, 185, 129, 0.1)';
  if (demand === 'medium') return 'rgba(245, 158, 11, 0.1)';
  return 'rgba(239, 68, 68, 0.1)';
}

function demandBorder(demand: string | null) {
  if (demand === 'high') return 'rgba(16, 185, 129, 0.25)';
  if (demand === 'medium') return 'rgba(245, 158, 11, 0.25)';
  return 'rgba(239, 68, 68, 0.25)';
}

function formatSalary(val: number | null) {
  if (!val || val <= 0) return 'N/A';
  const lakhs = (val / 10000).toFixed(1);
  return `₹${lakhs} LPA`;
}

function CareerModal({ career, onClose }: { career: Career; onClose: () => void }) {
  const navigate = useNavigate();
  const reqSkills = Object.keys(career.required_skills ?? {});
  const prefSkills = Object.keys(career.preferred_skills ?? {});

  return (
    <div
      style={{
        position: 'fixed', 
        inset: 0, 
        zIndex: 1000,
        background: 'rgba(5, 8, 15, 0.8)', 
        backdropFilter: 'blur(8px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{ 
          maxWidth: '680px', 
          width: '100%', 
          maxHeight: '85vh', 
          overflowY: 'auto', 
          position: 'relative',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ 
            position: 'absolute', 
            top: '1.25rem', 
            right: '1.25rem', 
            background: 'var(--bg-elevated)', 
            border: 'var(--micro-border)', 
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', 
            color: 'var(--text-muted)',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={16} />
        </button>

        <div style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {career.title}
            </h2>
            {career.market_demand && (
              <span style={{ 
                background: demandBg(career.market_demand), 
                color: demandColor(career.market_demand),
                border: `1px solid ${demandBorder(career.market_demand)}`,
                padding: '0.15rem 0.55rem', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '0.6875rem', 
                fontWeight: 700, 
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                {career.market_demand} demand
              </span>
            )}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textTransform: 'capitalize' }}>
            {career.category?.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-elevated)', border: 'var(--micro-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.85rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Median Salary</div>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.15rem' }}>{formatSalary(career.median_salary_usd)}</div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', border: 'var(--micro-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.85rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Growth Rate</div>
            <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.15rem' }}>
              {career.growth_rate_percent ? `+${career.growth_rate_percent}%` : 'N/A'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', border: 'var(--micro-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.85rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Auto Risk</div>
            <div style={{ fontWeight: 700, color: career.automation_risk_percent && career.automation_risk_percent > 25 ? 'var(--error)' : 'var(--warning)', fontSize: '1.15rem' }}>
              {career.automation_risk_percent ? `${career.automation_risk_percent}%` : 'Low'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', border: 'var(--micro-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.85rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Experience</div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
              {career.typical_experience_years ? `${career.typical_experience_years} yrs` : '0-2 yrs'}
            </div>
          </div>
        </div>

        {career.description && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Role Synopsis</div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.875rem', margin: 0 }}>{career.description}</p>
          </div>
        )}

        {reqSkills.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Required Vector Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {reqSkills.map(s => (
                <span key={s} style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 500 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {prefSkills.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Preferred Distinctions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {prefSkills.map(s => (
                <span key={s} style={{ background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 500 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {career.required_education && (
          <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: 'var(--micro-border)', marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Education Baseline:</strong> {career.required_education}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: 'var(--micro-border)' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.8125rem' }}>
            Close
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              onClose();
              navigate('/simulation');
            }}
            style={{ fontSize: '0.8125rem', gap: '0.4rem' }}
          >
            <span>Simulate What-If Path</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}

const FALLBACK_CAREERS: Career[] = [
  {
    id: 'c1',
    title: 'Machine Learning Engineer',
    category: 'data_science',
    short_description: 'Designs and builds production AI/ML models, neural pipelines, and scalable inference infrastructure.',
    description: 'Specializes in training, fine-tuning, and deploying machine learning models to production systems.',
    median_salary_usd: 150000,
    salary_range_low: 110000,
    salary_range_high: 220000,
    market_demand: 'high',
    growth_rate_percent: 24.5,
    automation_risk_percent: 8.2,
    required_skills: { Python: 9, PyTorch: 8, 'Machine Learning': 9, SQL: 7 },
    preferred_skills: { Docker: 8, Kubernetes: 7, MLOps: 8 },
    required_education: "Bachelor's / Master's",
    typical_experience_years: 2,
  },
  {
    id: 'c2',
    title: 'Full Stack Software Engineer',
    category: 'software_engineering',
    short_description: 'Architects modern web applications from frontend interfaces to backend distributed microservices.',
    description: 'Builds responsive user interfaces, REST/GraphQL APIs, and manages relational database architectures.',
    median_salary_usd: 135000,
    salary_range_low: 95000,
    salary_range_high: 190000,
    market_demand: 'high',
    growth_rate_percent: 18.0,
    automation_risk_percent: 12.0,
    required_skills: { React: 8, TypeScript: 8, 'Node.js': 8, SQL: 7 },
    preferred_skills: { Docker: 7, AWS: 7, Nextjs: 8 },
    required_education: "Bachelor's Degree",
    typical_experience_years: 2,
  },
  {
    id: 'c3',
    title: 'Cloud & DevOps Architect',
    category: 'software_engineering',
    short_description: 'Designs resilient cloud infrastructure, automated CI/CD pipelines, and zero-downtime deployments.',
    description: 'Automates cloud infrastructure with Terraform, orchestrates Kubernetes clusters, and guarantees system availability.',
    median_salary_usd: 160000,
    salary_range_low: 120000,
    salary_range_high: 230000,
    market_demand: 'high',
    growth_rate_percent: 21.0,
    automation_risk_percent: 6.5,
    required_skills: { AWS: 9, Docker: 9, Kubernetes: 8, 'CI/CD': 9 },
    preferred_skills: { Terraform: 8, Linux: 9, Python: 7 },
    required_education: "Bachelor's Degree",
    typical_experience_years: 3,
  },
  {
    id: 'c4',
    title: 'Data Scientist & AI Analyst',
    category: 'data_science',
    short_description: 'Extracts strategic business insights from large-scale structured and unstructured data assets.',
    description: 'Builds predictive analytics pipelines, runs statistical hypothesis testing, and creates visual intelligence dashboards.',
    median_salary_usd: 140000,
    salary_range_low: 100000,
    salary_range_high: 195000,
    market_demand: 'high',
    growth_rate_percent: 22.0,
    automation_risk_percent: 10.5,
    required_skills: { Python: 9, Pandas: 9, SQL: 9, Statistics: 8 },
    preferred_skills: { Tableau: 8, 'A/B Testing': 8, ScikitLearn: 8 },
    required_education: "Bachelor's / Master's",
    typical_experience_years: 2,
  },
  {
    id: 'c5',
    title: 'Technical Product Manager',
    category: 'product_management',
    short_description: 'Bridges engineering, design, and executive business strategy to deliver high-impact tech products.',
    description: 'Defines product roadmaps, prioritizes feature backlogs, and aligns cross-functional engineering teams.',
    median_salary_usd: 155000,
    salary_range_low: 115000,
    salary_range_high: 210000,
    market_demand: 'medium',
    growth_rate_percent: 14.5,
    automation_risk_percent: 9.0,
    required_skills: { 'Product Management': 9, 'Agile / Scrum': 8, Communication: 9 },
    preferred_skills: { 'System Design': 7, 'Data Analysis': 8 },
    required_education: "Bachelor's / MBA",
    typical_experience_years: 3,
  },
  {
    id: 'c6',
    title: 'Cybersecurity Systems Analyst',
    category: 'software_engineering',
    short_description: 'Secures networks, endpoints, and cloud workloads against advanced persistent threats.',
    description: 'Implements zero-trust security postures, conducts vulnerability audits, and responds to active incident vectors.',
    median_salary_usd: 145000,
    salary_range_low: 105000,
    salary_range_high: 200000,
    market_demand: 'high',
    growth_rate_percent: 28.0,
    automation_risk_percent: 4.8,
    required_skills: { Cybersecurity: 9, 'Network Security': 8, Linux: 8 },
    preferred_skills: { Cryptography: 7, 'Ethical Hacking': 8 },
    required_education: "Bachelor's Degree",
    typical_experience_years: 2,
  }
];

export default function CareerExplorer() {
  const [careers, setCareers] = useState<Career[]>(FALLBACK_CAREERS);
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
      const data = response.data.data ?? [];
      if (data.length > 0) {
        setCareers(data);
      } else {
        // Fallback filter
        const filtered = FALLBACK_CAREERS.filter(c => {
          if (category !== 'All' && c.category.toLowerCase() !== category.toLowerCase()) return false;
          if (q && !c.title.toLowerCase().includes(q.toLowerCase()) && !(c.short_description || '').toLowerCase().includes(q.toLowerCase())) return false;
          return true;
        });
        setCareers(filtered);
      }
    } catch (err) {
      console.error('Failed to load careers, using fallback seed', err);
      const filtered = FALLBACK_CAREERS.filter(c => {
        if (category !== 'All' && c.category.toLowerCase() !== category.toLowerCase()) return false;
        if (q && !c.title.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      });
      setCareers(filtered);
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ borderBottom: 'var(--micro-border)', paddingBottom: '1.25rem' }}>
        <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          Career Taxonomy & Global Registry
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          Search across calibrated industry roles, skill requirements, automated market risk, and compensation envelopes.
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '40px', fontSize: '0.875rem' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search roles: Machine Learning Engineer, Solution Architect, Product Lead..."
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '0.35rem 0.75rem', 
                fontSize: '0.75rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                background: activeCategory === cat ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: activeCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                border: activeCategory === cat ? '1px solid rgba(255, 255, 255, 0.2)' : 'var(--micro-border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'All' ? 'All Domains' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Career Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0', color: 'var(--text-muted)', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin" color="var(--accent-primary)" />
          <span style={{ fontSize: '0.875rem' }}>Querying career taxonomy database...</span>
        </div>
      ) : careers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <Globe size={40} style={{ opacity: 0.3, marginBottom: '0.85rem' }} />
          <p style={{ margin: 0, fontSize: '0.875rem' }}>No careers found matching your query filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {careers.map(career => (
            <div
              key={career.id}
              className="card"
              style={{ 
                cursor: 'pointer', 
                padding: '1.25rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onClick={() => setSelectedCareer(career)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {career.title}
                  </h3>
                  
                  {career.market_demand && (
                    <span style={{
                      background: demandBg(career.market_demand), 
                      color: demandColor(career.market_demand),
                      border: `1px solid ${demandBorder(career.market_demand)}`,
                      padding: '0.1rem 0.45rem', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.6875rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      flexShrink: 0
                    }}>
                      {career.market_demand}
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0 0.75rem 0', textTransform: 'capitalize' }}>
                  {career.category?.replace(/_/g, ' ')}
                </p>

                <p style={{ 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.8125rem', 
                  margin: '0 0 1rem 0', 
                  lineHeight: 1.5,
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden' 
                }}>
                  {career.short_description || career.description || 'No description available.'}
                </p>
              </div>

              {/* Stats Row */}
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap', borderTop: 'var(--micro-border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 600 }}>
                    <DollarSign size={13} />
                    <span>{career.median_salary_usd ? `${formatSalary(career.salary_range_low)} – ${formatSalary(career.salary_range_high)}` : formatSalary(career.median_salary_usd)}</span>
                  </div>
                  {career.growth_rate_percent !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                      <TrendingUp size={13} />
                      <span>+{career.growth_rate_percent}%</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-primary)', fontSize: '0.78125rem', fontWeight: 600 }}>
                  <span>Inspect taxonomy</span>
                  <ChevronRight size={13} />
                </div>
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
