import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Sidebar from '../Common/Sidebar';
import Pagination from '../Common/Pagination';
import '../Dashboard/Index.css';
import './Notifications.css';
import Header from '../Common/Header';
import { useNotifications } from '../../context/NotificationContext';

const Notifications = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user') || 'null');
  const { fetchUnreadCounts } = useNotifications() || { fetchUnreadCounts: () => {} };

  const handlePrefix = user?.email ? user.email.split('@')[0].toUpperCase() : 'STUDENT';
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [activeDateFilter, setActiveDateFilter] = useState('All Time');
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
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const dateFilterRef = useRef(null);

  const filters = ['All', 'Orders', 'Skill Requests', 'Service Bookings', 'Admin'];
  const dateFilters = ['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days'];

  const [notificationsData, setNotificationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [deletedIds, setDeletedIds] = useState(() => {
    try {
      const saved = user ? localStorage.getItem(`deleted_notifications_${user.id}`) : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const formatTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  useEffect(() => {
    const fetchAllNotifications = async () => {
      try {
        const [buyerRes, sellerRes, restockRes] = await Promise.all([
          api.get(`/orders/buyer/${user.id}`),
          api.get(`/orders/seller/${user.id}`),
          api.get('/notifications').catch(err => {
            console.error('Error fetching restock notifications:', err);
            return { data: { success: false, notifications: [] } };
          })
        ]);

        let combined = [];

        if (buyerRes.data.success) {
          const buyerNotifs = buyerRes.data.orders.map(o => {
            const s = (o.status || '').toLowerCase();
            // Build booking detail suffix for service/skill orders
            const bookingDetail = (o.item_type === 'service' || o.item_type === 'skill') && o.booking_date && o.booking_slot
              ? ` | 📅 ${new Date(o.booking_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })} · 🕐 ${o.booking_slot}`
              : '';
            const planDetail = o.selected_plan_type ? ` (${o.selected_plan_type} - ₹${o.selected_price || o.itemPrice})` : '';
            return {
              id: `buyer-${o.id}`,
              type: s === 'pending' ? 'order_sent' : (s === 'accepted' ? 'order_accepted' : (s === 'cancelled' ? 'order_cancelled' : 'order_declined')),
              title: s === 'pending' ? 'Order Request Sent' : (s === 'accepted' ? 'Order Accepted' : (s === 'cancelled' ? 'Order Cancelled' : 'Order Declined')),
              description: s === 'pending'
                ? `You sent a request for ${o.itemTitle}${planDetail}${bookingDetail} to ${o.seller_first_name} ${o.seller_last_name || ''}.`
                : (s === 'accepted'
                  ? `Your request for ${o.itemTitle}${planDetail}${bookingDetail} was accepted by ${o.seller_first_name}.`
                  : (s === 'cancelled'
                    ? `Your request for ${o.itemTitle}${bookingDetail} was cancelled.`
                    : `Your request for ${o.itemTitle}${bookingDetail} was declined.${o.rejection_reason ? ` (Reason: ${o.rejection_reason})` : ''}`)),
              withPerson: `${o.seller_first_name} ${o.seller_last_name || ''}`,
              status: (o.status || '').toUpperCase(),
              time: formatTime(o.updated_at || o.created_at),
              image: o.seller_profile_image ? window.getImageUrl(o.seller_profile_image) : null,
              hasChat: s !== 'pending',
              itemType: o.item_type,
              createdAt: o.updated_at || o.created_at,
              itemId: o.item_id,
              hasRequestedNotification: o.hasRequestedNotification
            };
          });
          combined = [...combined, ...buyerNotifs];
        }

        if (sellerRes.data.success) {
          const sellerNotifs = sellerRes.data.orders.map(o => {
            const s = (o.status || '').toLowerCase();
            // Build booking detail suffix for service/skill orders
            const bookingDetail = (o.item_type === 'service' || o.item_type === 'skill') && o.booking_date && o.booking_slot
              ? ` | 📅 ${new Date(o.booking_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })} · 🕐 ${o.booking_slot}`
              : '';
            return {
              id: `seller-${o.id}`,
              type: s === 'cancelled' ? 'order_cancelled' : (o.item_type === 'skill' ? 'skill_request' : (o.item_type === 'service' ? 'booking_confirmed' : 'order_received')),
              title: s === 'cancelled'
                ? 'Order Request Cancelled'
                : (o.item_type === 'skill' ? 'New Skill Request' : (o.item_type === 'service' ? 'New Service Booking' : 'New Order Request')),
              description: s === 'cancelled'
                ? `${o.buyer_first_name} cancelled their request for ${o.itemTitle}${bookingDetail}.`
                : (o.selected_plan_type
                  ? `${o.buyer_first_name} requested ${o.itemTitle} (${o.selected_plan_type} - ₹${o.selected_price || o.itemPrice})${bookingDetail}.`
                  : `${o.buyer_first_name} requested ${o.itemTitle}${bookingDetail}.`),
              withPerson: `${o.buyer_first_name} ${o.buyer_last_name || ''}`,
              status: (o.status || '').toUpperCase(),
              time: formatTime(o.updated_at || o.created_at),
              image: o.buyer_profile_image ? window.getImageUrl(o.buyer_profile_image) : null,
              iconType: o.item_type === 'skill' ? 'purple' : 'blue',
              iconSvg: o.item_type === 'skill'
                ? <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                : <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>,
              hasAcceptDecline: s === 'pending',
              hasChat: s === 'accepted',
              itemType: o.item_type,
              createdAt: o.updated_at || o.created_at
            };
          });
          combined = [...combined, ...sellerNotifs];
        }

        if (restockRes && restockRes.data && restockRes.data.success) {
          if (restockRes.data.notifications) {
            const restockNotifs = restockRes.data.notifications.map(n => ({
              id: `restock-${n.id}`,
              type: 'restock_notification',
              title: n.title || 'Product Restocked',
              description: n.message,
              withPerson: `${n.seller_first_name} ${n.seller_last_name || ''}`,
              status: 'AVAILABLE',
              time: formatTime(n.created_at),
              image: n.seller_profile_image ? window.getImageUrl(n.seller_profile_image) : null,
              iconType: 'blue',
              iconSvg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
              hasChat: false,
              itemType: 'product',
              createdAt: n.created_at,
              productId: n.product_id
            }));
            combined = [...combined, ...restockNotifs];
          }

          if (restockRes.data.generalNotifications) {
            const generalNotifs = restockRes.data.generalNotifications.map(n => ({
              id: `general-${n.id}`,
              type: 'general_notification',
              title: n.title,
              description: n.status === 'REJECTED' && n.rejection_reason ? `${n.message} (Reason: ${n.rejection_reason})` : n.message,
              withPerson: 'Admin Moderation',
              status: n.status || 'INFO',
              time: formatTime(n.created_at),
              image: null,
              iconType: n.status === 'APPROVED' ? 'green' : 'red',
              iconSvg: n.status === 'APPROVED'
                ? (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </>
                )
                : (
                  <>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </>
                ),
              hasChat: false,
              itemType: n.item_type || 'admin',
              createdAt: n.created_at,
              itemId: n.item_id,
              rejectionReason: n.rejection_reason
            }));
            combined = [...combined, ...generalNotifs];
          }
        }

        // Add mock admin notification
        const adminNotif = {
          id: 'admin-1',
          type: 'admin_announcement',
          title: 'System Update',
          description: 'TalentNest has been updated to version 2.0 with improved security.',
          withPerson: 'System Admin',
          status: 'INFO',
          time: '3 hours ago',
          iconType: 'dark',
          iconSvg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
          hasChat: false,
          itemType: 'admin',
          createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
        };
        combined = [...combined, adminNotif];

        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotificationsData(combined);

        // Mark all fetched notifications as read
        const currentReadSaved = localStorage.getItem(`read_notifications_${user.id}`);
        let currentReadIds = [];
        try {
          currentReadIds = currentReadSaved ? JSON.parse(currentReadSaved) : [];
        } catch {
          currentReadIds = [];
        }
        const newIds = combined.map(n => n.id);
        const updatedReadIds = [...new Set([...currentReadIds, ...newIds])];
        localStorage.setItem(`read_notifications_${user.id}`, JSON.stringify(updatedReadIds));
        if (fetchUnreadCounts) {
          fetchUnreadCounts();
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNotifications();
  }, [user.id, fetchUnreadCounts]);

  useEffect(() => {
    const handleDateClickOutside = (event) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleDateClickOutside);
    return () => document.removeEventListener('mousedown', handleDateClickOutside);
  }, []);

  const handleDateFilterSelect = (filterVal) => {
    setActiveDateFilter(filterVal);
    if (filterVal !== 'Custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
    setShowDateDropdown(false);
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const deleteNotifications = (idsToDelete) => {
    const updatedDeleted = [...new Set([...deletedIds, ...idsToDelete])];
    setDeletedIds(updatedDeleted);
    localStorage.setItem(`deleted_notifications_${user.id}`, JSON.stringify(updatedDeleted));
    // Clear selection for deleted items
    setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
    if (fetchUnreadCounts) {
      fetchUnreadCounts();
    }
  };

  const handleSelectToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredNotifications = notificationsData.filter(notif => {
    if (deletedIds.includes(notif.id)) return false;

    let matchesCategory = true;
    if (activeFilter === 'Admin') matchesCategory = ['admin', 'report', 'chat', 'user'].includes(notif.itemType);
    else if (activeFilter === 'Orders') matchesCategory = notif.itemType === 'product';
    else if (activeFilter === 'Skill Requests') matchesCategory = notif.itemType === 'skill';
    else if (activeFilter === 'Service Bookings') matchesCategory = notif.itemType === 'service';

    if (!matchesCategory) return false;

    // Date filter logic
    if (activeDateFilter !== 'All Time') {
      if (!notif.createdAt) return false;
      const notifDate = new Date(notif.createdAt);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const notifTime = notifDate.getTime();

      if (activeDateFilter === 'Today') {
        const notifDateZero = new Date(notif.createdAt);
        notifDateZero.setHours(0, 0, 0, 0);
        if (notifDateZero.getTime() !== today.getTime()) return false;
      } else if (activeDateFilter === 'Yesterday') {
        const notifDateZero = new Date(notif.createdAt);
        notifDateZero.setHours(0, 0, 0, 0);
        if (notifDateZero.getTime() !== yesterday.getTime()) return false;
      } else if (activeDateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        if (notifTime < sevenDaysAgo.getTime()) return false;
      } else if (activeDateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        if (notifTime < thirtyDaysAgo.getTime()) return false;
      } else if (activeDateFilter === 'Custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (notifTime < start.getTime()) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (notifTime > end.getTime()) return false;
        }
      }
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const titleMatch = notif.title ? notif.title.toLowerCase().includes(term) : false;
      const descMatch = notif.description ? notif.description.toLowerCase().includes(term) : false;
      const typeMatch = notif.itemType ? notif.itemType.toLowerCase().includes(term) : false;
      const typeDetailMatch = notif.type ? notif.type.toLowerCase().includes(term) : false;
      const statusMatch = notif.status ? notif.status.toLowerCase().includes(term) : false;

      return titleMatch || descMatch || typeMatch || typeDetailMatch || statusMatch;
    }

    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const contentElement = document.querySelector('.content-scrollable');
    if (contentElement) contentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    setSelectedIds([]); // Reset selections
  }, [activeFilter, searchTerm, activeDateFilter, customStartDate, customEndDate]);

  const isAllSelected = filteredNotifications.length > 0 && filteredNotifications.every(notif => selectedIds.includes(notif.id));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      const filteredIds = filteredNotifications.map(n => n.id);
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredNotifications.map(n => n.id);
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Layout Area */}
      <main className="dashboard-main">
        {/* Top Header */}
        <Header 
          user={user} 
          onSearchChange={setSearchTerm} 
          onSearch={(val) => setSearchTerm(val)} 
          searchPlaceholder="Search notifications..." 
        />

        {/* Notifications Content */}
        <div className="content-scrollable">
          <div className="notifications-main">
            <div className="notifications-page-header">
              <h1 className="notifications-page-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                Notifications
              </h1>
              <p className="notifications-subtitle">Stay updated on your campus activities.</p>
            </div>

            <div className="notifications-filter-container">
              <div className="filter-categories">
                {filters.map(filter => (
                  <button
                    key={filter}
                    className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="date-filter-wrapper" ref={dateFilterRef}>
                <button 
                  className={`date-filter-toggle-btn ${activeDateFilter !== 'All Time' ? 'active' : ''}`}
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>{activeDateFilter === 'Custom' ? (customStartDate || customEndDate ? `${formatShortDate(customStartDate)} - ${formatShortDate(customEndDate)}` : 'Custom Range') : activeDateFilter}</span>
                  <svg className={`chevron-icon ${showDateDropdown ? 'open' : ''}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                
                {showDateDropdown && (
                  <div className="date-filter-dropdown">
                    {dateFilters.map(dFilter => (
                      <button
                        key={dFilter}
                        className={`date-dropdown-item ${activeDateFilter === dFilter ? 'selected' : ''}`}
                        onClick={() => handleDateFilterSelect(dFilter)}
                      >
                        {dFilter}
                      </button>
                    ))}
                    
                    <div className="custom-date-section">
                      <div className="custom-date-header">Custom Range</div>
                      <div className="custom-date-inputs">
                        <div className="date-input-group">
                          <label>From</label>
                          <input 
                            type="date" 
                            value={customStartDate} 
                            onChange={(e) => {
                              setCustomStartDate(e.target.value);
                              setActiveDateFilter('Custom');
                            }}
                          />
                        </div>
                        <div className="date-input-group">
                          <label>To</label>
                          <input 
                            type="date" 
                            value={customEndDate} 
                            onChange={(e) => {
                              setCustomEndDate(e.target.value);
                              setActiveDateFilter('Custom');
                            }}
                          />
                        </div>
                      </div>
                      {(activeDateFilter === 'Custom' || customStartDate || customEndDate) && (
                        <button 
                          className="clear-custom-btn"
                          onClick={() => {
                            setActiveDateFilter('All Time');
                            setCustomStartDate('');
                            setCustomEndDate('');
                          }}
                        >
                          Clear Custom Range
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="notifications-bulk-actions-bar">
                <label className="bulk-select-all-label">
                  <input 
                    type="checkbox" 
                    className="custom-checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAllToggle}
                  />
                  <span>Select All ({filteredNotifications.length})</span>
                </label>
                
                <button 
                  className="bulk-delete-btn"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected notifications?`)) {
                      deleteNotifications(selectedIds);
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

            <div className={`notifications-list ${selectedIds.length > 0 ? 'has-selection' : ''}`}>
              {loading ? (
                <div className="loading-placeholder">Loading your notifications...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="loading-placeholder">No notifications found.</div>
              ) : (
                paginatedNotifications.map(notif => {
                  return (
                    <div key={notif.id} className={`notification-card ${selectedIds.includes(notif.id) ? 'selected' : ''}`}>
                      {/* 1. Checkbox/Select Option */}
                      <div className="notif-select-wrapper">
                        <input 
                          type="checkbox" 
                          className="custom-checkbox"
                          checked={selectedIds.includes(notif.id)}
                          onChange={() => handleSelectToggle(notif.id)}
                        />
                      </div>

                      {/* 2. Image / Icon */}
                      {notif.image ? (
                        <div className="notif-avatar-container">
                          <img src={notif.image} alt={notif.title} style={{ objectFit: 'cover' }} />
                        </div>
                      ) : (
                        ['order_sent', 'order_accepted', 'order_cancelled', 'order_declined', 'skill_request', 'booking_confirmed', 'order_received', 'restock_notification'].includes(notif.type) ? (
                          <div className="notif-avatar-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E7EB', color: '#4B5563', fontWeight: 'bold', fontSize: '14px' }}>
                            {notif.withPerson?.[0]?.toUpperCase() || 'U'}
                          </div>
                        ) : (
                          <div className={`notif-avatar-container icon-bg-${notif.iconType}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {notif.iconSvg}
                            </svg>
                          </div>
                        )
                      )}

                      {/* 3. Text details / Description */}
                      <div className="notif-text-content">
                        <h4 className="notif-title">{notif.title}</h4>
                        <p className="notif-desc">{notif.description}</p>
                        <p className="notif-with">With <span>{notif.withPerson}</span></p>
                      </div>

                      {/* 4. Status badge */}
                      <div className="notif-status-wrapper">
                        <span className={`notif-status-pill notif-status-${notif.status.toLowerCase()}`}>
                          {notif.status}
                        </span>
                      </div>

                      {/* 5. Time details */}
                      <span className="notif-time">{notif.time}</span>

                      {/* 6. Action buttons */}
                      <div className="notif-actions-wrapper">
                        {notif.type === 'restock_notification' && (
                          <button className="notif-action-btn btn-dark" onClick={() => navigate(`/product/${notif.productId}`, { state: { user } })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            View Product
                          </button>
                        )}
                        {notif.type === 'general_notification' && notif.itemType === 'skill' && (
                          <button className="notif-action-btn btn-dark" onClick={() => navigate('/profile', { state: { user } })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                            View in Profile
                          </button>
                        )}
                        {notif.status === 'PENDING' && !notif.hasAcceptDecline && (
                          <button className="notif-action-btn btn-dark" onClick={() => navigate('/orders', { state: { user } })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            View Request
                          </button>
                        )}
                        {(notif.status === 'REJECTED' || notif.status === 'CANCELLED') && notif.itemType === 'product' && notif.id.startsWith('buyer-') ? (
                          <button 
                            className="notif-action-btn btn-primary"
                            onClick={() => handleNotifyMe(notif.itemId)}
                            disabled={notif.hasRequestedNotification || notifiedProductIds.includes(notif.itemId)}
                            style={{
                              opacity: (notif.hasRequestedNotification || notifiedProductIds.includes(notif.itemId)) ? 0.6 : 1,
                              cursor: (notif.hasRequestedNotification || notifiedProductIds.includes(notif.itemId)) ? 'default' : 'pointer'
                            }}
                          >
                            {notif.hasRequestedNotification || notifiedProductIds.includes(notif.itemId) ? 'Notification Request Sent' : 'Notify Me'}
                          </button>
                        ) : (
                          <>
                            {(notif.status === 'ACCEPTED' || notif.status === 'REJECTED') && notif.hasChat && (
                              <button className="notif-action-btn btn-dark" onClick={() => navigate('/chat', { state: { user } })}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                View in Chat
                              </button>
                            )}
                            {notif.status === 'CANCELLED' && (
                              <button className="notif-action-btn btn-dark" onClick={() => navigate('/orders', { state: { user } })}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                View Request
                              </button>
                            )}
                          </>
                        )}
                        {notif.hasAcceptDecline && (
                          <div className="notif-btn-row">
                            <button className="notif-action-btn btn-primary" onClick={() => navigate('/orders', { state: { user } })}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              Accept
                            </button>
                            <button className="notif-action-btn btn-light" onClick={() => navigate('/orders', { state: { user } })}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                              Decline
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 7. Single Delete option */}
                      <button 
                        className="notif-delete-single-btn" 
                        title="Delete notification"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this notification?")) {
                            deleteNotifications([notif.id]);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <Pagination 
              currentPage={currentPage}
              totalItems={filteredNotifications.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
