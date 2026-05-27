import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);
  const token = localStorage.getItem('token');
  
  if (!user || !token || token === 'undefined' || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeListings: 0,
    ongoingRequests: 0,
    pendingReports: 0,
    pendingVerifications: 0
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const userRole = user?.role;

  // Route protection
  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchStats();
      fetchActivities();
    }
  }, [userRole]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await api.get('/admin/recent-activity');
      if (res.data.success) {
        setActivities(res.data.activities);
      }
    } catch (err) {
      console.error('Error fetching admin activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    const elapsed = now - past;

    if (elapsed < msPerMinute) {
      return 'Just now';
    } else if (elapsed < msPerHour) {
      const minutes = Math.round(elapsed / msPerMinute);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (elapsed < msPerDay) {
      const hours = Math.round(elapsed / msPerHour);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (elapsed < msPerMonth) {
      const days = Math.round(elapsed / msPerDay);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (elapsed < msPerYear) {
      const months = Math.round(elapsed / msPerMonth);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.round(elapsed / msPerYear);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  const getActivityIconClass = (type) => {
    switch (type) {
      case 'product': return 'purple-icon';
      case 'skill': return 'blue-icon';
      case 'order': return 'green-icon';
      case 'report': return 'orange-icon';
      case 'verification': return 'indigo-icon';
      default: return 'purple-icon';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'product':
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
      case 'skill':
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 17 22 12"></polyline></svg>;
      case 'order':
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
      case 'report':
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
      case 'verification':
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>;
      default:
        return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>;
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="dashboard" />

      {/* Admin Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-container">
            <div className="header-title-area">
              <h1>Dashboard</h1>
              <p>Campus ecosystem moderation overview.</p>
            </div>
            <div className="admin-profile-badge-group">
              <div className="admin-avatar-initials">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="admin-profile-details">
                <span className="admin-profile-name">{user.firstName} {user.lastName || ''}</span>
                <span className="admin-profile-role">SYSTEM ADMIN</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-dashboard-body">
          <div className="admin-kpi-grid">
          <div className="admin-kpi-card students-card" onClick={() => !loading && navigate('/admin/students')} style={{ cursor: loading ? 'default' : 'pointer' }}>
            <div className="kpi-header-row">
              <span className="kpi-title">Total Students</span>
              {!loading && (
                <span className="kpi-trend positive">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  +4.8%
                </span>
              )}
            </div>
            {loading ? (
              <div className="skeleton skeleton-value"></div>
            ) : (
              <span className="kpi-value">{stats.totalStudents.toLocaleString()}</span>
            )}
            {loading ? (
              <div className="skeleton skeleton-subtext"></div>
            ) : (
              <span className="kpi-subtext">vs last month</span>
            )}
          </div>

          <div className="admin-kpi-card listings-card" onClick={() => !loading && navigate('/admin/marketplace')} style={{ cursor: loading ? 'default' : 'pointer' }}>
            <div className="kpi-header-row">
              <span className="kpi-title">Active Listings</span>
              {!loading && (
                <span className="kpi-trend positive">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  +12.5%
                </span>
              )}
            </div>
            {loading ? (
              <div className="skeleton skeleton-value"></div>
            ) : (
              <span className="kpi-value">{stats.activeListings.toLocaleString()}</span>
            )}
            {loading ? (
              <div className="skeleton skeleton-subtext"></div>
            ) : (
              <span className="kpi-subtext">this week</span>
            )}
          </div>

          <div className="admin-kpi-card requests-card" onClick={() => !loading && navigate('/admin/orders')} style={{ cursor: loading ? 'default' : 'pointer' }}>
            <div className="kpi-header-row">
              <span className="kpi-title">Ongoing Requests</span>
              {!loading && (
                <span className="kpi-trend positive">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  +8.2%
                </span>
              )}
            </div>
            {loading ? (
              <div className="skeleton skeleton-value"></div>
            ) : (
              <span className="kpi-value">{stats.ongoingRequests.toLocaleString()}</span>
            )}
            {loading ? (
              <div className="skeleton skeleton-subtext"></div>
            ) : (
              <span className="kpi-subtext">vs last week</span>
            )}
          </div>

          <div className="admin-kpi-card reports-card" onClick={() => !loading && navigate('/admin/reports')} style={{ cursor: loading ? 'default' : 'pointer' }}>
            <div className="kpi-header-row">
              <span className="kpi-title">Pending Reports</span>
              {!loading && (
                <span className={`kpi-trend ${stats.pendingReports > 0 ? 'negative' : 'neutral'}`}>
                  {stats.pendingReports > 0 ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="17" y1="7" x2="7" y2="17"></line><polyline points="17 17 7 17 7 7"></polyline></svg>
                      +{stats.pendingReports}
                    </>
                  ) : (
                    '0%'
                  )}
                </span>
              )}
            </div>
            {loading ? (
              <div className="skeleton skeleton-value"></div>
            ) : (
              <span className="kpi-value">{stats.pendingReports.toLocaleString()}</span>
            )}
            {loading ? (
              <div className="skeleton skeleton-subtext"></div>
            ) : (
              <span className="kpi-subtext">needs attention</span>
            )}
          </div>
        </div>

        <div className="admin-content-grid">
          <div className="admin-recent-activity">
            <h3>Recent Activity</h3>
            <div className="activity-feed">
              {loadingActivities ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div className="activity-item skeleton-row" key={idx}>
                    <div className="activity-icon skeleton-icon"></div>
                    <div className="activity-content">
                      <div className="skeleton skeleton-line-long"></div>
                      <div className="skeleton skeleton-line-short"></div>
                    </div>
                  </div>
                ))
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="activity-item clickable" onClick={() => navigate(activity.route)}>
                    <div className={`activity-icon ${getActivityIconClass(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="activity-content">
                      <p>{activity.title}</p>
                      <span className="activity-time">{timeAgo(activity.time)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activities">No recent activity.</div>
              )}
            </div>
          </div>

          <div className="admin-actions">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div className="action-card skeleton-row" key={idx}>
                  <div className="action-icon skeleton-icon"></div>
                  <div className="action-info" style={{ flex: 1 }}>
                    <div className="skeleton skeleton-line-medium"></div>
                    <div className="skeleton skeleton-line-long"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="action-card" onClick={() => navigate('/admin/students')}>
                  <div className="action-icon purple-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <div className="action-info">
                    <h4>Manage Students</h4>
                    <p>Review accounts and verification</p>
                  </div>
                  {stats.pendingVerifications > 0 && (
                    <span className="action-badge blue-badge">{stats.pendingVerifications}</span>
                  )}
                </div>

                <div className="action-card" onClick={() => navigate('/admin/marketplace')}>
                  <div className="action-icon purple-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  </div>
                  <div className="action-info">
                    <h4>Review Listings</h4>
                    <p>Moderate marketplace items</p>
                  </div>
                </div>

                <div className="action-card" onClick={() => navigate('/admin/reports')}>
                  <div className="action-icon purple-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                  </div>
                  <div className="action-info">
                    <h4>Handle Reports</h4>
                    <p>Review flagged content and chats</p>
                  </div>
                  {stats.pendingReports > 0 && (
                    <span className="action-badge red-badge">{stats.pendingReports}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
