import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bus,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  Clock,
  RotateCcw,
  Loader2,
  FileCheck2,
  ArrowRight
} from 'lucide-react';

export default function ConductorScan() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'file' | 'manual'
  
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const html5QrCodeRef = useRef(null);

  // Verification state
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Approval state
  const [busNumber, setBusNumber] = useState('PMPL Route #102');
  const [approving, setApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(null);

  // Today's validation log
  const [todayLogs, setTodayLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Audio beep generator using Web Audio API
  const playBeep = (isSuccess = true) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (isSuccess) {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio not supported or blocked
    }
  };

  useEffect(() => {
    // Check conductor auth
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      navigate('/conductor/login');
      return;
    }

    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        if (u.role !== 'conductor') {
          setVerifyError('Logged in account is a Passenger. Please login as a Conductor to access verification.');
        }
      } catch (e) {}
    }

    fetchTodayLogs();

    return () => {
      stopCameraScanner();
    };
  }, [navigate]);

  const fetchTodayLogs = () => {
    setLoadingLogs(true);
    api.get('/conductor/today-validations')
      .then(res => setTodayLogs(res.data))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  };

  // Start live camera scanner
  const startCameraScanner = async () => {
    setScannerError('');
    setIsScanning(true);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame misses
        }
      );
    } catch (err) {
      console.error("Camera start error:", err);
      setScannerError('Could not open camera. Please grant camera permission or use File Upload / Manual Search.');
      setIsScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {}
    }
    setIsScanning(false);
  };

  // Handle uploaded QR image file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingVerify(true);
    setScannerError('');

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-file-dummy");
      const decodedText = await html5QrCode.scanFile(file, false);
      html5QrCode.clear();
      handleScanSuccess(decodedText);
    } catch (err) {
      setScannerError('No QR code detected in this image. Please upload a clear QR photo.');
      playBeep(false);
    } finally {
      setLoadingVerify(false);
    }
  };

  // Process decoded QR or manual entry
  const handleScanSuccess = (text) => {
    stopCameraScanner();
    playBeep(true);

    let identifier = text.trim();
    // If QR contains JSON, parse booking_id or aadhar
    try {
      const parsed = JSON.parse(text);
      if (parsed.booking_id) identifier = parsed.booking_id;
      else if (parsed.aadhar) identifier = parsed.aadhar;
    } catch (e) {
      // Raw string identifier
    }

    lookupPassengerPass(identifier);
  };

  const lookupPassengerPass = async (identifier) => {
    setLoadingVerify(true);
    setVerifyResult(null);
    setVerifyError('');
    setApprovalSuccess(null);

    try {
      const res = await api.get(`/conductor/verify/${encodeURIComponent(identifier)}`);
      setVerifyResult(res.data);
      playBeep(res.data.valid);
    } catch (err) {
      setVerifyError(err.response?.data?.detail || `Pass not found for: ${identifier}`);
      playBeep(false);
    } finally {
      setLoadingVerify(false);
    }
  };

  // Conductor approves pass for today
  const handleApproveToday = async () => {
    if (!verifyResult?.booking) return;

    setApproving(true);
    setApprovalSuccess(null);

    try {
      const payload = {
        booking_id: verifyResult.booking.booking_id,
        bus_number: busNumber.trim() || 'PMPL City Bus',
        notes: `Validated by ${currentUser?.name || 'Conductor'}`
      };

      const res = await api.post('/conductor/approve-today', payload);
      setApprovalSuccess(res.data);
      playBeep(true);

      // Re-fetch verification state and today's log
      lookupPassengerPass(verifyResult.booking.booking_id);
      fetchTodayLogs();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve pass for today.');
    } finally {
      setApproving(false);
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

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '1000px', paddingBottom: '90px' }}>
      {/* Conductor Badge Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', letterSpacing: '1px' }}>
              CONDUCTOR PORTAL
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {currentUser?.conductor_badge ? `Badge: ${currentUser.conductor_badge}` : 'On-Duty Officer'}
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', marginTop: '6px', fontWeight: 800 }}>
            Pass Scanner & Daily Verification
          </h1>
        </div>

        {/* Quick bus selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(30, 41, 59, 0.6)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <Bus size={20} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ASSIGNED BUS / ROUTE</div>
            <input
              type="text"
              value={busNumber}
              onChange={(e) => setBusNumber(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontWeight: 600, outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
        </div>
      </div>

      {/* Tabs: Live Camera, File Upload, Manual Search */}
      <div className="glass-panel" style={{ padding: '6px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '6px', background: 'rgba(15, 23, 42, 0.6)' }}>
        <button
          onClick={() => { setActiveTab('camera'); stopCameraScanner(); }}
          className={`btn ${activeTab === 'camera' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: '1 1 140px', padding: '8px 12px', fontSize: '0.88rem' }}
        >
          <Camera size={16} /> Live Camera
        </button>
        <button
          onClick={() => { setActiveTab('file'); stopCameraScanner(); }}
          className={`btn ${activeTab === 'file' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: '1 1 140px', padding: '8px 12px', fontSize: '0.88rem' }}
        >
          <Upload size={16} /> Upload Photo
        </button>
        <button
          onClick={() => { setActiveTab('manual'); stopCameraScanner(); }}
          className={`btn ${activeTab === 'manual' ? 'btn-primary' : 'btn-outline'}`}
          style={{ flex: '1 1 140px', padding: '8px 12px', fontSize: '0.88rem' }}
        >
          <Search size={16} /> Search ID / Aadhaar
        </button>
      </div>

      {/* Scanner Section - Stacks on mobile, 2-col on desktop */}
      <div className={verifyResult ? "responsive-two-col" : ""} style={{ gap: '20px' }}>
        {/* Left Column: Scanner / Input Controls */}
        <div className="glass-panel" style={{ padding: '20px 16px' }}>
          {activeTab === 'camera' && (
            <div style={{ textAlign: 'center' }}>
              <div
                id="qr-reader"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  margin: '0 auto 16px auto',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#000000',
                  minHeight: isScanning ? '300px' : '0px'
                }}
              />

              {!isScanning ? (
                <div style={{ padding: '40px 20px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Camera size={34} color="#3b82f6" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Scan Passenger QR Pass</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '320px', margin: '0 auto 20px auto' }}>
                    Point camera at passenger's digital pass QR code on mobile or printed pass.
                  </p>
                  <button className="btn btn-primary" onClick={startCameraScanner} style={{ padding: '12px 28px', fontSize: '1rem' }}>
                    <Camera size={18} /> Open Camera Scanner
                  </button>
                </div>
              ) : (
                <div>
                  <button className="btn btn-danger" onClick={stopCameraScanner} style={{ marginTop: '12px' }}>
                    Stop Camera
                  </button>
                </div>
              )}

              {scannerError && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', fontSize: '0.88rem' }}>
                  ⚠️ {scannerError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'file' && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div id="qr-reader-file-dummy" style={{ display: 'none' }} />
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Upload size={34} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Upload Pass Photo or Screenshot</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '340px', margin: '0 auto 20px auto' }}>
                If passenger sent pass via WhatsApp or screenshot, select the image to instantly scan the QR code.
              </p>

              <label className="btn btn-primary" style={{ padding: '12px 28px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} /> Choose QR Image File
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              {scannerError && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', fontSize: '0.88rem' }}>
                  ⚠️ {scannerError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div style={{ padding: '20px 10px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Manual Passenger Lookup</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                Enter the Booking ID (e.g. PMPL-XXXX) or 12-digit Aadhaar Card number:
              </p>

              <form onSubmit={(e) => { e.preventDefault(); if (manualInput.trim()) lookupPassengerPass(manualInput.trim()); }}>
                <div className="input-group">
                  <label>Booking ID or Aadhaar Card Number</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. PMPL-1A2B3C4D or 541289012345"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    required
                    style={{ fontSize: '1.05rem', letterSpacing: '1px' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loadingVerify}>
                  {loadingVerify ? <Loader2 className="animate-spin" size={18} /> : <><Search size={18} /> Search & Verify</>}
                </button>
              </form>
            </div>
          )}

          {/* Loading verification */}
          {loadingVerify && (
            <div className="text-center" style={{ padding: '24px' }}>
              <Loader2 className="animate-spin" size={32} color="#3b82f6" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Verifying pass with central database...</p>
            </div>
          )}

          {/* Verification Error */}
          {verifyError && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <XCircle size={24} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700 }}>Pass Verification Failed</div>
                <div style={{ fontSize: '0.88rem', marginTop: '2px' }}>{verifyError}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scanned Passenger Card & Daily Approval */}
        {verifyResult && verifyResult.booking && (
          <div className="glass-panel animate-fade-in" style={{ padding: '28px', border: verifyResult.valid ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(239, 68, 68, 0.5)' }}>
            {/* Passenger Pass Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {verifyResult.booking.bus_pass?.pass_name || 'PMPL PASS'}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                  {verifyResult.booking.passenger_name}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  className={`status-badge ${
                    verifyResult.valid
                      ? verifyResult.is_today_approved
                        ? 'status-booked'
                        : 'status-booked'
                      : 'status-cancelled'
                  }`}
                  style={{
                    background: verifyResult.valid
                      ? verifyResult.is_today_approved
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(59, 130, 246, 0.25)'
                      : 'rgba(239, 68, 68, 0.25)',
                    color: verifyResult.valid ? '#34d399' : '#f87171',
                    fontSize: '0.85rem',
                    padding: '6px 14px'
                  }}
                >
                  {verifyResult.valid
                    ? verifyResult.is_today_approved
                      ? '✓ APPROVED TODAY'
                      : 'VALID PASS'
                    : 'INVALID / EXPIRED'}
                </span>
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {verifyResult.booking.booking_id}
                </div>
              </div>
            </div>

            {/* Official Identification & Photo on Pass */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '74px', height: '92px', borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(59, 130, 246, 0.5)', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {verifyResult.booking.passenger_photo ? (
                  <img src={verifyResult.booking.passenger_photo} alt="Passenger" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={36} color="#64748b" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Official Govt ID (Aadhaar Card)
                  </span>
                  <ShieldCheck size={16} color="#10b981" />
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1.5px', fontFamily: 'monospace', color: '#38bdf8' }}>
                  {formatAadhar(verifyResult.booking.aadhar_number)}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '6px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span>PAN: <strong style={{ color: '#f8fafc' }}>{verifyResult.booking.pan_number || 'N/A'}</strong></span>
                  <span>Phone: <strong style={{ color: '#f8fafc' }}>{verifyResult.booking.phone}</strong></span>
                  <span>Age: <strong style={{ color: '#f8fafc' }}>{verifyResult.booking.age} yrs</strong></span>
                </div>
              </div>
            </div>

            {/* Travel Route & Validity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AUTHORIZED ROUTE</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#f59e0b" />
                  <span>{verifyResult.booking.source} ➔ {verifyResult.booking.destination}</span>
                </div>
              </div>

              <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PASS VALID UNTIL</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '4px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} color="#10b981" />
                  <span>{verifyResult.booking.valid_until ? new Date(verifyResult.booking.valid_until).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Today's Validation Status & Approval Action */}
            {verifyResult.is_today_approved ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34d399', fontWeight: 700, fontSize: '1rem' }}>
                  <CheckCircle2 size={22} />
                  <span>PASS ALREADY APPROVED FOR TODAY</span>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                  {verifyResult.status_message}
                </div>
              </div>
            ) : verifyResult.valid ? (
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, marginBottom: '6px' }}>
                  <Clock size={18} />
                  <span>Not Yet Punched / Approved Today</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Verify passenger's face and Aadhaar ID matches. Click below to allow passenger on bus for today.
                </p>

                <button
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
                    gap: '10px'
                  }}
                  onClick={handleApproveToday}
                  disabled={approving}
                >
                  {approving ? (
                    <><Loader2 className="animate-spin" size={20} /> Approving...</>
                  ) : (
                    <><FileCheck2 size={22} /> ALLOW PASS FOR TODAY</>
                  )}
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', padding: '16px', marginBottom: '20px', color: '#f87171' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                  <AlertTriangle size={22} />
                  <span>DO NOT ALLOW PASSENGER TO BOARD</span>
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.88rem' }}>
                  {verifyResult.status_message}
                </div>
              </div>
            )}

            {/* Approval Success Notification */}
            {approvalSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.25)', border: '1px solid #10b981', padding: '14px', borderRadius: '10px', color: '#34d399', textAlign: 'center', fontWeight: 600, fontSize: '0.95rem' }}>
                🎉 {approvalSuccess.message}
              </div>
            )}

            <button
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '12px', padding: '10px' }}
              onClick={() => { setVerifyResult(null); setVerifyError(''); }}
            >
              <RotateCcw size={16} /> Scan Next Passenger
            </button>
          </div>
        )}
      </div>

      {/* Conductor's Today Validations Log */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck2 size={24} color="#10b981" />
            <h2 style={{ fontSize: '1.4rem' }}>Today's Validated Passengers</h2>
          </div>
          <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', fontSize: '0.88rem' }}>
            {todayLogs.length} Passes Approved Today
          </span>
        </div>

        {loadingLogs ? (
          <div className="text-center" style={{ padding: '24px' }}>
            <Loader2 className="animate-spin" size={24} color="#3b82f6" style={{ margin: '0 auto' }} />
          </div>
        ) : todayLogs.length === 0 ? (
          <div className="glass-panel text-center" style={{ padding: '32px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No passengers scanned and approved yet today.</p>
          </div>
        ) : (
          <div className="glass-panel table-responsive-container" style={{ padding: '0px' }}>
            <table style={{ width: '100%', minWidth: '550px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px' }}>Time</th>
                  <th style={{ padding: '14px 18px' }}>Booking ID</th>
                  <th style={{ padding: '14px 18px' }}>Bus / Route</th>
                  <th style={{ padding: '14px 18px' }}>Conductor</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {new Date(log.validated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 700, fontFamily: 'monospace', color: '#38bdf8' }}>
                      {log.booking_id}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {log.bus_number || 'PMPL Bus'}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                      {log.conductor_name}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className="status-badge status-booked" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
