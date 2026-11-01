import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Shield, User, Mail, Lock, BadgeCheck, Bus } from 'lucide-react';

export default function ConductorRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    conductor_badge: ''
  });
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
      await api.post('/conductor/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'conductor',
        conductor_badge: formData.conductor_badge.trim() || 'PMPL-C101'
      });
      navigate('/conductor/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Conductor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '480px', marginTop: '2vh', paddingBottom: '40px' }}>
      {/* Role Switcher at top */}
      <div className="glass-panel" style={{ padding: '4px', marginBottom: '18px', display: 'flex', borderRadius: '12px' }}>
        <Link
          to="/register"
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
            Officer Enrolment
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px' }}>Register Conductor</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.95rem' }}>
            Register as a PMPL staff conductor for QR scanning & daily pass approval
          </p>
        </div>

        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '12px', color: '#f87171', marginBottom: '20px', textAlign: 'center', borderRadius: '8px', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Conductor Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
              <input
                type="text"
                name="name"
                className="input-field"
                placeholder="Ramesh Patil"
                value={formData.name}
                onChange={handleChange}
                required
                style={{ paddingLeft: '42px' }}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Official Conductor Badge ID</label>
            <div style={{ position: 'relative' }}>
              <BadgeCheck size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#f59e0b' }} />
              <input
                type="text"
                name="conductor_badge"
                className="input-field"
                placeholder="e.g. PMPL-C102"
                value={formData.conductor_badge}
                onChange={handleChange}
                required
                style={{ paddingLeft: '42px', letterSpacing: '1px', fontWeight: 600 }}
              />
            </div>
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
              Issued by PMPL Bus Transit Authority.
            </small>
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder="conductor@pmpl.org"
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
            {loading ? 'Registering Badge...' : 'Create Conductor Account'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '24px', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Already registered officer?{' '}
            <Link to="/conductor/login" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
              Sign in to Scanner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
