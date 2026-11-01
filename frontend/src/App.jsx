import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ConductorLogin from './pages/ConductorLogin';
import ConductorRegister from './pages/ConductorRegister';
import Passes from './pages/Passes';
import BookPass from './pages/BookPass';
import MyBookings from './pages/MyBookings';
import ConductorScan from './pages/ConductorScan';
import { Bus, QrCode, Shield, CheckCircle2, CreditCard, ArrowRight, Sparkles, Smartphone, Users } from 'lucide-react';

function Home() {
  const token = localStorage.getItem('token');
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  const isConductor = user?.role === 'conductor';

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '60px', marginTop: '2vh' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto 36px auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '6px 14px', borderRadius: '24px', fontSize: '0.8rem', color: '#60a5fa', marginBottom: '14px' }}>
          <Sparkles size={15} /> Official PMPL Smart Transit Portal
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5.5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '14px' }}>
          Seamless Bus Passes with <span className="text-gradient">Aadhaar & QR Validation</span>
        </h1>
        <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto' }}>
          Book bus passes with your official photo, Aadhaar, and PAN card, get instant scannable digital passes, and empower bus conductors with real-time QR verification.
        </p>
      </div>

      {/* Two Dedicated Portals: Passenger vs Conductor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', maxWidth: '960px', margin: '0 auto 40px auto' }}>
        {/* Passenger Portal Card */}
        <div
          className="glass-card"
          style={{
            padding: '36px 30px',
            borderRadius: '20px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)' }}>
                <Bus size={30} color="#ffffff" />
              </div>
              <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 700, padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>
                FOR COMMUTERS
              </span>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>
              Passenger Portal
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Book Daily, Weekly, and Monthly bus passes using your Aadhaar number. Carry your authentic digital pass with dynamic QR code right on your phone.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '30px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" /> Aadhaar ID imprinted on digital pass
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" /> Scannable QR code for bus conductors
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" /> Instant activation & booking management
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {token && !isConductor ? (
              <Link to="/passes" className="btn btn-primary" style={{ padding: '14px', fontSize: '1rem', width: '100%' }}>
                Browse Passes & Book Now <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary" style={{ padding: '14px', fontSize: '1rem', width: '100%' }}>
                  Passenger Login <ArrowRight size={18} />
                </Link>
                <Link to="/register" className="btn btn-outline" style={{ padding: '12px', fontSize: '0.95rem', width: '100%' }}>
                  Register New Passenger
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Conductor Portal Card */}
        <div
          className="glass-card"
          style={{
            padding: '36px 30px',
            borderRadius: '20px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(20, 16, 8, 0.85))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)' }}>
                <Shield size={30} color="#000000" />
              </div>
              <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>
                FOR TRANSIT STAFF
              </span>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>
              Conductor Portal
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Dedicated validation terminal for bus conductors. Scan passenger QR codes using camera or file upload, inspect Aadhaar credentials, and approve passes for today.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '30px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#fbbf24" /> Live Camera & photo QR code scanner
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#fbbf24" /> One-click "Allow Pass for Today" punch
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#fbbf24" /> Automatic duplicate & expiry detection
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {token && isConductor ? (
              <Link
                to="/conductor/scan"
                className="btn btn-primary"
                style={{
                  padding: '14px',
                  fontSize: '1rem',
                  width: '100%',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000000',
                  fontWeight: 800
                }}
              >
                Open QR Scanner Terminal <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/conductor/login"
                  className="btn btn-primary"
                  style={{
                    padding: '14px',
                    fontSize: '1rem',
                    width: '100%',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000000',
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  Conductor Login <ArrowRight size={18} />
                </Link>
                <Link
                  to="/conductor/register"
                  className="btn btn-outline"
                  style={{ padding: '12px', fontSize: '0.95rem', width: '100%', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
                >
                  Register Conductor Badge
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* How the Process Works */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.6rem', marginBottom: '28px', fontWeight: 800 }}>
          How the Whole Process Works
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px' }}>
          {[
            {
              step: '1',
              title: 'Passenger Books Pass',
              desc: 'Select pass type and enter Aadhaar number, PAN card, and travel route stations.'
            },
            {
              step: '2',
              title: 'Pass Issued with Aadhaar & QR',
              desc: 'Aadhaar ID appears on digital pass as official user ID, with an encrypted QR code.'
            },
            {
              step: '3',
              title: 'Conductor Scans QR Code',
              desc: 'Conductor uses the live scanner page on their phone or tablet to scan passenger QR.'
            },
            {
              step: '4',
              title: 'Approved for Today',
              desc: 'Conductor clicks "Allow Pass for Today". Validation is saved securely in the database.'
            }
          ].map((item, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px 20px', textAlign: 'left' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                {item.step}
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>{item.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Passenger Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Conductor Auth Routes */}
        <Route path="/conductor/login" element={<ConductorLogin />} />
        <Route path="/conductor/register" element={<ConductorRegister />} />
        
        {/* Commuter Pass Booking & View Routes */}
        <Route path="/passes" element={<Passes />} />
        <Route path="/book/:id" element={<BookPass />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        
        {/* Conductor QR Scanner & Pass Approval Route */}
        <Route path="/conductor/scan" element={<ConductorScan />} />
      </Routes>
    </Router>
  );
}

export default App;
