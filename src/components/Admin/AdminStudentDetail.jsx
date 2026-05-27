import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminStudentDetail.css';

const AdminStudentDetail = () => {
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
  
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState({ marketplace: 0, skills: 0, services: 0, orders: 0 });
  const [reports, setReports] = useState([]);
  const [suspensionHistory, setSuspensionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Suspension Modals State
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

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
      fetchStudentDetails();
    }
  }, [id, userRole]);

  const fetchStudentDetails = async () => {
    try {
      const res = await api.get(`/admin/students/${id}`);
      if (res.data.success) {
        setStudent(res.data.student);
        setStats(res.data.stats);
        setReports(res.data.reports);
        setSuspensionHistory(res.data.suspensionHistory || []);
      }
    } catch (err) {
      console.error('Error fetching admin student detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/admin/students/${id}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        setStudent({ ...student, account_status: newStatus });
      }
    } catch (err) {
      console.error('Error updating student status:', err);
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
      const res = await api.post(`/admin/students/${id}/suspend`, {
        duration,
        reason,
        severityLevel
      });
      if (res.data.success) {
        setShowSuspendModal(false);
        setReason('');
        fetchStudentDetails();
      }
    } catch (err) {
      console.error('Error suspending student:', err);
      alert(err.response?.data?.message || 'Failed to suspend student');
    }
  };

  const handleExtend = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for extending suspension');
      return;
    }
    try {
      const res = await api.post(`/admin/students/${id}/extend-suspension`, {
        duration,
        reason,
        severityLevel
      });
      if (res.data.success) {
        setShowExtendModal(false);
        setReason('');
        fetchStudentDetails();
      }
    } catch (err) {
      console.error('Error extending suspension:', err);
      alert(err.response?.data?.message || 'Failed to extend suspension');
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/admin/students/${id}/restore`, {
        reason: restoreReason
      });
      if (res.data.success) {
        setShowRestoreModal(false);
        setRestoreReason('');
        fetchStudentDetails();
      }
    } catch (err) {
      console.error('Error restoring student:', err);
      alert(err.response?.data?.message || 'Failed to restore student');
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
      <AdminSidebar activePage="students" />

      <main className="admin-main">
        <div className="admin-breadcrumb-flex">
          <div className="breadcrumb-nav" onClick={() => navigate('/admin/students')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <h1>Student Profile</h1>
          </div>
          
          <div className="admin-profile-actions">
            <button className="btn-warn" onClick={() => handleUpdateStatus('Warned')}>Warn Student</button>
            {student?.account_status === 'Suspended' ? (
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
                }}>Restore Account</button>
              </>
            ) : (
              <button className="btn-suspend" onClick={() => {
                setDuration('24h');
                setSeverityLevel('Low');
                setReason('');
                setShowSuspendModal(true);
              }}>Suspend Account</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>Loading student profile...</div>
        ) : student ? (
          <div className="admin-profile-grid">
            {/* Left Column: Basic Info */}
            <div className="profile-left-card">
              <div className="profile-main-info">
                <div className="profile-avatar-large" style={{backgroundColor: '#F5F3FF', color: '#7C3AED'}}>
                  {student.profile_image ? (
                    <img src={window.getImageUrl(student.profile_image)} alt="" />
                  ) : (
                    student.first_name.charAt(0)
                  )}
                </div>
                <h2>{student.first_name} {student.last_name}</h2>
                <p className="profile-email">{student.email}</p>
                <span className={`status-badge-lg ${student.account_status === 'Suspended' ? 'suspended' : 'active'}`}>
                  {student.account_status}
                </span>

                {student.account_status === 'Suspended' && (
                  <div className="suspension-info-box">
                    <p><strong>Suspended Until:</strong> {student.suspended_until ? new Date(student.suspended_until).toLocaleString() : 'Permanently'}</p>
                    <p className="time-remaining">{getRemainingTimeText(student.suspended_until)}</p>
                  </div>
                )}
              </div>

              <div className="profile-detail-list">
                <div className="detail-item">
                  <label>DEPARTMENT</label>
                  <span>{student.department || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>GRADUATION YEAR</label>
                  <span>{student.graduation_year || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Activity & Reports */}
            <div className="profile-right-content">
              <div className="activity-overview-card">
                <h3>Activity Overview</h3>
                <div className="activity-stats-grid">
                  <div className="stat-box">
                    <span className="stat-num">{stats.marketplace}</span>
                    <span className="stat-label">Marketplace</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{stats.skills}</span>
                    <span className="stat-label">Skills</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{stats.services}</span>
                    <span className="stat-label">Services</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{stats.orders}</span>
                    <span className="stat-label">Orders</span>
                  </div>
                </div>
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

              <div className="reports-history-card">
                <h3>Recent Reports Against User</h3>
                <div className="reports-list">
                  {reports.length > 0 ? reports.map((report) => (
                    <div key={report.id} className="report-item">
                      <div className="report-header">
                        <span className="reporter">Flagged by: <strong>{report.reporter_name}</strong></span>
                        <span className="report-date">{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="report-reason">{report.reason}</p>
                      <span className={`report-status ${report.status.toLowerCase()}`}>{report.status}</span>
                    </div>
                  )) : (
                    <div className="empty-reports">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      <p>No reports against this user.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{padding: '2rem', textAlign: 'center'}}>Student not found</div>
        )}
      </main>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <div className="suspension-modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <form className="suspension-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSuspend}>
            <div className="suspension-modal-header">
              <h3>Suspend Student Account</h3>
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
                placeholder="Specify details for the student's notification email/dashboard alert..."
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
              <h3>Extend Account Suspension</h3>
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
              <h3>Restore Student Account</h3>
              <button type="button" className="suspension-modal-close" onClick={() => setShowRestoreModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Reason for Restoration</label>
              <textarea
                className="suspension-modal-textarea"
                rows="4"
                placeholder="Specify details for student notification (e.g. Account reinstated after compliance check)..."
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

export default AdminStudentDetail;
