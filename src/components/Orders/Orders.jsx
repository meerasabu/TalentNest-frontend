import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import Pagination from '../Common/Pagination';
import '../Dashboard/Index.css';
import './Orders.css';
import Header from '../Common/Header';

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { id: 5, firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('orders_active_tab') || 'buyer';
    } catch {
      return 'buyer';
    }
  });

  const switchTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('orders_active_tab', tab);
  };

  const [notifiedProductIds, setNotifiedProductIds] = useState([]);

  const handleNotifyMe = async (productId) => {
    try {
      const res = await api.post(`/products/${productId}/notify`);
      if (res.data.success) {
        setNotifiedProductIds(prev => [...prev, productId]);
        alert('You will be notified when this product is restocked!');
      }
    } catch (err) {
      console.error('Error subscribing to restock notifications:', err);
      alert('Failed to set restock notification.');
    }
  };

  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [deletedIds, setDeletedIds] = useState(() => {
    try {
      const saved = user ? localStorage.getItem(`deleted_orders_${user.id}`) : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const deleteOrders = (idsToDelete) => {
    const updatedDeleted = [...new Set([...deletedIds, ...idsToDelete])];
    setDeletedIds(updatedDeleted);
    localStorage.setItem(`deleted_orders_${user.id}`, JSON.stringify(updatedDeleted));
    setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
  };

  const handleSelectToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [activeReviewOrder, setActiveReviewOrder] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [communicationRating, setCommunicationRating] = useState(0);
  const [teachingRating, setTeachingRating] = useState(0);
  const [outcomeRating, setOutcomeRating] = useState(0);
  const [commHover, setCommHover] = useState(0);
  const [teachHover, setTeachHover] = useState(0);
  const [outcomeHover, setOutcomeHover] = useState(0);
  // Product-specific trust metrics
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [sellerCommRating, setSellerCommRating] = useState(0);
  const [productQualityHover, setProductQualityHover] = useState(0);
  const [valueHover, setValueHover] = useState(0);
  const [sellerCommHover, setSellerCommHover] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [buyerRes, sellerRes] = await Promise.all([
        api.get(`/orders/buyer/${user.id}`),
        api.get(`/orders/seller/${user.id}`)
      ]);

      if (buyerRes.data.success) {
        setBuyerOrders(buyerRes.data.orders);
      }
      if (sellerRes.data.success) {
        setSellerOrders(sellerRes.data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user.id]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchOrders();
        if (newStatus === 'Accepted') {
          navigate('/messages', { state: { user, orderId } });
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this request? This will restore inventory and disable the chat.")) return;
    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        alert("Order cancelled successfully.");
        // Refresh orders
        const bRes = await api.get(`/orders/buyer/${user.id}`);
        if (bRes.data.success) setBuyerOrders(bRes.data.orders);
        const sRes = await api.get(`/orders/seller/${user.id}`);
        if (sRes.data.success) setSellerOrders(sRes.data.orders);
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  const openReviewModal = (order) => {
    setActiveReviewOrder(order);
    setRating(0);
    setRatingHover(0);
    setCommunicationRating(0);
    setCommHover(0);
    setTeachingRating(0);
    setTeachHover(0);
    setOutcomeRating(0);
    setOutcomeHover(0);
    setProductQualityRating(0);
    setValueRating(0);
    setSellerCommRating(0);
    setProductQualityHover(0);
    setValueHover(0);
    setSellerCommHover(0);
    setReviewText('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!rating) {
      alert("Please select an overall rating.");
      return;
    }
    if (!activeReviewOrder) return;

    try {
      const isSkill = activeReviewOrder.item_type === 'skill';
      const isProduct = activeReviewOrder.item_type === 'product';
      const payload = {
        reviewerId: user.id,
        reviewedId: activeReviewOrder.seller_id,
        orderId: activeReviewOrder.id,
        rating,
        reviewText,
        communicationRating: isSkill ? communicationRating : (isProduct ? sellerCommRating : null),
        teachingRating: isSkill ? teachingRating : (isProduct ? productQualityRating : null),
        outcomeRating: isSkill ? outcomeRating : (isProduct ? valueRating : null)
      };

      const res = await api.post('/reviews', payload);
      if (res.data.success) {
        alert("Review submitted successfully!");
        setReviewModalOpen(false);
        fetchOrders();
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      alert(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const getStatusLayer = (status) => {
    // We treat 'Pending' or 'PENDING' identically visually
    const s = status.toUpperCase();
    switch (s) {
      case 'PENDING':
        return <span className="ord-badge ord-pen"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> PENDING</span>;
      case 'ACCEPTED':
        return <span className="ord-badge ord-acc"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ACCEPTED</span>;
      case 'REJECTED':
        return <span className="ord-badge ord-rej"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> REJECTED</span>;
      case 'COMPLETED':
        return <span className="ord-badge ord-com"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> COMPLETED</span>;
      case 'CANCELLED':
        return <span className="ord-badge ord-rej" style={{ background: '#FEE2E2', color: '#EF4444' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> CANCELLED</span>;
      default:
        return null;
    }
  };

  const getActionLayer = (order, isBuyer) => {
    const s = order.status.toUpperCase();
    if (isBuyer) {
      if (s === 'PENDING') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out-warn" style={{ cursor: 'default' }}>Waiting for seller confirmation</button>
            <button className="ord-btn ord-btn-out" onClick={() => handleDeleteOrder(order.id)} style={{ color: '#DC2626', borderColor: '#FCA5A5' }}>Cancel Request</button>
          </div>
        );
      }
      if (s === 'ACCEPTED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-green" onClick={() => handleUpdateStatus(order.id, 'Completed')}>Mark as Completed</button>
            <button className="ord-btn ord-btn-out" onClick={() => navigate('/messages', { state: { user, orderId: order.id } })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Open Chat</button>
          </div>
        );
      }
      if (s === 'COMPLETED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-purp" onClick={() => openReviewModal(order)}>Write Review</button>
            <button className="ord-btn ord-btn-out" onClick={() => navigate('/messages', { state: { user, orderId: order.id } })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Open Chat</button>
          </div>
        );
      }
      if (s === 'REJECTED' || s === 'CANCELLED') {
        if (order.item_type === 'product') {
          const isNotified = order.hasRequestedNotification || notifiedProductIds.includes(order.item_id);
          return (
            <div className="ord-act-grp">
              <button 
                className={`ord-btn ${isNotified ? 'ord-btn-out-warn' : 'ord-btn-purp'}`} 
                onClick={() => !isNotified && handleNotifyMe(order.item_id)}
                disabled={isNotified}
                style={{ cursor: isNotified ? 'default' : 'pointer' }}
              >
                {isNotified ? 'Notification Request Sent' : 'Notify Me'}
              </button>
            </div>
          );
        }
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>Chat Disabled</button>
          </div>
        );
      }
    } else {
      // Seller view
      if (s === 'PENDING') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-purp" onClick={() => handleUpdateStatus(order.id, 'Accepted')}>Accept</button>
            <button className="ord-btn ord-btn-out" onClick={() => handleUpdateStatus(order.id, 'Rejected')}>Reject</button>
          </div>
        );
      }
      if (s === 'ACCEPTED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out-warn">Waiting for completion</button>
            <button className="ord-btn ord-btn-out" onClick={() => navigate('/messages', { state: { user, orderId: order.id } })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Open Chat</button>
          </div>
        );
      }
      if (s === 'COMPLETED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out" onClick={() => navigate('/messages', { state: { user, orderId: order.id } })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Open Chat</button>
          </div>
        );
      }
      if (s === 'REJECTED' || s === 'CANCELLED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>Chat Disabled</button>
          </div>
        );
      }
    }
  };

  const filteredList = (activeTab === 'buyer' ? buyerOrders : sellerOrders).filter(order => {
    if (deletedIds.includes(order.id)) return false;

    // 1. Category Filter
    if (filterCategory !== 'All' && order.item_type !== filterCategory.toLowerCase()) return false;

    // 2. Search Term (Title or Person)
    const personName = activeTab === 'buyer' ? `${order.seller_first_name} ${order.seller_last_name}` : `${order.buyer_first_name} ${order.buyer_last_name}`;
    const searchMatch = order.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) || personName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;

    // 3. Date Filter
    if (filterDate !== 'All') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      if (filterDate === 'Today') {
        if (orderDate.toDateString() !== today.toDateString()) return false;
      } else if (filterDate === 'This Week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        if (orderDate < weekAgo) return false;
      } else if (filterDate === 'This Month') {
        if (orderDate.getMonth() !== today.getMonth() || orderDate.getFullYear() !== today.getFullYear()) return false;
      }
    }

    return true;
  });

  const isAllSelected = filteredList.length > 0 && filteredList.every(order => selectedIds.includes(order.id));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      const filteredIds = filteredList.map(o => o.id);
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredList.map(o => o.id);
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedList = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const listElement = document.querySelector('.ord-scrollable');
    if (listElement) listElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, filterCategory, filterDate, searchTerm]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredList.length, totalPages, currentPage]);

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Primary Window Scope */}
      <main className="dashboard-main ord-main">
        {/* Main Interface Header */}
        <Header user={user} showSearch={false} />

        <div className="content-scrollable ord-scrollable">

          {/* Header Action Layers */}
          <div className="ord-header-row">
            <div className="ord-title-block">
              <h1 className="ord-title">Orders & Requests</h1>
              <p className="ord-subtitle">Manage your purchases and incoming requests.</p>
            </div>

            <div className="ord-tab-grp">
              <button
                className={`ord-tab-toggle ${activeTab === 'buyer' ? 'active-tab' : ''}`}
                onClick={() => switchTab('buyer')}
              >
                My Requests (Buyer)
              </button>
              <button
                className={`ord-tab-toggle ${activeTab === 'seller' ? 'active-tab' : ''}`}
                onClick={() => switchTab('seller')}
              >
                Received Requests (Seller)
              </button>
            </div>
          </div>

          <div className="ord-box-container">

            <div className="ord-box-hdr">
              <div className="ord-box-lft">
                <h3 className="ord-box-tl">{activeTab === 'buyer' ? "Orders you've requested" : "Requests for your items"}</h3>
                <span className="ord-box-lbl">{activeTab === 'buyer' ? "YOU ARE ACTING AS BUYER" : "YOU ARE ACTING AS SELLER"}</span>
              </div>

              <div className="ord-filters-row">
                <div className="ord-filter-group">
                  <label>Type:</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="product">Products</option>
                    <option value="skill">Skills</option>
                    <option value="service">Services</option>
                  </select>
                </div>

                <div className="ord-filter-group">
                  <label>Time:</label>
                  <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                  </select>
                </div>

                <div className="ord-search-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" /></svg>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="orders-bulk-actions-bar">
                <label className="ord-bulk-select-all-label">
                  <input 
                    type="checkbox" 
                    className="custom-checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAllToggle}
                  />
                  <span>Select All ({filteredList.length})</span>
                </label>
                
                <button 
                  className="ord-bulk-delete-btn"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected orders?`)) {
                      deleteOrders(selectedIds);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete Selected ({selectedIds.length})
                </button>
              </div>
            )}

            <div className={`ord-list ${selectedIds.length > 0 ? 'has-selection' : ''}`}>
              {paginatedList.map((order, idx) => (
                <div key={order.id} className={`ord-itm ${selectedIds.includes(order.id) ? 'selected' : ''} ${idx !== paginatedList.length - 1 ? 'ord-border-btm' : ''}`}>
                  <div className="ord-select-wrapper">
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => handleSelectToggle(order.id)}
                    />
                  </div>

                  <div className="ord-itm-body">
                    <img src={order.itemImage ? window.getImageUrl(order.itemImage) : `https://placehold.co/80x80/e2e8f0/cbd5e1?text=${order.category}`} alt={order.itemTitle} className="ord-itm-ava" />
                    <div className="ord-itm-core">
                      <div className="ord-itm-titlerow">
                        <h4 className="ord-itm-name">{order.itemTitle}</h4>
                        {getStatusLayer(order.status)}
                      </div>
                      <div className="ord-itm-sub">
                        <span className="ord-sub-p">₹{order.itemPrice}</span>
                        <span className="ord-sub-dot">•</span>
                        <span className="ord-sub-dt">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="ord-sub-dot">•</span>
                        <span className="ord-sub-act" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {activeTab === 'buyer' ? 'Seller: ' : 'Buyer: '}
                          {activeTab === 'buyer' ? (
                            order.seller_profile_image ? (
                              <img src={window.getImageUrl(order.seller_profile_image)} alt="Seller" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#E5E7EB', color: '#4B5563', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                                {order.seller_first_name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )
                          ) : (
                            order.buyer_profile_image ? (
                              <img src={window.getImageUrl(order.buyer_profile_image)} alt="Buyer" style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#E5E7EB', color: '#4B5563', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                                {order.buyer_first_name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )
                          )}
                          {activeTab === 'buyer' ? `${order.seller_first_name} ${order.seller_last_name || ''}` : `${order.buyer_first_name} ${order.buyer_last_name || ''}`}
                        </span>
                      </div>
                      {order.status.toUpperCase() === 'REJECTED' && order.rejection_reason && (
                        <div className="ord-itm-rejection" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#EF4444', backgroundColor: '#FEE2E2', padding: '2px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                          Reason: {order.rejection_reason}
                        </div>
                      )}
                      {order.selected_plan_type && (
                        <div className="ord-itm-plan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '2px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                          Plan: {order.selected_plan_type}
                        </div>
                      )}
                      {(order.item_type === 'service' || order.item_type === 'skill') && order.booking_date && (
                        <div className="ord-itm-plan" style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          marginTop: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          color: order.item_type === 'skill' ? '#7E22CE' : '#0369A1', 
                          backgroundColor: order.item_type === 'skill' ? '#F3E8FF' : '#E0F2FE', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          alignSelf: 'flex-start' 
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {new Date(order.booking_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        </div>
                      )}
                      {(order.item_type === 'service' || order.item_type === 'skill') && order.booking_slot && (
                        <div className="ord-itm-plan" style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem', 
                          marginTop: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          color: order.item_type === 'skill' ? '#6B21A8' : '#065F46', 
                          backgroundColor: order.item_type === 'skill' ? '#F3E8FF' : '#D1FAE5', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          alignSelf: 'flex-start' 
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {order.booking_slot}
                        </div>
                      )}
                      {order.item_type === 'skill' && (order.user_skill_level || order.learning_goal || order.preferred_schedule) && (
                        <div className="ord-itm-skill-details" style={{
                          marginTop: '8px',
                          padding: '10px 14px',
                          backgroundColor: '#FAF5FF',
                          borderLeft: '4px solid #9333EA',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          color: '#581C87',
                          width: '100%',
                          maxWidth: '500px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
                        }}>
                          {order.user_skill_level && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <span style={{ fontWeight: '700', color: '#7E22CE', minWidth: '85px' }}>Skill Level:</span>
                              <span style={{ textTransform: 'capitalize', color: '#3B0764' }}>{order.user_skill_level}</span>
                            </div>
                          )}
                          {order.learning_goal && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <span style={{ fontWeight: '700', color: '#7E22CE', minWidth: '85px' }}>Learning Goal:</span>
                              <span style={{ color: '#3B0764', lineHeight: '1.4' }}>{order.learning_goal}</span>
                            </div>
                          )}
                          {order.preferred_schedule && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <span style={{ fontWeight: '700', color: '#7E22CE', minWidth: '85px' }}>Pref. Schedule:</span>
                              <span style={{ color: '#3B0764' }}>{order.preferred_schedule}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ord-itm-end">
                    {getActionLayer(order, activeTab === 'buyer')}
                  </div>

                  <button 
                    className="ord-delete-single-btn" 
                    title="Delete request"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this request from your view?")) {
                        deleteOrders([order.id]);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredList.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />

          </div>

        </div>
      </main>

      {/* Review Modal Overlay dynamically toggling natively */}
      {reviewModalOpen && (
        <div className="ord-modal-overlay">
          <div className="ord-modal-box" style={{ maxWidth: '480px', width: '90%' }}>
            <div className="ord-modal-hdr">
              <h3 className="ord-modal-title">Write a Review</h3>
              <button className="ord-modal-close" onClick={() => setReviewModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="ord-stars-grp" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4B5563' }}>Overall Rating</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`ord-star ${star <= (ratingHover || rating) ? 'filled' : ''}`}
                      onMouseEnter={() => setRatingHover(star)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => setRating(star)}
                      width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                      style={{ cursor: 'pointer' }}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  ))}
                </div>
              </div>

              {/* Skill graded metrics */}
              {activeReviewOrder?.item_type === 'skill' && (
                <div className="ord-graded-metrics" style={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                    Session Graded Metrics
                  </span>
                  {[{ label: 'Communication', val: communicationRating, hover: commHover, setVal: setCommunicationRating, setHover: setCommHover },
                    { label: 'Teaching Quality', val: teachingRating, hover: teachHover, setVal: setTeachingRating, setHover: setTeachHover },
                    { label: 'Learning Outcomes', val: outcomeRating, hover: outcomeHover, setVal: setOutcomeRating, setHover: setOutcomeHover }
                  ].map(({ label, val, hover, setVal, setHover }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>{label}</span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star}
                            className={`ord-star ${star <= (hover || val) ? 'filled' : ''}`}
                            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
                            onClick={() => setVal(star)}
                            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                            style={{ cursor: 'pointer' }}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Product trust metrics */}
              {activeReviewOrder?.item_type === 'product' && (
                <div className="ord-graded-metrics" style={{
                  backgroundColor: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                    🛡️ Verified Purchase Metrics
                  </span>
                  {[{ label: 'Product Quality', val: productQualityRating, hover: productQualityHover, setVal: setProductQualityRating, setHover: setProductQualityHover },
                    { label: 'Value for Money', val: valueRating, hover: valueHover, setVal: setValueRating, setHover: setValueHover },
                    { label: 'Seller Communication', val: sellerCommRating, hover: sellerCommHover, setVal: setSellerCommRating, setHover: setSellerCommHover }
                  ].map(({ label, val, hover, setVal, setHover }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0C4A6E' }}>{label}</span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star}
                            className={`ord-star ${star <= (hover || val) ? 'filled' : ''}`}
                            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
                            onClick={() => setVal(star)}
                            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                            style={{ cursor: 'pointer' }}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <textarea
              className="ord-review-txt"
              placeholder="Share your experience..."
              rows="4"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            ></textarea>

            <button className="ord-btn-submit" onClick={handleSubmitReview}>Submit Review</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
