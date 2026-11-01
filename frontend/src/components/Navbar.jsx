import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bus, LogOut, User, Ticket, Home, LayoutDashboard, QrCode, Shield, Menu, X } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem('token');
  
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  const isConductor = user?.role === 'conductor';
  const isAuthenticated = !!token;

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', flexShrink: 0 }}>
            <Bus size={20} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.5px', color: '#f8fafc', lineHeight: 1.2 }}>
              PMPL <span className="text-gradient">SmartPass</span>
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Transit Portal
            </span>
          </div>
        </Link>
        
        {/* Desktop Links (>= 860px) */}
        <div className="nav-links-desktop">
          <Link to="/" className={`nav-link ${isActive('/')}`}>
            <Home size={17} /> Home
          </Link>

          {isAuthenticated ? (
            <>
              {isConductor ? (
                <>
                  <Link to="/conductor/scan" className={`nav-link ${isActive('/conductor/scan')}`} style={{ color: '#fbbf24', fontWeight: 600 }}>
                    <QrCode size={17} /> Scanner & Approval
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#fbbf24' }}>
                    <Shield size={14} />
                    <span>{user.name} ({user.conductor_badge || 'Conductor'})</span>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/passes" className={`nav-link ${isActive('/passes')}`}>
                    <Ticket size={17} /> Passes
                  </Link>
                  <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings')}`}>
                    <LayoutDashboard size={17} /> My Digital Passes
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#93c5fd' }}>
                    <User size={14} />
                    <span>{user?.name || 'Passenger'}</span>
                  </div>
                </>
              )}

              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                <User size={15} /> Passenger Login
              </Link>
              <Link
                to="/conductor/login"
                className="btn btn-primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000000',
                  fontWeight: 700,
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                }}
              >
                <Shield size={15} color="#000000" /> Conductor Portal
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button (< 860px) */}
        <button
          className="nav-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer animate-fade-in">
          {isAuthenticated && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: isConductor ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)', border: isConductor ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              {isConductor ? <Shield size={18} color="#fbbf24" /> : <User size={18} color="#60a5fa" />}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isConductor ? '#fbbf24' : '#60a5fa' }}>
                  {user?.name || (isConductor ? 'Conductor' : 'Passenger')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {isConductor ? `Badge ID: ${user?.conductor_badge || 'PMPL-C101'}` : user?.email}
                </div>
              </div>
            </div>
          )}

          <Link to="/" className={`mobile-nav-link ${isActive('/')}`} onClick={() => setMobileMenuOpen(false)}>
            <Home size={18} /> Home
          </Link>

          {isAuthenticated ? (
            <>
              {isConductor ? (
                <Link to="/conductor/scan" className={`mobile-nav-link ${isActive('/conductor/scan')}`} style={{ color: '#fbbf24' }} onClick={() => setMobileMenuOpen(false)}>
                  <QrCode size={18} color="#fbbf24" /> QR Scanner & Approval
                </Link>
              ) : (
                <>
                  <Link to="/passes" className={`mobile-nav-link ${isActive('/passes')}`} onClick={() => setMobileMenuOpen(false)}>
                    <Ticket size={18} /> Available Passes
                  </Link>
                  <Link to="/my-bookings" className={`mobile-nav-link ${isActive('/my-bookings')}`} onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard size={18} /> My Digital Passes (QR)
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="btn btn-danger"
                style={{ width: '100%', marginTop: '8px', padding: '12px', fontSize: '0.95rem' }}
              >
                <LogOut size={16} /> Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                <User size={18} /> Passenger Login
              </Link>
              <Link to="/register" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Passenger Sign Up
              </Link>
              <Link
                to="/conductor/login"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000000',
                  fontWeight: 800
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield size={18} color="#000000" /> Conductor Portal (Scanner)
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
