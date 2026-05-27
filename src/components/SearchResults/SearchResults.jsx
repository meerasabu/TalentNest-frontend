import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import Header from '../Common/Header';
import '../Dashboard/Index.css';

const SearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';
  
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ products: [], skills: [], services: [] });
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (response.data.success) {
          setResults(response.data.results);
          if (response.data.results.products.length > 0) setActiveTab('products');
          else if (response.data.results.skills.length > 0) setActiveTab('skills');
          else if (response.data.results.services.length > 0) setActiveTab('services');
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  const renderProductCard = (prod) => (
    <div key={prod.id} className="market-card" onClick={() => navigate(`/product/${prod.id}`, { state: { user } })} style={{cursor: 'pointer', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', transition: 'box-shadow 0.2s'}}>
      <div style={{width: '100%', height: '160px', backgroundColor: '#F3F4F6', borderRadius: '8px', overflow: 'hidden', position: 'relative'}}>
        {prod.image_urls && prod.image_urls.length > 0 ? (
          <img src={`http://localhost:5000${prod.image_urls[0]}`} alt={prod.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #E0E7FF 0%, #EDE9FE 100%)'}}></div>
        )}
      </div>
      <div>
        <h3 style={{fontSize: '1.125rem', fontWeight: '700', color: '#111827', margin: '0 0 0.25rem 0'}}>{prod.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem', fontSize: '0.75rem', color: '#4B5563' }}>
          <span style={{ color: '#FBBF24' }}>⭐</span>
          <span style={{ fontWeight: 600 }}>{prod.rating ? parseFloat(prod.rating).toFixed(1) : '0.0'}</span>
          <span style={{ color: '#9CA3AF' }}>({prod.reviews || 0} {prod.reviews === 1 ? 'Review' : 'Reviews'})</span>
        </div>
        
        <div className="prod-seller-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          {prod.profile_image ? (
            <img 
              src={`http://localhost:5000${prod.profile_image}`} 
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

        <p style={{fontSize: '1rem', fontWeight: '800', color: '#4F46E5', margin: '0 0 0.5rem 0'}}>₹{prod.price}</p>
        <p style={{fontSize: '0.875rem', color: '#6B7280', margin: '0'}}>{prod.category}</p>
      </div>
    </div>
  );

  const renderSkillCard = (skill) => (
    <div key={skill.id} className="market-card" onClick={() => navigate(`/skill/${skill.id}`, { state: { user } })} style={{cursor: 'pointer', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', transition: 'box-shadow 0.2s'}}>
      <div style={{width: '100%', height: '160px', backgroundColor: '#F3F4F6', borderRadius: '8px', overflow: 'hidden', position: 'relative'}}>
        {skill.image_urls && skill.image_urls.length > 0 ? (
          <img src={`http://localhost:5000${skill.image_urls[0]}`} alt={skill.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)'}}></div>
        )}
      </div>
      <div>
        <h3 style={{fontSize: '1.125rem', fontWeight: '700', color: '#111827', margin: '0 0 0.25rem 0'}}>{skill.title}</h3>
        <p style={{fontSize: '1rem', fontWeight: '800', color: '#10B981', margin: '0 0 0.5rem 0'}}>{skill.charge_type === 'Free' ? 'Free' : `₹${skill.hourly_rate}/hr`}</p>
        <p style={{fontSize: '0.875rem', color: '#6B7280', margin: '0'}}>{skill.category}</p>
      </div>
    </div>
  );

  const renderServiceCard = (service) => (
    <div key={service.id} className="market-card" onClick={() => navigate(`/service/${service.id}`, { state: { user } })} style={{cursor: 'pointer', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', transition: 'box-shadow 0.2s'}}>
      <div style={{width: '100%', height: '160px', backgroundColor: '#F3F4F6', borderRadius: '8px', overflow: 'hidden', position: 'relative'}}>
        {service.image_urls && service.image_urls.length > 0 ? (
          <img src={`http://localhost:5000${service.image_urls[0]}`} alt={service.title} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <div style={{width: '100%', height: '100%', background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)'}}></div>
        )}
      </div>
      <div>
        <h3 style={{fontSize: '1.125rem', fontWeight: '700', color: '#111827', margin: '0 0 0.25rem 0'}}>{service.title}</h3>
        <p style={{fontSize: '1rem', fontWeight: '800', color: '#F59E0B', margin: '0 0 0.5rem 0'}}>{service.standard_plan ? `₹${service.standard_plan}` : 'Custom'}</p>
        <p style={{fontSize: '0.875rem', color: '#6B7280', margin: '0'}}>{service.service_type || 'General'}</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />
      <main className="dashboard-main">
        <Header user={user} />
        
        <div className="content-scrollable" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', margin: '0 0 0.5rem 0' }}>Search Results</h1>
            <p style={{ fontSize: '1rem', color: '#6B7280', margin: 0 }}>Showing results for "{query}"</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#6B7280' }}>Searching...</div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #E5E7EB', marginBottom: '2rem' }}>
                <button 
                  onClick={() => setActiveTab('products')}
                  style={{ padding: '0.75rem 1rem', border: 'none', background: 'none', fontWeight: '600', color: activeTab === 'products' ? '#4F46E5' : '#6B7280', borderBottom: activeTab === 'products' ? '2px solid #4F46E5' : '2px solid transparent', cursor: 'pointer' }}
                >
                  Products ({results.products.length})
                </button>
                <button 
                  onClick={() => setActiveTab('skills')}
                  style={{ padding: '0.75rem 1rem', border: 'none', background: 'none', fontWeight: '600', color: activeTab === 'skills' ? '#4F46E5' : '#6B7280', borderBottom: activeTab === 'skills' ? '2px solid #4F46E5' : '2px solid transparent', cursor: 'pointer' }}
                >
                  Skills ({results.skills.length})
                </button>
                <button 
                  onClick={() => setActiveTab('services')}
                  style={{ padding: '0.75rem 1rem', border: 'none', background: 'none', fontWeight: '600', color: activeTab === 'services' ? '#4F46E5' : '#6B7280', borderBottom: activeTab === 'services' ? '2px solid #4F46E5' : '2px solid transparent', cursor: 'pointer' }}
                >
                  Services ({results.services.length})
                </button>
              </div>

              {activeTab === 'products' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {results.products.length > 0 ? results.products.map(renderProductCard) : <div style={{ color: '#6B7280', gridColumn: '1 / -1' }}>No products found.</div>}
                </div>
              )}

              {activeTab === 'skills' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {results.skills.length > 0 ? results.skills.map(renderSkillCard) : <div style={{ color: '#6B7280', gridColumn: '1 / -1' }}>No skills found.</div>}
                </div>
              )}

              {activeTab === 'services' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {results.services.length > 0 ? results.services.map(renderServiceCard) : <div style={{ color: '#6B7280', gridColumn: '1 / -1' }}>No services found.</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults;
