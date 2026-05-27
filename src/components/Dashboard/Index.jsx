import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import './Index.css';
import api from '../../api/axiosConfig';
import Sidebar from '../Common/Sidebar';
import Header from '../Common/Header';

const IndexDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Extract user and token from state or recovery from localStorage
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }
  
  const [dashboardData, setDashboardData] = React.useState({
    products: [],
    services: [],
    skills: [],
    activities: []
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await api.get('/dashboard/overview');
        if (response.data.success) {
          setDashboardData({
            products: response.data.products,
            services: response.data.services,
            skills: response.data.skills,
            activities: response.data.activities
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard overview:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  // Generate prefix for email safely
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : 'STUDENT';

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Layout Area */}
      <main className="dashboard-main">
        {/* Top Header */}
        <Header user={user} />

        {/* Page Content Map */}
        <div className="content-scrollable">
          <div className="welcome-banner">
            <div className="welcome-text">
              <h1>Welcome back, {user.firstName}.</h1>
              <p>Here's what's happening on campus today.</p>
            </div>
            <div className="welcome-actions">
              <button 
                className="action-btn-hub product-btn" 
                onClick={() => navigate('/create-listing', { state: { user, initialTab: 'product' } })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
                Add Product
              </button>
              <button 
                className="action-btn-hub skill-btn" 
                onClick={() => navigate('/create-listing', { state: { user, initialTab: 'skill' } })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-2 10h3L7 22l2-10H6L13 2z"></path></svg>
                Add Skill
              </button>
              <button 
                className="action-btn-hub service-btn" 
                onClick={() => navigate('/create-listing', { state: { user, initialTab: 'service' } })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                Add Service
              </button>
            </div>
          </div>

          {/* Stats Overview Panel */}
          <div className="dashboard-stats-row">
            <div className="stat-widget-card products-stat" onClick={() => navigate('/marketplace', { state: { user } })} style={{ cursor: 'pointer' }}>
              <div className="stat-widget-glow"></div>
              <div className="stat-widget-icon purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              </div>
              <div className="stat-widget-details">
                <span className="stat-widget-num">
                  {loading ? (
                    <span className="skeleton" style={{ width: '40px', height: '24px', borderRadius: '4px' }}></span>
                  ) : (
                    dashboardData.products.length
                  )}
                </span>
                <span className="stat-widget-label">Market Items</span>
              </div>
            </div>

            <div className="stat-widget-card skills-stat" onClick={() => navigate('/skills', { state: { user } })} style={{ cursor: 'pointer' }}>
              <div className="stat-widget-glow"></div>
              <div className="stat-widget-icon indigo">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              </div>
              <div className="stat-widget-details">
                <span className="stat-widget-num">
                  {loading ? (
                    <span className="skeleton" style={{ width: '40px', height: '24px', borderRadius: '4px' }}></span>
                  ) : (
                    dashboardData.skills.length
                  )}
                </span>
                <span className="stat-widget-label">Mentors Active</span>
              </div>
            </div>

            <div className="stat-widget-card services-stat" onClick={() => navigate('/services', { state: { user } })} style={{ cursor: 'pointer' }}>
              <div className="stat-widget-glow"></div>
              <div className="stat-widget-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              <div className="stat-widget-details">
                <span className="stat-widget-num">
                  {loading ? (
                    <span className="skeleton" style={{ width: '40px', height: '24px', borderRadius: '4px' }}></span>
                  ) : (
                    dashboardData.services.length
                  )}
                </span>
                <span className="stat-widget-label">Campus Services</span>
              </div>
            </div>

            <div className="stat-widget-card activity-stat" onClick={() => navigate('/notifications', { state: { user } })} style={{ cursor: 'pointer' }}>
              <div className="stat-widget-glow"></div>
              <div className="stat-widget-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <div className="stat-widget-details">
                <span className="stat-widget-num">
                  {loading ? (
                    <span className="skeleton" style={{ width: '40px', height: '24px', borderRadius: '4px' }}></span>
                  ) : (
                    dashboardData.activities.length
                  )}
                </span>
                <span className="stat-widget-label">Exchanges Done</span>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="left-column">
              {/* Trending Products */}
              <section className="dashboard-section">
                <div className="section-header">
                  <h3>Trending Products</h3>
                  <span className="view-all" onClick={() => navigate('/marketplace', { state: { user } })} style={{cursor: 'pointer'}}>View all →</span>
                </div>
                <div className="cards-grid">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={`prod-skeleton-${i}`} className="product-card skeleton-card">
                        <div className="image-box skeleton skeleton-img" style={{ minHeight: '200px' }}></div>
                        <div className="product-info">
                          <div className="skeleton" style={{ width: '80%', height: '18px', marginBottom: '8px', borderRadius: '4px' }}></div>
                          <div className="skeleton" style={{ width: '60%', height: '14px', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))
                  ) : dashboardData.products.length > 0 ? dashboardData.products.map(prod => (
                    <div key={prod.id} className="product-card" onClick={() => navigate(`/product/${prod.id}`)} style={{cursor: 'pointer'}}>
                      <div className="image-box">
                        <img src={prod.image_urls && prod.image_urls.length > 0 ? `http://127.0.0.1:5000${prod.image_urls[0]}` : "https://placehold.co/200x200"} alt={prod.title} />
                        <span className="price-tag">₹{prod.price}</span>
                      </div>
                      <div className="product-info">
                        <h4>{prod.title}</h4>
                        <p className="product-meta">{prod.category} • Listed {new Date(prod.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="loading-placeholder">No trending products found.</div>
                  )}
                </div>
              </section>

              {/* Campus Services */}
              <section className="dashboard-section">
                <div className="section-header">
                  <h3>Campus Services</h3>
                  <span className="view-all" onClick={() => navigate('/services', { state: { user } })} style={{cursor: 'pointer'}}>View all →</span>
                </div>
                <div className="service-cards">
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={`svc-skeleton-${i}`} className="service-card skeleton-card">
                        <div className="skeleton skeleton-img" style={{ width: '68px', height: '68px', borderRadius: '10px', flexShrink: 0 }}></div>
                        <div className="service-info" style={{ flex: 1 }}>
                          <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '6px', borderRadius: '4px' }}></div>
                          <div className="skeleton" style={{ width: '50%', height: '12px', marginBottom: '8px', borderRadius: '4px' }}></div>
                          <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '6px' }}></div>
                        </div>
                      </div>
                    ))
                  ) : dashboardData.services.length > 0 ? dashboardData.services.map(svc => (
                    <div key={svc.id} className="service-card" onClick={() => navigate(`/service/${svc.id}`)} style={{cursor: 'pointer'}}>
                      <img src={svc.image_urls && svc.image_urls.length > 0 ? `http://127.0.0.1:5000${svc.image_urls[0]}` : "https://placehold.co/60x60"} alt={svc.title} />
                      <div className="service-info">
                        <h4>{svc.title}</h4>
                        <p>by {svc.first_name} {svc.last_name}</p>
                        <span className="badge">₹{svc.price}/{svc.price_type === 'hourly' ? 'hr' : 'flat'}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="loading-placeholder">No campus services available.</div>
                  )}
                </div>
              </section>
            </div>

            <div className="right-column">
              {/* Recent Updates */}
              <section className="updates-card">
                <div className="updates-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Recent Updates
                </div>
                <ul className="updates-list">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <li key={`act-skeleton-${i}`} className="skeleton-item" style={{ animationDelay: `${i * 0.15}s` }}>
                        <span className="dot skeleton skeleton-dark" style={{ width: '10px', height: '10px', borderRadius: '50%', border: '4px solid #141E30', margin: '0.35rem 0 0 0', flexShrink: 0 }}></span>
                        <div className="update-content" style={{ flex: 1 }}>
                          <div className="skeleton skeleton-dark" style={{ width: '40%', height: '14px', marginBottom: '6px', borderRadius: '4px' }}></div>
                          <div className="skeleton skeleton-dark" style={{ width: '85%', height: '12px', borderRadius: '4px' }}></div>
                        </div>
                      </li>
                    ))
                  ) : dashboardData.activities.length > 0 ? dashboardData.activities.map(act => {
                    const isBuyer = act.buyer_id === user.id;
                    const partnerName = isBuyer ? `${act.seller_first_name} ${act.seller_last_name || ''}` : `${act.buyer_first_name} ${act.buyer_last_name || ''}`;
                    const itemTitle = act.product_title || act.skill_title || act.service_title || 'Item';
                    
                    let title = 'Order Update';
                    let desc = '';
                    let dotColor = 'blue';

                    if (act.status === 'Pending') {
                      title = isBuyer ? 'Order Sent' : 'Order Received';
                      desc = isBuyer ? `You sent a request for ${itemTitle} to ${partnerName}.` : `${partnerName} requested ${itemTitle}.`;
                      dotColor = 'blue';
                    } else if (act.status === 'Accepted') {
                      title = 'Order Accepted';
                      desc = isBuyer ? `Your request for ${itemTitle} was accepted by ${act.seller_first_name}.` : `You accepted ${partnerName}'s request for ${itemTitle}.`;
                      dotColor = 'green';
                    } else if (act.status === 'Cancelled') {
                      title = 'Order Cancelled';
                      desc = `The request for ${itemTitle} has been cancelled.`;
                      dotColor = 'red';
                    } else if (act.status === 'Completed') {
                      title = 'Order Completed';
                      desc = `The trade for ${itemTitle} is finished.`;
                      dotColor = 'purple';
                    }

                    return (
                      <li key={act.id}>
                        <span className={`dot ${dotColor}`}></span>
                        <div className="update-content">
                          <h4>{title}</h4>
                          <p>{desc}</p>
                        </div>
                      </li>
                    );
                  }) : (
                    <li className="no-updates">No recent updates.</li>
                  )}
                </ul>
                <div className="updates-footer" onClick={() => navigate('/notifications', { state: { user } })}>View all notifications</div>
              </section>

              {/* Popular Skills */}
              <section className="dashboard-section">
                <h3 className="section-title">Popular Skills</h3>
                <div className="skills-list" style={{marginTop: '1rem'}}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={`skill-skeleton-${i}`} className="skill-card skeleton-card">
                        <div className="skeleton skeleton-img" style={{ width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0 }}></div>
                        <div className="skill-info" style={{ flex: 1 }}>
                          <div className="skeleton" style={{ width: '60%', height: '14px', marginBottom: '6px', borderRadius: '4px' }}></div>
                          <div className="skeleton" style={{ width: '45%', height: '12px', borderRadius: '4px' }}></div>
                        </div>
                        <div className="skeleton" style={{ width: '38px', height: '22px', borderRadius: '6px' }}></div>
                      </div>
                    ))
                  ) : dashboardData.skills.length > 0 ? dashboardData.skills.map(skill => (
                    <div key={skill.id} className="skill-card" onClick={() => navigate(`/skills/${skill.id}`)} style={{cursor: 'pointer'}}>
                      <div className="skill-icon">
                        {skill.image_urls && skill.image_urls.length > 0 ? (
                          <img src={`http://127.0.0.1:5000${skill.image_urls[0]}`} alt="" style={{width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover'}} />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-2 10h3L7 22l2-10H6L13 2z"></path></svg>
                        )}
                      </div>
                      <div className="skill-info">
                        <h4>{skill.title}</h4>
                        <p>by {skill.first_name} {skill.last_name}</p>
                      </div>
                      <div className="skill-rating">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#F59E0B'}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        4.9
                      </div>
                    </div>
                  )) : (
                    <div className="loading-placeholder">No popular skills found.</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndexDashboard;
