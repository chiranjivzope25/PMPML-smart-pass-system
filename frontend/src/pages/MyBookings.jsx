import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import QRCodeCanvas from '../components/QRCodeCanvas';
import { Ticket, Ban, Loader2, MapPin, Calendar, Clock, ShieldCheck, QrCode, Maximize2, X, Printer, CheckCircle2, User, Phone, Bus } from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModalPass, setActiveModalPass] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = () => {
    api.get('/my-bookings')
      .then(res => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch(err => {
        if (err.response?.status === 401) navigate('/login');
        setLoading(false);
      });
  };

  const cancelBooking = async (booking_id) => {
    if (!window.confirm('Are you sure you want to cancel this bus pass booking?')) return;
    try {
      await api.delete(`/booking/${booking_id}`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  const formatAadhar = (raw) => {
    if (!raw) return 'N/A';
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 12) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
    }
    return raw;
  };

  const isTodayValidated = (booking) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return booking.validations?.some(v => v.validation_date === todayStr);
  };

  const getTodayValidation = (booking) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return booking.validations?.find(v => v.validation_date === todayStr);
  };

  if (loading) {
    return (
      <div className="text-center" style={{ marginTop: '20vh' }}>
        <Loader2 className="animate-spin" size={44} color="#3b82f6" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading your digital passes...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.2rem' }}>My Digital Passes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Official PMPL Smart Passes with Photo, Aadhaar Identification & Scannable QR Codes
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/passes')}>
          + Book New Pass
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '60px 20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Ticket size={40} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>No Active Passes</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 24px auto' }}>
            You don't have any booked bus passes yet. Book your daily, weekly or monthly pass now.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/passes')}>
            Browse Available Passes
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
          {bookings.map(booking => {
            const todayVal = getTodayValidation(booking);
            const isCancelled = booking.status === 'Cancelled';
            const isExpired = booking.valid_until && new Date(booking.valid_until) < new Date();
            
            // Payload encoded in the QR code
            const qrPayload = JSON.stringify({
              booking_id: booking.booking_id,
              aadhar: booking.aadhar_number,
              passenger_name: booking.passenger_name,
              route: `${booking.source} - ${booking.destination}`,
              valid_until: booking.valid_until
            });

            return (
              <div
                key={booking.id}
                className="glass-card"
                style={{
                  position: 'relative',
                  padding: '20px 16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                  border: isCancelled
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : todayVal
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(59, 130, 246, 0.3)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                {/* Official Pass Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed rgba(255,255,255,0.12)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bus size={22} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', color: '#60a5fa', textTransform: 'uppercase' }}>
                        PMPL DIGITAL TRANSIT PASS
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                        {booking.bus_pass?.pass_name || 'Standard Bus Pass'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`status-badge ${
                        isCancelled ? 'status-cancelled' : isExpired ? 'status-cancelled' : 'status-booked'
                      }`}
                      style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                    >
                      {isCancelled ? 'CANCELLED' : isExpired ? 'EXPIRED' : 'ACTIVE PASS'}
                    </span>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {booking.booking_id}
                    </div>
                  </div>
                </div>

                {/* Today's Validation Status Banner */}
                {todayVal ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399' }}>
                    <CheckCircle2 size={20} />
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      Allowed for Today by Conductor {todayVal.conductor_name} ({todayVal.bus_number || 'PMPL Bus'})
                    </div>
                  </div>
                ) : !isCancelled && !isExpired ? (
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', color: '#93c5fd' }}>
                    <Clock size={18} />
                    <div style={{ fontSize: '0.85rem' }}>
                      Ready to travel today. Show QR code to bus conductor for scan & approval.
                    </div>
                  </div>
                ) : null}

                {/* Main Pass Content (Passenger Photo, Aadhaar ID, Details, QR Code) */}
                <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Passenger Photo Frame */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '78px',
                        height: '96px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '2px solid rgba(59, 130, 246, 0.5)',
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        flexShrink: 0
                      }}
                    >
                      {booking.passenger_photo ? (
                        <img
                          src={booking.passenger_photo}
                          alt={booking.passenger_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', color: '#64748b' }}>
                          <User size={34} />
                          <div style={{ fontSize: '0.65rem', marginTop: '2px' }}>Pass Photo</div>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      PASS PHOTO
                    </span>
                  </div>

                  {/* Middle Column: Passenger & ID Details */}
                  <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* User ID on Pass: Aadhaar Card */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Official Passenger ID (Aadhaar)
                        </span>
                        <ShieldCheck size={15} color="#10b981" />
                      </div>
                      <div style={{ fontSize: '1.18rem', fontWeight: 800, letterSpacing: '1.5px', fontFamily: 'monospace', color: '#38bdf8' }}>
                        {formatAadhar(booking.aadhar_number)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                        PAN: <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{booking.pan_number || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Passenger Name & Details */}
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                        {booking.passenger_name}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
                        <span>{booking.age} yrs, {booking.gender}</span>
                        <span>•</span>
                        <span>+91 {booking.phone}</span>
                      </div>
                    </div>

                    {/* Route */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <MapPin size={15} color="#f59e0b" />
                      <span style={{ fontWeight: 600 }}>{booking.source}</span>
                      <span style={{ color: '#64748b' }}>➔</span>
                      <span style={{ fontWeight: 600 }}>{booking.destination}</span>
                    </div>

                    {/* Validity Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={14} color="#3b82f6" />
                      <span>
                        Valid until: <strong style={{ color: '#f1f5f9' }}>{booking.valid_until ? new Date(booking.valid_until).toLocaleDateString() : 'N/A'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Scannable QR Code */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        cursor: 'pointer',
                        padding: '6px',
                        background: '#ffffff',
                        borderRadius: '14px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        transition: 'transform 0.2s ease',
                      }}
                      onClick={() => setActiveModalPass(booking)}
                      title="Click to Enlarge QR Code for Conductor"
                    >
                      <QRCodeCanvas value={qrPayload} size={130} />
                    </div>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '5px 10px', fontSize: '0.78rem', gap: '5px' }}
                      onClick={() => setActiveModalPass(booking)}
                    >
                      <Maximize2 size={12} /> Fullscreen QR
                    </button>
                  </div>
                </div>

                {/* Footer Controls */}
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '14px' }}>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '9px', fontSize: '0.88rem' }}
                    onClick={() => setActiveModalPass(booking)}
                  >
                    <QrCode size={16} /> View Pass Details
                  </button>

                  {!isCancelled && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '9px 16px', fontSize: '0.88rem' }}
                      onClick={() => cancelBooking(booking.booking_id)}
                    >
                      <Ban size={15} /> Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Digital Pass Modal (For Conductor Scan & Inspection) */}
      {activeModalPass && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '12px'
          }}
          onClick={() => setActiveModalPass(null)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{
              maxWidth: 'min(94vw, 500px)',
              width: '100%',
              background: '#0f172a',
              border: '2px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '20px',
              padding: '24px 16px',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              maxHeight: '94vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalPass(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.15)', marginBottom: '10px' }}>
                <Bus size={32} color="#3b82f6" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
                PMPL OFFICIAL DIGITAL PASS
              </h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Present this screen directly to the PMPL Bus Conductor
              </div>
            </div>

            {/* High Contrast QR Code in Center */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-block', padding: '12px', background: '#ffffff', borderRadius: '18px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
                <QRCodeCanvas
                  value={JSON.stringify({
                    booking_id: activeModalPass.booking_id,
                    aadhar: activeModalPass.aadhar_number,
                    passenger_name: activeModalPass.passenger_name,
                    route: `${activeModalPass.source} - ${activeModalPass.destination}`,
                    valid_until: activeModalPass.valid_until
                  })}
                  size={200}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600, letterSpacing: '1px' }}>
                BOOKING ID: {activeModalPass.booking_id}
              </div>
            </div>

            {/* Passenger Identification & Photo Card */}
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {/* Photo in Modal */}
                <div
                  style={{
                    width: '84px',
                    height: '105px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '2px solid rgba(59, 130, 246, 0.6)',
                    background: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {activeModalPass.passenger_photo ? (
                    <img
                      src={activeModalPass.passenger_photo}
                      alt={activeModalPass.passenger_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <User size={36} color="#64748b" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Official User ID (Aadhaar)
                    </span>
                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                      VERIFIED
                    </span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '2px', fontFamily: 'monospace', color: '#38bdf8' }}>
                    {formatAadhar(activeModalPass.aadhar_number)}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.88rem', color: '#f8fafc', fontWeight: 700 }}>
                    {activeModalPass.passenger_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activeModalPass.age} yrs, {activeModalPass.gender} • PAN: {activeModalPass.pan_number || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Route & Validity Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>ROUTE</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{activeModalPass.source} ➔ {activeModalPass.destination}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>VALID UNTIL</div>
                <div style={{ fontWeight: 600, marginTop: '2px', color: '#10b981' }}>
                  {activeModalPass.valid_until ? new Date(activeModalPass.valid_until).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            <button
              className="btn btn-outline"
              style={{ width: '100%', padding: '12px', gap: '8px' }}
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print Official Pass Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
