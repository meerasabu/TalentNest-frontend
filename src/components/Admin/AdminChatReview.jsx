import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminChatReview.css';

const AdminChatReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = React.useMemo(() => {
    return location.state?.user || JSON.parse(localStorage.getItem('user'));
  }, [location.state?.user]);

  const [report, setReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [restrictReason, setRestrictReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionDuration, setSuspensionDuration] = useState('24h');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    } else {
      fetchReviewData();
    }
  }, [id, user]);

  const fetchReviewData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reports/${id}/messages`);
      if (res.data.success) {
        setReport(res.data.report);
        setMessages(res.data.messages);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
      setError('Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async () => {
    if (!window.confirm("Are you sure you want to resolve this report with no further action?")) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/reports/${id}/resolve`);
      if (res.data.success) {
        alert("Report resolved successfully.");
        navigate('/admin/chat');
      }
    } catch (err) {
      console.error("Error resolving report:", err);
      alert("Failed to resolve report.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleWarnUser = async () => {
    if (!window.confirm(`Are you sure you want to send a guidelines warning to ${report.reported_first_name}?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/reports/${id}/warn`);
      if (res.data.success) {
        alert("Guidelines warning sent successfully.");
        navigate('/admin/chat');
      }
    } catch (err) {
      console.error("Error warning user:", err);
      alert("Failed to send warning.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestrictChat = async () => {
    if (!restrictReason.trim()) {
      alert("Please provide a reason for restricting the chat.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/reports/${id}/restrict`, {
        reason: restrictReason
      });
      if (res.data.success) {
        alert("Chat session restricted successfully.");
        setShowRestrictModal(false);
        setRestrictReason('');
        navigate('/admin/chat');
      }
    } catch (err) {
      console.error("Error restricting chat:", err);
      alert(err.response?.data?.message || "Failed to restrict chat session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!suspensionReason.trim()) {
      alert("Please provide a reason for suspension.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/reports/${id}/suspend`, {
        duration: suspensionDuration,
        reason: suspensionReason
      });
      if (res.data.success) {
        alert("User suspended successfully.");
        setShowSuspendModal(false);
        setSuspensionReason('');
        navigate('/admin/chat');
      }
    } catch (err) {
      console.error("Error suspending user:", err);
      alert("Failed to suspend user.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="chat" />

      <main className="admin-main">
        <header className="admin-header-flex detail-header">
          <button className="back-btn" onClick={() => navigate('/admin/chat')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div className="admin-header-text">
            <h1>Conversation Review</h1>
          </div>
        </header>

        <div className="privacy-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <p>Chats are visible only for moderation purposes after a report is submitted.</p>
        </div>

        {loading ? (
          <div className="loading-state">Loading conversation...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <div className="chat-review-grid">
            <div className="chat-log-card">
              <div className="chat-log-header">
                <h3>Chat Log: {report.reporter_first_name} & {report.reported_first_name}</h3>
                <span className="related-item">Related to: {report.itemTitle}</span>
              </div>
              
              <div className="chat-messages-container">
                {messages.length > 0 ? messages.map((msg) => {
                  const isReported = msg.message_text.includes(report.reason.split(' ')[0]); // Simple heuristic for demo
                  return (
                    <div key={msg.message_id} className={`chat-message-wrapper ${msg.sender_id === report.reporter_id ? 'reporter' : 'reported'} ${isReported ? 'flagged-message' : ''}`}>
                      <div className="message-meta">
                        {isReported && <span className="flagged-label">Reported Message • </span>}
                        {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="message-bubble">
                        {msg.message_text}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="no-messages">No messages found for this interaction.</div>
                )}
              </div>
            </div>

            <div className="report-actions-sidebar">
              <div className="detail-card">
                <h3>Report Details</h3>
                <div className="report-info-block">
                  <label>REASON</label>
                  <p className="reason-text">{report.reason}</p>
                </div>
                <div className="report-info-block">
                  <label>REPORTED BY</label>
                  <p>{report.reporter_first_name} {report.reporter_last_name}</p>
                </div>
                <div className="report-info-block">
                  <label>DATE</label>
                  <p>{new Date(report.created_at).toISOString().split('T')[0]}</p>
                </div>

                 <div className="action-buttons-stack">
                  <button className="mod-btn resolve-btn" onClick={handleResolveReport} disabled={actionLoading}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Resolve Report
                  </button>
                  <button className="mod-btn warn-btn" onClick={handleWarnUser} disabled={actionLoading}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Warn User ({report.reported_first_name})
                  </button>
                  <button className="mod-btn restrict-btn" onClick={() => setShowRestrictModal(true)} disabled={actionLoading}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    Restrict Chat Access
                  </button>
                  <button className="mod-btn suspend-btn" onClick={() => setShowSuspendModal(true)} disabled={actionLoading}>
                    Suspend User ({report.reported_first_name})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal for Restrict Chat */}
      {showRestrictModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '12px', textAlign: 'center' }}>Restrict Chat Access?</h3>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: '1.4', marginBottom: '16px', textAlign: 'center' }}>
              This will disable messaging in this specific conversation for both users. They will be notified that the chat was restricted by an admin due to a guidelines complaint.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Reason for Restriction
              </label>
              <textarea 
                rows="4" 
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
                placeholder="Specify the reason for restricting this chat..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #D1D5DB',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowRestrictModal(false);
                  setRestrictReason('');
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '30px',
                  border: '1.5px solid #E5E7EB',
                  background: 'white',
                  color: '#4B5563',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRestrictChat}
                disabled={!restrictReason.trim()}
                style={{
                  padding: '10px 18px',
                  borderRadius: '30px',
                  border: 'none',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: !restrictReason.trim() ? 0.6 : 1
                }}
              >
                Restrict Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Suspend User */}
      {showSuspendModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '12px', textAlign: 'center' }}>
              Suspend User ({report.reported_first_name})
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: '1.4', marginBottom: '16px', textAlign: 'center' }}>
              Temporarily disable this student's messaging access across the entire platform. The user will be notified of the reason.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Suspension Duration
              </label>
              <select 
                value={suspensionDuration} 
                onChange={(e) => setSuspensionDuration(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #D1D5DB',
                  background: 'white',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              >
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', marginBottom: '6px' }}>
                Reason for Suspension
              </label>
              <textarea 
                rows="4" 
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Specify the reason..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #D1D5DB',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason('');
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '30px',
                  border: '1.5px solid #E5E7EB',
                  background: 'white',
                  color: '#4B5563',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSuspendUser}
                disabled={!suspensionReason.trim()}
                style={{
                  padding: '10px 18px',
                  borderRadius: '30px',
                  border: 'none',
                  background: '#EF4444',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: !suspensionReason.trim() ? 0.6 : 1
                }}
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatReview;
