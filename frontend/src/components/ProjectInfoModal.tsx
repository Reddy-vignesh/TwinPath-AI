import { useState } from 'react';
import { Info, X, Sparkles, Cpu, ShieldCheck, Layers } from 'lucide-react';

interface ProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectInfoModal({ isOpen, onClose }: ProjectInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '20px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div 
        className="glass-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          position: 'relative',
          borderRadius: '24px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.3)',
          color: '#ffffff',
          animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* Close (X) Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#06b6d4',
            flexShrink: 0
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              About Decision Twin AI
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
              Predictive Simulation & Career Trajectory Modeling Engine
            </p>
          </div>
        </div>

        {/* Project Description */}
        <p style={{ fontSize: '0.92rem', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '24px' }}>
          <strong>Decision Twin AI</strong> is a next-generation predictive intelligence platform that creates a 
          personalized digital twin of your academic, skill, and career profile. It simulates complex real-world pathways 
          to give you data-driven probability forecasts and personalized recommendations.
        </p>

        {/* Key Features List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Cpu size={18} color="#06b6d4" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#38bdf8' }}>AI Digital Twin Engine</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Models your unique skills, traits, and background into a dynamic decision matrix.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <Layers size={18} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#a5b4fc' }}>What-If Scenario Simulation</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Simulate potential career shifts, university choices, and salary trajectories before taking action.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ShieldCheck size={18} color="#34d399" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#6ee7b7' }}>Privacy & Security</div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Enterprise-grade token encryption ensures your data remains 100% private and protected.
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ 
          paddingTop: '16px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: '#64748b' 
        }}>
          TwinPath AI v1.0 • Empowering Intelligent Decision Making
        </div>
      </div>
    </div>
  );
}

export function ProjectInfoFloatingTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="project-info-trigger-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: '9999px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          color: '#06b6d4',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(6, 182, 212, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 25px rgba(6, 182, 212, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(6, 182, 212, 0.3)';
        }}
      >
        <Info size={18} />
        <span>About Project</span>
      </button>

      <ProjectInfoModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
