import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api';
import { LogIn, Mail, Lock, User, Shield, Bus, ArrowRight } from 'lucide-react';

export default function Login() {
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

      const response = await api.post('/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify({
        email: response.data.email,
        name: response.data.name,
        role: response.data.role,
        conductor_badge: response.data.conductor_badge
      }));

      if (response.data.role === 'conductor') {
        navigate('/conductor/scan');
      } else {
        navigate('/passes');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '480px', marginTop: '2vh', paddingBottom: '40px' }}>
      {/* Role Switcher at top */}
      <div className="glass-panel" style={{ padding: '4px', marginBottom: '18px', display: 'flex', borderRadius: '12px' }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, padding: '10px 8px', fontSize: '0.85rem', gap: '6px' }}
        >
          <User size={15} /> Passenger
        </button>
        <Link
          to="/conductor/login"
          className="btn btn-outline"
          style={{ flex: 1, padding: '10px 8px', fontSize: '0.85rem', gap: '6px', border: 'none' }}
        >
          <Shield size={15} color="#f59e0b" /> Conductor
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '36px' }}>
        <div className="text-center mb-4">
          <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '50%', marginBottom: '14px' }}>
            <Bus size={32} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Passenger Sign In</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>
            Access your booked digital bus passes and QR tickets
          </p>
        </div>

        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '12px', color: '#f87171', marginBottom: '20px', textAlign: 'center', borderRadius: '8px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
              <input
                type="email"
                className="input-field"
                placeholder="passenger@example.com"
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
            style={{ width: '100%', marginTop: '16px', padding: '14px', fontSize: '1.05rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In as Passenger'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '24px', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            New commuter?{' '}
            <Link to="/register" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
              Create Passenger Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
