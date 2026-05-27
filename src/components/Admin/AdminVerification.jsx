import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import Pagination from '../Common/Pagination';
import './AdminVerification.css';

const AdminVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);

  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Bulk verification states
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState(null); // 'review', 'reject'
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [activeBulkIndex, setActiveBulkIndex] = useState(0);
  const [showList, setShowList] = useState(false);

  const userRole = user?.role;

  // Route protection
  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchRequests();
    }
  }, [userRole]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/verifications');
      if (res.data.success) {
        setRequests(Array.isArray(res.data.verifications) ? res.data.verifications : []);
        setSelectedIds([]); // Clear selection when data reloads
      }
    } catch (err) {
      console.error('Error fetching verification requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search logic
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const reqList = Array.isArray(requests) ? requests : [];
    const filtered = reqList.filter(r => {
      if (!r) return false;
      const publisherName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
      const title = (r.title || '').toLowerCase();
      const category = (r.category || '').toLowerCase();
      const department = (r.department || '').toLowerCase();
      const status = (r.status || 'Pending Verification').toLowerCase();
      return (
        publisherName.includes(term) ||
        title.includes(term) ||
        category.includes(term) ||
        department.includes(term) ||
        status.includes(term)
      );
    });
    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [requests, searchTerm]);

  const handleUpdateStatus = async (requestId, newStatus, rejectionReason = null) => {
    try {
      const res = await api.put(`/admin/verifications/${requestId}/status`, {
        status: newStatus,
        rejectionReason
      });
      if (res.data.success) {
        // Update local state
        setRequests(prev => 
          prev.map(r => r.id === requestId ? { ...r, status: newStatus, rejection_reason: rejectionReason } : r)
        );
        // If modal is open, update the modal request details
        if (selectedRequest && selectedRequest.id === requestId) {
          setSelectedRequest(prev => ({ ...prev, status: newStatus, rejection_reason: rejectionReason }));
        }
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error('Error updating verification status:', err);
      alert('Failed to update status.');
    }
  };

  // Bulk verification selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredRequests.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRemoveFromBulk = (id) => {
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const handleBulkUpdateStatus = async (status, rejectionReason = null) => {
    if (selectedIds.length === 0) return;
    
    let actionLabel = 'Approve';
    if (status === 'Rejected') actionLabel = 'Reject';
    else if (status === 'Pending Verification') actionLabel = 'Mark for Review';

    const confirmMessage = `Are you sure you want to change the status of ${selectedIds.length} selected request(s) to "${actionLabel}"?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const res = await api.put('/admin/verifications/bulk/status', {
        ids: selectedIds,
        status,
        rejectionReason
      });
      if (res.data.success) {
        await fetchRequests();
        setSelectedIds([]);
        setBulkActionType(null);
        setBulkRejectionReason('');
        setShowBulkModal(false);
        alert(res.data.message || 'Bulk status updated successfully.');
      }
    } catch (err) {
      console.error('Error updating bulk status:', err);
      alert('Failed to apply bulk actions.');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualAction = async (id, status, reason = null) => {
    try {
      const res = await api.put(`/admin/verifications/${id}/status`, {
        status,
        rejectionReason: reason
      });
      if (res.data.success) {
        // Update local state
        setRequests(prev => 
          prev.map(r => r.id === id ? { ...r, status, rejection_reason: reason } : r)
        );
        // Remove from selection
        setSelectedIds(prev => prev.filter(x => x !== id));
        
        // Adjust index if we removed the last element
        const remainingCount = selectedIds.length - 1;
        if (remainingCount === 0) {
          setShowBulkModal(false);
          alert('All selected requests moderated.');
        } else {
          setActiveBulkIndex(prev => Math.min(prev, remainingCount - 1));
        }
      }
    } catch (err) {
      console.error('Error in individual action:', err);
      alert('Failed to update status.');
    }
  };

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const closeAllDropdowns = () => {
      setActiveDropdown(null);
    };
    window.addEventListener('click', closeAllDropdowns);
    return () => window.removeEventListener('click', closeAllDropdowns);
  }, []);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  if (!user || user.role !== 'admin') return null;

  // Helpers for date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toISOString().split('T')[0];
    } catch (e) {
      return 'N/A';
    }
  };

  const formatLocalDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  };

  // Helpers for portfolio links & media
  const getPortfolioLinks = (req) => {
    if (!req || !req.portfolio_links) return {};
    if (typeof req.portfolio_links === 'string') {
      try {
        return JSON.parse(req.portfolio_links);
      } catch (e) {
        console.error('Error parsing portfolio_links:', e);
        return {};
      }
    }
    return req.portfolio_links;
  };

  const getMediaUrl = (url) => {
    if (typeof url !== 'string' || !url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const formatLink = (url) => {
    if (typeof url !== 'string' || !url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const isImage = (url) => typeof url === 'string' && /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  const isVideo = (url) => typeof url === 'string' && /\.(mp4|webm|ogg|mov)$/i.test(url);
  const isPdf = (url) => typeof url === 'string' && /\.pdf$/i.test(url);

  return (
    <div className="admin-container">
      <AdminSidebar activePage="verification" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Verification</h1>
            <p>Review student skill sessions and badge publish requests</p>
          </div>

          <div className="admin-controls">
            <div className="admin-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {selectedIds.length > 0 && (
          <div className="admin-bulk-actions-bar">
            <div className="bulk-actions-left">
              <span className="bulk-selection-count">
                <strong>{selectedIds.length}</strong> request{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <button type="button" className="bulk-clear-selection-btn" onClick={() => setSelectedIds([])}>
                Clear Selection
              </button>
            </div>
            <div className="bulk-actions-right">
              <button 
                type="button"
                className="bulk-action-btn-primary" 
                onClick={() => {
                  setBulkActionType('review');
                  setActiveBulkIndex(0);
                  setShowBulkModal(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Bulk Review
              </button>
              <button 
                type="button"
                className="bulk-action-btn-green"
                onClick={() => handleBulkUpdateStatus('Active')}
              >
                Approve Selected
              </button>
              <button 
                type="button"
                className="bulk-action-btn-danger" 
                onClick={() => {
                  setBulkActionType('reject');
                  setActiveBulkIndex(0);
                  setShowBulkModal(true);
                }}
              >
                Reject Selected
              </button>
              <button 
                type="button"
                className="bulk-action-btn-amber"
                onClick={() => handleBulkUpdateStatus('Pending Verification')}
              >
                Mark for Review
              </button>
            </div>
          </div>
        )}

        <div className="admin-table-container">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading requests...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', paddingLeft: '24px' }}>
                    <input 
                      type="checkbox" 
                      checked={filteredRequests.length > 0 && selectedIds.length === filteredRequests.length}
                      onChange={handleSelectAll}
                      className={`admin-checkbox ${selectedIds.length > 0 ? 'visible' : ''}`}
                    />
                  </th>
                  <th>PUBLISHER</th>
                  <th>SKILL TITLE</th>
                  <th>CATEGORY</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length > 0 ? (
                  paginatedRequests.map((request) => (
                    <tr key={request.id}>
                      <td style={{ paddingLeft: '24px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(request.id)}
                          onChange={() => handleSelectOne(request.id)}
                          className={`admin-checkbox ${selectedIds.includes(request.id) ? 'visible' : ''}`}
                        />
                      </td>
                      <td>
                        <div className="student-profile-cell">
                          <div className="student-avatar-mini" style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
                            {request.profile_image ? (
                              <img src={window.getImageUrl(request.profile_image)} alt="" />
                            ) : (
                              (request.first_name || 'U').charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="student-name-text" style={{ display: 'block', fontWeight: '600' }}>
                              {request.first_name || ''} {request.last_name || ''}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6B7280' }}>
                              {request.email || ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{request.title || 'Untitled Skill'}</span>
                      </td>
                      <td>
                        <span className="badge-type-text">{request.category || 'N/A'}</span>
                      </td>
                      <td>{formatDate(request.created_at)}</td>
                      <td>
                        <span className={`status-badge ${
                          (request.status || 'Pending Verification') === 'Pending Verification' ? 'pending' : 
                          (request.status || '') === 'Active' ? 'approved' : 
                          (request.status || '') === 'Rejected' ? 'rejected' : 
                          (request.status || '').toLowerCase().replace(/\s+/g, '-')
                        }`}>
                          {request.status || 'Pending Verification'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-dropdown-wrapper">
                          <button className={`options-btn ${activeDropdown === request.id ? 'visible' : ''}`} onClick={(e) => toggleDropdown(request.id, e)}>
                            Options
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </button>

                          {activeDropdown === request.id && (
                            <div className="admin-dropdown-menu" onClick={e => e.stopPropagation()}>
                              <button onClick={() => {
                                setSelectedRequest(request);
                                setActiveDropdown(null);
                              }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                View
                              </button>
                              
                              {request.status === 'Pending Verification' && (
                                <>
                                  <button className="text-green" onClick={() => handleUpdateStatus(request.id, 'Active')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Approve
                                  </button>
                                  <button className="text-danger" onClick={() => {
                                    const reason = prompt('Please enter a rejection reason:');
                                    if (reason !== null && reason.trim() !== '') {
                                      handleUpdateStatus(request.id, 'Rejected', reason);
                                    }
                                  }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>No verification requests found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredRequests.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <Pagination 
              currentPage={currentPage}
              totalItems={filteredRequests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </main>

      {/* Verification Document Modal */}
      {selectedRequest && (
        <div className="verification-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="verification-modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            <div className="verification-modal-header">
              <h3>Skill Session Moderation</h3>
              <button className="close-modal-btn" onClick={() => setSelectedRequest(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="verification-modal-body">
              <div className="verification-details-grid">
                <div className="details-item">
                  <span className="details-label">Publisher Name</span>
                  <span className="details-val">{selectedRequest.first_name || ''} {selectedRequest.last_name || ''}</span>
                </div>
                <div className="details-item">
                  <span className="details-label">Category</span>
                  <span className="details-val badge-type-val">{selectedRequest.category || 'N/A'}</span>
                </div>
                <div className="details-item">
                  <span className="details-label">Department</span>
                  <span className="details-val">{selectedRequest.department || 'N/A'}</span>
                </div>
                <div className="details-item">
                  <span className="details-label">Graduation Year</span>
                  <span className="details-val">{selectedRequest.graduation_year || 'N/A'}</span>
                </div>
                <div className="details-item">
                  <span className="details-label">Date Submitted</span>
                  <span className="details-val">{formatLocalDate(selectedRequest.created_at)}</span>
                </div>
                <div className="details-item">
                  <span className="details-label">Status</span>
                  <span className={`status-badge ${
                    (selectedRequest.status || 'Pending Verification') === 'Pending Verification' ? 'pending' : 
                    (selectedRequest.status || '') === 'Active' ? 'approved' : 
                    (selectedRequest.status || '') === 'Rejected' ? 'rejected' : 
                    (selectedRequest.status || '').toLowerCase().replace(/\s+/g, '-')
                  }`}>{selectedRequest.status || 'Pending Verification'}</span>
                </div>
              </div>

              {/* General details of the skill */}
              <div>
                <span className="details-label" style={{ display: 'block', marginBottom: '4px' }}>Skill Title</span>
                <span className="details-val" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
                  {selectedRequest.title || 'Untitled Skill'}
                </span>
              </div>

              <div>
                <span className="details-label" style={{ display: 'block', marginBottom: '4px' }}>Description</span>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563', lineHeight: '1.5' }}>
                  {selectedRequest.description || 'No description provided.'}
                </p>
              </div>

              <div className="verification-details-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="details-item">
                  <span className="details-label">Type</span>
                  <span className="details-val">{selectedRequest.skill_type || 'Online'}</span>
                </div>
                <div className="details-item">
                  <span className="details-label">Compensation</span>
                  <span className="details-val">
                    {selectedRequest.charge_type === 'Free' ? 'Free' : selectedRequest.hourly_rate ? `₹${selectedRequest.hourly_rate} / hr` : 'N/A'}
                  </span>
                </div>
                <div className="details-item">
                  <span className="details-label">Availability</span>
                  <span className="details-val" style={{ fontSize: '0.8rem' }}>
                    {selectedRequest.day_availability || 'N/A'}<br/>
                    {selectedRequest.available_time_slot || ''}
                  </span>
                </div>
              </div>

              {/* Trusted System Peer Learning Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span className="details-label" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '4px' }}>Trusted System Details</span>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <span className="details-label">Experience Level</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>{selectedRequest.experience_level || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="details-label">Languages Known</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>{selectedRequest.languages_known || 'N/A'}</div>
                  </div>
                </div>

                {selectedRequest.prev_experience && (
                  <div>
                    <span className="details-label">Previous Experience</span>
                    <div style={{ fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'pre-line' }}>{selectedRequest.prev_experience}</div>
                  </div>
                )}

                {selectedRequest.topics_covered && (
                  <div>
                    <span className="details-label">Topics Covered</span>
                    <div style={{ fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'pre-line' }}>{selectedRequest.topics_covered}</div>
                  </div>
                )}

                {selectedRequest.learning_outcomes && (
                  <div>
                    <span className="details-label">Learning Outcomes</span>
                    <div style={{ fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'pre-line' }}>{selectedRequest.learning_outcomes}</div>
                  </div>
                )}
              </div>

              {/* Portfolio Links */}
              {Object.keys(getPortfolioLinks(selectedRequest)).length > 0 && (
                <div>
                  <span className="details-label" style={{ display: 'block', marginBottom: '6px' }}>Portfolio & Social Links</span>
                  <div className="portfolio-links-list">
                    {Object.entries(getPortfolioLinks(selectedRequest)).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a 
                          key={platform} 
                          href={formatLink(url)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`portfolio-link-badge ${platform.toLowerCase()}`}
                        >
                          {platform.toUpperCase()}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Demo Media Previews */}
              {selectedRequest.demo_media && Array.isArray(selectedRequest.demo_media) && selectedRequest.demo_media.filter(Boolean).length > 0 && (
                <div>
                  <span className="details-label" style={{ display: 'block', marginBottom: '6px' }}>Demo Media Attachments</span>
                  <div className="media-previews-grid">
                    {selectedRequest.demo_media.filter(Boolean).map((mediaUrl, idx) => {
                      const fullUrl = getMediaUrl(mediaUrl);
                      const filename = typeof mediaUrl === 'string' ? (mediaUrl.split('/').pop() || `attachment-${idx + 1}`) : `attachment-${idx + 1}`;
                      if (isImage(mediaUrl)) {
                        return (
                          <div key={idx} className="media-preview-item">
                            <img src={fullUrl} alt={filename} />
                            <div className="media-item-footer">
                              <span className="media-item-title">{filename}</span>
                              <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="media-item-action">View</a>
                            </div>
                          </div>
                        );
                      } else if (isVideo(mediaUrl)) {
                        return (
                          <div key={idx} className="media-preview-item">
                            <video src={fullUrl} controls />
                            <div className="media-item-footer">
                              <span className="media-item-title">{filename}</span>
                              <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="media-item-action">View</a>
                            </div>
                          </div>
                        );
                      } else if (isPdf(mediaUrl)) {
                        return (
                          <div key={idx} className="media-preview-item pdf-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                            <div className="media-item-footer" style={{ marginTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
                              <span className="media-item-title">{filename}</span>
                              <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="media-item-action">Open</a>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={idx} className="media-preview-item pdf-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            <div className="media-item-footer" style={{ marginTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
                              <span className="media-item-title">{filename}</span>
                              <a href={fullUrl} download className="media-item-action">Download</a>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}

              {/* Rejection Reason display if rejected */}
              {selectedRequest.status === 'Rejected' && selectedRequest.rejection_reason && (
                <div className="rejection-reason-box">
                  <h4>Rejection Reason</h4>
                  <p>{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>

            <div className="verification-modal-footer">
              <button className="verification-modal-btn-cancel" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
              {selectedRequest.status === 'Pending Verification' && (
                <div className="action-buttons-flex">
                  <button className="verification-modal-btn-reject" onClick={() => {
                    const reason = prompt('Please enter a rejection reason:');
                    if (reason !== null && reason.trim() !== '') {
                      handleUpdateStatus(selectedRequest.id, 'Rejected', reason);
                    }
                  }}>
                    Reject
                  </button>
                  <button className="verification-modal-btn-confirm" onClick={() => handleUpdateStatus(selectedRequest.id, 'Active')}>
                    Approve & Publish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Review Modal */}
      {showBulkModal && (
        (() => {
          const selectedRequests = requests.filter(r => selectedIds.includes(r.id));
          if (selectedRequests.length === 0) return null;
          const activeReq = selectedRequests[Math.min(activeBulkIndex, selectedRequests.length - 1)] || selectedRequests[0];
          if (!activeReq) return null;
          const reqPortfolio = getPortfolioLinks(activeReq);

          return (
            <div className="verification-modal-overlay" onClick={() => setShowBulkModal(false)}>
              <div className="verification-modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
                <div className="verification-modal-header">
                  <div className="bulk-header-title-nav">
                    <h3>Bulk Verification Review ({activeBulkIndex + 1} of {selectedRequests.length})</h3>
                    <div className="bulk-nav-arrows">
                      <button 
                        type="button" 
                        className="bulk-arrow-btn" 
                        disabled={activeBulkIndex === 0}
                        onClick={() => setActiveBulkIndex(prev => prev - 1)}
                        title="Previous Request"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                      <button 
                        type="button" 
                        className="bulk-arrow-btn" 
                        disabled={activeBulkIndex === selectedRequests.length - 1}
                        onClick={() => setActiveBulkIndex(prev => prev + 1)}
                        title="Next Request"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    </div>
                  </div>
                  <button className="close-modal-btn" onClick={() => setShowBulkModal(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="verification-modal-body">
                  {/* Collapsible Select All List and Bulk Actions */}
                  <div className="bulk-action-selection-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="details-label">Bulk Action On All Selected ({selectedRequests.length})</span>
                      <button type="button" className="bulk-clear-selection-btn" style={{ padding: 0 }} onClick={() => setShowList(!showList)}>
                        {showList ? 'Hide List' : 'Show List'}
                      </button>
                    </div>
                    
                    {showList && (
                      <div className="bulk-requests-list" style={{ marginTop: '4px', marginBottom: '4px' }}>
                        {selectedRequests.map((req, idx) => (
                          <div key={req.id} className={`bulk-request-item ${idx === activeBulkIndex ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setActiveBulkIndex(idx)}>
                            <div className="bulk-request-item-details">
                              <span className="bulk-item-publisher"><strong>{req.first_name} {req.last_name}</strong></span>
                              <span className="bulk-item-title">{req.title || 'Untitled Skill'}</span>
                            </div>
                            <button 
                              type="button" 
                              className="bulk-remove-item-btn" 
                              title="Remove from bulk list"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromBulk(req.id);
                                if (selectedRequests.length <= 1) {
                                  setShowBulkModal(false);
                                }
                              }}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {bulkActionType === 'reject' ? (
                      <div className="bulk-rejection-reason-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        <label className="details-label">Bulk Rejection Reason</label>
                        <textarea 
                          rows="2"
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1.5px solid #D1D5DB', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none', fontSize: '0.85rem' }}
                          placeholder="Provide reason for rejecting all selected requests..."
                          value={bulkRejectionReason}
                          onChange={e => setBulkRejectionReason(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button type="button" className="verification-modal-btn-cancel" style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setBulkActionType('review')}>
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            className="verification-modal-btn-reject" 
                            style={{ padding: '0.375rem 1rem', fontSize: '0.75rem' }}
                            disabled={!bulkRejectionReason.trim()}
                            onClick={() => handleBulkUpdateStatus('Rejected', bulkRejectionReason)}
                          >
                            Confirm Bulk Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bulk-modal-action-buttons">
                        <button type="button" className="bulk-modal-action-btn approve" onClick={() => handleBulkUpdateStatus('Active')}>
                          Approve All Selected
                        </button>
                        <button type="button" className="bulk-modal-action-btn reject" onClick={() => setBulkActionType('reject')}>
                          Reject All Selected
                        </button>
                        <button type="button" className="bulk-modal-action-btn review" onClick={() => handleBulkUpdateStatus('Pending Verification')}>
                          Mark All for Review
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CURRENT DETAIL PANEL (Identical Layout to Single Request Detail Modal) */}
                  <div className="verification-details-grid" style={{ marginTop: '0.5rem' }}>
                    <div className="details-item">
                      <span className="details-label">Publisher Name</span>
                      <span className="details-val">{activeReq.first_name || ''} {activeReq.last_name || ''}</span>
                    </div>
                    <div className="details-item">
                      <span className="details-label">Category</span>
                      <span className="details-val badge-type-val">{activeReq.category || 'N/A'}</span>
                    </div>
                    <div className="details-item">
                      <span className="details-label">Department</span>
                      <span className="details-val">{activeReq.department || 'N/A'}</span>
                    </div>
                    <div className="details-item">
                      <span className="details-label">Graduation Year</span>
                      <span className="details-val">{activeReq.graduation_year || 'N/A'}</span>
                    </div>
                    <div className="details-item">
                      <span className="details-label">Date Submitted</span>
                      <span className="details-val">{formatLocalDate(activeReq.created_at)}</span>
                    </div>
                    <div className="details-item">
                      <span className="details-label">Status</span>
                      <span className={`status-badge ${(activeReq.status || 'Pending Verification') === 'Pending Verification' ? 'pending' : (activeReq.status || '') === 'Active' ? 'approved' : (activeReq.status || '') === 'Rejected' ? 'rejected' : (activeReq.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {activeReq.status || 'Pending Verification'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="details-label" style={{ display: 'block', marginBottom: '4px' }}>Skill Title</span>
                    <span className="details-val" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
                      {activeReq.title || 'Untitled Skill'}
                    </span>
                  </div>

                  <div>
                    <span className="details-label" style={{ display: 'block', marginBottom: '4px' }}>Description</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563', lineHeight: '1.5' }}>
                      {activeReq.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="verification-details-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="details-item">
                      <span className="details-label">Type</span>
                      <span className="details-val">{activeReq.skill_type || 'Online'}</span>
                    </div>
                    <div className="details-item">
                      <span className="details-label">Compensation</span>
                      <span className="details-val">
                        {activeReq.charge_type === 'Free' ? 'Free' : activeReq.hourly_rate ? `₹${activeReq.hourly_rate} / hr` : 'N/A'}
                      </span>
                    </div>
                    <div className="details-item">
                      <span className="details-label">Availability</span>
                      <span className="details-val" style={{ fontSize: '0.8rem' }}>
                        {activeReq.day_availability || 'N/A'}<br/>
                        {activeReq.available_time_slot || ''}
                      </span>
                    </div>
                  </div>

                  {/* Trusted System Peer Learning Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <span className="details-label" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '4px' }}>Trusted System Details</span>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                      <div>
                        <span className="details-label">Experience Level</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>{activeReq.experience_level || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="details-label">Languages Known</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>{activeReq.languages_known || 'N/A'}</div>
                      </div>
                    </div>

                    {activeReq.prev_experience && (
                      <div>
                        <span className="details-label">Previous Experience</span>
                        <div style={{ fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'pre-line' }}>{activeReq.prev_experience}</div>
                      </div>
                    )}

                    {activeReq.topics_covered && (
                      <div>
                        <span className="details-label">Topics Covered</span>
                        <div style={{ fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'pre-line' }}>{activeReq.topics_covered}</div>
                      </div>
                    )}

                    {activeReq.learning_outcomes && (
                      <div>
                        <span className="details-label">Learning Outcomes</span>
                        <div style={{ fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'pre-line' }}>{activeReq.learning_outcomes}</div>
                      </div>
                    )}
                  </div>

                  {/* Portfolio Links */}
                  {Object.keys(reqPortfolio).length > 0 && (
                    <div>
                      <span className="details-label" style={{ display: 'block', marginBottom: '6px' }}>Portfolio & Social Links</span>
                      <div className="portfolio-links-list">
                        {Object.entries(reqPortfolio).map(([platform, url]) => {
                          if (!url) return null;
                          return (
                            <a 
                              key={platform} 
                              href={formatLink(url)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={`portfolio-link-badge ${platform.toLowerCase()}`}
                            >
                              {platform.toUpperCase()}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Demo Media Previews */}
                  {activeReq.demo_media && Array.isArray(activeReq.demo_media) && activeReq.demo_media.filter(Boolean).length > 0 && (
                    <div>
                      <span className="details-label" style={{ display: 'block', marginBottom: '6px' }}>Demo Media Attachments</span>
                      <div className="media-previews-grid">
                        {activeReq.demo_media.filter(Boolean).map((mediaUrl, idx) => {
                          const fullUrl = getMediaUrl(mediaUrl);
                          const filename = typeof mediaUrl === 'string' ? (mediaUrl.split('/').pop() || `attachment-${idx + 1}`) : `attachment-${idx + 1}`;
                          if (isImage(mediaUrl)) {
                            return (
                              <div key={idx} className="media-preview-item">
                                <img src={fullUrl} alt={filename} />
                                <div className="media-item-footer">
                                  <span className="media-item-title">{filename}</span>
                                  <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="media-item-action">View</a>
                                </div>
                              </div>
                            );
                          } else if (isVideo(mediaUrl)) {
                            return (
                              <div key={idx} className="media-preview-item">
                                <video src={fullUrl} controls />
                                <div className="media-item-footer">
                                  <span className="media-item-title">{filename}</span>
                                  <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="media-item-action">View</a>
                                </div>
                              </div>
                            );
                          } else if (isPdf(mediaUrl)) {
                            return (
                              <div key={idx} className="media-preview-item pdf-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                <div className="media-item-footer" style={{ marginTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
                                  <span className="media-item-title">{filename}</span>
                                  <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="media-item-action">Open</a>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={idx} className="media-preview-item pdf-item">
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                                <div className="media-item-footer" style={{ marginTop: '0.5rem', borderTop: '1px solid #E5E7EB' }}>
                                  <span className="media-item-title">{filename}</span>
                                  <a href={fullUrl} download className="media-item-action">Download</a>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason if rejected */}
                  {activeReq.status === 'Rejected' && activeReq.rejection_reason && (
                    <div className="rejection-reason-box">
                      <h4>Rejection Reason</h4>
                      <p>{activeReq.rejection_reason}</p>
                    </div>
                  )}
                </div>

                <div className="verification-modal-footer">
                  <button className="verification-modal-btn-cancel" onClick={() => setShowBulkModal(false)}>
                    Close
                  </button>
                  {activeReq.status === 'Pending Verification' && (
                    <div className="action-buttons-flex">
                      <button className="verification-modal-btn-cancel" style={{ borderColor: '#F59E0B', color: '#D97706' }} onClick={() => handleIndividualAction(activeReq.id, 'Pending Verification')}>
                        Mark for Review
                      </button>
                      <button className="verification-modal-btn-reject" onClick={() => {
                        const reason = prompt('Please enter a rejection reason:');
                        if (reason !== null && reason.trim() !== '') {
                          handleIndividualAction(activeReq.id, 'Rejected', reason);
                        }
                      }}>
                        Reject Current
                      </button>
                      <button className="verification-modal-btn-confirm" onClick={() => handleIndividualAction(activeReq.id, 'Active')}>
                        Approve & Publish
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default AdminVerification;
