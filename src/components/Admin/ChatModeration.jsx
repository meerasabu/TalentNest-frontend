import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './ChatModeration.css';

const ChatModeration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);

  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'active'); // 'active' or 'archive'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRole = user?.role;

  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    } else {
      fetchReports();
    }
  }, [userRole]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      if (res.data.success) {
        setReports(res.data.reports);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reported conversations');
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-dropdown-wrapper')) {
        document.querySelectorAll('.action-dropdown.show').forEach(el => {
          el.classList.remove('show');
        });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="chat" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Reported Conversations</h1>
            <p>Review flagged interactions between students</p>
          </div>
        </header>

        <div className="privacy-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <p><strong>Privacy Note:</strong> Chats are visible only for moderation purposes after a report is submitted. Admin cannot monitor all chats by default.</p>
        </div>

        {/* Active vs Archived Tabs */}
        {!loading && !error && (
          <div className="moderation-tabs-container" style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            borderBottom: '2px solid #E5E7EB',
            paddingBottom: '2px'
          }}>
            <button 
              className={`mod-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === 'active' ? '3px solid #7C3AED' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === 'active' ? '#7C3AED' : '#6B7280',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
            >
              Active Queue ({reports.filter(r => r.status === 'Pending').length})
            </button>
            <button 
              className={`mod-tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
              onClick={() => setActiveTab('archive')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === 'archive' ? '3px solid #7C3AED' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === 'archive' ? '#7C3AED' : '#6B7280',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
            >
              Archived History ({reports.filter(r => r.status !== 'Pending').length})
            </button>
          </div>
        )}

        <div className="admin-table-container">
          {loading ? (
            <div className="loading-state">Loading reports...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>BUYER</th>
                  <th>SELLER</th>
                  <th>RELATED ITEM</th>
                  <th>REPORT REASON</th>
                  <th>DATE</th>
                  {activeTab === 'active' ? (
                    <th>STATUS</th>
                  ) : (
                    <>
                      <th>ACTION TAKEN</th>
                      <th>ACTION REASON</th>
                    </>
                  )}
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'active' ? reports.filter(r => r.status === 'Pending') : reports.filter(r => r.status !== 'Pending')).length > 0 ? 
                  (activeTab === 'active' ? reports.filter(r => r.status === 'Pending') : reports.filter(r => r.status !== 'Pending')).map((report) => {
                    const allowed = report.status === 'Pending' || 
                      (report.action_taken && (report.action_taken.includes('Restrict Chat') || report.action_taken.includes('Suspend User')));
                    return (
                      <tr key={report.id}>
                        <td><strong>{report.reporter_first_name} {report.reporter_last_name}</strong></td>
                        <td style={{color: '#6B7280'}}>{report.reported_first_name} {report.reported_last_name}</td>
                        <td>{report.itemTitle}</td>
                        <td className="reason-cell">{report.reason}</td>
                        <td style={{color: '#6B7280'}}>{new Date(report.created_at).toISOString().split('T')[0]}</td>
                        {activeTab === 'active' ? (
                          <td>
                            <span className={`status-pill status-${report.status.toLowerCase().replace(' ', '-')}`}>
                              {report.status}
                            </span>
                          </td>
                        ) : (
                          <>
                            <td>
                              <span className={`status-pill action-${(report.action_taken || 'resolved').toLowerCase().split(' ')[0]}`} style={{
                                backgroundColor: report.action_taken?.includes('Warn') ? '#FEF3C7' : (report.action_taken?.includes('Restrict') || report.action_taken?.includes('Suspend') ? '#FEE2E2' : '#E0F2FE'),
                                color: report.action_taken?.includes('Warn') ? '#D97706' : (report.action_taken?.includes('Restrict') || report.action_taken?.includes('Suspend') ? '#DC2626' : '#0284C7'),
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                display: 'inline-block'
                              }}>
                                {report.action_taken || 'Resolved'}
                              </span>
                            </td>
                            <td style={{color: '#4B5563', fontSize: '0.85rem'}}>{report.action_reason || 'N/A'}</td>
                          </>
                        )}
                        <td className="text-right">
                          <div className="action-dropdown-wrapper" style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100%' }}>
                            {allowed ? (
                              <>
                                <button className="options-btn" onClick={(e) => {
                                  const dropdown = e.currentTarget.nextElementSibling;
                                  dropdown.classList.toggle('show');
                                }}>
                                  Options
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                                <div className="action-dropdown">
                                  <button onClick={() => navigate(`/admin/chat/${report.id}`)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    View Conversation
                                  </button>
                                </div>
                              </>
                            ) : (
                              <span title="Conversation log locked for privacy/resolved cases without active security threat" style={{ 
                                fontSize: '0.8rem', 
                                color: '#9CA3AF', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                fontWeight: '600',
                                background: '#F3F4F6',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                border: '1px solid #E5E7EB',
                                cursor: 'help'
                              }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                Locked
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={activeTab === 'active' ? 7 : 8} style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>
                        No reports found
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatModeration;
