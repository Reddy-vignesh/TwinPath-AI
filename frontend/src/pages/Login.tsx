import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const { setCredentials } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let tokenData;

      if (isGuest) {
        const guestResponse = await apiClient.post('/auth/guest', { name: guestName });
        tokenData = guestResponse.data.data;
      } else if (isRegister) {
        const regResponse = await apiClient.post('/auth/register', { 
          email, 
          password,
          first_name: firstName,
          last_name: lastName
        });
        tokenData = regResponse.data.data;
      } else {
        const loginResponse = await apiClient.post('/auth/login', { email, password });
        tokenData = loginResponse.data.data;
      }

      const { access_token, refresh_token } = tokenData;

      // Fetch the real user profile using the token
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
      const detail = err.response?.data?.detail;
      const message = err.response?.data?.message;
      const validationErrors = detail && Array.isArray(detail)
        ? detail.map((d: any) => d.msg).join('. ')
        : null;
      setError(
        validationErrors || 
        message || 
        detail || 
        (isGuest ? 'Guest login failed' : isRegister ? 'Registration failed' : 'Login failed')
      );
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
      padding: 'var(--spacing-md)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow effects */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'var(--accent-blue)',
        filter: 'blur(150px)',
        opacity: 0.2,
        borderRadius: '50%'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '400px',
        height: '400px',
        background: 'var(--accent-purple)',
        filter: 'blur(150px)',
        opacity: 0.2,
        borderRadius: '50%'
      }} />

      <div className="card" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>
            TwinPath AI
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Digital Twin Career &amp; Salary Simulator</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            color: 'var(--error)',
            padding: 'var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--spacing-md)',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isGuest ? (
            <div className="input-group">
              <label className="input-label">Your Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Alex"
                required={isGuest}
              />
            </div>
          ) : (
            <>
              {isRegister && (
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">First Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required={isRegister}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Last Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required={isRegister}
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  required={!isGuest}
                />
              </div>
              
              <div className="input-group">
                <label className="input-label">Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={!isGuest}
                />
              </div>

              {isRegister && (
                <p style={{ 
                  color: 'var(--text-muted)', 
                  fontSize: '0.75rem', 
                  marginTop: '-4px',
                  marginBottom: 'var(--spacing-sm)',
                  paddingLeft: '2px'
                }}>
                  Min 8 chars: uppercase, lowercase, digit, and special character (!@#$...)
                </p>
              )}
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (isGuest ? 'Enter App as Guest' : isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
          {isGuest ? (
            <button 
              type="button"
              className="btn"
              style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem' }}
              onClick={() => {
                setIsGuest(false);
                setError('');
              }}
            >
              Back to Sign In
            </button>
          ) : (
            <>
              <button 
                type="button"
                className="btn"
                style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.875rem' }}
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
              >
                {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                margin: 'var(--spacing-md) 0',
                color: 'var(--text-muted)',
                fontSize: '0.875rem'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <span>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              </div>

              <button 
                type="button" 
                className="btn" 
                style={{ 
                  width: '100%', 
                  border: '1px dashed rgba(59, 130, 246, 0.4)', 
                  color: 'var(--accent-blue)', 
                  background: 'rgba(59, 130, 246, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setIsGuest(true);
                  setIsRegister(false);
                  setError('');
                }}
              >
                Continue as Guest
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
