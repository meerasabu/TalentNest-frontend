import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import Pagination from '../Common/Pagination';
import '../Dashboard/Index.css'; 
import './Marketplace.css';
import Header from '../Common/Header';

const Marketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  const [wishlistIds, setWishlistIds] = useState(new Set());

  const fetchWishlist = async () => {
    try {
      const res = await api.get(`/wishlist/users/${user.id}`);
      if (res.data.success) {
        const ids = new Set(res.data.items.filter(item => item.type === 'product').map(item => item.id));
        setWishlistIds(ids);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        if (response.data.success) {
          setProducts(response.data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    fetchWishlist();
  }, []);

  const handleAddToWishlist = async (e, itemId) => {
    e.stopPropagation();
    const isWishlisted = wishlistIds.has(itemId);
    try {
      if (isWishlisted) {
        const res = await api.delete(`/wishlist/${user.id}/product/${itemId}`);
        if (res.data.success) {
          const newIds = new Set(wishlistIds);
          newIds.delete(itemId);
          setWishlistIds(newIds);
          window.dispatchEvent(new Event('wishlistUpdated'));
        }
      } else {
        const res = await api.post('/wishlist', {
          userId: user.id,
          itemType: 'product',
          itemId
        });
        if (res.data.success) {
          const newIds = new Set(wishlistIds);
          newIds.add(itemId);
          setWishlistIds(newIds);
          window.dispatchEvent(new Event('wishlistUpdated'));
        }
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      alert('Failed to update wishlist.');
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(prod => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = prod.title?.toLowerCase().includes(q);
      const descMatch = prod.description?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch) return false;
    }
    if (activeCategory !== 'All' && prod.category !== activeCategory) return false;
    
    if (priceRange !== 'All') {
      const price = parseFloat(prod.price);
      if (priceRange === 'Under ₹500' && price >= 500) return false;
      if (priceRange === '₹500 - ₹2000' && (price < 500 || price > 2000)) return false;
      if (priceRange === 'Above ₹2000' && price <= 2000) return false;
    }

    if (minRating > 0 && parseFloat(prod.rating || 0) < minRating) return false;

    return true;
  });

  // Sort Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceLow') return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === 'priceHigh') return parseFloat(b.price) - parseFloat(a.price);
    if (sortBy === 'rating') return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
    return new Date(b.created_at) - new Date(a.created_at); // default latest
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedProducts = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const contentElement = document.querySelector('.marketplace-content');
    if (contentElement) contentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleClearAll = () => {
    setActiveCategory('All');
    setPriceRange('All');
    setMinRating(0);
    setCurrentPage(1);
  };

  const hasActiveFilters = activeCategory !== 'All' || priceRange !== 'All' || minRating > 0;

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      <main className="dashboard-main marketplace-main">
        <Header user={user} />

        <div className="content-scrollable marketplace-content">
          
          <div className="market-header-actions">
            <div>
              <h1 className="market-title">Marketplace</h1>
              <p className="market-subtitle">Buy and sell goods securely on campus.</p>
            </div>
            
            <div className="market-action-group">
              <div className="marketplace-search-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery} 
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="search-input-field"
                />
              </div>
              <button className="btn-add-product" onClick={() => navigate('/create-listing', { state: { initialTab: 'product' } })}>
                + Add Product
              </button>
              <button className={`btn-filter ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                Filters
              </button>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select 
                  className="btn-sort" 
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

          {showFilters && (
            <div className="filter-panel" style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', gap: '2rem', border: '1px solid #E5E7EB' }}>
              <div style={{ flex: 1 }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>CATEGORY</h5>
                <select value={activeCategory} onChange={(e) => {setActiveCategory(e.target.value); setCurrentPage(1);}} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                  <option value="All">All Categories</option>
                  {['Electronics', 'Books', 'Furniture', 'Clothing', 'Stationery', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>PRICE</h5>
                <select value={priceRange} onChange={(e) => {setPriceRange(e.target.value); setCurrentPage(1);}} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                  <option value="All">Any Price</option>
                  <option value="Under ₹500">Under ₹500</option>
                  <option value="₹500 - ₹2000">₹500 - ₹2000</option>
                  <option value="Above ₹2000">Above ₹2000</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>MINIMUM RATING</h5>
                <select value={minRating} onChange={(e) => {setMinRating(parseFloat(e.target.value)); setCurrentPage(1);}} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #D1D5DB' }}>
                  <option value="0">Any Rating</option>
                  <option value="4">4★ & above</option>
                  <option value="3">3★ & above</option>
                </select>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="market-filters-row">
              <span className="filter-label">Active filters:</span>
              {activeCategory !== 'All' && <span className="filter-chip">{activeCategory} <span className="chip-x" onClick={() => setActiveCategory('All')}>×</span></span>}
              {priceRange !== 'All' && <span className="filter-chip">{priceRange} <span className="chip-x" onClick={() => setPriceRange('All')}>×</span></span>}
              {minRating > 0 && <span className="filter-chip">{minRating}★ & above <span className="chip-x" onClick={() => setMinRating(0)}>×</span></span>}
              <span className="clear-filters" onClick={handleClearAll} style={{cursor: 'pointer'}}>Clear all filters</span>
            </div>
          )}
          
          <div className="results-count" style={{marginBottom: '1.5rem'}}>Showing <strong>{filteredProducts.length}</strong> results</div>

          <div className="market-products-grid">
            {paginatedProducts.map(prod => (
              <div key={prod.id} className="market-card" onClick={() => navigate(`/product/${prod.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
                 <div className="market-card-img-wrap">
                   {prod.image_urls && prod.image_urls.length > 0 ? (
                     <img src={window.getImageUrl(prod.image_urls[0])} alt={prod.title} className="market-card-img" />
                   ) : (
                     <div className="market-card-img placeholder-null"></div>
                   )}
                   
                   <div className="card-top-icons">
                      <div className="badge-area">
                         {prod.condition === 'New' && <span className="badge-new">NEW</span>}
                         <span className={`badge-status ${prod.status === 'Available' && prod.available_quantity > 0 ? 'avail' : 'sold'}`} style={prod.status !== 'Sold' && prod.available_quantity === 0 ? { color: '#EF4444' } : {}}>
                           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                           {prod.status === 'Sold' ? 'Sold' : (prod.available_quantity > 0 ? 'Available' : 'Out of Stock')}
                         </span>
                      </div>
                      <span className="heart-icon-layer" onClick={(e) => handleAddToWishlist(e, prod.id)}>
                        <svg 
                           width="16" 
                           height="16" 
                           viewBox="0 0 24 24" 
                           fill={wishlistIds.has(prod.id) ? "#EF4444" : "none"} 
                           stroke={wishlistIds.has(prod.id) ? "#EF4444" : "#6B7280"} 
                           strokeWidth="2"
                         >
                           <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                         </svg>
                      </span>
                   </div>
                 </div>

                 <div className="market-card-body">
                    <h3 className="prod-title">{prod.title}</h3>
                     <div className="prod-rating">
                        <span style={{ color: '#FBBF24', fontSize: '0.75rem', marginRight: '2px' }}>⭐</span>
                        <span className="rating-revs">({prod.reviews || 0} {prod.reviews === 1 ? 'Review' : 'Reviews'})</span>
                     </div>
                    
                    <div className="prod-seller-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                      {prod.profile_image ? (
                        <img 
                          src={window.getImageUrl(prod.profile_image)} 
                          alt={prod.first_name} 
                          style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            backgroundColor: '#E5E7EB', 
                            color: '#4B5563', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '9px', 
                            fontWeight: 'bold' 
                          }}
                        >
                          {prod.first_name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <span style={{ fontSize: '0.75rem', color: '#4B5563' }}>
                        by <strong>{prod.first_name} {prod.last_name?.charAt(0)}.</strong>
                      </span>
                    </div>
                    
                    <div className="prod-price">₹{prod.price}</div>
                    
                    <p className="prod-meta">{prod.category} • Today</p>

                    <button className="prod-request-btn">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                       Request-based purchase via chat
                    </button>
                  </div>
              </div>
            ))}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />

        </div>
      </main>
    </div>
  );
};

export default Marketplace;
