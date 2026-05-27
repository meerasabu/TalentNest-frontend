import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../VerifyOtp/VerifyOtp.css';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    campusEmail: '',
    department: '',
    graduationYear: '',
    password: ''
  });
  const [message, setMessage] = useState(null);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState(null);
  const [timer, setTimer] = useState(600); // 10 minutes
  const otpInputRefs = useRef([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr && token !== 'undefined') {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/index', { replace: true });
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  // OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (showOtpModal && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && showOtpModal) {
      setOtpMessage({ type: 'error', text: 'Verification code has expired. Please click Resend Code.' });
    }
    return () => clearInterval(interval);
  }, [showOtpModal, timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '') {
      if (index < 5) {
        otpInputRefs.current[index + 1].focus();
      }
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '') {
        if (index > 0) {
          otpInputRefs.current[index - 1].focus();
        }
      } else {
        setOtp([...otp.map((d, idx) => (idx === index ? '' : d))]);
      }
    }
  };

  const handleOtpPaste = (e) => {
    const data = e.clipboardData.getData('text');
    if (data.length === 6 && !isNaN(data)) {
      const pastedOtp = data.split('');
      setOtp(pastedOtp);
      otpInputRefs.current[5].focus();
    }
  };

  const handleResendOtp = async () => {
    setOtpMessage(null);
    try {
      const response = await axios.post('http://localhost:5000/api/signup/resend-otp', {
        campusEmail: formData.campusEmail
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.data.success) {
        setTimer(600); // reset 10 mins
        setOtp(new Array(6).fill(''));
        setOtpMessage({ type: 'success', text: response.data.message || 'OTP Sent!' });
      }
    } catch (err) {
      setOtpMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to resend code.'
      });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setOtpMessage({ type: 'error', text: 'Please enter the complete 6-digit code.' });
      return;
    }

    setOtpLoading(true);
    setOtpMessage(null);

    try {
      const response = await axios.post('http://localhost:5000/api/signup/verify-otp', {
        campusEmail: formData.campusEmail,
        otp: otpCode
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      setOtpLoading(false);

      if (response.data.success) {
        setOtpMessage({ type: 'success', text: 'Email verified and account created successfully!' });
        setTimeout(() => {
          setShowOtpModal(false);
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      setOtpLoading(false);
      setOtpMessage({
        type: 'error',
        text: err.response?.data?.message || 'Verification failed. Please check the code.'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate campus email extension
    if (!formData.campusEmail.endsWith('@kristujayanti.com')) {
      setMessage({ type: 'error', text: 'Please use your campus email ending with @kristujayanti.com.' });
      return;
    }

    // Validate password conditions
    const hasMinLength = formData.password.length >= 6;
    const hasCapital = /[A-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);

    if (!hasMinLength || !hasCapital || !hasNumber || !hasSpecial) {
      setMessage({ type: 'error', text: 'Please ensure your password satisfies all validation criteria.' });
      return;
    }

    try {
      setMessage(null);
      const response = await axios.post('http://localhost:5000/api/signup', formData, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.data.success) {
        setShowOtpModal(true);
        setTimer(600); // 10 minutes countdown
        setOtp(new Array(6).fill(''));
        setOtpMessage({ type: 'success', text: response.data.message || 'OTP Sent!' });
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Error signing up. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    }
  };

  const hasMinLength = formData.password.length >= 6;
  const hasCapital = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1rem' }}>
      <div style={{ position: 'relative', backgroundColor: 'white', padding: '3.5rem 2rem 2rem 2rem', borderRadius: '1rem', width: '100%', maxWidth: '460px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        {/* Back Arrow inside the card */}
        <Link to="/" className="auth-card-back" title="Go Back">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#4f46e5', margin: '0 0 0.25rem 0', letterSpacing: '-0.025em' }}>
            TalentNest
          </h1>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            Create an Account
          </h2>
        </div>
        {message && <div style={{ color: message.type === 'error' ? 'red' : 'green', marginBottom: '1rem', textAlign: 'center' }}>{message.text}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>First Name</label>
              <input type="text" id="firstName" value={formData.firstName} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}/>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Last Name</label>
              <input type="text" id="lastName" value={formData.lastName} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}/>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Campus Email</label>
            <input 
              type="email" 
              id="campusEmail" 
              value={formData.campusEmail}
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
            />
            {formData.campusEmail && !formData.campusEmail.endsWith('@kristujayanti.com') && (
              <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: '500', textAlign: 'left' }}>
                Email must end with @kristujayanti.com
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1.5 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Department</label>
              <select id="department" value={formData.department} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box', backgroundColor: 'white', height: '38px' }}>
                <option value="" disabled>Select Department</option>
                <option value="Department of CS (PG)">Department of CS (PG)</option>
                <option value="Department of CS (UG)">Department of CS (UG)</option>
                <option value="Department of English">Department of English</option>
                <option value="Department of Social Science">Department of Social Science</option>
                <option value="Department of Life Science">Department of Life Science</option>
                <option value="Department of Management">Department of Management</option>
                <option value="Department of Psychology">Department of Psychology</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Graduation Year</label>
              <select id="graduationYear" value={formData.graduationYear} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box', backgroundColor: 'white', height: '38px' }}>
                <option value="" disabled>Select Year</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
                <option value="2031">2031</option>
                <option value="2032">2032</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={formData.password}
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {formData.password && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '500', textAlign: 'left' }}>
                <div style={{ color: hasMinLength ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>{hasMinLength ? '✓' : '•'}</span> Minimum 6 characters
                </div>
                <div style={{ color: hasCapital ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>{hasCapital ? '✓' : '•'}</span> At least one capital letter (A-Z)
                </div>
                <div style={{ color: hasNumber ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>{hasNumber ? '✓' : '•'}</span> At least one number (0-9)
                </div>
                <div style={{ color: hasSpecial ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>{hasSpecial ? '✓' : '•'}</span> At least one special character (e.g., !@#$%)
                </div>
              </div>
            )}
          </div>

          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#4f46e5', color: 'white', fontWeight: '600', border: 'none', borderRadius: '0.375rem', marginTop: '1rem', cursor: 'pointer' }}>
            Register
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
          Already have an account? <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '500' }}>Sign In here</Link>
        </div>
      </div>

      {showOtpModal && (
        <div className="verification-modal-overlay">
          <div className="verify-card" style={{ padding: '3rem 2rem 2.5rem 2rem', maxWidth: '380px', borderRadius: '1.25rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            {/* Close modal button */}
            <button 
              type="button" 
              className="verify-card-back" 
              style={{ top: '1.5rem', left: '1.5rem', transform: 'none' }} 
              onClick={() => setShowOtpModal(false)}
              title="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h1 className="verify-title" style={{ marginTop: '1rem', fontSize: '1.35rem', fontWeight: '800' }}>Verify Your Email</h1>
            <p className="verify-subtitle" style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: '#4B5563' }}>
              We sent a 6-digit verification code to <br /><strong>{formData.campusEmail}</strong>
            </p>

            {otpMessage && (
              <div className={`verify-message ${otpMessage.type}`} style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', marginBottom: '1.25rem' }}>
                {otpMessage.text}
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div className="otp-inputs-wrapper" onPaste={handleOtpPaste} style={{ gap: '0.35rem', marginBottom: '1.5rem' }}>
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    value={data}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="otp-digit-input"
                    style={{ width: '2.5rem', height: '3rem', fontSize: '1.25rem' }}
                  />
                ))}
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: timer > 0 ? '#6B7280' : '#EF4444', marginBottom: '1.25rem' }}>
                {timer > 0 ? `Code expires in: ${formatTimer(timer)}` : 'Code expired'}
              </div>

              <button type="submit" className="verify-button" disabled={otpLoading || timer === 0} style={{ backgroundColor: '#4f46e5', fontSize: '0.85rem', padding: '0.625rem 1.25rem', borderRadius: '0.5rem' }}>
                {otpLoading ? 'Verifying...' : 'Verify & Activate'}
              </button>
            </form>

            <p className="resend-text" style={{ fontSize: '0.8rem' }}>
              Didn't get the code?{' '}
              <button type="button" onClick={handleResendOtp} className="resend-link-btn" style={{ fontSize: '0.8rem', color: '#4f46e5' }}>
                Resend Code
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
