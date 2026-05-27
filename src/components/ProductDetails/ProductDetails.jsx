import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css'; 
import './ProductDetails.css';
import Header from '../Common/Header';

const ProductDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { id: 5, firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.product);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Fetch real reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/product/${id}`);
        if (res.data.success) setReviews(res.data.reviews);
      } catch (err) {
        console.error('Error fetching product reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (product && product.category) {
      const fetchSimilar = async () => {
        try {
          const res = await api.get(`/products/category/${product.category}`);
          if (res.data.success) {
            // Filter out current product and take top 4
            const filtered = res.data.products.filter(p => p.id.toString() !== id);
            setSimilarProducts(filtered.slice(0, 4));
          }
        } catch (err) {
          console.error("Error fetching similar products:", err);
        }
      };
      fetchSimilar();
    }
  }, [product, id]);

  const handleOrderRequest = async () => {
    try {
      const res = await api.post('/orders', {
        buyerId: user.id || 5,
        sellerId: product.user_id,
        itemType: 'product',
        itemId: product.id,
        quantity: quantity
      });
      if (res.data.success) {
        alert('Order request sent successfully!');
        navigate('/orders', { state: { user } });
      }
    } catch (err) {
      console.error('Error sending order request:', err);
      alert(err.response?.data?.message || 'Failed to send order request.');
    }
  };

  const handleNotifyMe = async () => {
    try {
      const res = await api.post(`/products/${id}/notify`);
      if (res.data.success) {
        alert('You will be notified when this product is back in stock!');
        setProduct(prev => ({
          ...prev,
          hasRequestedNotification: true
        }));
      }
    } catch (err) {
      console.error('Error requesting restock notification:', err);
      alert(err.response?.data?.message || 'Failed to request notification.');
    }
  };

  if (loading) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading product details...</div>;
  }

  if (!product) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Product not found.</div>;
  }

  const imageUrls = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls.map(url => window.getImageUrl(url)) 
    : ['https://placehold.co/600x500/e6e3df/a39589?text=No+Image'];

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Container */}
      <main className="dashboard-main product-details-main">
        {/* Top Header mapping index style natively avoiding misalignment */}
        <Header user={user} />

        <div className="content-scrollable product-details-scroll">
          <div className="prod-viewer-wrapper">
             
             <div className="back-nav-pd" onClick={() => navigate('/marketplace', { state: { user } })} title="Go Back">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
             </div>

             { (product.status === 'Suspended' || product.seller_account_status === 'Suspended') && (
               <div className="suspension-warning-banner">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                 <span>This product or its seller has been temporarily suspended by an administrator. Purchases and interactions are disabled.</span>
               </div>
             )}

             {/* Top Stage Grid */}
             <div className="details-stage-grid">
               
               {/* Left: Image Gallery */}
               <div className="details-gallery">
                 <div className="main-image-wrap">
                   <img src={imageUrls[activeImageIndex]} alt={product.title} className="main-image-obj" />
                                       <span className="heart-icon-overlay" onClick={() => navigate('/wishlist', { state: { user } })} style={{cursor: 'pointer'}}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                   </span>
                 </div>
                 {imageUrls.length > 1 && (
                   <div className="thumb-row">
                     {imageUrls.map((url, idx) => (
                       <div key={idx} className={`thumb-item ${activeImageIndex === idx ? 'active' : ''}`} onClick={() => setActiveImageIndex(idx)}>
                         <img src={url} alt={`Thumb ${idx}`} />
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* Right: Info Config */}
               <div className="details-meta-area">
                 <div className="stage-badges">
                   <span className="drk-badge blue-pill" style={{textTransform: 'uppercase'}}>{product.category}</span>
                   <span className={`drk-badge ${product.available_quantity > 0 && product.status !== 'Sold' ? 'green-pill' : 'red-pill'}`}>
                     {product.available_quantity > 0 && product.status !== 'Sold' && <span className="green-dot"></span>} 
                     {product.status === 'Sold' ? 'SOLD' : (product.available_quantity > 0 ? 'AVAILABLE' : 'OUT OF STOCK')}
                   </span>
                 </div>

                 <h1 className="stage-title">{product.title}</h1>
                 <div className="prod-details-rating" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1.25rem', fontSize: '0.9rem', color: '#4B5563' }}>
                    <span style={{ color: '#FBBF24' }}>⭐</span>
                    <strong style={{ color: '#111827' }}>
                      {reviews.length > 0 
                        ? (reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length).toFixed(1) 
                        : (product.rating ? parseFloat(product.rating).toFixed(1) : '0.0')}
                    </strong>
                    <span style={{ color: '#6B7280' }}>
                      ({reviews.length > 0 ? reviews.length : (product.reviews || 0)} { (reviews.length > 0 ? reviews.length : (product.reviews || 0)) === 1 ? 'Review' : 'Reviews' })
                    </span>
                  </div>
                  <div className="stage-price-row">
                    <span className="current-price">₹{product.price}</span>
                  </div>

                  <p className="stage-desc">
                    {product.description}
                  </p>
                  
                  <div className="stage-action-row">
                    {(product.status === 'Suspended' || product.seller_account_status === 'Suspended') ? (
                      <button 
                         className="btn-order" 
                         disabled 
                         style={{
                           backgroundColor: '#EF4444',
                           color: 'white',
                           opacity: 0.7, 
                           cursor: 'not-allowed'
                         }}
                       >
                        Action Disabled (Suspended)
                      </button>
                    ) : (product.available_quantity === 0 || product.status === 'Sold') ? (
                      <button 
                         className="btn-order" 
                         onClick={handleNotifyMe} 
                         disabled={product.hasRequestedNotification} 
                         style={{
                           backgroundColor: product.hasRequestedNotification ? '#E5E7EB' : '#111827',
                           color: product.hasRequestedNotification ? '#9CA3AF' : 'white',
                           opacity: 1, 
                           cursor: product.hasRequestedNotification ? 'not-allowed' : 'pointer'
                         }}
                       >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> 
                        {product.hasRequestedNotification ? 'Notification Request Sent' : 'Notify Me'}
                      </button>
                    ) : (
                      <button 
                         className="btn-order" 
                         onClick={handleOrderRequest} 
                       >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> 
                        Send Order Request
                      </button>
                    )}
                  </div>

                  <ul className="stage-bullets">
                    <li>Condition: {product.condition}</li>
                    <li>Listed on: {new Date(product.created_at).toLocaleDateString()}</li>
                  </ul>

                  <div className="seller-box">
                    <div className="seller-profile-group">
                      {product.profile_image ? (
                        <img src={window.getImageUrl(product.profile_image)} alt={product.first_name} className="seller-avatar" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div 
                          className="seller-avatar-fallback" 
                          style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '50%', 
                            backgroundColor: '#4F46E5', 
                            color: 'white', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '16px', 
                            fontWeight: 'bold',
                            marginRight: '16px'
                          }}
                        >
                          {(product.first_name?.[0] || 'U').toUpperCase()}{(product.last_name?.[0] || '').toUpperCase()}
                        </div>
                      )}
                      <div className="seller-name-stack">
                        <span className="sn-title">{product.first_name} {product.last_name}</span>
                        <span className="sn-rates"><span className="star-icon">★</span> <strong className="ora-text">Seller</strong></span>
                      </div>
                    </div>
                    <span className="seller-chevron">›</span>
                  </div>

                 <div className="stage-traits-row">
                   <div className="trait-box">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                     <div className="trait-text">
                       <strong>Verified Student</strong>
                       <p>Campus ID checked</p>
                     </div>
                   </div>
                   <div className="trait-box pb-green">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                     <div className="trait-text">
                       <strong>Campus Meetup</strong>
                       <p>Library Cafe</p>
                     </div>
                   </div>
                 </div>

               </div>
             </div>

             {/* Middle Section: Reviews */}
             <div className="pd-section-wrapper">
               <h2 className="pd-section-title">Reviews &amp; Ratings</h2>

               {loadingReviews ? (
                 <div style={{ color: '#6B7280', padding: '1rem 0', fontSize: '0.9rem' }}>Loading reviews...</div>
               ) : reviews.length === 0 ? (
                 <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#9CA3AF', fontSize: '0.95rem' }}>
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" style={{ marginBottom: '0.75rem' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                   <div>No reviews yet for this product.</div>
                   <div style={{ fontSize: '0.82rem', marginTop: '4px', color: '#CBD5E1' }}>Be the first to buy and review!</div>
                 </div>
               ) : (() => {
                 const avgRating = reviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / reviews.length;
                 const starDist = [5, 4, 3, 2, 1].map(s => ({
                   st: s,
                   count: reviews.filter(r => Math.round(parseFloat(r.rating)) === s).length
                 }));
                 return (
                   <>
                     {/* Analysis Block */}
                     <div className="reviews-analysis-box">
                       <div className="raa-left">
                         <div className="raa-num">{avgRating.toFixed(1)}</div>
                         <div className="raa-stars">
                           {[1,2,3,4,5].map(s => (
                             <span key={s} className={s <= Math.round(avgRating) ? 'star-full' : 'star-empty'}>★</span>
                           ))}
                         </div>
                         <div className="raa-desc">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</div>
                       </div>
                       <div className="raa-right">
                         {starDist.map(row => {
                           const pct = reviews.length > 0 ? Math.round((row.count / reviews.length) * 100) : 0;
                           return (
                             <div key={row.st} className="raa-row">
                               <span className="raa-rlab">{row.st} ★</span>
                               <div className="raa-track"><div className="raa-fill" style={{ width: `${pct}%` }}></div></div>
                               <span className="raa-rpct">{pct}%</span>
                             </div>
                           );
                         })}
                       </div>
                     </div>

                     {/* Real Review Cards */}
                     {reviews.map((rev) => {
                       const initials = `${rev.first_name?.[0] || ''}${rev.last_name?.[0] || ''}`;
                       const timeAgo = (() => {
                         const diff = Date.now() - new Date(rev.created_at);
                         const s = Math.floor(diff / 1000);
                         if (s < 60) return `${s}s ago`;
                         const m = Math.floor(s / 60);
                         if (m < 60) return `${m}m ago`;
                         const h = Math.floor(m / 60);
                         if (h < 24) return `${h}h ago`;
                         const d = Math.floor(h / 24);
                         if (d < 7) return `${d}d ago`;
                         return `${Math.floor(d / 7)}w ago`;
                       })();
                       const stars = Math.round(parseFloat(rev.rating));
                       return (
                         <div key={rev.id} className="review-card">
                           <div className="rev-head">
                             <div className="rev-user-grp">
                               {rev.profile_image ? (
                                 <img src={window.getImageUrl(rev.profile_image)} alt={rev.first_name} className="rev-avatar" style={{ objectFit: 'cover' }} />
                               ) : (
                                 <img src={`https://placehold.co/40x40/6366f1/fff?text=${initials}`} alt={rev.first_name} className="rev-avatar" />
                               )}
                               <div className="rev-name-stack">
                                 <span className="rn-name">{rev.first_name} {rev.last_name}</span>
                                 <span className="rn-sub">
                                   {[1,2,3,4,5].map(s => (
                                     <span key={s} className={s <= stars ? 'star-icon' : 'star-empty'}>★</span>
                                   ))}
                                   &nbsp;{timeAgo}
                                 </span>
                               </div>
                             </div>
                             <div className="rev-verified-block">
                               <span className="rv-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Verified Purchase</span>
                               <span className="rv-desc">Completed order</span>
                             </div>
                           </div>
                           {rev.review_text && <p className="rev-msg">{rev.review_text}</p>}
                           {/* Sub-ratings if present */}
                           {(rev.teaching_rating || rev.outcome_rating || rev.communication_rating) && (
                             <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                               {rev.teaching_rating && (
                                 <span style={{ fontSize: '0.78rem', background: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: '999px', fontWeight: '600' }}>
                                   Quality: {parseFloat(rev.teaching_rating).toFixed(1)}★
                                 </span>
                               )}
                               {rev.outcome_rating && (
                                 <span style={{ fontSize: '0.78rem', background: '#F0FDF4', color: '#16A34A', padding: '3px 10px', borderRadius: '999px', fontWeight: '600' }}>
                                   Value: {parseFloat(rev.outcome_rating).toFixed(1)}★
                                 </span>
                               )}
                               {rev.communication_rating && (
                                 <span style={{ fontSize: '0.78rem', background: '#FFF7ED', color: '#EA580C', padding: '3px 10px', borderRadius: '999px', fontWeight: '600' }}>
                                   Seller Comm: {parseFloat(rev.communication_rating).toFixed(1)}★
                                 </span>
                               )}
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </>
                 );
               })()}
             </div>

             {/* Bottom Section: Similar items dynamic */}
              <div className="pd-section-wrapper">
                <div className="pd-similar-head">
                  <h2 className="pd-section-title" style={{margin:0}}>Similar Products</h2>
                  <span className="pd-view-all" onClick={() => navigate('/marketplace', { state: { user } })} style={{cursor: 'pointer'}}>View all ›</span>
                </div>

                <div className="pd-similar-grid">
                   {similarProducts.length > 0 ? similarProducts.map(sim => (
                     <div key={sim.id} className="sim-card" onClick={() => navigate(`/product/${sim.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
                       <div className="sim-img-wrap">
                         <img 
                           src={sim.image_urls && sim.image_urls.length > 0 ? window.getImageUrl(sim.image_urls[0]) : "https://placehold.co/300x200/e6e3df/a39589?text=No+Image"} 
                           alt={sim.title} 
                           className="sim-img" 
                         />
                         <span className="sim-price-tag">₹{sim.price}</span>
                       </div>
                       <h4 className="sim-title">{sim.title}</h4>
                       <p className="sim-cat">{sim.category}</p>
                     </div>
                   )) : (
                     <div className="no-similar-msg" style={{padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', gridColumn: '1/-1'}}>
                       No other products found in this category.
                     </div>
                   )}
                </div>
              </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
