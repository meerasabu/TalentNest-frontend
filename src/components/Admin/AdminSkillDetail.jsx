import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminSkillDetail.css';

const AdminSkillDetail = () => {
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
  
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warnHistory, setWarnHistory] = useState([]);

  // Warn Modal
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnReason, setWarnReason] = useState('');
  const [warnLoading, setWarnLoading] = useState(false);

  const userRole = user?.role;

  // Route protection
  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchSkillDetails();
      fetchWarnHistory();
    }
  }, [id, userRole]);

  const fetchSkillDetails = async () => {
    try {
      const res = await api.get(`/admin/skills/${id}`);
      if (res.data.success) setSkill(res.data.skill);
    } catch (err) {
      console.error('Error fetching admin skill detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarnHistory = async () => {
    try {
      const res = await api.get(`/admin/skills/${id}/warn-history`);
      if (res.data.success) setWarnHistory(res.data.warnHistory || []);
    } catch (err) {
      console.error('Error fetching warn history:', err);
    }
  };

  const handleUpdateStatus = async (newStatus, rejectionReason = null) => {
    try {
      const res = await api.put(`/admin/skills/${id}/status`, { status: newStatus, rejectionReason });
      if (res.data.success) setSkill({ ...skill, status: newStatus, rejection_reason: rejectionReason });
    } catch (err) {
      console.error('Error updating skill status:', err);
      alert('Failed to update status');
    }
  };

  const handleWarnProvider = async (e) => {
    e.preventDefault();
    if (!warnReason.trim()) return;
    setWarnLoading(true);
    try {
      const res = await api.post(`/admin/skills/${id}/warn-provider`, { reason: warnReason });
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

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="skills" />

      <main className="admin-main">
        <div className="admin-breadcrumb-flex">
          <div className="breadcrumb-nav" onClick={() => navigate('/admin/skills')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <h1>Skill Details</h1>
          </div>
          
          <div className="admin-profile-actions">
            <button
              className="btn-warn"
              onClick={() => { setWarnReason(''); setShowWarnModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Warn Provider
            </button>
            {skill?.status !== 'Active' && (
              <button
                className="btn-mark btn-approve-skill"
                onClick={() => handleUpdateStatus('Active')}
                style={{ backgroundColor: '#10B981', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '14px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                Approve Skill
              </button>
            )}
            {skill?.status !== 'Rejected' && (
              <button
                className="btn-warn btn-reject-skill"
                onClick={() => {
                  const reason = prompt('Please enter a rejection reason:');
                  if (reason) handleUpdateStatus('Rejected', reason);
                }}
                style={{ backgroundColor: '#EF4444', color: 'white', border: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', marginLeft: '8px' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                Reject Skill
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>Loading skill details...</div>
        ) : skill ? (
          <div className="admin-skill-grid">
            {/* Info Card */}
            <div className="skill-info-card">
              <div className="skill-info-header">
                <div>
                  <h2>{skill.title}</h2>
                  <div className="skill-price-text">
                    {skill.charge_type === 'Paid' ? `Paid (₹${skill.hourly_rate}/hr)` : 'Exchange'}
                  </div>
                </div>
                <span className={`status-badge-lg ${skill.status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                  {skill.status || 'Pending'}
                </span>
              </div>
              
              {skill.status === 'Rejected' && skill.rejection_reason && (
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '8px', padding: '12px 16px', color: '#B91C1C', fontSize: '14px', marginBottom: '20px' }}>
                  <strong>Rejection Reason:</strong> {skill.rejection_reason}
                </div>
              )}
              
              <div className="skill-meta-grid">
                <div className="meta-item">
                  <label>CATEGORY</label>
                  <span>{skill.category}</span>
                </div>
                <div className="meta-item">
                  <label>SESSION</label>
                  <span>{skill.skill_type || 'Online'}</span>
                </div>
                <div className="meta-item">
                  <label>AVAILABILITY</label>
                  <span>{skill.available_time_slot || 'Weekends'}</span>
                </div>
              </div>

              <div className="skill-description-admin">
                <h3>Description</h3>
                <p>{skill.description}</p>
              </div>

              {/* Mentor Information */}
              <div className="sk-section-block-admin">
                <h3>Mentor Information</h3>
                <div className="mentor-info-grid-box">
                  <div className="mentor-info-item">
                    <span className="mib-label">Experience Level</span>
                    <span className="mib-val">{skill.experience_level || 'Beginner'}</span>
                  </div>
                  <div className="mentor-info-item">
                    <span className="mib-label">Languages Known</span>
                    <span className="mib-val">{skill.languages_known || 'English'}</span>
                  </div>
                  <div className="mentor-info-item">
                    <span className="mib-label">Session Setup</span>
                    <span className="mib-val">
                      {(skill.session_types && (typeof skill.session_types === 'string' ? skill.session_types : skill.session_types.join(', '))) || '1:1 Session'}
                    </span>
                  </div>
                </div>
                {skill.prev_experience && (
                  <div className="prev-experience-block" style={{ marginTop: '12px' }}>
                    <span className="mib-label" style={{ display: 'block', marginBottom: '4px' }}>Previous Session Experience</span>
                    <p style={{ fontSize: '0.9rem', color: '#B45309', margin: 0, lineHeight: '1.5' }}>{skill.prev_experience}</p>
                  </div>
                )}
              </div>

              {/* Topics Covered & Learning Outcomes */}
              <div className="sk-section-block-admin">
                <div className="topics-outcomes-flex">
                  <div className="topics-box-item">
                    <h3>Topics Covered</h3>
                    {skill.topics_covered ? (
                      <ul className="topics-outcomes-list">
                        {skill.topics_covered.split('\n').filter(t => t.trim()).map((t, idx) => (
                          <li key={idx}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2.5" style={{ marginRight: '8px', flexShrink: 0 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>Refer description for topics.</p>
                    )}
                  </div>
                  
                  <div className="outcomes-box-item">
                    <h3>Learning Outcomes</h3>
                    {skill.learning_outcomes ? (
                      <ul className="topics-outcomes-list">
                        {skill.learning_outcomes.split('\n').filter(o => o.trim()).map((o, idx) => (
                          <li key={idx}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" style={{ marginRight: '8px', flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>Practical, hands-on learning guidance.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Availability schedule */}
              <div className="sk-section-block-admin">
                <h3>Availability Schedule</h3>
                <div className="sk-availability-pills">
                  {skill.day_availability ? (
                    (typeof skill.day_availability === 'string' ? skill.day_availability.split(', ') : skill.day_availability).map((day, index) => (
                      <span key={index} className="sk-avail-day-pill">
                        <svg className="sk-avail-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {day}
                      </span>
                    ))
                  ) : (
                    <span className="sk-avail-day-pill">Flexible Days</span>
                  )}
                </div>
                <div className="sk-availability-pills" style={{ marginTop: '12px' }}>
                  {skill.available_time_slot ? (
                    skill.available_time_slot.split(', ').map((slot, index) => (
                      <span key={index} className="sk-avail-pill">
                        <svg className="sk-avail-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {slot}
                      </span>
                    ))
                  ) : (
                    <span className="sk-avail-pill">Flexible Time Slots</span>
                  )}
                </div>
              </div>

              {/* Portfolio & Social Verification links */}
              {(() => {
                let portfolioObj = { github: '', linkedin: '', portfolio: '', certificates: '' };
                if (skill.portfolio_links) {
                  portfolioObj = typeof skill.portfolio_links === 'string'
                    ? JSON.parse(skill.portfolio_links)
                    : skill.portfolio_links;
                }
                if (portfolioObj.github || portfolioObj.linkedin || portfolioObj.portfolio || portfolioObj.certificates) {
                  return (
                    <div className="sk-section-block-admin">
                      <h3>Mentor Portfolio & Verification</h3>
                      <div className="portfolio-link-showcase">
                        {portfolioObj.github && (
                          <a href={portfolioObj.github} target="_blank" rel="noopener noreferrer" className="portfolio-link-badge">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                            <span>GitHub Profile</span>
                          </a>
                        )}
                        {portfolioObj.linkedin && (
                          <a href={portfolioObj.linkedin} target="_blank" rel="noopener noreferrer" className="portfolio-link-badge">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {portfolioObj.portfolio && (
                          <a href={portfolioObj.portfolio} target="_blank" rel="noopener noreferrer" className="portfolio-link-badge">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            <span>Portfolio Website</span>
                          </a>
                        )}
                        {portfolioObj.certificates && (
                          <a href={portfolioObj.certificates} target="_blank" rel="noopener noreferrer" className="portfolio-link-badge">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            <span>Verification Proof / Cert</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Media Showcase (Demo gallery) */}
              {skill.demo_media && skill.demo_media.length > 0 && (
                <div className="sk-section-block-admin">
                  <h3>Media & Demos Showcase</h3>
                  <div className="demo-showcase-gallery">
                    {skill.demo_media.map((mediaPath, index) => {
                      const fileUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${mediaPath}`;
                      const isVideo = mediaPath.toLowerCase().endsWith('.mp4') || 
                                      mediaPath.toLowerCase().endsWith('.mov') ||
                                      mediaPath.toLowerCase().endsWith('.webm');
                      const isPdf = mediaPath.toLowerCase().endsWith('.pdf');
                      const pathParts = mediaPath.split('-');
                      const cleanName = pathParts.length > 3 
                        ? pathParts.slice(3).join('-') 
                        : (pathParts.slice(2).join('-') || 'Document.pdf');
                      return (
                        <div key={index} className="demo-gallery-card">
                          {isVideo ? (
                            <video src={fileUrl} className="demo-video-player" controls preload="metadata" />
                          ) : isPdf ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="demo-pdf-link">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                              </svg>
                              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#DC2626', letterSpacing: '0.05em', marginTop: '4px' }}>OPEN PDF FILE</span>
                              <span style={{ fontSize: '0.65rem', color: '#7F1D1D', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }} title={cleanName}>
                                {cleanName}
                              </span>
                            </a>
                          ) : (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                              <img src={fileUrl} alt={`Demo ${index + 1}`} className="demo-image-item" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="admin-skill-sidebar">
              {/* Provider Card */}
              <div className="provider-details-card">
                <h3>PROVIDER DETAILS</h3>
                <div className="provider-profile-sm">
                  <div className="provider-avatar-sm" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                    {skill.provider_avatar ? (
                      <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${skill.provider_avatar}`} alt="" />
                    ) : (
                      skill.first_name.charAt(0)
                    )}
                  </div>
                  <div className="provider-info-text">
                    <span className="provider-name-admin">{skill.first_name} {skill.last_name}</span>
                    <span className="provider-sub-text">
                      {skill.provider_dept ? `${skill.provider_dept}` : 'Campus Peer'}
                      {skill.provider_grad_year ? ` (Class of ${skill.provider_grad_year})` : ''}
                    </span>
                    {skill.provider_account_status === 'Verified' && (
                      <span className="status-badge-lg active" style={{ display: 'inline-block', alignSelf: 'flex-start', marginTop: '4px', padding: '2px 8px', fontSize: '10px', textTransform: 'uppercase' }}>Verified Student</span>
                    )}
                    <Link to={`/admin/students/${skill.user_id}`} className="view-profile-link" style={{ marginTop: '8px' }}>View Profile</Link>
                  </div>
                </div>
              </div>

              {/* Warning History Card */}
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
                    <p>No warnings issued for this skill listing yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : (
          <div style={{padding: '2rem', textAlign: 'center'}}>Skill not found</div>
        )}
      </main>

      {/* Warn Provider Modal */}
      {showWarnModal && (
        <div className="suspension-modal-overlay" onClick={() => setShowWarnModal(false)}>
          <form className="suspension-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleWarnProvider}>
            <div className="suspension-modal-header">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Warn Skill Provider
              </h3>
              <button type="button" className="suspension-modal-close" onClick={() => setShowWarnModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '-8px 0 16px 0', lineHeight: '1.5' }}>
              A notification will be sent to the skill provider. This will be recorded in the warning history.
            </p>
            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Reason for Warning</label>
              <textarea
                className="suspension-modal-textarea"
                rows="4"
                placeholder="Describe the violation or issue with this skill listing..."
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
    </div>
  );
};

export default AdminSkillDetail;
