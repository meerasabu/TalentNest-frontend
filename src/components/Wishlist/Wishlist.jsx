import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css';
import './Wishlist.css';
import Header from '../Common/Header';

const Wishlist = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { id: 5, firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : 'STUDENT';

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await api.get(`/wishlist/users/${user.id}`);
        if (res.data.success) {
          setWishlistItems(res.data.items);
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user.id]);

  const handleRemoveFromWishlist = async (itemType, itemId) => {
    try {
      const res = await api.delete(`/wishlist/${user.id}/${itemType}/${itemId}`);
      if (res.data.success) {
        setWishlistItems(prev => prev.filter(item => !(item.type === itemType && item.id === itemId)));
      }
    } catch (err) {
      console.error('Error removing wishlist item:', err);
      alert('Failed to remove item.');
    }
  };

  const filteredItems = activeTab === 'all' ? wishlistItems : wishlistItems.filter(item => item.type === activeTab);

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Content Area */}
      <main className="dashboard-main wishlist-main">
        {/* Header */}
        <Header user={user} showSearch={true} searchPlaceholder="Search saved items..." />

        <div className="content-scrollable wishlist-content">
          <div className="wishlist-header">
            <h1 className="wishlist-title">My Wishlist</h1>
            <div className="wishlist-tabs">
              <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Items</button>
              <button className={`tab-btn ${activeTab === 'product' ? 'active' : ''}`} onClick={() => setActiveTab('product')}>Products</button>
              <button className={`tab-btn ${activeTab === 'skill' ? 'active' : ''}`} onClick={() => setActiveTab('skill')}>Skills</button>
              <button className={`tab-btn ${activeTab === 'service' ? 'active' : ''}`} onClick={() => setActiveTab('service')}>Services</button>
            </div>
          </div>

          {loading ? (
            <div style={{textAlign: 'center', marginTop: '2rem'}}>Loading wishlist...</div>
          ) : (
            <div className="wishlist-grid">
              {filteredItems.map(item => (
                <div key={item.wishlist_id} className="wishlist-card">
                  <div className="card-image-wrap">
                    <img src={item.image_url ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.image_url}` : "https://placehold.co/600x400?text=No+Image"} alt={item.title} className="card-image" />
                    <div className="card-badge" style={{textTransform: 'uppercase'}}>{item.category}</div>
                    <button className="remove-wishlist" onClick={() => handleRemoveFromWishlist(item.type, item.id)}>❤️</button>
                  </div>
                  <div className="card-details">
                    <h3 className="card-title">{item.title}</h3>
                    <div className="card-meta">
                      <span className="card-price">₹{item.price}</span>
                      <span className="card-status">{item.status?.toUpperCase() || 'AVAILABLE'}</span>
                    </div>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button 
                        className="view-btn" 
                        onClick={() => navigate(`/${item.type === 'product' ? 'product' : item.type === 'skill' ? 'skill' : 'service'}/${item.id}`, { state: { user } })}
                        style={{flex: 1}}
                      >
                        View Details
                      </button>
                      <button 
                        className="view-btn" 
                        onClick={() => handleRemoveFromWishlist(item.type, item.id)}
                        style={{flex: 1, backgroundColor: '#FEE2E2', color: '#DC2626'}}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="empty-wishlist">
              <div className="empty-icon">❤️</div>
              <h2>Your wishlist is empty</h2>
              <p>Items you save will appear here.</p>
              <button className="browse-btn" onClick={() => navigate('/marketplace', { state: { user } })}>Browse Marketplace</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wishlist;
