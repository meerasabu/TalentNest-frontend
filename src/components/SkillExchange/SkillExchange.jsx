import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import Pagination from '../Common/Pagination';
import '../Dashboard/Index.css'; 
import './SkillExchange.css';
import Header from '../Common/Header';

const SkillExchange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeCategory, setActiveCategory] = useState('All');

  // Live filter and sort states
  const [sessionType, setSessionType] = useState('Both');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await api.get('/skills');
        if (response.data.success) {
          // Filter to show only Active skills
          const activeSkills = response.data.skills.filter(s => s.status === 'Active' || !s.status);
          setSkills(activeSkills);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  const filteredSkills = skills.filter(skill => {
    // 1. Category check
    if (activeCategory !== 'All' && skill.category !== activeCategory) return false;

    // 2. Session Type check (skill_type column stores 'Online', 'Offline' or 'Both')
    if (sessionType !== 'Both') {
      const sType = skill.skill_type || 'Online';
      if (sessionType === 'Online' && sType !== 'Online' && sType !== 'Both') {
        return false;
      }
      if (sessionType === 'In-person' && sType !== 'Offline' && sType !== 'Both') {
        return false;
      }
    }

    // 3. Minimum Rating check
    const rating = parseFloat(skill.rating || 0.0);
    if (minRating > 0 && rating < minRating) {
      return false;
    }

    return true;
  });

  // Sort skills locally
  const sortedSkills = [...filteredSkills].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortBy === 'rating') {
      return parseFloat(b.rating || 0.0) - parseFloat(a.rating || 0.0);
    }
    if (sortBy === 'priceLow') {
      return parseFloat(a.hourly_rate || 0) - parseFloat(b.hourly_rate || 0);
    }
    if (sortBy === 'priceHigh') {
      return parseFloat(b.hourly_rate || 0) - parseFloat(a.hourly_rate || 0);
    }
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedSkills = sortedSkills.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const contentElement = document.querySelector('.sk-ex-scrollable');
    if (contentElement) contentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearAll = () => {
    setActiveCategory('All');
    setSessionType('Both');
    setMinRating(0);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when category changes
  }, [activeCategory]);

  const handleAddToWishlist = async (e, itemId) => {
    e.stopPropagation();
    try {
      const res = await api.post('/wishlist', {
        userId: user.id || 5,
        itemType: 'skill',
        itemId
      });
      if (res.data.success) {
        alert(res.data.message || 'Added to wishlist!');
      }
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      alert('Failed to add to wishlist.');
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Primary Window Scope */}
      <main className="dashboard-main sk-ex-main">
        {/* Main Interface Header */}
        <Header user={user} />

        <div className="content-scrollable sk-ex-scrollable">
          
          {/* Header Action Layers */}
          <div className="sk-ex-header-row">
            <div className="sk-ex-title-block">
              <h1 className="sk-ex-title">
                <span className="sk-ex-lightning">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="bolt-icon"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                </span>
                Skill Exchange
              </h1>
              <p className="sk-ex-subtitle">Learn from peers or offer your expertise.</p>
            </div>
            
            <div className="sk-ex-action-group">
              <button className="btn-add-sk" onClick={() => navigate('/create-listing', { state: { initialTab: 'skill' } })}>
                + Add Skill
              </button>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select 
                  className="btn-sort-sk" 
                  value={sortBy} 
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  style={{ 
                    appearance: 'none', 
                    WebkitAppearance: 'none', 
                    paddingRight: '32px',
                    position: 'relative',
                    cursor: 'pointer',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                >
                  <option value="latest">Sort by: Latest</option>
                  <option value="rating">Sort by: Highest Rated</option>
                  <option value="priceLow">Sort by: Price (Low to High)</option>
                  <option value="priceHigh">Sort by: Price (High to Low)</option>
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#4F46E5' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>

          <div className="sk-ex-dual-col">
            
            {/* Left Filter Box Architecture */}
            <aside className="sk-filter-sidebar">
               
               <div className="filter-sect">
                 <div className="filter-sect-head">
                   <h5 className="fl-head">CATEGORIES</h5>
                   <span className="fl-clear" onClick={handleClearAll} style={{ cursor: 'pointer' }}>Clear All</span>
                 </div>
                 <div className="fl-options">
                    {['Programming', 'Languages', 'Design', 'Music', 'Fitness', 'Academics'].map(cat => (
                      <label key={cat} className="fl-chk-wrap" onClick={() => { setActiveCategory(activeCategory === cat ? 'All' : cat); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
                        <span className={`fl-box ${activeCategory === cat ? 'active-box' : ''}`}></span>
                        <span className="fl-lbl">{cat}</span>
                      </label>
                    ))}
                 </div>
               </div>

               <div className="filter-sect">
                 <h5 className="fl-head">SESSION TYPE</h5>
                 <div className="fl-options">
                   {[
                     { key: 'Online', label: 'Online' },
                     { key: 'In-person', label: 'In-person (Campus)' },
                     { key: 'Both', label: 'Both' }
                   ].map(item => (
                     <label key={item.key} className="fl-chk-wrap" onClick={() => { setSessionType(item.key); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
                       <span className={`fl-rad ${sessionType === item.key ? 'active-rad' : ''}`}>
                         {sessionType === item.key && <span className="rad-inner"></span>}
                       </span>
                       <span className="fl-lbl">{item.label}</span>
                     </label>
                   ))}
                 </div>
               </div>

               <div className="filter-sect">
                 <h5 className="fl-head">MINIMUM RATING</h5>
                 <div className="fl-options">
                   {[4, 3].map(rating => (
                     <label key={rating} className="fl-chk-wrap" onClick={() => { setMinRating(minRating === rating ? 0 : rating); setCurrentPage(1); }} style={{ cursor: 'pointer' }}>
                       <span className={`fl-rad ${minRating === rating ? 'active-rad' : ''}`}>
                         {minRating === rating && <span className="rad-inner"></span>}
                       </span>
                       <span className="fl-lbl">{rating} <span className="fl-star">★</span> & above</span>
                     </label>
                   ))}
                 </div>
               </div>

            </aside>

            {/* Right Core Interactive Grid Space */}
            <div className="sk-main-content">
               
               <div className="sk-active-filters-row">
                 <div className="af-group">
                   {activeCategory !== 'All' && (
                     <span className="af-chip" onClick={() => setActiveCategory('All')}>
                       {activeCategory} <span className="af-x">×</span>
                     </span>
                   )}
                   {sessionType !== 'Both' && (
                     <span className="af-chip">
                       {sessionType} <span className="af-x" onClick={() => setSessionType('Both')} style={{ cursor: 'pointer' }}>×</span>
                     </span>
                   )}
                   {minRating > 0 && (
                     <span className="af-chip">
                       {minRating}★ & above <span className="af-x" onClick={() => setMinRating(0)} style={{ cursor: 'pointer' }}>×</span>
                     </span>
                   )}
                 </div>
                 <div className="af-results">Showing <strong>{filteredSkills.length}</strong> results</div>
               </div>

               <div className="sk-grid-wrap">
                 {paginatedSkills.map((skill) => (
                   <div key={skill.id} className="sk-card" onClick={() => navigate(`/skill/${skill.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
                     <div className="sk-img-layer">
                       {skill.image_urls && skill.image_urls.length > 0 ? (
                         <img src={window.getImageUrl(skill.image_urls[0])} alt={skill.title} className="sk-img"/>
                       ) : (
                         <div className="sk-img sk-gradient-bg"></div>
                       )}
                       <div className="sk-img-overlay">
                          <span className="sk-tag-cat">{skill.category}</span>
                          <span className="sk-tag-rate"><span className="sk-rate-star">★</span> {parseFloat(skill.rating || 0).toFixed(1)} <span style={{ opacity: 0.8, fontSize: '0.78em' }}>({skill.review_count || 0})</span></span>
                       </div>
                       {skill.status && (
                         <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                           {skill.status}
                         </span>
                       )}
                       <span className="heart-icon-layer" onClick={(e) => handleAddToWishlist(e, skill.id)}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                       </span>
                     </div>
                     <div className="sk-card-body">
                       <h3 className="sk-card-title">{skill.title}</h3>
                       
                       <div className="sk-author-row">
                         <img src={skill.profile_image ? window.getImageUrl(skill.profile_image) : "https://placehold.co/24x24/e2e8f0/e2e8f0"} alt="Avatar" className="sk-auth-ava" style={{objectFit: 'cover'}}/>
                         <span className="sk-auth-lbl">by <strong>{skill.first_name} {skill.last_name?.charAt(0)}.</strong></span>
                       </div>

                       <div className="sk-card-footer">
                         <span className="sk-foot-sess">
                           {skill.available_time_slot 
                             ? (skill.available_time_slot.includes(', ') 
                                 ? `${skill.available_time_slot.split(', ')[0]}...` 
                                 : skill.available_time_slot)
                             : 'Flexible'}
                         </span>
                         <span className="sk-foot-price">{skill.charge_type === 'Free' ? 'Free/Trade' : `₹${skill.hourly_rate || '0'}/hr`}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
               <Pagination 
                 currentPage={currentPage}
                 totalItems={filteredSkills.length}
                 itemsPerPage={itemsPerPage}
                 onPageChange={handlePageChange}
               />
             </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default SkillExchange;
