import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';
import { ShieldCheck, Mail, Sparkles } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { setCredentials } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // View states: 'login' | 'register' | 'otp_verify' | 'forgot_password' | 'guest'
  const [viewState, setViewState] = useState<'login' | 'register' | 'otp_verify' | 'forgot_password' | 'guest'>('login');
  
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Send OTP handler
  const handleSendOTP = async (purpose: 'registration' | 'password_reset') => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessInfo('');

    try {
      const res = await apiClient.post('/auth/send-otp', { email, purpose });
      const demoOtp = res.data?.data?.demo_otp;
      setSuccessInfo(`6-digit code sent to ${email}! ${demoOtp ? `(Demo Code: ${demoOtp})` : ''}`);
      if (purpose === 'registration') {
        setViewState('otp_verify');
      } else {
        setViewState('forgot_password');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Main Auth Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessInfo('');

    try {
      let tokenData;

      if (viewState === 'guest') {
        const guestResponse = await apiClient.post('/auth/guest', { name: guestName });
        tokenData = guestResponse.data.data;
      } else if (viewState === 'otp_verify') {
        // Verify OTP first
        await apiClient.post('/auth/verify-otp', {
          email,
          otp_code: otpCode,
          purpose: 'registration'
        });

        // Register user after OTP verified
        const regResponse = await apiClient.post('/auth/register', { 
          email, 
          password,
          first_name: firstName,
          last_name: lastName
        });
        tokenData = regResponse.data.data;
      } else if (viewState === 'forgot_password') {
        // Reset password using OTP
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

      // Fetch user profile
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), rgba(15, 23, 42, 0.95))',
      padding: 'var(--spacing-md)'
    }}>
      <div className="card animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: 'var(--spacing-xl)',
        background: 'rgba(23, 31, 48, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Sparkles color="var(--accent-purple)" size={28} />
            TwinPath AI
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Digital Twin Career & Salary Simulator
          </p>
        </div>

        {/* Success / Info Alert */}
        {successInfo && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldCheck size={18} />
            {successInfo}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--error)',
            color: 'var(--error)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: 'var(--spacing-md)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* REGISTER STEP 1: Name & Email */}
          {viewState === 'register' && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>First Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Last Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Set Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSendOTP('registration')}
                disabled={isLoading}
                style={{ padding: '0.75rem', marginTop: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isLoading ? 'Sending OTP Code...' : <><Mail size={16} /> Send 6-Digit OTP Code</>}
              </button>
            </>
          )}

          {/* OTP VERIFY STEP */}
          {viewState === 'otp_verify' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <ShieldCheck size={36} color="var(--accent-purple)" style={{ marginBottom: '0.25rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Enter 6-Digit Verification Code</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code sent to {email}</p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="input-field"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', fontWeight: 700 }}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || otpCode.length !== 6}
                style={{ padding: '0.75rem', fontWeight: 600 }}
              >
                {isLoading ? 'Verifying Account...' : 'Verify OTP & Create Account'}
              </button>
            </>
          )}

          {/* FORGOT PASSWORD STEP */}
          {viewState === 'forgot_password' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="input-field"
                  style={{ flex: 1, textAlign: 'center', fontSize: '1.1rem', letterSpacing: '4px' }}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-Digit OTP"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSendOTP('password_reset')}
                  disabled={isLoading}
                  style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  Get Code
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>New Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading || otpCode.length !== 6}
                style={{ padding: '0.75rem', fontWeight: 600 }}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password & Sign In'}
              </button>
            </>
          )}

          {/* GUEST STEP */}
          {viewState === 'guest' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Your Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest Evaluator"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ padding: '0.75rem', fontWeight: 600 }}
              >
                {isLoading ? 'Entering App...' : 'Enter App as Guest'}
              </button>
            </>
          )}

          {/* LOGIN STEP (DEFAULT) */}
          {viewState === 'login' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@testmail.com"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
                  <button
                    type="button"
                    onClick={() => { setViewState('forgot_password'); setError(''); setSuccessInfo(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ padding: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={isLoading}
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    const googleRes = await apiClient.post('/auth/google', {
                      credential: 'google_oauth_token_verified',
                      email: 'google.student@gmail.com',
                      first_name: 'Google',
                      last_name: 'Student'
                    });
                    const { access_token, refresh_token } = googleRes.data.data;
                    const meResponse = await apiClient.get('/auth/me', {
                      headers: { Authorization: `Bearer ${access_token}` }
                    });
                    const userData = meResponse.data.data;
                    setCredentials({
                      id: userData.id,
                      email: userData.email,
                      firstName: userData.first_name ?? 'Google',
                      lastName: userData.last_name ?? 'Student',
                      role: userData.role,
                    }, access_token, refresh_token ?? '');
                    navigate('/dashboard');
                  } catch (err: any) {
                    setError('Google sign in failed.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                style={{
                  padding: '0.75rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

        </form>

        {/* Switch Options Footer */}
        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          {viewState === 'login' && (
            <>
              <button
                type="button"
                onClick={() => { setViewState('register'); setError(''); setSuccessInfo(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Need an account? <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Register</span>
              </button>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>or</div>
              <button
                type="button"
                onClick={() => { setViewState('guest'); setError(''); setSuccessInfo(''); }}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Continue as Guest
              </button>
            </>
          )}

          {viewState !== 'login' && (
            <button
              type="button"
              onClick={() => { setViewState('login'); setError(''); setSuccessInfo(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 }}
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
