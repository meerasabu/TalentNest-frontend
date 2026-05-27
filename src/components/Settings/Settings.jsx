import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import Header from '../Common/Header';
import api from '../../api/axiosConfig';
import './Settings.css';

const Settings = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = location.state?.user || JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }

  // Load preferences from localStorage or defaults
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem(`settings_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      emailAlerts: true,
      pushAlerts: true,
      publicProfile: true,
      showPresence: true,
    };
  });

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // Get current browser user agent description
  const [currentBrowser, setCurrentBrowser] = useState('Chrome on Windows');
  useEffect(() => {
    const ua = navigator.userAgent;
    let browserName = 'Browser';
    let osName = 'OS';

    if (ua.includes('Windows')) osName = 'Windows';
    else if (ua.includes('Macintosh')) osName = 'macOS';
    else if (ua.includes('Linux')) osName = 'Linux';
    else if (ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';
    else if (ua.includes('Android')) osName = 'Android';

    if (ua.includes('Firefox')) browserName = 'Firefox';
    else if (ua.includes('Chrome')) browserName = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browserName = 'Safari';
    else if (ua.includes('Edge')) browserName = 'Edge';

    setCurrentBrowser(`${browserName} on ${osName}`);
  }, []);

  // Save settings on changes
  useEffect(() => {
    localStorage.setItem(`settings_${user.id}`, JSON.stringify(preferences));
  }, [preferences, user.id]);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("New passwords do not match.");
      return;
    }
    try {
      const response = await api.post('/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      if (response.data.success) {
        alert("Password updated successfully!");
        setPasswordModalOpen(false);
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      alert(error.response?.data?.message || "Failed to update password.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : 'USER';

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      <main className="dashboard-main">
        <Header user={user} showSearch={false} />

        <div className="settings-content-wrapper">
          <div className="settings-header">
            <h2>Account Settings</h2>
            <p>Manage your account security, notification alerts, and active visibility configurations.</p>
          </div>

          <div className="settings-grid">
            {/* Left Column: Notification & Privacy */}
            <div className="settings-column">
              {/* Notifications settings */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon notif">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  </div>
                  <div className="settings-card-title-group">
                    <h3>Notification Preferences</h3>
                    <p>Configure how you receive activity notifications on TalentNest.</p>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Email Alerts</span>
                      <span className="setting-desc">Get system emails for order completions, verifications, and listing activities.</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={preferences.emailAlerts} 
                        onChange={() => handleToggle('emailAlerts')}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Real-time Push Alerts</span>
                      <span className="setting-desc">Get active socket message notifications and badge increments.</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={preferences.pushAlerts} 
                        onChange={() => handleToggle('pushAlerts')}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Privacy settings */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon privacy">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <div className="settings-card-title-group">
                    <h3>Privacy & Visibility</h3>
                    <p>Control listing reach and presence indicators on the campus network.</p>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Public Campus Profile</span>
                      <span className="setting-desc">Allow campus-wide search and listing sharing to increase response rates.</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={preferences.publicProfile} 
                        onChange={() => handleToggle('publicProfile')}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <span className="setting-label">Online Presence Indicator</span>
                      <span className="setting-desc">Display active online/offline presence inside socket chat sessions.</span>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={preferences.showPresence} 
                        onChange={() => handleToggle('showPresence')}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Security, Sessions & Logout */}
            <div className="settings-column">
              {/* Security Preferences */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon security-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  </div>
                  <div className="settings-card-title-group">
                    <h3>Security Preferences</h3>
                    <p>Manage your account login credentials securely.</p>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="security-info-text">
                    <p>To safeguard your account transactions and chats, please ensure you update your password periodically.</p>
                  </div>
                  <div className="security-action-btn-row">
                    <button className="settings-action-btn" onClick={() => setPasswordModalOpen(true)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      Change Security Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Session Info */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon sessions">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  </div>
                  <div className="settings-card-title-group">
                    <h3>Active Session</h3>
                    <p>Current device connection details for this workspace session.</p>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="sessions-list">
                    <div className="session-item-row current-only">
                      <div className="session-device-details">
                        <span className="session-device-name">{currentBrowser}</span>
                        <span className="session-device-meta">Active Workspace Session • <strong className="current">Online Now</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Controls */}
              <div className="settings-card danger-action-card">
                <div className="settings-card-header">
                  <div className="settings-card-icon danger">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  </div>
                  <div className="settings-card-title-group">
                    <h3>Account Controls</h3>
                    <p>Log out of your active workspace account session.</p>
                  </div>
                </div>
                <div className="settings-card-body">
                  <div className="logout-panel">
                    <p>Logging out closes your active browser socket and clears session tokens. Your settings will persist upon your next login.</p>
                    <button className="settings-logout-trigger-btn" onClick={handleLogout}>
                      Sign Out Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change password modal overlay */}
        {passwordModalOpen && (
          <div className="settings-modal-overlay">
            <div className="settings-modal">
              <div className="modal-header">
                <h3>Change Password</h3>
                <button className="modal-close-btn" onClick={() => setPasswordModalOpen(false)}>✕</button>
              </div>
              <form onSubmit={handlePasswordChangeSubmit}>
                <div className="modal-form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    value={passwords.current} 
                    onChange={e => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                    required 
                  />
                </div>
                <div className="modal-form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={passwords.new} 
                    onChange={e => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    required 
                  />
                </div>
                <div className="modal-form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwords.confirm} 
                    onChange={e => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    required 
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setPasswordModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-submit">Update Password</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
