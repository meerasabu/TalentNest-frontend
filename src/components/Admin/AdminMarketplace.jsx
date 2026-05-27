import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import Pagination from '../Common/Pagination';
import './AdminMarketplace.css';

const AdminMarketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const userRole = user?.role;

  // Route protection
  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchProducts();
    }
  }, [userRole]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/marketplace');
      if (res.data.success) {
        setProducts(res.data.products);
        setFilteredProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching admin marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (productId, newStatus) => {
    try {
      const res = await api.put(`/admin/marketplace/${productId}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        const updated = products.map(p => p.id === productId ? { ...p, status: newStatus } : p);
        setProducts(updated);
        filterList(searchTerm, updated);
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error('Error updating product status:', err);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      const res = await api.delete(`/admin/marketplace/${productId}`);
      if (res.data.success) {
        const updated = products.filter(p => p.id !== productId);
        setProducts(updated);
        filterList(searchTerm, updated);
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error('Error removing product:', err);
    }
  };

  const filterList = (term, list = products) => {
    const filtered = list.filter(p => 
      p.title.toLowerCase().includes(term.toLowerCase()) ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(term.toLowerCase()) ||
      p.category.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to page 1 when filtering
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterList(term);
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="marketplace" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Marketplace</h1>
            <p>Moderate physical goods listed by students</p>
          </div>
          
          <div className="admin-controls">
            <div className="admin-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <button className="admin-filter-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Category
            </button>
            
            <button className="admin-filter-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Status
            </button>
          </div>
        </header>

        <div className="admin-table-container">
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center'}}>Loading marketplace...</div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>PRODUCT</th>
                    <th>SELLER</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th>STATUS</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length > 0 ? paginatedProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-profile-cell">
                          <div className="product-img-mini">
                            {product.image_urls && product.image_urls.length > 0 ? (
                              <img src={`http://localhost:5000${product.image_urls[0]}`} alt="" />
                            ) : (
                              <div className="img-placeholder">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                              </div>
                            )}
                          </div>
                          <span className="product-title-text">{product.title}</span>
                        </div>
                      </td>
                      <td>{product.first_name} {product.last_name}</td>
                      <td>{product.category}</td>
                      <td><strong style={{color: '#111827'}}>₹{product.price}</strong></td>
                      <td>
                        <span className={`status-badge ${product.status.toLowerCase()}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-dropdown-wrapper">
                          <button className="options-btn" onClick={() => toggleDropdown(product.id)}>
                            Options
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </button>
                          
                          {activeDropdown === product.id && (
                            <div className="admin-dropdown-menu">
                              <button onClick={() => navigate(`/admin/marketplace/${product.id}`)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                View
                              </button>
                              <button className="text-orange" onClick={() => handleUpdateStatus(product.id, 'Inappropriate')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                                Mark Inappropriate
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>No products found</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Pagination 
                currentPage={currentPage}
                totalItems={filteredProducts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminMarketplace;
