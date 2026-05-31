import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import Pagination from '../Common/Pagination';
import '../Dashboard/Index.css'; 
import './Services.css';
import Header from '../Common/Header';

const Services = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Live filter and sort states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [deliveryType, setDeliveryType] = useState('Both');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services');
        if (response.data.success) {
          // Filter to show only Active services
          const activeServices = response.data.services.filter(srv => srv.status === 'Active' || !srv.status);
          setServices(activeServices);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleAddToWishlist = async (e, itemId) => {
    e.stopPropagation();
    try {
      const res = await api.post('/wishlist', {
        userId: user.id,
        itemType: 'service',
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

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setDeliveryType('Both');
    setMinRating(0);
    setCurrentPage(1);
  };

  // Filter products locally based on multiple states
  const filteredServices = services.filter(service => {
    // 0. Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = service.title?.toLowerCase().includes(q);
      const descMatch = service.description?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }

    // 1. Category check (service_type stores standard categories like Design, Writing etc.)
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(service.service_type)) {
        return false;
      }
    }

    // 2. Delivery type check (Remote Project, On-Campus, Both)
    const desc = (service.description || '').toLowerCase();
    const title = (service.title || '').toLowerCase();
    if (deliveryType === 'Remote Project') {
      const isRemote = desc.includes('remote') || desc.includes('online') || desc.includes('zoom') || desc.includes('web') || title.includes('remote') || title.includes('online');
      if (!isRemote) return false;
    } else if (deliveryType === 'On-Campus') {
      const isOnCampus = desc.includes('campus') || desc.includes('person') || desc.includes('onsite') || desc.includes('dorm') || desc.includes('office') || title.includes('campus') || title.includes('person');
      if (!isOnCampus) return false;
    }

    // 3. Rating check (standard numeric check)
    const rating = parseFloat(service.rating || 0.0);
    if (minRating > 0 && rating < minRating) {
      return false;
    }

    return true;
  });

  // Sort services locally
  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }
    if (sortBy === 'rating') {
      return parseFloat(b.rating || 0.0) - parseFloat(a.rating || 0.0);
    }
    if (sortBy === 'priceLow') {
      return parseFloat(a.standard_plan || 0) - parseFloat(b.standard_plan || 0);
    }
    if (sortBy === 'priceHigh') {
      return parseFloat(b.standard_plan || 0) - parseFloat(a.standard_plan || 0);
    }
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedServices = sortedServices.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const contentElement = document.querySelector('.srv-scrollable');
    if (contentElement) contentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      <main className="dashboard-main srv-main">
        {/* Main Interface Header */}
        <Header user={user} />

        <div className="content-scrollable srv-scrollable">
          
          {/* Header Action Layers */}
          <div className="srv-header-row">
            <div className="srv-title-block">
              <h1 className="srv-title">
                <span className="srv-lightning">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="bolt-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </span>
                Services
              </h1>
              <p className="srv-subtitle">Find or provide specialized campus services.</p>
            </div>
            
            <div className="srv-action-group">
              <div className="service-search-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search services..." 
                  value={searchQuery} 
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="search-input-field"
                />
              </div>
              <button className="btn-add-srv" onClick={() => navigate('/create-listing', { state: { initialTab: 'service' } })}>
                + Add Service
              </button>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select 
                  className="btn-sort-srv" 
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

          <div className="srv-dual-col">
            
            {/* Left Filter Box Architecture natively simulating constraints */}
            <aside className="srv-filter-sidebar">
               
               <div className="filter-sect">
                 <div className="filter-sect-head">
                   <h5 className="fl-head">CATEGORIES</h5>
                   <span className="fl-clear" onClick={handleClearAll} style={{ cursor: 'pointer' }}>Clear All</span>
                 </div>
                 <div className="fl-options">
                   {['Design', 'Cleaning', 'Writing', 'Errands', 'Fitness', 'Tech Support', 'Photography', 'Tutoring', 'Event Help'].map(cat => (
                     <label key={cat} className="fl-chk-wrap" onClick={() => handleCategoryToggle(cat)} style={{ cursor: 'pointer' }}>
                       <span className={`fl-box ${selectedCategories.includes(cat) ? 'active-box' : ''}`}></span>
                       <span className="fl-lbl">{cat}</span>
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

            {/* Right Core Interactive Grid Space identically bound */}
            <div className="srv-main-content">
               
               <div className="srv-active-filters-row">
                 <div className="af-group">
                                       {selectedCategories.map(cat => (
                      <span key={cat} className="af-chip">
                        {cat} <span className="af-x" onClick={() => handleCategoryToggle(cat)} style={{ cursor: 'pointer' }}>×</span>
                      </span>
                    ))}
                    {deliveryType !== 'Both' && (
                      <span className="af-chip">
                        {deliveryType} <span className="af-x" onClick={() => setDeliveryType('Both')} style={{ cursor: 'pointer' }}>×</span>
                      </span>
                    )}
                    {minRating > 0 && (
                      <span className="af-chip">
                        {minRating}★ & above <span className="af-x" onClick={() => setMinRating(0)} style={{ cursor: 'pointer' }}>×</span>
                      </span>
                    )}

                 </div>
                 <div className="af-results">Showing <strong>{filteredServices.length}</strong> results</div>
               </div>

               <div className="srv-grid-wrap">
                 {paginatedServices.map((service) => (
                   <div key={service.id} className="srv-card" onClick={() => navigate(`/service/${service.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
                     <div className="srv-img-layer">
                       {service.image_urls && service.image_urls.length > 0 ? (
                         <img src={window.getImageUrl(service.image_urls[0])} alt={service.title} className="srv-img"/>
                       ) : (
                         <div className="srv-img srv-gradient-bg"></div>
                       )}
                       <div className="srv-img-overlay">
                          <span className="srv-tag-cat">{service.service_type || 'General'}</span>
                          <span className="srv-tag-rate"><span className="srv-rate-star">★</span></span>
                       </div>
                       {service.status && (
                         <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                           {service.status}
                         </span>
                       )}
                       <span className="heart-icon-layer" onClick={(e) => handleAddToWishlist(e, service.id)}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                       </span>
                     </div>
                     <div className="srv-card-body">
                       <h3 className="srv-card-title">{service.title}</h3>
                       
                       <div className="srv-author-row">
                         <img src={service.profile_image ? window.getImageUrl(service.profile_image) : "https://placehold.co/24x24/e2e8f0/e2e8f0"} alt="Avatar" className="srv-auth-ava" style={{objectFit: 'cover'}}/>
                         <span className="srv-auth-lbl">by <strong>{service.first_name} {service.last_name?.charAt(0)}.</strong></span>
                       </div>

                       <div className="srv-card-footer">
                         <span className="srv-foot-sess">{service.service_type || 'Flexible'}</span>
                         <span className="srv-foot-price">{service.standard_plan ? '₹'+service.standard_plan : 'Custom'}</span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>

               <Pagination 
                 currentPage={currentPage}
                 totalItems={filteredServices.length}
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

export default Services;
