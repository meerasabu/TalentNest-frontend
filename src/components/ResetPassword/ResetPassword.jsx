import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/forgot-password', { campusEmail: email });
      setLoading(false);
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: response.data.message || 'Secure 6-digit OTP code sent!'
        });
        setTimeout(() => {
          navigate('/verify-otp', { state: { campusEmail: email } });
        }, 1500);
      }
    } catch (err) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send reset code. Please try again.'
      });
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        {/* Back Arrow inside the card */}
        <button className="reset-card-back" onClick={() => navigate('/login')} title="Back to Login">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#4f46e5', margin: '0 0 0.25rem 0', letterSpacing: '-0.025em' }}>
            TalentNest
          </h1>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            Reset Password
          </h2>
        </div>
        <p className="reset-subtitle">Enter your email to receive a reset code</p>

        {message && (
          <div className={`reset-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="reset-form-group">
            <label htmlFor="email">UNIVERSITY EMAIL</label>
            <input
              type="email"
              id="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="reset-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
