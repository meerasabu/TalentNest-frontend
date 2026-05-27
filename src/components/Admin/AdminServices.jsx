import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import Pagination from '../Common/Pagination';
import './AdminServices.css';

const AdminServices = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);
  
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
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
      fetchServices();
    }
  }, [userRole]);

  const fetchServices = async () => {
    try {
      const res = await api.get('/admin/services');
      if (res.data.success) {
        setServices(res.data.services);
        setFilteredServices(res.data.services);
      }
    } catch (err) {
      console.error('Error fetching admin services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (serviceId, newStatus) => {
    try {
      const res = await api.put(`/admin/services/${serviceId}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        const updated = services.map(s => s.id === serviceId ? { ...s, status: newStatus } : s);
        setServices(updated);
        filterList(searchTerm, updated);
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error('Error updating service status:', err);
    }
  };

  const filterList = (term, list = services) => {
    const filtered = list.filter(s => 
      s.title.toLowerCase().includes(term.toLowerCase()) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term.toLowerCase()) ||
      s.category.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredServices(filtered);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedServices = filteredServices.slice(indexOfFirstItem, indexOfLastItem);

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
      <AdminSidebar activePage="services" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Services</h1>
            <p>Moderate service offerings from students</p>
          </div>
          
          <div className="admin-controls">
            <div className="admin-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search services..." 
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
            <div style={{padding: '2rem', textAlign: 'center'}}>Loading services...</div>
          ) : (
            <>
              <table className="admin-table">
              <thead>
                <tr>
                  <th>SERVICE TITLE</th>
                  <th>PROVIDER</th>
                  <th>CATEGORY</th>
                  <th>PRICING</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedServices.length > 0 ? paginatedServices.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <strong style={{color: '#111827'}}>{service.title}</strong>
                    </td>
                    <td>{service.first_name} {service.last_name}</td>
                    <td>{service.category || 'General'}</td>
                    <td>
                      ₹{service.standard_plan || '0'} 
                      <span style={{fontSize: '12px', color: '#6B7280', marginLeft: '4px'}}>
                        {service.service_type === 'Online' ? '/hr' : '/event'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${service.status?.toLowerCase() || 'active'}`}>
                        {service.status || 'Active'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-dropdown-wrapper">
                        <button className="options-btn" onClick={() => toggleDropdown(service.id)}>
                          Options
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        
                        {activeDropdown === service.id && (
                          <div className="admin-dropdown-menu">
                            <button onClick={() => navigate(`/admin/services/${service.id}`, { state: { user } })}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              View
                            </button>
                            <button className="text-orange" onClick={() => handleUpdateStatus(service.id, 'Suspended')}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                              Mark Suspicious
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>No services found</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <Pagination 
              currentPage={currentPage}
              totalItems={filteredServices.length}
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

export default AdminServices;
