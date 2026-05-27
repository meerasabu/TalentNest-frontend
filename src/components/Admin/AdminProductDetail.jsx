import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminProductDetail.css';

const AdminProductDetail = () => {
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

  const [product, setProduct] = useState(null);
  const [warnHistory, setWarnHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Warn Modal State
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnReason, setWarnReason] = useState('');
  const [warnLoading, setWarnLoading] = useState(false);

  // Restore loading state
  const [restoreLoading, setRestoreLoading] = useState(false);

  const userRole = user?.role;

  useEffect(() => {
    if (!userRole || userRole !== 'admin') navigate('/login');
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchProductDetails();
      fetchWarnHistory();
    }
  }, [id, userRole]);

  const fetchProductDetails = async () => {
    try {
      const res = await api.get(`/admin/marketplace/${id}`);
      if (res.data.success) setProduct(res.data.product);
    } catch (err) {
      console.error('Error fetching admin product detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarnHistory = async () => {
    try {
      const res = await api.get(`/admin/marketplace/${id}/warn-history`);
      if (res.data.success) setWarnHistory(res.data.warnHistory || []);
    } catch (err) {
      console.error('Error fetching warn history:', err);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/admin/marketplace/${id}/status`, { status: newStatus });
      if (res.data.success) setProduct({ ...product, status: newStatus });
    } catch (err) {
      console.error('Error updating product status:', err);
      alert('Failed to update status');
    }
  };

  const handleWarnSeller = async (e) => {
    e.preventDefault();
    if (!warnReason.trim()) return;
    setWarnLoading(true);
    try {
      const res = await api.post(`/admin/marketplace/${id}/warn-seller`, { reason: warnReason });
      if (res.data.success) {
        setShowWarnModal(false);
        setWarnReason('');
        fetchWarnHistory(); // refresh history
      }
    } catch (err) {
      console.error('Error warning seller:', err);
      alert(err.response?.data?.message || 'Failed to send warning');
    } finally {
      setWarnLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm('Restore this product listing back to Available?')) return;
    setRestoreLoading(true);
    try {
      const res = await api.post(`/admin/marketplace/${id}/restore`);
      if (res.data.success) setProduct({ ...product, status: 'Available' });
    } catch (err) {
      console.error('Error restoring product:', err);
      alert(err.response?.data?.message || 'Failed to restore product');
    } finally {
      setRestoreLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="marketplace" />

      <main className="admin-main">
        <div className="admin-breadcrumb-flex">
          <div className="breadcrumb-nav" onClick={() => navigate('/admin/marketplace')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <h1>Product Listing</h1>
          </div>

          <div className="admin-profile-actions">
            <button className="btn-warn" onClick={() => { setWarnReason(''); setShowWarnModal(true); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Warn Seller
            </button>

            {product?.status === 'Inappropriate' ? (
              <button className="btn-restore" onClick={handleRestore} disabled={restoreLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-5"></path></svg>
                {restoreLoading ? 'Restoring...' : 'Restore Listing'}
              </button>
            ) : (
              <button
                className="btn-mark"
                onClick={() => handleUpdateStatus('Inappropriate')}
                disabled={product?.status === 'Inappropriate'}
              >
                Mark Inappropriate
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading product details...</div>
        ) : product ? (
          <>
            <div className="admin-product-grid">
              {/* Image Section */}
              <div className="product-image-card">
                <div className="main-product-img">
                  {product.image_urls && product.image_urls.length > 0 ? (
                    <img src={window.getImageUrl(product.image_urls[0])} alt={product.title} />
                  ) : (
                    <div className="img-placeholder-lg">No Image Available</div>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="product-info-card">
                <div className="product-info-header">
                  <h2>{product.title}</h2>
                  <span className={`status-badge-lg ${product.status?.toLowerCase() || 'available'}`}>
                    {product.status}
                  </span>
                </div>
                <div className="product-price-lg">₹{product.price}</div>

                <div className="product-meta-grid">
                  <div className="meta-item">
                    <label>CATEGORY</label>
                    <span>{product.category}</span>
                  </div>
                  <div className="meta-item">
                    <label>LISTED ON</label>
                    <span>{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="product-description-admin">
                  <p>{product.description}</p>
                </div>
              </div>

              {/* Seller Card */}
              <div className="seller-details-card">
                <h3>SELLER DETAILS</h3>
                <div className="seller-profile-sm">
                  <div className="seller-avatar-sm" style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}>
                    {product.seller_avatar ? (
                      <img src={window.getImageUrl(product.seller_avatar)} alt="" />
                    ) : (
                      product.first_name.charAt(0)
                    )}
                  </div>
                  <div className="seller-info-text">
                    <span className="seller-name-admin">{product.first_name} {product.last_name}</span>
                    <Link to={`/admin/students/${product.user_id}`} className="view-profile-link">View Profile</Link>
                  </div>
                </div>
              </div>

              {/* Reports Card */}
              <div className="reports-card-admin">
                <h3>REPORTS & FLAGS</h3>
                <div className="empty-reports-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  <p>No reports against this listing.</p>
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
                  <p>No warnings issued for this listing yet.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Product not found</div>
        )}
      </main>

      {/* Warn Seller Modal */}
      {showWarnModal && (
        <div className="suspension-modal-overlay" onClick={() => setShowWarnModal(false)}>
          <form className="suspension-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleWarnSeller}>
            <div className="suspension-modal-header">
              <h3>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Warn Seller
              </h3>
              <button type="button" className="suspension-modal-close" onClick={() => setShowWarnModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <p className="warn-modal-subtitle">
              A notification will be sent to the seller with your warning message. This will be recorded in the warning history.
            </p>

            <div className="suspension-modal-field">
              <label className="suspension-modal-label">Reason for Warning</label>
              <textarea
                className="suspension-modal-textarea"
                rows="4"
                placeholder="Describe the violation or issue with this listing..."
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

export default AdminProductDetail;
