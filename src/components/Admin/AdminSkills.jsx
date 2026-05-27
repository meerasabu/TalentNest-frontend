import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import Pagination from '../Common/Pagination';
import './AdminSkills.css';

const AdminSkills = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);
  
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
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
      fetchSkills();
    }
  }, [userRole]);

  const fetchSkills = async () => {
    try {
      const res = await api.get('/admin/skills');
      if (res.data.success) {
        setSkills(res.data.skills);
        setFilteredSkills(res.data.skills);
      }
    } catch (err) {
      console.error('Error fetching admin skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (skillId, newStatus, rejectionReason = null) => {
    try {
      const res = await api.put(`/admin/skills/${skillId}/status`, {
        status: newStatus,
        rejectionReason
      });
      if (res.data.success) {
        const updated = skills.map(s => s.id === skillId ? { ...s, status: newStatus, rejection_reason: rejectionReason } : s);
        setSkills(updated);
        filterList(searchTerm, updated);
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error('Error updating skill status:', err);
    }
  };

  const filterList = (term, list = skills) => {
    const filtered = list.filter(s => 
      s.title.toLowerCase().includes(term.toLowerCase()) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term.toLowerCase()) ||
      s.category.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredSkills(filtered);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedSkills = filteredSkills.slice(indexOfFirstItem, indexOfLastItem);

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
      <AdminSidebar activePage="skills" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Skills</h1>
            <p>Moderate skill exchanges and tutoring listings</p>
          </div>
          
          <div className="admin-controls">
            <div className="admin-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search skills..." 
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
            <div style={{padding: '2rem', textAlign: 'center'}}>Loading skills...</div>
          ) : (
            <>
              <table className="admin-table">
              <thead>
                <tr>
                  <th>SKILL TITLE</th>
                  <th>PROVIDER</th>
                  <th>CATEGORY</th>
                  <th>SESSION TYPE</th>
                  <th>COMPENSATION</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSkills.length > 0 ? paginatedSkills.map((skill) => (
                  <tr key={skill.id}>
                    <td>
                      <strong style={{color: '#111827'}}>{skill.title}</strong>
                    </td>
                    <td>{skill.first_name} {skill.last_name}</td>
                    <td>{skill.category}</td>
                    <td>{skill.skill_type || 'Online'}</td>
                    <td>
                      {skill.charge_type === 'Paid' ? `Paid (₹${skill.hourly_rate}/hr)` : 'Exchange'}
                    </td>
                    <td>
                      <span className={`status-badge ${skill.status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                        {skill.status || 'Pending'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        className="options-btn"
                        onClick={() => navigate(`/admin/skills/${skill.id}`, { state: { user } })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        View
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>No skills found</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <Pagination 
              currentPage={currentPage}
              totalItems={filteredSkills.length}
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

export default AdminSkills;
