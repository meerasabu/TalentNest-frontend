import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './VerifyOtp.css';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const campusEmail = location.state?.campusEmail || '';

  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const inputRefs = useRef([]);

  useEffect(() => {
    // If no email, redirect back to reset password screen
    if (!campusEmail) {
      navigate('/reset-password');
    }
  }, [campusEmail, navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '') {
      if (index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '') {
        if (index > 0) {
          inputRefs.current[index - 1].focus();
        }
      } else {
        setOtp([...otp.map((d, idx) => (idx === index ? '' : d))]);
      }
    }
  };

  const handlePaste = (e) => {
    const data = e.clipboardData.getData('text');
    if (data.length === 6 && !isNaN(data)) {
      const pastedOtp = data.split('');
      setOtp(pastedOtp);
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setMessage({ type: 'error', text: 'Please enter the complete 6-digit code.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/verify-otp', { campusEmail, otp: otpCode });
      setLoading(false);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'OTP Verified! Redirecting...' });
        setTimeout(() => {
          navigate('/create-new-password', {
            state: { campusEmail, resetToken: response.data.resetToken }
          });
        }, 1000);
      }
    } catch (err) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Verification failed. Please check the code.'
      });
    }
  };

  const handleResend = async () => {
    setMessage(null);
    try {
      await api.post('/forgot-password', { campusEmail });
      setMessage({ type: 'success', text: 'A new 6-digit OTP code has been sent!' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to resend code.'
      });
    }
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        {/* Back Arrow inside the card */}
        <button className="verify-card-back" onClick={() => navigate('/reset-password')} title="Back">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <h1 className="verify-title">Verify OTP</h1>
        <p className="verify-subtitle">We sent a secure 6-digit code to <br /><strong>{campusEmail}</strong></p>




        {message && (
          <div className={`verify-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="otp-inputs-wrapper" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="otp-digit-input"
              />
            ))}
          </div>

          <button type="submit" className="verify-button" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <p className="resend-text">
          Didn't get the code?{' '}
          <button onClick={handleResend} className="resend-link-btn">
            Resend Code
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
