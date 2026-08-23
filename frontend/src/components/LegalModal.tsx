import React, { useState } from 'react';
import { X, Shield, FileText, Cookie, AlertTriangle, Mail } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'cookies' | 'disclaimer' | 'contact';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '88vh',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(11, 15, 23, 0.98) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f1f5f9',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
                Legal, Privacy & Compliance Center
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                TwinPath AI Official Governance Standards
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '0.75rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'privacy', label: 'Privacy Policy (GDPR/DPDP)', icon: Shield },
            { id: 'terms', label: 'Terms & Conditions', icon: FileText },
            { id: 'cookies', label: 'Cookie & Session Policy', icon: Cookie },
            { id: 'disclaimer', label: 'AI Disclaimer & Governance', icon: AlertTriangle },
            { id: 'contact', label: 'Official Contact & Grievance', icon: Mail },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LegalTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div
          style={{
            padding: '1.75rem',
            overflowY: 'auto',
            flex: 1,
            lineHeight: 1.65,
            fontSize: '0.9rem',
            color: '#cbd5e1',
          }}
        >
          {activeTab === 'privacy' && (
            <div>
              <h3 style={{ color: '#fff', marginTop: 0, fontSize: '1.15rem' }}>1. Privacy Policy (GDPR / CCPA / DPDP)</h3>
              <p>
                <strong>TwinPath AI</strong> is committed to safeguarding the confidentiality of your academic, skill, and career trajectory data.
              </p>
              
              <h4 style={{ color: '#38bdf8', marginBottom: '6px' }}>1.1 Information We Collect</h4>
              <ul style={{ paddingLeft: '1.25rem', marginTop: 0 }}>
                <li><strong>Identity & Account:</strong> Name, verified educational/personal email, 12-round salted bcrypt password hashes.</li>
                <li><strong>Academic Credentials:</strong> College/university, major, CGPA, graduation year, degree level.</li>
                <li><strong>Resume & Skills:</strong> In-memory PDF extracted skills, project descriptions, portfolio/GitHub/LinkedIn URLs.</li>
                <li><strong>Vector Embeddings:</strong> High-dimensional mathematical representations used exclusively for career decision simulations.</li>
              </ul>

              <h4 style={{ color: '#38bdf8', marginBottom: '6px' }}>1.2 Zero Data Sale Guarantee</h4>
              <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', color: '#6ee7b7', marginBottom: '1rem' }}>
                🛡️ <strong>Our Promise:</strong> TwinPath AI does NOT sell, rent, or trade your personal information, resume documents, or career simulation vector matrices to third-party ad networks or brokers.
              </div>

              <h4 style={{ color: '#38bdf8', marginBottom: '6px' }}>1.3 Your Privacy Rights (Portability & Erasure)</h4>
              <p>
                Under GDPR & CCPA, you retain 100% data sovereignty. You can access your profile settings anytime to:
              </p>
              <ul style={{ paddingLeft: '1.25rem', marginTop: 0 }}>
                <li><strong>1-Click Data Export:</strong> Download a comprehensive JSON package of your complete digital twin profile.</li>
                <li><strong>Right to be Forgotten:</strong> Permanently scrub all your skills, evidence, and embeddings from our database with immediate effect.</li>
              </ul>
            </div>
          )}

          {activeTab === 'terms' && (
            <div>
              <h3 style={{ color: '#fff', marginTop: 0, fontSize: '1.15rem' }}>2. Terms and Conditions (Terms of Service)</h3>
              <p>
                By accessing or registering with TwinPath AI, you agree to comply with the following operational terms:
              </p>

              <h4 style={{ color: '#38bdf8', marginBottom: '6px' }}>2.1 Acceptable Use & Account Integrity</h4>
              <ul style={{ paddingLeft: '1.25rem', marginTop: 0 }}>
                <li>You agree to provide accurate and truthful academic information to ensure optimal simulation precision.</li>
                <li>You agree NOT to upload executable malware, corrupted scripts, or weaponized payloads via the resume upload interface.</li>
                <li>You agree NOT to execute automated vulnerability scanners, brute-force scrapers, or DDoS attacks against platform APIs.</li>
              </ul>

              <h4 style={{ color: '#38bdf8', marginBottom: '6px' }}>2.2 Intellectual Property</h4>
              <p>
                You retain complete ownership of your uploaded resumes, code repositories, and project portfolios. The TwinPath AI brand, neural matching algorithms, vector pipelines, and UI designs remain the exclusive property of TwinPath AI.
              </p>

              <h4 style={{ color: '#38bdf8', marginBottom: '6px' }}>2.3 Account Security</h4>
              <p>
                Accounts are protected with automated brute-force lockouts (15-minute freeze on 5 failed attempts) and secure multi-factor OTP verification. You are responsible for maintaining the confidentiality of your credentials.
              </p>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div>
              <h3 style={{ color: '#fff', marginTop: 0, fontSize: '1.15rem' }}>3. Cookie & Session Policy</h3>
              <p>
                TwinPath AI enforces a <strong>Privacy-First Minimalist Cookie Architecture</strong>. We do not use third-party marketing pixels or cross-site tracking cookies.
              </p>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', textAlign: 'left' }}>
                    <th style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Cookie / Key</th>
                    <th style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Classification</th>
                    <th style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Function</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8' }}><code>refresh_token</code></td>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Strictly Necessary (httpOnly)</td>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Secures authentication session against XSS token theft.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8' }}><code>theme_mode</code></td>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Preference (LocalStorage)</td>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Stores dark / cyber aesthetic preference.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8' }}><code>form_ts</code></td>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Security (In-Memory)</td>
                    <td style={{ padding: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>Shields login forms against rapid bot script submissions.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div>
              <h3 style={{ color: '#fff', marginTop: 0, fontSize: '1.15rem' }}>4. AI Disclaimer & Governance</h3>
              <div style={{ padding: '14px 18px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', color: '#fbbf24', marginBottom: '1.25rem' }}>
                ⚠️ <strong>Important Career Simulation Advisory:</strong> TwinPath AI provides algorithmic decision intelligence, probabilistic career trajectories, and salary modeling based on statistical datasets and vector similarity.
              </div>

              <ul style={{ paddingLeft: '1.25rem', marginTop: 0 }}>
                <li><strong>No Placement Guarantee:</strong> TwinPath AI is an educational advisory tool and does not guarantee job offers, hiring decisions, or specific compensation tiers.</li>
                <li><strong>Not Financial or Legal Counsel:</strong> Simulated trajectories are computational forecasts and should not replace accredited academic advisors or professional legal/financial guidance.</li>
                <li><strong>Market Dynamics:</strong> Real-world macroeconomic conditions and corporate hiring cycles are subject to external fluctuations.</li>
              </ul>
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h3 style={{ color: '#fff', marginTop: 0, fontSize: '1.15rem' }}>5. Official Contact & Grievance Office</h3>
              <p>
                For data protection inquiries, GDPR compliance requests, or legal notices:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Data Protection & Legal</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.95rem' }}>legal@twinpath.ai</span>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Response SLA</span>
                  <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.95rem' }}>Within 48 Business Hours</span>
                </div>
              </div>

              <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                TwinPath AI (Decision Twin AI) — Developed with strict enterprise compliance, ethical AI transparency, and zero data compromise.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Effective Date: August 2026 • Version 1.0 Compliance
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
            }}
          >
            I Understand & Close
          </button>
        </div>
      </div>
    </div>
  );
};
