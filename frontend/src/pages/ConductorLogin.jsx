import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { LogIn, Mail, Lock, Shield, User, Bus, CheckCircle2 } from 'lucide-react';

export default function ConductorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', password);

      const response = await api.post('/conductor/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        email: response.data.email,
        name: response.data.name,
        role: response.data.role,
        conductor_badge: response.data.conductor_badge
      }));

      navigate('/conductor/scan');
    } catch (err) {
      setError(err.response?.data?.detail || 'Conductor login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '480px', marginTop: '2vh', paddingBottom: '40px' }}>
      {/* Role Switcher at top */}
      <div className="glass-panel" style={{ padding: '4px', marginBottom: '18px', display: 'flex', borderRadius: '12px' }}>
        <Link
          to="/login"
          className="btn btn-outline"
          style={{ flex: 1, padding: '10px 8px', fontSize: '0.85rem', gap: '6px', border: 'none' }}
        >
          <User size={15} /> Passenger
        </Link>
        <button
          className="btn btn-primary"
          style={{ flex: 1, padding: '10px 8px', fontSize: '0.85rem', gap: '6px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: '#000000', fontWeight: 800 }}
        >
          <Shield size={15} color="#000000" /> Conductor
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '36px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
        <div className="text-center mb-4">
          <div style={{ display: 'inline-flex', background: 'rgba(245, 158, 11, 0.15)', padding: '16px', borderRadius: '50%', marginBottom: '14px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <Shield size={34} color="#f59e0b" />
          </div>
          <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Official Transit Staff
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>Conductor Sign In</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>
            Authorized portal for scanning and approving daily passenger passes
          </p>
        </div>

        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '12px', color: '#f87171', marginBottom: '20px', textAlign: 'center', borderRadius: '8px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Conductor Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
              <input
                type="email"
                className="input-field"
                placeholder="conductor@pmpl.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '14px',
              fontSize: '1.05rem',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000000',
              fontWeight: 800,
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating Officer...' : 'Sign In to Scanner'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '24px', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            New PMPL conductor?{' '}
            <Link to="/conductor/register" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
              Register Conductor Badge
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
