import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import { X } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setCredentials } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Panel toggle state: false = Login, true = Register
  const [isRegistering, setIsRegistering] = useState(false);

  // Overlay modal state: null | 'otp_verify' | 'forgot_password' | 'guest'
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
      if (!fullName.trim()) {
        setError('Please enter your full name.');
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

  // Main Auth Submit
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
          setError('Please enter your name for guest demo access.');
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

        const nameParts = fullName.trim().split(' ');
        const first_name = nameParts[0] || 'User';
        const last_name = nameParts.slice(1).join(' ') || 'User';

        const regResponse = await apiClient.post('/auth/register', {
          email,
          password,
          first_name,
          last_name
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw' }}>
      <div className={`animated-auth-container ${isRegistering ? 'active' : ''}`}>
        <div className="curved-shaped"></div>
        <div className="curved-shaped2"></div>

        {/* ── LOGIN FORM PANEL ───────────────────────────────────────────── */}
        <div className="form-box Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 21 } as React.CSSProperties}>Login</h2>

          {error && !activeModal && (
            <div style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              fontSize: '11px',
              marginTop: '10px'
            }}>
              {error}
            </div>
          )}

          {successInfo && !activeModal && (
            <div style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#6ee7b7',
              fontSize: '11px',
              marginTop: '10px'
            }}>
              {successInfo}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, 'login')}>
            <div className="input-box animation" style={{ '--D': 1, '--S': 22 } as React.CSSProperties}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email Address</label>
              <i className="bx bx-at"></i>
            </div>

            <div className="input-box animation" style={{ '--D': 2, '--S': 23 } as React.CSSProperties}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
              <i className="bx bx-lock"></i>
            </div>

            <div className="input-box animation" style={{ '--D': 3, '--S': 24 } as React.CSSProperties}>
              <button className="btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </div>

            <div className="auth-aux-options animation" style={{ '--D': 3, '--S': 24 } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => handleGoogleSignIn()}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setActiveModal('guest');
                }}
              >
                Guest Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessInfo('');
                  handleSendOTP('password_reset');
                }}
              >
                Forgot Password?
              </button>
            </div>

            <div className="regi-link animation" style={{ '--D': 4, '--S': 25 } as React.CSSProperties}>
              <p>
                Don't have an account?{' '}
                <a
                  href="#"
                  className="SignUpLink"
                  onClick={(e) => {
                    e.preventDefault();
                    setError('');
                    setSuccessInfo('');
                    setIsRegistering(true);
                  }}
                >
                  signup
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* ── LOGIN SIDE INFO CONTENT ────────────────────────────────────── */}
        <div className="info-content Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 20 } as React.CSSProperties}>
            Welcome Back !
          </h2>
          <p className="animation" style={{ '--D': 1, '--S': 21 } as React.CSSProperties}>
            Enter your credentials to access your account.
          </p>
        </div>

        {/* ── REGISTER FORM PANEL ────────────────────────────────────────── */}
        <div className="form-box Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>Register</h2>

          {error && !activeModal && (
            <div style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              fontSize: '11px',
              marginTop: '10px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, 'register_init')}>
            <div className="input-box animation" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <label>Full Name</label>
              <i className="bx bx-user"></i>
            </div>

            <div className="input-box animation" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Official Email</label>
              <i className="bx bx-at"></i>
            </div>

            <div className="input-box animation" style={{ '--li': 19, '--S': 2 } as React.CSSProperties}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
              <i className="bx bx-lock"></i>
            </div>

            <div className="input-box animation" style={{ '--li': 20, '--S': 3 } as React.CSSProperties}>
              <button className="btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Sending Code...' : 'Register'}
              </button>
            </div>

            <div className="regi-link animation" style={{ '--li': 21, '--S': 4 } as React.CSSProperties}>
              <p>
                Have an account?{' '}
                <a
                  href="#"
                  className="SignInLink"
                  onClick={(e) => {
                    e.preventDefault();
                    setError('');
                    setSuccessInfo('');
                    setIsRegistering(false);
                  }}
                >
                  Sign In
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* ── REGISTER SIDE INFO CONTENT ─────────────────────────────────── */}
        <div className="info-content Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>
            Welcome
          </h2>
          <p className="animation" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>
            Join us today and unlock access to your personalized dashboard.
          </p>
        </div>
      </div>

      {/* ── OVERLAY MODALS (OTP / Reset / Guest) ───────────────────────────── */}
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
          zIndex: 100
        }}>
          <div style={{
            background: '#111827',
            border: '2px solid #06b6d4',
            borderRadius: '16px',
            padding: '2rem',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 0 30px rgba(6, 182, 212, 0.4)',
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
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {error && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                fontSize: '12px',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            {successInfo && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#6ee7b7',
                fontSize: '12px',
                marginBottom: '1rem'
              }}>
                {successInfo}
              </div>
            )}

            {/* OTP VERIFY */}
            {activeModal === 'otp_verify' && (
              <form onSubmit={(e) => handleSubmit(e, 'otp_verify')}>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', textAlign: 'center' }}>Verify Email</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', textAlign: 'center' }}>
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>

                <div className="input-box" style={{ marginTop: '0', marginBottom: '20px' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.trim())}
                    style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '20px' }}
                  />
                  <label style={{ left: '50%', transform: 'translate(-50%, -50%)' }}>6-Digit OTP</label>
                </div>

                <button type="submit" className="btn" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Complete Registration'}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD */}
            {activeModal === 'forgot_password' && (
              <form onSubmit={(e) => handleSubmit(e, 'forgot_password')}>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', textAlign: 'center' }}>Reset Password</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', textAlign: 'center' }}>
                  Enter code sent to <strong>{email}</strong> and your new password.
                </p>

                <div className="input-box" style={{ marginTop: '0', marginBottom: '16px' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.trim())}
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '18px' }}
                  />
                  <label style={{ left: '50%', transform: 'translate(-50%, -50%)' }}>OTP Code</label>
                </div>

                <div className="input-box" style={{ marginTop: '16px', marginBottom: '20px' }}>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label>New Password</label>
                </div>

                <button type="submit" className="btn" style={{ width: '100%' }} disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset & Login'}
                </button>
              </form>
            )}

            {/* GUEST DEMO */}
            {activeModal === 'guest' && (
              <form onSubmit={(e) => handleSubmit(e, 'guest')}>
                <h3 style={{ fontSize: '18px', marginBottom: '8px', textAlign: 'center' }}>Guest Demo Access</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', textAlign: 'center' }}>
                  Try the career twin simulator immediately with a temporary profile.
                </p>

                <div className="input-box" style={{ marginTop: '0', marginBottom: '20px' }}>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                  <label>Display Name</label>
                </div>

                <button type="submit" className="btn" style={{ width: '100%' }} disabled={isLoading}>
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
