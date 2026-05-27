import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminOrders.css';

const AdminOrders = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Memoize user to prevent infinite re-renders since JSON.parse creates a new object every time
  const user = React.useMemo(() => {
    return location.state?.user || JSON.parse(localStorage.getItem('user'));
  }, [location.state?.user]);
  
  const [activeTab, setActiveTab] = useState('product'); // product, skill, service
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-dropdown-wrapper')) {
        document.querySelectorAll('.action-dropdown.show').forEach(el => {
          el.classList.remove('show');
        });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Route protection
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchOrders();
    }
  }, [user, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/orders?type=${activeTab}`);
      if (res.data.success) {
        setOrders(res.data.orders);
      } else {
        setError(res.data.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      setError('Connection error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'cancelled': return 'status-cancelled';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const filteredOrders = orders.filter(o => {
    const titleMatch = o.itemTitle ? o.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const buyerMatch = `${o.buyer_first_name} ${o.buyer_last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const sellerMatch = `${o.seller_first_name} ${o.seller_last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    return titleMatch || buyerMatch || sellerMatch;
  });

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="orders" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Orders & Requests</h1>
            <p>Track campus interactions and completions</p>
          </div>
          
          <div className="admin-controls">
            <div className="admin-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => setActiveTab('product')}
          >
            Marketplace Orders
          </button>
          <button 
            className={`admin-tab ${activeTab === 'skill' ? 'active' : ''}`}
            onClick={() => setActiveTab('skill')}
          >
            Skill Exchanges
          </button>
          <button 
            className={`admin-tab ${activeTab === 'service' ? 'active' : ''}`}
            onClick={() => setActiveTab('service')}
          >
            Service Requests
          </button>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center'}}>Loading interactions...</div>
          ) : error ? (
            <div style={{padding: '2rem', textAlign: 'center', color: '#DC2626'}}>{error}</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>BUYER</th>
                  <th>SELLER</th>
                  <th>ITEM / SESSION</th>
                  <th>REQUEST STATUS</th>
                  <th>COMPLETION</th>
                  <th>DATE</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong style={{color: '#111827'}}>{order.buyer_first_name} {order.buyer_last_name}</strong>
                    </td>
                    <td style={{color: '#6B7280'}}>{order.seller_first_name} {order.seller_last_name}</td>
                    <td>{order.itemTitle}</td>
                    <td>
                      <span className={`status-pill ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className="completion-pill">
                        {order.status === 'Accepted' ? 'In Progress' : 
                         order.status === 'Completed' ? 'Confirmed' : 
                         order.status === 'Pending' ? 'Awaiting' : 'N/A'}
                      </span>
                    </td>
                    <td style={{color: '#6B7280'}}>{new Date(order.created_at).toISOString().split('T')[0]}</td>
                    <td className="text-right">
                      <div className="action-dropdown-wrapper">
                        <button className="options-btn" onClick={(e) => {
                          const dropdown = e.currentTarget.nextElementSibling;
                          dropdown.classList.toggle('show');
                        }}>
                          Options
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div className="action-dropdown">
                          <button onClick={() => navigate(`/admin/orders/${order.id}`)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            View
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>No interactions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
