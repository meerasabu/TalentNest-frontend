import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminServiceDetail.css';

const AdminServiceDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);
  
  const [service, setService] = useState(null);
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [warnHistory, setWarnHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Suspension Modals State
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Warn Modal State
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnReason, setWarnReason] = useState('');
  const [warnLoading, setWarnLoading] = useState(false);

  // Form Fields
  const [duration, setDuration] = useState('24h');
  const [severityLevel, setSeverityLevel] = useState('Low');
  const [reason, setReason] = useState('');
  const [restoreReason, setRestoreReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const userRole = user?.role;

  // Route protection
  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchServiceDetails();
      fetchWarnHistory();
    }
  }, [id, userRole]);

  const fetchWarnHistory = async () => {
    try {
      const res = await api.get(`/admin/services/${id}/warn-history`);
      if (res.data.success) setWarnHistory(res.data.warnHistory || []);
    } catch (err) {
      console.error('Error fetching warn history:', err);
    }
  };

  const handleWarnProvider = async (e) => {
    e.preventDefault();
    if (!warnReason.trim()) return;
    setWarnLoading(true);
    try {
      const res = await api.post(`/admin/services/${id}/warn-provider`, { reason: warnReason });
      if (res.data.success) {
        setShowWarnModal(false);
        setWarnReason('');
        fetchWarnHistory();
      }
    } catch (err) {
      console.error('Error warning provider:', err);
      alert(err.response?.data?.message || 'Failed to send warning');
    } finally {
      setWarnLoading(false);
    }
  };

  const fetchServiceDetails = async () => {
    try {
      const res = await api.get(`/admin/services/${id}`);
      if (res.data.success) {
        setService(res.data.service);
        setSuspensionHistory(res.data.suspensionHistory || []);
      }
    } catch (err) {
      console.error('Error fetching admin service detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/admin/services/${id}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        setService({ ...service, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating service status:', err);
      alert('Failed to update status');
    }
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for suspension');
      return;
    }
    try {
      const res = await api.post(`/admin/services/${id}/suspend`, {
        duration,
        reason,
        severityLevel
      });
      if (res.data.success) {
        setShowSuspendModal(false);
        setReason('');
        fetchServiceDetails();
      }
    } catch (err) {
      console.error('Error suspending service:', err);
      alert(err.response?.data?.message || 'Failed to suspend service');
    }
  };

  const handleExtend = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for extending suspension');
      return;
    }
    try {
      const res = await api.post(`/admin/services/${id}/extend-suspension`, {
        duration,
        reason,
        severityLevel
      });
      if (res.data.success) {
        setShowExtendModal(false);
        setReason('');
        fetchServiceDetails();
      }
    } catch (err) {
      console.error('Error extending suspension:', err);
      alert(err.response?.data?.message || 'Failed to extend suspension');
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/admin/services/${id}/restore`, {
        reason: restoreReason
      });
      if (res.data.success) {
        setShowRestoreModal(false);
        setRestoreReason('');
        fetchServiceDetails();
      }
    } catch (err) {
      console.error('Error restoring service:', err);
      alert(err.response?.data?.message || 'Failed to restore service');
    }
  };

  const getRemainingTimeText = (suspendedUntil) => {
    if (!suspendedUntil) return 'Permanent Suspension';
    const diff = new Date(suspendedUntil) - new Date();
    if (diff <= 0) return 'Suspension expired (refreshing...)';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m remaining`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h remaining`;
  };

  const filteredHistory = suspensionHistory.filter(log => {
    const query = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(query) ||
      log.reason?.toLowerCase().includes(query) ||
      log.severity_level?.toLowerCase().includes(query) ||
      `${log.admin_first_name || ''} ${log.admin_last_name || ''}`.toLowerCase().includes(query)
    );
  });

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="services" />

      <main className="admin-main">
        <div className="admin-breadcrumb-flex">
          <div className="breadcrumb-nav" onClick={() => navigate('/admin/services')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <h1>Service Details</h1>
          </div>
          
          <div className="admin-profile-actions">
            <button
              className="btn-warn"
              onClick={() => { setWarnReason(''); setShowWarnModal(true); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Warn Provider
            </button>
            {service?.status === 'Suspended' ? (
              <>
                <button className="btn-warn" onClick={() => {
                  setDuration('24h');
                  setSeverityLevel('Low');
                  setReason('');
                  setShowExtendModal(true);
                }}>Extend Suspension</button>
                <button className="btn-activate" onClick={() => {
                  setRestoreReason('');
                  setShowRestoreModal(true);
                }}>Restore Service</button>
              </>
            ) : (
              <button className="btn-suspend" onClick={() => {
                setDuration('24h');
                setSeverityLevel('Low');
                setReason('');
                setShowSuspendModal(true);
              }}>Suspend Service</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>Loading service details...</div>
        ) : service ? (
          <>
            <div className="admin-service-grid">
              {/* Left Column (Main Details & Logs) */}
              <div className="service-info-left-col">
                {/* Info Card */}
                <div className="service-info-card">
                  <div className="service-info-header">
                    <div>
                      <h2>{service.title}</h2>
                      <div className="service-price-text">
                        ₹{service.standard_plan || '0'} / {service.service_type === 'Online' ? 'hr' : 'event'}
                      </div>
                    </div>
                    <span className={`status-badge-lg ${service.status?.toLowerCase() || 'active'}`}>
                      {service.status || 'Active'}
                    </span>
                  </div>
                  
                  <div className="service-meta-grid">
                    <div className="meta-item">
                      <label>CATEGORY</label>
                      <span>{service.category || 'General'}</span>
                    </div>
                    <div className="meta-item">
                      <label>AVAILABILITY</label>
                      <span>Flexible</span>
                    </div>
                  </div>

                  <div className="service-description-admin">
                    <h3>Description</h3>
                    <p>{service.description || 'Professional and reliable service offered for campus students. Available upon request.'}</p>
                  </div>

                  {service.status === 'Suspended' && (
                    <div className="suspension-info-box" style={{ marginTop: '24px' }}>
                      <p><strong>Suspended Until:</strong> {service.suspended_until ? new Date(service.suspended_until).toLocaleString() : 'Permanently'}</p>
                      <p className="time-remaining">{getRemainingTimeText(service.suspended_until)}</p>
                    </div>
                  )}
                </div>

                {/* Suspension History Log */}
                <div className="reports-history-card">
                  <div className="card-header-flex">
                    <h3>Suspension History Logs</h3>
                    <input 
                      type="text" 
                      placeholder="Search history logs..." 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="suspension-timeline">
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((log) => (
                        <div key={log.id} className="timeline-item">
                          <div className="timeline-badge-wrapper">
                            <span className={`timeline-badge ${log.action}`}>
                              {log.action}
                            </span>
                            {log.severity_level && (
                              <span className={`severity-badge ${log.severity_level.toLowerCase()}`}>
                                {log.severity_level}
                              </span>
                            )}
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-header">
                              <span className="admin-actor">
                                Performed by: <strong>{log.admin_first_name ? `${log.admin_first_name} ${log.admin_last_name}` : 'System'}</strong>
                              </span>
                              <span className="log-date">{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                            <p className="log-reason">{log.reason}</p>
                            {log.duration && (
                              <div className="log-meta">
                                <span>Duration: <strong>{log.duration === '24h' ? '24 Hours' : log.duration === '7d' ? '7 Days' : log.duration === '30d' ? '30 Days' : 'Permanent'}</strong></span>
                                {log.suspended_until && (
                                  <span>Until: <strong>{new Date(log.suspended_until).toLocaleString()}</strong></span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-reports">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        <p>No suspension history logs found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (Sidebar containing Provider & Warning Cards) */}
              <div className="service-info-right-col">
                {/* Provider Card */}
                <div className="provider-details-card">
                  <h3>PROVIDER DETAILS</h3>
                  <div className="provider-profile-sm">
                    <div className="provider-avatar-sm" style={{backgroundColor: '#F5F3FF', color: '#7C3AED'}}>
                      {service.provider_avatar ? (
                        <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${service.provider_avatar}`} alt="" />
                      ) : (
                        service.first_name.charAt(0)
                      )}
                    </div>
                    <div className="provider-info-text">
                      <span className="provider-name-admin">{service.first_name} {service.last_name}</span>
                      <span className="provider-sub-text">Student Provider</span>
                      <Link to={`/admin/students/${service.user_id}`} className="view-profile-link">View Profile</Link>
                    </div>
                  </div>
                </div>

                {/* Warning History Section */}
                <div className="warn-history-card">
                  <div className="warn-history-header">
                    <h3>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      Warning History
                    </h3>
                    <span className="warn-count-badge">{warnHistory.length} warning{warnHistory.length !== 1 ? 's' : ''}</span>
                  </div>
                  {warnHistory.length > 0 ? (
                    <div className="warn-history-list">
                      {warnHistory.map((log) => (
                        <div key={log.id} className="warn-history-item">
                          <div className="warn-history-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                          </div>
                          <div className="warn-history-content">
                            <p className="warn-history-reason">{log.reason}</p>
                            <div className="warn-history-meta">
                              <span>By: <strong>{log.admin_first_name ? `${log.admin_first_name} ${log.admin_last_name}` : 'Admin'}</strong></span>
                              <span>{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="warn-history-empty">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
                      <p>No warnings issued for this service yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{padding: '2rem', textAlign: 'center'}}>Service not found</div>
        )}
      </main>

      {/* Warn Provider Modal */}
      {showWarnModal && (
        <div className="suspension-modal-overlay" onClick={() => setShowWarnModal(false)}>
          <form className="suspension-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleWarnProvider}>
            <div className="suspension-modal-header">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Warn Service Provider
              </h3>
              <button type="button" className="suspension-modal-close" onClick={() => setShowWarnModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '-8px 0 16px 0', lineHeight: '1.5' }}>
              A notification will be sent to the service provider. This will be recorded in the warning history.
            </p>
            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Reason for Warning</label>
              <textarea
                className="suspension-modal-textarea"
                rows="4"
                placeholder="Describe the issue or violation with this service listing..."
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                required
              />
            </div>
            <div className="suspension-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowWarnModal(false)}>Cancel</button>
              <button type="submit" className="btn-modal-warn" disabled={!warnReason.trim() || warnLoading}>
                {warnLoading ? 'Sending...' : 'Send Warning'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div className="suspension-modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <form className="suspension-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSuspend}>
            <div className="suspension-modal-header">
              <h3>Suspend Service Listing</h3>
              <button type="button" className="suspension-modal-close" onClick={() => setShowSuspendModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Suspension Duration</label>
              <select className="suspension-modal-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Severity Level</label>
              <div className="severity-pill-group">
                {['Low', 'Medium', 'High', 'Critical'].map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`severity-pill-btn ${level.toLowerCase()} ${severityLevel === level ? 'active' : ''}`}
                    onClick={() => setSeverityLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Reason for Suspension</label>
              <textarea
                className="suspension-modal-textarea"
                rows="4"
                placeholder="Specify details for the provider's notification email/dashboard alert..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="suspension-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowSuspendModal(false)}>Cancel</button>
              <button type="submit" className="btn-modal-submit">Confirm Suspension</button>
            </div>
          </form>
        </div>
      )}

      {/* Extend Suspension Modal */}
      {showExtendModal && (
        <div className="suspension-modal-overlay" onClick={() => setShowExtendModal(false)}>
          <form className="suspension-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleExtend}>
            <div className="suspension-modal-header">
              <h3>Extend Service Suspension</h3>
              <button type="button" className="suspension-modal-close" onClick={() => setShowExtendModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Extension Duration</label>
              <select className="suspension-modal-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="24h">Extend by 24 Hours</option>
                <option value="7d">Extend by 7 Days</option>
                <option value="30d">Extend by 30 Days</option>
                <option value="permanent">Extend Permanently</option>
              </select>
            </div>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Severity Level</label>
              <div className="severity-pill-group">
                {['Low', 'Medium', 'High', 'Critical'].map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`severity-pill-btn ${level.toLowerCase()} ${severityLevel === level ? 'active' : ''}`}
                    onClick={() => setSeverityLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Reason for Extension</label>
              <textarea
                className="suspension-modal-textarea"
                rows="4"
                placeholder="Specify the reason for lengthening the suspension..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="suspension-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowExtendModal(false)}>Cancel</button>
              <button type="submit" className="btn-modal-submit">Confirm Extension</button>
            </div>
          </form>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <div className="suspension-modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <form className="suspension-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleRestore}>
            <div className="suspension-modal-header">
              <h3>Restore Service Listing</h3>
              <button type="button" className="suspension-modal-close" onClick={() => setShowRestoreModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Reason for Restoration</label>
              <textarea
                className="suspension-modal-textarea"
                rows="4"
                placeholder="Specify details for provider notification (e.g. Listing reinstated after compliance check)..."
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
              />
            </div>

            <div className="suspension-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowRestoreModal(false)}>Cancel</button>
              <button type="submit" className="btn-modal-submit restore">Confirm Restoration</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminServiceDetail;
