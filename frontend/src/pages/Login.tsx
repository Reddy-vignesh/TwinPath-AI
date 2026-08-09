import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import { X } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setCredentials, fetchUser } = useAuthStore();
  
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'otp' | 'guest' | 'forgot_email' | 'forgot_otp'>('none');
  const [otpCode, setOtpCode] = useState('');
  
  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

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

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
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
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 of Registration: Send OTP to user's email
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  // Step 2 of Registration: Verify OTP code & Create Account
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
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
        last_name
      });

      const tokenData = response.data.data || response.data;
      setCredentials(
        null,
        tokenData.access_token,
        tokenData.refresh_token || ''
      );
      await fetchUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid OTP code or registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Email/Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const tokenData = response.data.data || response.data;
      setCredentials(
        null,
        tokenData.access_token,
        tokenData.refresh_token || ''
      );
      await fetchUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Google OAuth Sign-In
  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
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

        const tokenData = response.data.data || response.data;
        setCredentials(
          null,
          tokenData.access_token,
          tokenData.refresh_token || ''
        );
        await fetchUser();
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || err.response?.data?.detail || 'Google sign-in failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google sign-in failed'),
  });

  // Guest Demo Mode
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const demoEmail = `guest_${Date.now()}@gmail.com`;
      const demoPassword = 'DemoPassword123!';
      const names = (username || 'Guest Evaluator').trim().split(' ');
      const first_name = names[0] || 'Guest';
      const last_name = names.slice(1).join(' ') || 'Evaluator';
      
      const registerRes = await apiClient.post('/auth/register', {
        email: demoEmail,
        password: demoPassword,
        first_name,
        last_name
      });

      const tokenData = registerRes.data.data || registerRes.data;
      setCredentials(
        null,
        tokenData.access_token,
        tokenData.refresh_token || ''
      );
      await fetchUser();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to create guest session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className={`animated-auth-container ${isRegistering ? 'active' : ''}`}>
        
        <div className="curved-shaped"></div>
        <div className="curved-shaped2"></div>

        {/* LOGIN FORM */}
        <div className="form-box Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 21 } as React.CSSProperties}>Login</h2>
          <form onSubmit={handleLoginSubmit}>
            <div className="input-box animation" style={{ '--D': 1, '--S': 22 } as React.CSSProperties}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <label>Email Address</label>
              <i className="bx bx-at"></i>
            </div>
            <div className="input-box animation" style={{ '--D': 2, '--S': 23 } as React.CSSProperties}>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <label>Password</label>
              <i className="bx bx-lock"></i>
            </div>
            <div className="animation" style={{ '--D': 3, '--S': 24 } as React.CSSProperties}>
              <button className="btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Wait...' : 'Login'}
              </button>
            </div>
            
            <div className="auth-aux-options animation" style={{ '--D': 4, '--S': 25 } as React.CSSProperties}>
              <a onClick={() => handleGoogleSignIn()} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Google
              </a>
              <a onClick={() => setActiveModal('guest')}>Guest Demo</a>
              <a onClick={() => { setError(''); setForgotSuccessMessage(''); setForgotEmail(email || ''); setActiveModal('forgot_email'); }}>Forgot Password?</a>
            </div>

            <div className="regi-link animation" style={{ '--D': 5, '--S': 26 } as React.CSSProperties}>
              <p>Don't have an account? <a onClick={() => setIsRegistering(true)}>signup</a></p>
            </div>
          </form>
        </div>

        <div className="info-content Login">
          <h2 className="animation" style={{ '--D': 0, '--S': 20 } as React.CSSProperties}>Welcome Back !</h2>
          <p className="animation" style={{ '--D': 1, '--S': 21 } as React.CSSProperties}>Enter your credentials to access your account.</p>
        </div>

        {/* REGISTER FORM */}
        <div className="form-box Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>Register</h2>
          <form onSubmit={handleRegisterSubmit}>
            <div className="input-box animation" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} />
              <label>Full Name</label>
              <i className="bx bx-user"></i>
            </div>
            <div className="input-box animation" style={{ '--li': 19, '--S': 2 } as React.CSSProperties}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <label>Official Email</label>
              <i className="bx bx-at"></i>
            </div>
            <div className="input-box animation" style={{ '--li': 20, '--S': 3 } as React.CSSProperties}>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <label>Password</label>
              <i className="bx bx-lock"></i>
            </div>
            <div className="animation" style={{ '--li': 21, '--S': 4 } as React.CSSProperties}>
              <button className="btn" type="submit" disabled={isLoading}>
                {isLoading ? 'Wait...' : 'Register'}
              </button>
            </div>
            <div className="regi-link animation" style={{ '--li': 22, '--S': 5 } as React.CSSProperties}>
              <p>Have an account? <a onClick={() => setIsRegistering(false)}>Sign In</a></p>
            </div>
          </form>
        </div>
        <div className="info-content Register">
          <h2 className="animation" style={{ '--li': 17, '--S': 0 } as React.CSSProperties}>Welcome</h2>
          <p className="animation" style={{ '--li': 18, '--S': 1 } as React.CSSProperties}>Join us today and unlock access to your personalized dashboard.</p>
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

              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>New Password</label>
                <input
                  type="password"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
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

    </div>
  );
}
