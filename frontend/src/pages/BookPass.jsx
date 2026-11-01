import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Send, MapPin, Phone, User, Calendar, CreditCard, ShieldCheck, ArrowRight, Bus, Camera, Image, X, UploadCloud, CheckCircle2 } from 'lucide-react';

const PMPL_STATIONS = [
  "Swargate",
  "Pune Station",
  "Shivajinagar",
  "Katraj",
  "Hadapsar",
  "Hinjawadi",
  "Kothrud",
  "Nigdi",
  "Bhosari",
  "Deccan Gymkhana",
  "Alandi",
  "Wagholi",
  "Warje",
  "Chinchwad",
  "Viman Nagar",
  "Kalyani Nagar",
  "Pimpri",
  "Khadki"
];

export default function BookPass() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedPass, setSelectedPass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingPass, setFetchingPass] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    passenger_name: '',
    age: '',
    gender: 'Male',
    phone: '',
    aadhar_number: '',
    pan_number: '',
    passenger_photo: '',
    source: '',
    destination: ''
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Pre-fill user name if available
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.name) setFormData(prev => ({ ...prev, passenger_name: u.name }));
      } catch (e) {}
    }

    // Fetch pass details
    api.get('/passes')
      .then(res => {
        const pass = res.data.find(p => p.id === parseInt(id));
        if (pass) {
          setSelectedPass(pass);
        } else {
          setError('Selected pass not found.');
        }
      })
      .catch(err => {
        if (err.response?.status === 401) navigate('/login');
        setError('Failed to fetch pass details.');
      })
      .finally(() => setFetchingPass(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'aadhar_number') {
      // Keep only digits, limit to 12
      const digits = value.replace(/\D/g, '').slice(0, 12);
      // Format as XXXX-XXXX-XXXX
      let formatted = digits;
      if (digits.length > 4 && digits.length <= 8) {
        formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
      } else if (digits.length > 8) {
        formatted = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
      }
      setFormData(prev => ({ ...prev, aadhar_number: formatted }));
      return;
    }

    if (name === 'pan_number') {
      // Uppercase alphanumeric, max 10
      const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, pan_number: clean }));
      return;
    }

    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phone: digits }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Convert passenger photo to compact base64 data URL
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 360;
        const MAX_HEIGHT = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, passenger_photo: dataUrl }));
        setError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, passenger_photo: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanAadhar = formData.aadhar_number.replace(/\D/g, '');
    if (cleanAadhar.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits.');
      setLoading(false);
      return;
    }

    if (formData.pan_number.length !== 10) {
      setError('PAN card number must be exactly 10 characters (e.g. ABCDE1234F).');
      setLoading(false);
      return;
    }

    if (!formData.passenger_photo) {
      setError('Please upload your photo. It is required to appear on your official bus pass.');
      setLoading(false);
      return;
    }

    if (formData.source.trim().toLowerCase() === formData.destination.trim().toLowerCase()) {
      setError('Source and Destination station cannot be the same.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        pass_id: parseInt(id),
        passenger_name: formData.passenger_name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        phone: formData.phone.trim(),
        aadhar_number: cleanAadhar,
        pan_number: formData.pan_number.trim(),
        passenger_photo: formData.passenger_photo,
        source: formData.source.trim(),
        destination: formData.destination.trim()
      };

      await api.post('/book-pass', payload);
      navigate('/my-bookings');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to book pass. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '850px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/passes" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
          ← Back to Available Passes
        </Link>
        <h1 style={{ fontSize: '2.2rem', marginTop: '10px' }} className="text-gradient">
          Book Digital Bus Pass
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Please provide your photo and government identification details. Your photo, Aadhaar ID, and QR code will appear directly on the issued pass.
        </p>
      </div>

      {selectedPass && (
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(16, 185, 129, 0.12))', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={26} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedPass.pass_name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Validity: <span style={{ color: '#10b981', fontWeight: 600 }}>{selectedPass.validity}</span> • Category: {selectedPass.pass_type}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>₹{selectedPass.price}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>All-Inclusive Fare</div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '36px' }}>
        {error && (
          <div className="glass-panel" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '14px 18px', color: '#f87171', marginBottom: '24px', borderRadius: '10px', fontSize: '0.95rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Passenger Photo Upload Section */}
          <div style={{ marginBottom: '28px', background: 'rgba(15, 23, 42, 0.5)', padding: '20px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Camera size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '1.15rem', color: '#f1f5f9' }}>Passenger Photo (Appears on Pass) *</h3>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Photo Preview Frame */}
              <div style={{ position: 'relative', width: '110px', height: '130px', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(59, 130, 246, 0.4)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
                {formData.passenger_photo ? (
                  <>
                    <img
                      src={formData.passenger_photo}
                      alt="Passenger Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(239, 68, 68, 0.85)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Remove Photo"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <User size={38} color="#64748b" />
                    <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>Passport Photo</div>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                  Upload a clear passport-style portrait photo. The bus conductor will inspect this photo to verify your identity.
                </p>

                <label
                  className="btn btn-outline"
                  style={{
                    cursor: 'pointer',
                    padding: '10px 18px',
                    fontSize: '0.9rem',
                    gap: '8px',
                    borderColor: formData.passenger_photo ? '#10b981' : 'var(--glass-border)',
                    background: formData.passenger_photo ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                  }}
                >
                  {formData.passenger_photo ? (
                    <>
                      <CheckCircle2 size={16} color="#10b981" /> Photo Selected (Click to change)
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} color="#3b82f6" /> Select / Take Photo
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Passenger Identification Section */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              <ShieldCheck size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.15rem', color: '#f1f5f9' }}>Government Identification (Required for QR Pass)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Aadhaar Card Number *</span>
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>Printed on pass as User ID</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <CreditCard size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    name="aadhar_number"
                    className="input-field"
                    placeholder="e.g. 5412-8901-2345"
                    value={formData.aadhar_number}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '42px', letterSpacing: '1px', fontWeight: 600 }}
                  />
                </div>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                  12 digits required. Conductor will match this ID during inspection.
                </small>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>PAN Card Number *</span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>10 Characters</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <CreditCard size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    name="pan_number"
                    className="input-field"
                    placeholder="e.g. ABCDE1234F"
                    value={formData.pan_number}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    style={{ paddingLeft: '42px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}
                  />
                </div>
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                  Standard alphanumeric PAN format for records.
                </small>
              </div>
            </div>
          </div>

          {/* Passenger Personal Details */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              <User size={20} color="#3b82f6" />
              <h3 style={{ fontSize: '1.15rem', color: '#f1f5f9' }}>Passenger Information</h3>
            </div>

            <div className="form-grid-2">
              <div className="input-group form-grid-col-span-2">
                <label>Passenger Full Name (As per Govt ID) *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    name="passenger_name"
                    className="input-field"
                    placeholder="Enter full legal name"
                    value={formData.passenger_name}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Age *</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="number"
                    name="age"
                    className="input-field"
                    placeholder="e.g. 24"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    min="1"
                    max="120"
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Gender *</label>
                <select name="gender" className="input-field" value={formData.gender} onChange={handleChange} required>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="input-group form-grid-col-span-2">
                <label>Mobile Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="tel"
                    name="phone"
                    className="input-field"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Travel Route Section */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              <MapPin size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1.15rem', color: '#f1f5f9' }}>Travel Route Stations</h3>
            </div>

            <div className="form-grid-2">
              <div className="input-group">
                <label>Source Station *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    name="source"
                    list="station-list"
                    className="input-field"
                    placeholder="e.g. Swargate"
                    value={formData.source}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Destination Station *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    name="destination"
                    list="station-list"
                    className="input-field"
                    placeholder="e.g. Pune Station"
                    value={formData.destination}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '42px' }}
                  />
                </div>
              </div>

              <datalist id="station-list">
                {PMPL_STATIONS.map((st, i) => (
                  <option key={i} value={st} />
                ))}
              </datalist>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? (
              'Generating QR Pass...'
            ) : (
              <>
                <Send size={18} /> Confirm & Generate Digital Pass
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
