import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Calendar, Clock, CreditCard, ChevronRight } from 'lucide-react';

export default function Passes() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/passes')
      .then(res => {
        setPasses(res.data);
        setLoading(false);
      })
      .catch(err => {
        if(err.response?.status === 401) navigate('/login');
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div className="text-center mt-4"><h3 className="animate-fade-in">Loading passes...</h3></div>;

  return (
    <div className="container animate-fade-in">
      <div className="text-center mb-4">
        <h1 className="text-gradient">Available Passes</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Select the pass that fits your travel needs</p>
      </div>

      <div className="passes-grid">
        {passes.map((pass) => (
          <div key={pass.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{pass.pass_name}</h3>
              <span className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{pass.pass_type}</span>
            </div>
            
            <div className="pass-price">
              ₹{pass.price} <span>/ pass</span>
            </div>

            <ul style={{ listStyle: 'none', margin: '16px 0', flex: 1, color: 'var(--text-secondary)', gap: '12px', display: 'flex', flexDirection: 'column' }}>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Clock size={16} color="#10b981"/> Validity: {pass.validity}
              </li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Calendar size={16} color="#3b82f6"/> Unlimited travel
              </li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <CreditCard size={16} color="#f59e0b"/> Instant digital activation
              </li>
            </ul>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => navigate(`/book/${pass.id}`)}>
              Select Pass <ChevronRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
