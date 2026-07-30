import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import { ShieldCheck, Sparkles, ArrowRight, CheckCircle2, AlertCircle, X, Mail, Lock, User, AtSign } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setCredentials } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Active panel toggle: false = Login view, true = Register view
  const [isRegistering, setIsRegistering] = useState(false);

  // Overlay modal states: null | 'otp_verify' | 'forgot_password' | 'guest'
  const [activeModal, setActiveModal] = useState<null | 'otp_verify' | 'forgot_password' | 'guest'>(null);

  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Send OTP handler
  const handleSendOTP = async (purpose: 'registration' | 'password_reset') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (purpose === 'registration') {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first name and last name before requesting the verification code.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
    }

    setIsLoading(true);
    setError('');
    setSuccessInfo('');

    try {
      const res = await apiClient.post('/auth/send-otp', { email, purpose });
      const demoOtp = res.data?.data?.demo_otp;
      const emailError = res.data?.data?.email_error;

      if (emailError) {
        setError(`OTP created but email failed to send: ${emailError}`);
        return;
      }

      setSuccessInfo(`6-digit code sent to ${email}! Check your inbox. ${demoOtp ? `(Demo Code: ${demoOtp})` : ''}`);
      if (purpose === 'registration') {
        setActiveModal('otp_verify');
      } else {
        setActiveModal('forgot_password');
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Failed to send verification code. Please try again.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Main Auth Submit for Login / Register / OTP / Reset / Guest
  const handleSubmit = async (e: React.FormEvent, mode: 'login' | 'register_init' | 'otp_verify' | 'forgot_password' | 'guest') => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessInfo('');

    try {
      let tokenData;

      if (mode === 'register_init') {
        await handleSendOTP('registration');
        return;
      }

      if (mode === 'guest') {
        if (!guestName.trim()) {
          setError('Please enter your display name to continue as guest.');
          setIsLoading(false);
          return;
        }
        const guestResponse = await apiClient.post('/auth/guest', { name: guestName });
        tokenData = guestResponse.data.data;
      } else if (mode === 'otp_verify') {
        await apiClient.post('/auth/verify-otp', {
          email,
          otp_code: otpCode,
          purpose: 'registration'
        });

        const regResponse = await apiClient.post('/auth/register', {
          email,
          password,
          first_name: firstName,
          last_name: lastName
        });
        tokenData = regResponse.data.data;
      } else if (mode === 'forgot_password') {
        await apiClient.post('/auth/reset-password', {
          email,
          otp_code: otpCode,
          new_password: password
        });

        setSuccessInfo('Password reset successfully! Logging you in...');
        const loginResponse = await apiClient.post('/auth/login', { email, password });
        tokenData = loginResponse.data.data;
      } else {
        const loginResponse = await apiClient.post('/auth/login', { email, password });
        tokenData = loginResponse.data.data;
      }

      const { access_token, refresh_token } = tokenData;

      const meResponse = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const userData = meResponse.data.data;
      setCredentials({
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name ?? userData.firstName ?? '',
        lastName: userData.last_name ?? userData.lastName ?? '',
        role: userData.role,
      }, access_token, refresh_token ?? '');

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse: any) => {
      setIsLoading(true);
      setError('');
      try {
        const googleUserInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        }).then(res => res.json());

        const googleRes = await apiClient.post('/auth/google', {
          credential: tokenResponse.access_token,
          email: googleUserInfo.email,
          first_name: googleUserInfo.given_name || 'Google',
          last_name: googleUserInfo.family_name || 'User'
        });

        const { access_token, refresh_token } = googleRes.data.data;
        const meResponse = await apiClient.get('/auth/me', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        const userData = meResponse.data.data;

        setCredentials({
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name ?? googleUserInfo.given_name ?? 'Google',
          lastName: userData.last_name ?? googleUserInfo.family_name ?? 'User',
          role: userData.role,
        }, access_token, refresh_token ?? '');

        navigate('/dashboard');
      } catch (err: any) {
        console.error('Google Auth Error:', err);
        const detailMsg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || '';
        setError(`Google sign in failed: ${detailMsg || 'Please try again.'}`);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google OAuth Popup Error:', errorResponse);
      setError('Google sign in popup failed or was closed.');
    }
  });

  return (
    <div className="auth-wrapper">
      <div className={`animated-auth-container ${isRegistering ? 'active' : ''}`}>
        <div className="curved-shaped"></div>
        <div className="curved-shaped2"></div>

        {/* ── LOGIN FORM PANEL ───────────────────────────────────────────── */}
        <div className="form-box Login">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)'
            }}>
              <ShieldCheck size={18} color="#fff" />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: '#fff' }}>
              TwinPath <span className="text-gradient">AI</span>
            </span>
          </div>

          <h2 style={{ fontSize: '24px', color: '#fff' }}>Login</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
            Enter your credentials to access your account.
          </p>

          {error && !activeModal && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {successInfo && !activeModal && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px'
            }}>
              <CheckCircle2 size={14} />
              <span>{successInfo}</span>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, 'login')}>
            <div className="animated-input-box">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email Address</label>
              <Mail size={16} className="input-icon" />
            </div>

            <div className="animated-input-box">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
              <Lock size={16} className="input-icon" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessInfo('');
                  handleSendOTP('password_reset');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Social & Guest Buttons */}
          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            className="auth-btn-google"
            disabled={isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setError('');
                setActiveModal('guest');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ⚡ Explore as Guest (Quick Demo)
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Don't have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setError('');
                  setSuccessInfo('');
                  setIsRegistering(true);
                }}
                style={{ color: 'var(--accent-cyan)', fontWeight: '600', textDecoration: 'none' }}
              >
                Register Now
              </a>
            </p>
          </div>
        </div>

        {/* ── LOGIN SIDE INFO CONTENT ────────────────────────────────────── */}
        <div className="info-content Login">
          <h2>Welcome Back !</h2>
          <p>
            Enter your credentials to access your account and explore your digital career twin trajectory.
          </p>
        </div>

        {/* ── REGISTER FORM PANEL ────────────────────────────────────────── */}
        <div className="form-box Register">
          <h2 style={{ fontSize: '24px', color: '#fff' }}>Register</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
            Join us today and unlock access to your personalized dashboard.
          </p>

          {error && !activeModal && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px'
            }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, 'register_init')}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="animated-input-box" style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <label>First Name</label>
                <User size={16} className="input-icon" />
              </div>

              <div className="animated-input-box" style={{ marginTop: '10px' }}>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <label>Last Name</label>
                <User size={16} className="input-icon" />
              </div>
            </div>

            <div className="animated-input-box" style={{ marginTop: '14px' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Official Email Address</label>
              <AtSign size={16} className="input-icon" />
            </div>

            <div className="animated-input-box" style={{ marginTop: '14px' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password (min 8 chars)</label>
              <Lock size={16} className="input-icon" />
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Sending Code...' : 'Get Verification Code'}
              <Sparkles size={16} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setError('');
                  setSuccessInfo('');
                  setIsRegistering(false);
                }}
                style={{ color: 'var(--accent-cyan)', fontWeight: '600', textDecoration: 'none' }}
              >
                Sign In
              </a>
            </p>
          </div>
        </div>

        {/* ── REGISTER SIDE INFO CONTENT ─────────────────────────────────── */}
        <div className="info-content Register">
          <h2>Welcome</h2>
          <p>
            Join us today and unlock access to your personalized dashboard and career twin.
          </p>
        </div>
      </div>

      {/* ── OVERLAY MODALS (OTP Verification / Password Reset / Guest) ─────── */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            background: '#111827',
            border: '2px solid var(--accent-cyan)',
            borderRadius: '20px',
            padding: '2rem',
            width: '420px',
            maxWidth: '100%',
            boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
            position: 'relative'
          }}>
            <button
              onClick={() => setActiveModal(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {successInfo && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#6ee7b7',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '1rem'
              }}>
                <CheckCircle2 size={16} />
                <span>{successInfo}</span>
              </div>
            )}

            {/* OTP VERIFY MODAL */}
            {activeModal === 'otp_verify' && (
              <form onSubmit={(e) => handleSubmit(e, 'otp_verify')}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>
                  Verify Your Email
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>

                <div className="animated-input-box" style={{ marginTop: '0', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.trim())}
                    style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '20px', fontWeight: '700' }}
                  />
                  <label style={{ left: '50%', transform: 'translate(-50%, -50%)' }}>6-Digit OTP Code</label>
                </div>

                <button type="submit" className="auth-btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Complete Registration'}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD MODAL */}
            {activeModal === 'forgot_password' && (
              <form onSubmit={(e) => handleSubmit(e, 'forgot_password')}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>
                  Reset Your Password
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Enter the code sent to <strong>{email}</strong> and your new password.
                </p>

                <div className="animated-input-box" style={{ marginTop: '0', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.trim())}
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: '700' }}
                  />
                  <label style={{ left: '50%', transform: 'translate(-50%, -50%)' }}>6-Digit OTP Code</label>
                </div>

                <div className="animated-input-box" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label>New Password (min 8 chars)</label>
                </div>

                <button type="submit" className="auth-btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Resetting Password...' : 'Reset & Log In'}
                </button>
              </form>
            )}

            {/* GUEST LOGIN MODAL */}
            {activeModal === 'guest' && (
              <form onSubmit={(e) => handleSubmit(e, 'guest')}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#fff' }}>
                  Guest Demo Access
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Try the career twin simulator immediately with a temporary guest profile.
                </p>

                <div className="animated-input-box" style={{ marginTop: '0', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                  <label>Your Display Name</label>
                </div>

                <button type="submit" className="auth-btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Creating Demo...' : 'Enter Dashboard'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
