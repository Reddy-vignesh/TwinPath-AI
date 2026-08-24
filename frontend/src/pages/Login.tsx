import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import { X } from 'lucide-react';
import Loader from '../components/Loader';
import { ProjectInfoFloatingTrigger } from '../components/ProjectInfoModal';
import { LegalModal, type LegalTab } from '../components/LegalModal';
import loginBg from '../assets/login-bg.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { setCredentials, fetchUser } = useAuthStore();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEnteringWeb, setIsEnteringWeb] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // UI states
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'otp' | 'guest' | 'forgot_email' | 'forgot_otp'>('none');
  const [otpCode, setOtpCode] = useState('');
  
  // Anti-bot security telemetry
  const [formTs] = useState<number>(() => Date.now());
  const [honeypot, setHoneypot] = useState('');

  // Legal & Compliance Center states
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('privacy');
  const [termsAccepted, setTermsAccepted] = useState(true);

  const openLegal = (tab: LegalTab) => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };
  
  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  const renderWaveLabel = (text: string) => (
    <label>
      {text.split('').map((char, i) => (
        <span key={i} style={{ transitionDelay: `${i * 50}ms` }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </label>
  );

  // Forgot Password Step 1: Send OTP code
  const handleSendForgotOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotSuccessMessage('');
    setIsLoading(true);

    try {
      await apiClient.post('/auth/send-otp', { email: forgotEmail, purpose: 'password_reset' });
      setOtpCode('');
      setActiveModal('forgot_otp');
      setForgotSuccessMessage(`Verification code sent to ${forgotEmail}. Please check your email.`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Step 2: Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        email: forgotEmail,
        otp_code: otpCode,
        new_password: newPassword,
      });

      setForgotSuccessMessage('Password reset successfully! You can now log in with your new password.');
      setEmail(forgotEmail);
      setPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setActiveModal('none');
    } catch (err: any) {
      let msg = 'Failed to reset password.';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.message) {
          msg = data.message;
        } else if (data.detail) {
          if (Array.isArray(data.detail)) {
            msg = data.detail.map((d: any) => d.msg).join(', ');
          } else {
            msg = data.detail;
          }
        }
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 of Registration: Send OTP to user's email
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to create your account.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/send-otp', { email, purpose: 'registration' });
      setActiveModal('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Registration failed or disposable email blocked.');
    } finally {
      setIsLoading(false);
    }
  };

  // Optimized transition to dashboard with instant responsiveness
  const transitionToDashboard = async (authCall: () => Promise<any>) => {
    setIsLoading(true);
    try {
      // 1. Perform the authentication call
      const tokenData = await authCall();
      
      // 2. Auth succeeded! Show entering animation briefly
      setIsEnteringWeb(true);
      
      // 3. Set credentials in global store
      const userObj = tokenData.user || null;
      setCredentials(
        userObj,
        tokenData.access_token,
        tokenData.refresh_token || ''
      );

      // 4. Background non-blocking profile sync if user not returned directly
      if (!userObj) {
        fetchUser().catch(() => {});
      }
      
      // 5. Rich, smooth 1200ms holographic entrance animation to dashboard
      await new Promise(resolve => setTimeout(resolve, 1200));
      navigate('/dashboard');
    } catch (err: any) {
      setIsEnteringWeb(false);
      let msg = 'Invalid credentials or authentication failed.';
      if (err.response?.data) {
        const data = err.response.data;
        if (data.message) {
          msg = data.message;
        } else if (data.detail) {
          if (Array.isArray(data.detail)) {
            msg = data.detail.map((d: any) => d.msg || d.message).join(', ');
          } else {
            msg = data.detail;
          }
        } else if (data.error) {
          msg = data.error;
        }
      } else if (err.message && err.message !== 'Network Error') {
        msg = err.message;
      } else if (!err.response) {
        msg = 'Invalid credentials or unable to reach server. Please check your credentials.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 of Registration: Verify OTP code & Create Account
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    await transitionToDashboard(async () => {
      // 1. Verify 6-digit OTP code with backend
      await apiClient.post('/auth/verify-otp', {
        email,
        otp_code: otpCode,
        purpose: 'registration'
      });

      // 2. Register account with first & last name
      const names = (username || email.split('@')[0]).trim().split(' ');
      const first_name = names[0] || 'User';
      const last_name = names.slice(1).join(' ') || 'Student';

      const response = await apiClient.post('/auth/register', {
        email,
        password,
        first_name,
        last_name,
        website_url: honeypot || undefined,
        form_ts: formTs,
      });

      return response.data.data || response.data;
    });
  };

  // Standard Email/Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    await transitionToDashboard(async () => {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        website_url: honeypot || undefined,
        form_ts: formTs,
      });

      return response.data.data || response.data;
    });
  };

  // 1-Click Google OAuth Sign-In
  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      await transitionToDashboard(async () => {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        const names = (userInfo.name || '').trim().split(' ');
        const first_name = userInfo.given_name || names[0] || 'Google';
        const last_name = userInfo.family_name || names.slice(1).join(' ') || 'User';

        const response = await apiClient.post('/auth/google', {
          credential: tokenResponse.access_token,
          email: userInfo.email,
          first_name,
          last_name
        });

        return response.data.data || response.data;
      });
    },
    onError: () => setError('Google sign-in failed'),
  });

  // 1-Click Pre-Loaded Showcase Demo Mode
  const handleShowcaseDemoSubmit = async () => {
    setError('');
    await transitionToDashboard(async () => {
      const demoRes = await apiClient.post('/auth/demo');
      return demoRes.data.data || demoRes.data;
    });
  };

  // Guest Demo Mode
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    await transitionToDashboard(async () => {
      const guestRes = await apiClient.post('/auth/guest', {
        name: username.trim() || 'Guest Evaluator',
      });
      return guestRes.data.data || guestRes.data;
    });
  };

  if (isEnteringWeb) {
    return <Loader message="ENTERING TWINPATH AI ENGINE..." />;
  }

  return (
    <div 
      className="rain-bg-container"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#080C14'
      }}
    >
      <div className={`animated-auth-container ${isRegistering ? 'active' : ''}`}>
        
        <div className="curved-shaped"></div>
        <div className="curved-shaped2"></div>

        {/* LOGIN FORM */}
        <div className="form-box Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 21 } as React.CSSProperties}>TwinPath AI - Login</h2>
          <form onSubmit={handleLoginSubmit}>
            {/* Invisible Anti-Bot Honeypot Trap */}
            <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="input-box animation" style={{ '--D': 1, '--S': 22 } as React.CSSProperties}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              {renderWaveLabel('Email Address')}
              <i className="bx bx-at"></i>
            </div>

            <div className="input-box animation" style={{ '--D': 2, '--S': 23 } as React.CSSProperties}>
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
              {renderWaveLabel('Password')}
              <a 
                className="btn-forgot inline-forgot" 
                onClick={() => { setError(''); setForgotSuccessMessage(''); setForgotEmail(email || ''); setActiveModal('forgot_email'); }}
              >
                Forgot Password?
              </a>
              <button 
                type="button" 
                className={`toggle-btn ${showPassword ? 'active' : ''}`} 
                onClick={() => setShowPassword(!showPassword)} 
                aria-label="Toggle Password Visibility"
              >
                <svg className="eye-icon" viewBox="0 0 24 24">
                  <path className="eye-open-lid" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle className="pupil" cx="12" cy="12" r="3"></circle>
                  <path className="eye-closed-lid" d="M2 10c2.5 3 6 5 10 5s7.5-2 10-5"></path>
                  <g className="eye-lashes">
                    <line x1="4" y1="13" x2="2" y2="16"></line>
                    <line x1="8.5" y1="15" x2="7.5" y2="18.5"></line>
                    <line x1="12" y1="15.5" x2="12" y2="19.5"></line>
                    <line x1="15.5" y1="15" x2="16.5" y2="18.5"></line>
                    <line x1="20" y1="13" x2="22" y2="16"></line>
                  </g>
                </svg>
              </button>
            </div>

            <div className="animation" style={{ '--D': 3, '--S': 24 } as React.CSSProperties}>
              <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem' }}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>

            {/* Dedicated 1-Click Pre-Loaded Showcase Demo Button */}
            <div className="animation" style={{ '--D': 3.5, '--S': 24.5, marginTop: '10px' } as React.CSSProperties}>
              <button
                type="button"
                onClick={handleShowcaseDemoSubmit}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(147,51,234,0.25) 100%)',
                  border: '1px solid rgba(168,85,247,0.5)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 0 15px rgba(147,51,234,0.2)',
                  transition: 'all 0.25s ease',
                }}
              >
                <span>🚀 Explore Pre-Loaded Showcase Demo</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 500 }}>(1-Click)</span>
              </button>
            </div>
            
            {/* Neon Glowing OR Divider */}
            <div className="auth-or-divider animation" style={{ '--D': 4, '--S': 25 } as React.CSSProperties}>
              <span>OR</span>
            </div>

            {/* Prismatic Shimmer Google & Holographic Guest Buttons */}
            <div className="auth-aux-container animation" style={{ '--D': 5, '--S': 26 } as React.CSSProperties}>
              <button 
                type="button" 
                className="btn-google" 
                onClick={() => handleGoogleSignIn()}
              >
                <svg className="g-logo" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>

              <button 
                type="button" 
                className="btn-guest" 
                onClick={() => setActiveModal('guest')}
              >
                <span>Login as Guest</span>
              </button>
            </div>
          </form>
        </div>

        {/* REGISTER FORM */}
        <div className="form-box Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>Register</h2>
          <form onSubmit={handleRegisterSubmit}>
            {/* Invisible Anti-Bot Honeypot Trap */}
            <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }} aria-hidden="true">
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="input-box animation" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} />
              {renderWaveLabel('Full Name')}
              <i className="bx bx-user"></i>
            </div>
            <div className="input-box animation" style={{ '--li': 19, '--S': 2 } as React.CSSProperties}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              {renderWaveLabel('Official Email')}
              <i className="bx bx-at"></i>
            </div>
            <div className="input-box animation" style={{ '--li': 20, '--S': 3 } as React.CSSProperties}>
              <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} />
              {renderWaveLabel('Password')}
              <button 
                type="button" 
                className={`toggle-btn ${showPassword ? 'active' : ''}`} 
                onClick={() => setShowPassword(!showPassword)} 
                aria-label="Toggle Password Visibility"
              >
                <svg className="eye-icon" viewBox="0 0 24 24">
                  <path className="eye-open-lid" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle className="pupil" cx="12" cy="12" r="3"></circle>
                  <path className="eye-closed-lid" d="M2 10c2.5 3 6 5 10 5s7.5-2 10-5"></path>
                  <g className="eye-lashes">
                    <line x1="4" y1="13" x2="2" y2="16"></line>
                    <line x1="8.5" y1="15" x2="7.5" y2="18.5"></line>
                    <line x1="12" y1="15.5" x2="12" y2="19.5"></line>
                    <line x1="15.5" y1="15" x2="16.5" y2="18.5"></line>
                    <line x1="20" y1="13" x2="22" y2="16"></line>
                  </g>
                </svg>
              </button>
            </div>
            {/* Terms and Privacy Agreement Checkbox */}
            <div
              className="animation"
              style={{
                '--li': 20.5,
                '--S': 3.5,
                margin: '12px 0 16px 0',
                padding: '10px 12px',
                background: 'rgba(15, 23, 42, 0.55)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                textAlign: 'left',
              } as React.CSSProperties}
            >
              <input
                type="checkbox"
                id="terms-check"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: '#38bdf8',
                  width: '16px',
                  height: '16px',
                  flexShrink: 0,
                }}
              />
              <label
                htmlFor="terms-check"
                style={{
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                  lineHeight: 1.45,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                I agree to the{' '}
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openLegal('terms');
                  }}
                  style={{
                    color: '#38bdf8',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Terms of Service
                </span>
                ,{' '}
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openLegal('privacy');
                  }}
                  style={{
                    color: '#38bdf8',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Privacy Policy
                </span>
                , &{' '}
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openLegal('disclaimer');
                  }}
                  style={{
                    color: '#38bdf8',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    textUnderlineOffset: '2px',
                  }}
                >
                  AI Disclaimer
                </span>.
              </label>
            </div>

            <div className="animation" style={{ '--li': 21, '--S': 4 } as React.CSSProperties}>
              <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem' }}>
                {isLoading ? 'Creating Account...' : 'Register'}
              </button>
            </div>
          </form>
        </div>

        {/* WELCOME TILT PANELS & TEXT */}
        <div className="info-content Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 20 } as React.CSSProperties}>NEW JOURNEY?</h2>
          <h3 className="animation panel-subtitle" style={{ '--D': 1, '--S': 21 } as React.CSSProperties}>Build Your AI Twin</h3>
          <p className="animation panel-desc" style={{ '--D': 2, '--S': 22 } as React.CSSProperties}>Unlock intelligent simulation and predictive decision modeling in seconds.</p>
          <div className="animation" style={{ '--D': 3, '--S': 23 } as React.CSSProperties}>
            <button 
              type="button" 
              className="glass-pill-aura-btn" 
              onClick={() => setIsRegistering(true)}
            >
              SIGN UP
            </button>
          </div>
        </div>

        <div className="info-content Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>WELCOME BACK!</h2>
          <h3 className="animation panel-subtitle" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>Sync Your Twin</h3>
          <p className="animation panel-desc" style={{ '--li': 19, '--S': 2 } as React.CSSProperties}>Enter your credentials to re-sync with your Decision AI Engine.</p>
          <div className="animation" style={{ '--li': 20, '--S': 3 } as React.CSSProperties}>
            <button 
              type="button" 
              className="glass-pill-aura-btn" 
              onClick={() => setIsRegistering(false)}
            >
              SIGN IN
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS SNACKBAR */}
      {forgotSuccessMessage && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--success)', padding: '1rem 1.25rem', borderRadius: '8px', zIndex: 1000, color: 'white', display: 'flex', justifyContent: 'space-between', gap: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <span>{forgotSuccessMessage}</span>
          <button onClick={() => setForgotSuccessMessage('')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16}/></button>
        </div>
      )}

      {/* ERROR SNACKBAR */}
      {error && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'var(--error)', padding: '1rem 1.25rem', borderRadius: '8px', zIndex: 1000, color: 'white', display: 'flex', justifyContent: 'space-between', gap: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16}/></button>
        </div>
      )}

      {/* Floating About Project Button & Modal */}
      <ProjectInfoFloatingTrigger />

      {/* OTP MODAL (REGISTRATION) */}
      {activeModal === 'otp' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 13, 22, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', border: '1px solid var(--accent-blue)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--accent-blue)', marginBottom: '1rem' }}>Enter Verification Code</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>We sent a 6-digit code to <strong>{email}</strong>.</p>
            <form onSubmit={handleVerifyOTP}>
              <input type="text" required maxLength={6} style={{ width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--accent-blue)', color: 'white', fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center', borderRadius: '8px', outline: 'none', marginBottom: '1.5rem' }} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={otpCode.length !== 6 || isLoading}>{isLoading ? 'Verifying...' : 'Verify'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GUEST MODAL */}
      {activeModal === 'guest' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 13, 22, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px', border: '1px solid var(--accent-purple)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--accent-purple)', marginBottom: '1rem' }}>Explore TwinPath AI (Guest Mode)</h3>
            <form onSubmit={handleGuestSubmit}>
              <input type="text" required style={{ width: '100%', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--accent-purple)', color: 'white', borderRadius: '8px', outline: 'none', marginBottom: '1.5rem' }} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your Name (e.g. Alex Morgan)" />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--accent-purple)', color: 'white' }} disabled={isLoading}>{isLoading ? 'Launching Demo...' : 'Start Guest Demo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD STEP 1: ENTER EMAIL */}
      {activeModal === 'forgot_email' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 13, 22, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '420px', border: '1px solid var(--accent-blue)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--accent-blue)', marginBottom: '0.75rem' }}>Reset Password</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Enter your registered email address below. We'll send you a 6-digit verification code to reset your password.
            </p>
            <form onSubmit={handleSendForgotOTP}>
              <input
                type="email"
                required
                style={{ width: '100%', padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--accent-blue)', color: 'white', borderRadius: '8px', outline: 'none', marginBottom: '1.5rem', fontSize: '0.95rem' }}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="temporaryymail001@gmail.com"
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={!forgotEmail || isLoading}>
                  {isLoading ? 'Sending Code...' : 'Send Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD STEP 2: VERIFY OTP & RESET */}
      {activeModal === 'forgot_otp' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 13, 22, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '440px', border: '1px solid var(--accent-blue)', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>Set New Password</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              Enter the 6-digit code sent to <strong>{forgotEmail}</strong> and your new password.
            </p>
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem', textAlign: 'left' }}>6-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--accent-blue)', color: 'white', fontSize: '1.4rem', letterSpacing: '8px', textAlign: 'center', borderRadius: '8px', outline: 'none' }}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                />
              </div>

              <div style={{ marginBottom: '1rem', textAlign: 'left', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
                <button 
                  type="button" 
                  className={`toggle-btn ${showNewPassword ? 'active' : ''}`} 
                  style={{ top: '65%' }}
                  onClick={() => setShowNewPassword(!showNewPassword)} 
                  aria-label="Toggle Password Visibility"
                >
                  <svg className="eye-icon" viewBox="0 0 24 24">
                    <path className="eye-open-lid" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle className="pupil" cx="12" cy="12" r="3"></circle>
                    <path className="eye-closed-lid" d="M2 10c2.5 3 6 5 10 5s7.5-2 10-5"></path>
                    <g className="eye-lashes">
                      <line x1="4" y1="13" x2="2" y2="16"></line>
                      <line x1="8.5" y1="15" x2="7.5" y2="18.5"></line>
                      <line x1="12" y1="15.5" x2="12" y2="19.5"></line>
                      <line x1="15.5" y1="15" x2="16.5" y2="18.5"></line>
                      <line x1="20" y1="13" x2="22" y2="16"></line>
                    </g>
                  </svg>
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem', textAlign: 'left', position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Confirm New Password</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
                <button 
                  type="button" 
                  className={`toggle-btn ${showNewPassword ? 'active' : ''}`} 
                  style={{ top: '65%' }}
                  onClick={() => setShowNewPassword(!showNewPassword)} 
                  aria-label="Toggle Password Visibility"
                >
                  <svg className="eye-icon" viewBox="0 0 24 24">
                    <path className="eye-open-lid" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle className="pupil" cx="12" cy="12" r="3"></circle>
                    <path className="eye-closed-lid" d="M2 10c2.5 3 6 5 10 5s7.5-2 10-5"></path>
                    <g className="eye-lashes">
                      <line x1="4" y1="13" x2="2" y2="16"></line>
                      <line x1="8.5" y1="15" x2="7.5" y2="18.5"></line>
                      <line x1="12" y1="15.5" x2="12" y2="19.5"></line>
                      <line x1="15.5" y1="15" x2="16.5" y2="18.5"></line>
                      <line x1="20" y1="13" x2="22" y2="16"></line>
                    </g>
                  </svg>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setActiveModal('none')}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={otpCode.length !== 6 || !newPassword || isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL LEGAL FOOTER BAR */}
      <footer
        style={{
          position: 'fixed',
          bottom: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '0.74rem',
          color: '#64748b',
          zIndex: 10,
          background: 'rgba(11, 15, 23, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '7px 22px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        }}
      >
        <button onClick={() => openLegal('privacy')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 'inherit', fontWeight: 500, padding: 0 }}>Privacy Policy</button>
        <span style={{ opacity: 0.4 }}>•</span>
        <button onClick={() => openLegal('terms')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 'inherit', fontWeight: 500, padding: 0 }}>Terms of Service</button>
        <span style={{ opacity: 0.4 }}>•</span>
        <button onClick={() => openLegal('cookies')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 'inherit', fontWeight: 500, padding: 0 }}>Cookie Policy</button>
        <span style={{ opacity: 0.4 }}>•</span>
        <button onClick={() => openLegal('disclaimer')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 'inherit', fontWeight: 500, padding: 0 }}>AI Disclaimer</button>
        <span style={{ opacity: 0.4 }}>•</span>
        <button onClick={() => openLegal('contact')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 'inherit', fontWeight: 500, padding: 0 }}>Contact</button>
      </footer>

      {/* LEGAL & COMPLIANCE MODAL (Triggered on demand via footer or register link) */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

    </div>
  );
}
