import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import Pagination from '../Common/Pagination';
import './AdminStudents.css';
import { useToast } from '../../context/ToastContext';

const AdminStudents = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = React.useMemo(() => {
    try {
      return location.state?.user || JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  }, [location.state?.user]);
  
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Hardcoded departments list as requested
  const predefinedDepartments = [
    'All',
    'Department of CS (PG)',
    'Department of CS (UG)',
    'Department of English',
    'Department of Social Science',
    'Department of Life Science',
    'Department of Management',
    'Department of Psychology'
  ];
  
  const statuses = ['All', 'Active', 'Suspended', 'Warned'];

  const userRole = user?.role;

  // Route protection
  useEffect(() => {
    if (!userRole || userRole !== 'admin') {
      navigate('/login');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchStudents();
    }
  }, [userRole]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      if (res.data.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error('Error fetching admin students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply Filters
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = students.filter(s => {
      const matchSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(term) ||
                          s.email.toLowerCase().includes(term) ||
                          (s.department && s.department.toLowerCase().includes(term));
      
      const matchDept = departmentFilter === 'All' || (s.department || 'N/A') === departmentFilter;
      const matchStatus = statusFilter === 'All' || s.account_status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
    
    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [students, searchTerm, departmentFilter, statusFilter]);

  const handleUpdateStatus = async (studentId, newStatus) => {
    try {
      const res = await api.put(`/admin/students/${studentId}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        // Update local state
        const updated = students.map(s => s.id === studentId ? { ...s, account_status: newStatus } : s);
        setStudents(updated);
        setActiveDropdown(null);
        toast.success(`Student status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating student status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleDropdown = (id) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="students" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Students</h1>
            <p>Manage student accounts</p>
          </div>
          
          <div className="admin-controls">
            <div className="admin-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <select 
              className="admin-filter-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              {predefinedDepartments.map(dept => (
                <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
              ))}
            </select>
            
            <select 
              className="admin-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="admin-table-container">
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center'}}>Loading students...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>STUDENT NAME</th>
                  <th>CAMPUS EMAIL</th>
                  <th>DEPARTMENT</th>
                  <th>GRAD. YEAR</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length > 0 ? paginatedStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="student-profile-cell">
                        <div className="student-avatar-mini" style={{backgroundColor: '#E0E7FF', color: '#4F46E5'}}>
                          {student.profile_image ? (
                            <img src={window.getImageUrl(student.profile_image)} alt="" />
                          ) : (
                            student.first_name.charAt(0)
                          )}
                        </div>
                        <span className="student-name-text">{student.first_name} {student.last_name}</span>
                      </div>
                    </td>
                    <td>{student.email}</td>
                    <td>{student.department || 'N/A'}</td>
                    <td>{student.graduation_year || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${student.account_status === 'Suspended' ? 'suspended' : 'active'}`}>
                        {student.account_status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-dropdown-wrapper">
                        <button className="options-btn" onClick={() => toggleDropdown(student.id)}>
                          Options
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        
                        {activeDropdown === student.id && (
                          <div className="admin-dropdown-menu">
                            <button onClick={() => navigate(`/admin/students/${student.id}`)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              View
                            </button>
                            <button onClick={() => handleUpdateStatus(student.id, 'Warned')}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                              Warn
                            </button>
                            <button 
                              className={student.account_status === 'Suspended' ? 'text-green' : 'text-danger'}
                              onClick={() => handleUpdateStatus(student.id, student.account_status === 'Suspended' ? 'Active' : 'Suspended')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                              {student.account_status === 'Suspended' ? 'Activate' : 'Suspend'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>No students found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {!loading && filteredStudents.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <Pagination 
              currentPage={currentPage}
              totalItems={filteredStudents.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStudents;
