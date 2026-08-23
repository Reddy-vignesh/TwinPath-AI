import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie } from 'lucide-react';

interface CookieBannerProps {
  onOpenLegal: (tab: 'cookies') => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenLegal }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('twinpath_cookie_consent');
    if (!consent) {
      // Small delay for smooth entrance after page load
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('twinpath_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '720px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(11, 15, 23, 0.96) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            flexShrink: 0,
          }}
        >
          <Cookie size={18} />
        </div>
        <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.45, color: '#cbd5e1' }}>
          <strong>Cookie & Privacy Transparency:</strong> We use essential, encrypted httpOnly session cookies to secure your Digital Twin session. We never use ad trackers or sell user data.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onOpenLegal('cookies')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '8px 14px',
            color: '#94a3b8',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          Learn More
        </button>

        <button
          onClick={handleAccept}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '8px 16px',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(56, 189, 248, 0.3)',
          }}
        >
          <ShieldCheck size={14} />
          <span>Accept & Continue</span>
        </button>
      </div>
    </div>
  );
};
