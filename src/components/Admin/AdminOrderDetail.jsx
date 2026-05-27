import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminOrderDetail.css';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userRole = user?.role;

  // Route protection
  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchOrderDetail();
    }
  }, [id, userRole]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.order);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="orders" />

      <main className="admin-main">
        <header className="admin-header-flex detail-header">
          <button className="back-btn" onClick={() => navigate('/admin/orders')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div className="admin-header-text">
            <h1>Order #REQ-{order?.id || id}</h1>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">Loading order details...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <div className="order-detail-grid">
            <div className="detail-card">
              <h3>Transaction Details</h3>
              <div className="detail-row">
                <span className="label">Item/Service</span>
                <span className="value">{order.itemTitle}</span>
              </div>
              <div className="detail-row">
                <span className="label">Buyer</span>
                <span className="value">{order.buyer_first_name} {order.buyer_last_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Seller</span>
                <span className="value">{order.seller_first_name} {order.seller_last_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Date</span>
                <span className="value">{new Date(order.created_at).toISOString().split('T')[0]}</span>
              </div>
            </div>

            <div className="detail-card">
              <h3>Status & Timeline</h3>
              <div className="timeline">
                <div className="timeline-item completed">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h4>Requested</h4>
                    <span className="timeline-date">{new Date(order.created_at).toISOString().split('T')[0]}</span>
                  </div>
                </div>
                
                {(order.status === 'Accepted' || order.status === 'Completed') && (
                  <div className="timeline-item active">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>Accepted</h4>
                      <span className="timeline-date">{new Date(order.created_at).toISOString().split('T')[0]}</span>
                    </div>
                  </div>
                )}

                {order.status === 'Completed' && (
                  <div className="timeline-item completed">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>Completed</h4>
                      <span className="timeline-date">{new Date(order.created_at).toISOString().split('T')[0]}</span>
                    </div>
                  </div>
                )}
                
                {order.status === 'Pending' && (
                  <div className="timeline-item pending">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>Awaiting Confirmation</h4>
                      <span className="timeline-date">Pending seller response</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminOrderDetail;
