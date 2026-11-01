import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserPlus, User, Mail, Lock, Shield, Bus } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/register', { ...formData, role: 'passenger' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check inputs.');
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
          to="/conductor/register"
          className="btn btn-outline"
          style={{ flex: 1, padding: '10px 8px', fontSize: '0.85rem', gap: '6px', border: 'none' }}
        >
          <Shield size={15} color="#f59e0b" /> Conductor
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '36px' }}>
        <div className="text-center mb-4">
          <div style={{ display: 'inline-flex', background: 'rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '50%', marginBottom: '14px' }}>
            <UserPlus size={32} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Create Passenger Account</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>
            Join PMPL Smart Pass to book & carry daily QR bus passes
          </p>
        </div>

        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '12px', color: '#f87171', marginBottom: '20px', textAlign: 'center', borderRadius: '8px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Full Legal Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
              <input
                type="text"
                name="name"
                className="input-field"
                placeholder="Chiranjiv Zope"
                value={formData.name}
                onChange={handleChange}
                required
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px', padding: '14px', background: '#10b981', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)', fontSize: '1.05rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up as Passenger'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '24px', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
