import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css'; 
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Extract user and token for persistent sessions
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'products');

  const [userProducts, setUserProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [userServices, setUserServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  const [profileUser, setProfileUser] = useState(user);
  const [userReviews, setUserReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Quantity modal states
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantityInput, setQuantityInput] = useState(1);

  // Live clock for real-time "Xs ago" updates
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const ticker = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  const formatActivityTime = (timestamp, currentNow) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const diffMs = (currentNow || now) - date;
    
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';

    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s ago`;

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Joined Aug 2022';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Joined Aug 2022';
    const options = { month: 'short', year: 'numeric' };
    return `Joined ${date.toLocaleDateString('en-US', options)}`;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = user?.id || 1;
        const [prodRes, skillRes, servRes, actRes, userRes, revRes] = await Promise.all([
          api.get(`/users/${uid}/products`),
          api.get(`/users/${uid}/skills`),
          api.get(`/users/${uid}/services`),
          api.get(`/users/${uid}/activity`),
          api.get(`/users/${uid}`),
          api.get(`/reviews/user/${uid}`)
        ]);
        
        if (prodRes.data.success) setUserProducts(prodRes.data.products);
        if (skillRes.data.success) setUserSkills(skillRes.data.skills);
        if (servRes.data.success) setUserServices(servRes.data.services);
        if (actRes.data.success) setActivities(actRes.data.activities);
        if (userRes.data.success) setProfileUser(userRes.data.user);
        if (revRes.data.success) setUserReviews(revRes.data.reviews);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoadingProducts(false);
        setLoadingSkills(false);
        setLoadingServices(false);
        setLoadingActivities(false);
        setLoadingReviews(false);
      }
    };
    fetchUserData();
  }, [user?.id]);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [openMenuType, setOpenMenuType] = useState(null);

  const toggleMenu = (e, id, type) => {
    e.stopPropagation();
    if (openMenuId === id && openMenuType === type) {
      setOpenMenuId(null);
      setOpenMenuType(null);
    } else {
      setOpenMenuId(id);
      setOpenMenuType(type);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setOpenMenuType(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleUpdateStatus = async (id, type, newStatus) => {
    try {
      const endpoint = `/${type}/${id}/status`;
      if (type === 'products' && newStatus === 'Available') {
        setSelectedProductId(id);
        const currentProd = userProducts.find(p => p.id === id);
        setQuantityInput(currentProd ? (currentProd.quantity || 1) : 1);
        setShowQuantityModal(true);
        return;
      }

      const res = await api.patch(endpoint, { status: newStatus });
      if (res.data.success) {
        // Update local state
        if (type === 'products') {
          setUserProducts(userProducts.map(p => {
            if (p.id === id) {
              return { 
                ...p, 
                status: newStatus, 
                available_quantity: 0
              };
            }
            return p;
          }));
        } else if (type === 'skills') {
          setUserSkills(userSkills.map(s => s.id === id ? { ...s, status: newStatus } : s));
        } else if (type === 'services') {
          setUserServices(userServices.map(srv => srv.id === id ? { ...srv, status: newStatus } : srv));
        }
      }
    } catch (err) {
      console.error(`Error updating ${type} status:`, err);
      alert('Failed to update status.');
    }
  };

  const handleQuantitySubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid positive quantity.");
      return;
    }
    
    try {
      const endpoint = `/products/${selectedProductId}/status`;
      const res = await api.patch(endpoint, { status: 'Available', quantity: qty });
      if (res.data.success) {
        setUserProducts(userProducts.map(p => {
          if (p.id === selectedProductId) {
            return { 
              ...p, 
              status: 'Available', 
              available_quantity: qty,
              quantity: qty
            };
          }
          return p;
        }));
      }
      setShowQuantityModal(false);
    } catch (err) {
      console.error(`Error updating product status:`, err);
      alert('Failed to update status.');
    }
  };

  const handleDeleteItem = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    try {
      const endpoint = `/${type}/${id}`;
      const res = await api.delete(endpoint);
      if (res.data.success) {
        // Update local state
        if (type === 'products') {
          setUserProducts(userProducts.filter(p => p.id !== id));
        } else if (type === 'skills') {
          setUserSkills(userSkills.filter(s => s.id !== id));
        } else if (type === 'services') {
          setUserServices(userServices.filter(srv => srv.id !== id));
        }
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert('Failed to delete item.');
    }
  };

  // Hardcoded structure rendering logic mimicking specific visual boundaries completely!
  const renderTabContent = () => {
    if (activeTab === 'products') {
      return (
        <div className="prof-skill-grid">
          {userProducts.map(prod => (
            <div key={prod.id} className="prof-skill-card" onClick={() => navigate(`/product/${prod.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
              <div className="prof-img-container">
                {prod.image_urls && prod.image_urls.length > 0 ? (
                  <img src={`http://localhost:5000${prod.image_urls[0]}`} alt={prod.title} className="prof-sk-ava" />
                ) : (
                  <img src="https://placehold.co/90x90/e2e8f0/475569?text=Prod" alt="Product" className="prof-sk-ava" />
                )}
                {prod.status === 'Sold' && <div className="status-overlay">SOLD</div>}
              </div>
              <div className="prof-sk-core">
                 <div className="prof-sk-titlerow">
                   <h4>{prod.title}</h4>
                   <button className="prof-more-btn" onClick={(e) => toggleMenu(e, prod.id, 'products')}>⋮</button>
                   {openMenuId === prod.id && openMenuType === 'products' && (
                     <div className="options-dropdown" onClick={(e) => e.stopPropagation()}>
                       <button className="dropdown-item" onClick={() => navigate('/create-listing', { state: { user, editItem: prod, type: 'product' } })}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                         Edit Item
                       </button>
                       <button className="dropdown-item" onClick={() => handleUpdateStatus(prod.id, 'products', prod.status === 'Sold' ? 'Available' : 'Sold')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                         {prod.status === 'Sold' ? 'Make Available' : 'Mark as Sold'}
                       </button>
                       <button className="dropdown-item delete" onClick={() => handleDeleteItem(prod.id, 'products')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         Delete
                       </button>
                     </div>
                   )}
                 </div>
                 <span className="sk-cat" style={{ color: '#64748b', fontSize: '0.85rem' }}>{prod.category}</span>
                 <div className="sk-btm-row" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{prod.price}</span>
                   {prod.status === 'Available' ? (
                     <span className="act-pill" style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>ACTIVE</span>
                   ) : (
                     <span className="cmpt-pill" style={{ backgroundColor: '#475569', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>SOLD</span>
                   )}
                 </div>
              </div>
            </div>
          ))}
          {userProducts.length === 0 && !loadingProducts && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#6B7280'}}>
              No products found.
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'skills') {
      return (
        <div className="prof-skill-grid">
          {userSkills.map(skill => (
            <div key={skill.id} className="prof-skill-card" onClick={() => navigate(`/skill/${skill.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
              <div className="prof-img-container">
                {skill.image_urls && skill.image_urls.length > 0 ? (
                  <img src={`http://localhost:5000${skill.image_urls[0]}`} alt={skill.title} className="prof-sk-ava" />
                ) : (
                  <img src="https://placehold.co/90x90/3b82f6/fff?text=Skill" alt="Skill" className="prof-sk-ava" />
                )}
                {skill.status === 'Completed' && <div className="status-overlay">DONE</div>}
              </div>
              <div className="prof-sk-core">
                 <div className="prof-sk-titlerow">
                   <h4>{skill.title}</h4>
                   <button className="prof-more-btn" onClick={(e) => toggleMenu(e, skill.id, 'skills')}>⋮</button>
                   {openMenuId === skill.id && openMenuType === 'skills' && (
                     <div className="options-dropdown" onClick={(e) => e.stopPropagation()}>
                       <button className="dropdown-item" onClick={() => navigate('/create-listing', { state: { user, editItem: skill, type: 'skill' } })}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                         Edit Item
                       </button>
                       {(skill.status === 'Active' || skill.status === 'Completed') && (
                         <button className="dropdown-item" onClick={() => handleUpdateStatus(skill.id, 'skills', skill.status === 'Completed' ? 'Active' : 'Completed')}>
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                           {skill.status === 'Completed' ? 'Make Active' : 'Mark Completed'}
                         </button>
                       )}
                       <button className="dropdown-item delete" onClick={() => handleDeleteItem(skill.id, 'skills')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         Delete
                       </button>
                     </div>
                   )}
                 </div>
                 <span className="sk-cat">{skill.category}</span>
                 {skill.status === 'Rejected' && skill.rejection_reason && (
                   <div className="sk-rejection-reason" style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '6px', background: '#fee2e2', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #dc2626', lineHeight: '1.3' }} onClick={(e) => e.stopPropagation()}>
                     <strong>Reason:</strong> {skill.rejection_reason}
                   </div>
                 )}
                 <div className="sk-btm-row">
                   <span className="exc-lbl">⚡ {skill.charge_type || 'Exchange'}</span>
                   {skill.status === 'Active' ? (
                     <span className="act-pill">ACTIVE</span>
                   ) : skill.status === 'Pending Verification' ? (
                     <span className="pending-pill">PENDING VERIFICATION</span>
                   ) : skill.status === 'Rejected' ? (
                     <span className="rejected-pill">REJECTED</span>
                   ) : (
                     <span className="cmpt-pill">{skill.status?.toUpperCase() || 'COMPLETED'}</span>
                   )}
                 </div>
              </div>
            </div>
          ))}
          {userSkills.length === 0 && !loadingSkills && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#6B7280'}}>
              No skills found.
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'services') {
      return (
        <div className="prof-skill-grid">
          {userServices.map(service => (
            <div key={service.id} className="prof-skill-card" onClick={() => navigate(`/service/${service.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
              <div className="prof-img-container">
                {service.image_urls && service.image_urls.length > 0 ? (
                  <img src={`http://localhost:5000${service.image_urls[0]}`} alt={service.title} className="prof-sk-ava" />
                ) : (
                  <img src="https://placehold.co/90x90/1f2937/fff?text=Srvc" alt="Service" className="prof-sk-ava" />
                )}
                {service.status === 'Completed' && <div className="status-overlay">DONE</div>}
              </div>
              <div className="prof-sk-core">
                 <div className="prof-sk-titlerow">
                   <h4>{service.title}</h4>
                   <button className="prof-more-btn" onClick={(e) => toggleMenu(e, service.id, 'services')}>⋮</button>
                   {openMenuId === service.id && openMenuType === 'services' && (
                     <div className="options-dropdown" onClick={(e) => e.stopPropagation()}>
                       <button className="dropdown-item" onClick={() => navigate('/create-listing', { state: { user, editItem: service, type: 'service' } })}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                         Edit Item
                       </button>
                       <button className="dropdown-item" onClick={() => handleUpdateStatus(service.id, 'services', service.status === 'Completed' ? 'Active' : 'Completed')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                         {service.status === 'Completed' ? 'Make Active' : 'Mark Completed'}
                       </button>
                       <button className="dropdown-item delete" onClick={() => handleDeleteItem(service.id, 'services')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         Delete
                       </button>
                     </div>
                   )}
                 </div>
                 <span className="sk-cat">{service.category}</span>
                 <div className="sk-btm-row">
                   <span className="price-lbl">💼 {service.standard_plan ? '₹'+service.standard_plan : 'Custom'}</span>
                   {service.status === 'Active' ? (
                     <span className="act-pill">ACTIVE</span>
                   ) : (
                     <span className="cmpt-pill">{service.status?.toUpperCase() || 'COMPLETED'}</span>
                   )}
                 </div>
              </div>
            </div>
          ))}
          {userServices.length === 0 && !loadingServices && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#6B7280'}}>
              No services found.
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'reviews') {
      return (
        <div className="prof-reviews-list">
          {loadingReviews ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>Loading reviews...</div>
          ) : userReviews.length > 0 ? (
            userReviews.map((rev) => (
              <div key={rev.id} className="prof-rev-box">
                 <div className="prof-rev-header">
                   <div className="rev-user-grp">
                     {rev.profile_image ? (
                       <img src={`http://localhost:5000${rev.profile_image}`} alt="Reviewer" className="rev-ava" />
                     ) : (
                       <img src="https://placehold.co/40x40" alt="Reviewer" className="rev-ava" />
                     )}
                     <div className="rev-user-txt">
                       <h4>{rev.first_name} {rev.last_name}</h4>
                       <div className="rev-stars">
                         {Array.from({ length: rev.rating }).map((_, i) => '⭐ ')}
                         <span>{formatActivityTime(rev.created_at)}</span>
                       </div>
                     </div>
                   </div>
                   <div className="rev-chk-pill">
                     <span className="rev-ver-chk">✔ Verified Interaction</span>
                     <span className="sub-act-lbl">Completed interaction</span>
                   </div>
                 </div>
                 <p className="rev-desc">{rev.review_text}</p>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
              No reviews received yet.
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Primary Window Bounds perfectly wrapping UI constraints */}
      <main className="dashboard-main prof-main">
        <header className="main-header prof-hdr-bg">
          <div className="search-bar-placeholder" style={{flex: 1}}></div>
          <div className="header-actions">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div className="icon-wrapper" onClick={() => navigate('/wishlist', { state: { user } })} style={{cursor: 'pointer'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <div className="icon-wrapper notification-icon" onClick={() => navigate('/notifications', { state: { user } })} style={{cursor: 'pointer'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span className="notif-badge">2</span>
            </div>
          </div>
        </header>

        <div className="content-scrollable prof-scrollable">
          
           {/* Top Floating Context Container */}
           <div className="prof-top-block">
              <img src={user.bannerImage ? `http://localhost:5000${user.bannerImage}` : "https://placehold.co/1200x260/0284c7/ecf0f1"} alt="Banner" className="prof-banner" />
              <div className="prof-info-sect">
                <div className="prof-avatar-halo">
                  <img src={user.profileImage ? `http://localhost:5000${user.profileImage}` : "https://placehold.co/150x150"} alt="Avatar" className="prof-main-ava" />
                </div>
                
                <div className="prof-desc-grp">
                   <div className="prof-name-row">
                      <div className="prof-title-bnd">
                         <h1>{user.firstName} {user.lastName}</h1>
                         <p className="prof-dept-lbl">{user.department || 'Student'}, {user.graduationYear || 'N/A'}</p>
                      </div>
                      <button className="prof-btn-purp" onClick={() => navigate('/edit-profile', { state: { user } })}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 
                        Edit Profile
                      </button>
                   </div>
                   
                   <div className="prof-lbl-row">
                       <span className="prof-icon-txt">⭐ {profileUser.reviewCount > 0 ? profileUser.rating : '0.0'} <span className="light-txt">({profileUser.reviewCount || 0} reviews)</span></span>
                       <span className="prof-icon-txt">📍 {profileUser.campusLocation || 'Campus'}</span>
                       <span className="prof-icon-txt">📅 {formatJoinDate(profileUser.createdAt)}</span>
                    </div>

                   <p className="prof-bio">{user.bio || "No bio added yet."}</p>
                </div>
              </div>
           </div>

           {/* Layout Split Body Map natively replicating exact bounds */}
           <div className="prof-split-view">
             
              <div className="prof-left-pane">
                 <div className="prof-tabs">
                    <button className={`prof-tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
                    <button className={`prof-tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>Skills</button>
                    <button className={`prof-tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Services</button>
                    <button className={`prof-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
                 </div>
                 
                 <div className="prof-tab-content">
                   {renderTabContent()}
                 </div>
              </div>

              {/* Fixed Right Activity Bar matching UI parameters neatly */}
              <div className="prof-right-pane">
                 <div className="prof-activity-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 className="act-header" style={{ margin: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Activity</h3>
                      {activities.length > 1 && (
                        <button type="button" className="view-all-act-btn" onClick={() => setShowAllActivitiesModal(true)}>
                          View All
                        </button>
                      )}
                    </div>
                    
                    <div className="timeline-flow">
                       {loadingActivities ? (
                         <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>Loading activity...</div>
                       ) : activities.length > 0 ? (
                         (() => {
                           const act = activities[0];
                           let dotClass = 'tl-gry';
                           if (act.activity_type === 'login') {
                             dotClass = 'tl-grn';
                           } else if (act.activity_type === 'review_written' || act.activity_type === 'signup') {
                             dotClass = 'tl-grn';
                           } else if (act.activity_type === 'listing_create') {
                             dotClass = 'tl-purp';
                           } else if (act.activity_type.startsWith('order')) {
                             dotClass = 'tl-blu';
                           }

                           return (
                             <div className="timeline-item" onClick={() => setShowAllActivitiesModal(true)} style={{ cursor: 'pointer', paddingBottom: 0 }}>
                               <div className={`tl-dot ${dotClass}`}></div>
                               <div className="tl-txt">
                                 <h4>{act.details}</h4>
                                 <span>{formatActivityTime(act.created_at, now)}</span>
                               </div>
                             </div>
                           );
                         })()
                       ) : (
                         <div style={{ color: '#6B7280', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                           No recent activity found.
                         </div>
                       )}
                    </div>
                 </div>
              </div>

            </div>

         </div>
      </main>

      {showQuantityModal && (() => {
        const selectedProduct = userProducts.find(p => p.id === selectedProductId);
        return (
          <div className="qty-modal-overlay">
            <div className="qty-modal-card">
              <div className="qty-modal-header">
                <h3>Make Product Available</h3>
                {selectedProduct && (
                  <span className="qty-modal-prod-name">{selectedProduct.title}</span>
                )}
              </div>
              <form onSubmit={handleQuantitySubmit}>
                <div className="qty-form-group">
                  <label htmlFor="quantityInput">Enter available quantity for this product:</label>
                  <input
                    type="number"
                    id="quantityInput"
                    className="qty-input-field"
                    min="1"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    required
                  />
                </div>
                <div className="qty-modal-actions">
                  <button
                    type="button"
                    className="qty-btn qty-btn-cancel"
                    onClick={() => setShowQuantityModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="qty-btn qty-btn-submit">
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {showAllActivitiesModal && (
        <div className="activities-modal-overlay" onClick={() => setShowAllActivitiesModal(false)}>
          <div className="activities-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="activities-modal-header">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Activity History
              </h3>
              <button type="button" className="activities-modal-close" onClick={() => setShowAllActivitiesModal(false)} title="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="activities-modal-body">
              <div className="timeline-flow">
                 {activities.map((act, index) => {
                   let dotClass = 'tl-gry';
                   if (act.activity_type === 'login') {
                     dotClass = 'tl-grn';
                   } else if (act.activity_type === 'review_written' || act.activity_type === 'signup') {
                     dotClass = 'tl-grn';
                   } else if (act.activity_type === 'listing_create') {
                     dotClass = 'tl-purp';
                   } else if (act.activity_type.startsWith('order')) {
                     dotClass = 'tl-blu';
                   }

                   return (
                     <div key={index} className="timeline-item">
                       {index > 0 && <div className="tl-line"></div>}
                       <div className={`tl-dot ${dotClass}`}></div>
                       <div className="tl-txt">
                         <h4>{act.details}</h4>
                         <span>{formatActivityTime(act.created_at, now)}</span>
                       </div>
                     </div>
                   );
                 })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
