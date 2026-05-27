import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';

const Sidebar = ({ user, handlePrefix }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const notifications = useNotifications();
  const unreadNotificationCount = notifications ? notifications.unreadNotificationCount : undefined;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const nextVal = !prev;
      localStorage.setItem('sidebar-collapsed', String(nextVal));
      window.dispatchEvent(new Event('resize'));
      return nextVal;
    });
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <>
      {!isCollapsed && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleCollapse} 
          aria-hidden="true"
        />
      )}
      <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div 
            className="sidebar-logo-group" 
            onClick={() => navigate('/index', { state: { user } })} 
            style={{ cursor: 'pointer' }}
            tabIndex="0"
            onKeyDown={(e) => handleKeyDown(e, () => navigate('/index', { state: { user } }))}
            aria-label="TalentNest Home"
          >
            <div className="sidebar-logo-icon">T</div>
            <span className="sidebar-logo-text">TalentNest.</span>
          </div>
          <button 
            className="sidebar-collapse-btn" 
            onClick={toggleCollapse} 
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <div className="hamburger-menu">
              <span className="bar line-1"></span>
              <span className="bar line-2"></span>
              <span className="bar line-3"></span>
            </div>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li 
              className={`nav-item ${location.pathname === '/marketplace' ? 'active' : ''}`} 
              onClick={() => navigate('/marketplace', { state: { user } })}
              tabIndex="0"
              onKeyDown={(e) => handleKeyDown(e, () => navigate('/marketplace', { state: { user } }))}
              data-tooltip={isCollapsed ? "Marketplace" : undefined}
              aria-label="Marketplace"
            >
              <div className="nav-item-icon-wrapper">
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              </div>
              <span className="nav-item-text">Marketplace</span>
            </li>
            <li 
              className={`nav-item ${location.pathname === '/skills' ? 'active' : ''}`} 
              onClick={() => navigate('/skills', { state: { user } })}
              tabIndex="0"
              onKeyDown={(e) => handleKeyDown(e, () => navigate('/skills', { state: { user } }))}
              data-tooltip={isCollapsed ? "Skills" : undefined}
              aria-label="Skills"
            >
              <div className="nav-item-icon-wrapper">
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              </div>
              <span className="nav-item-text">Skills</span>
            </li>
            <li 
              className={`nav-item ${location.pathname === '/services' ? 'active' : ''}`} 
              onClick={() => navigate('/services', { state: { user } })}
              tabIndex="0"
              onKeyDown={(e) => handleKeyDown(e, () => navigate('/services', { state: { user } }))}
              data-tooltip={isCollapsed ? "Services" : undefined}
              aria-label="Services"
            >
              <div className="nav-item-icon-wrapper">
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              </div>
              <span className="nav-item-text">Services</span>
            </li>
            <li 
              className={`nav-item ${location.pathname === '/orders' ? 'active' : ''}`} 
              onClick={() => navigate('/orders', { state: { user } })}
              tabIndex="0"
              onKeyDown={(e) => handleKeyDown(e, () => navigate('/orders', { state: { user } }))}
              data-tooltip={isCollapsed ? "Orders" : undefined}
              aria-label="Orders"
            >
              <div className="nav-item-icon-wrapper">
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                {isCollapsed && unreadNotificationCount > 0 && <span className="sidebar-badge-dot" />}
              </div>
              <span className="nav-item-text">Orders</span>
              {!isCollapsed && unreadNotificationCount !== undefined && (
                unreadNotificationCount > 0 ? (
                  <span className="sidebar-badge">{unreadNotificationCount}</span>
                ) : null
              )}
              {!isCollapsed && unreadNotificationCount === undefined && (
                <span className="sidebar-badge loading" />
              )}
            </li>
            <li 
              className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`} 
              onClick={() => navigate('/profile', { state: { user } })}
              tabIndex="0"
              onKeyDown={(e) => handleKeyDown(e, () => navigate('/profile', { state: { user } }))}
              data-tooltip={isCollapsed ? "Profile" : undefined}
              aria-label="Profile"
            >
              <div className="nav-item-icon-wrapper">
                <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <span className="nav-item-text">Profile</span>
            </li>
          </ul>
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;
