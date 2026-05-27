import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import studentsCollaborating from '../../assets/students_collaborating.png';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr && token !== 'undefined') {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/index', { replace: true });
        }
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);
  return (
    <div className="home-container">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="nav-logo">
          <div className="logo-avatar">T</div>
          <span className="logo-text">TalentNest.</span>
        </div>
        <div className="nav-actions">
          <a href="#features" className="nav-link">Features</a>
          <a href="#testimonials" className="nav-link">Testimonials</a>
          <Link to="/login" className="nav-link">Log in</Link>
          <Link to="/signup" className="nav-btn">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pill">
          <span className="pill-dot"></span> CAMPUS ECOSYSTEM PROTOTYPE
        </div>
        <h1 className="hero-title">
          Discover Talent.<br />
          <span className="highlight-text">Exchange Skills.</span><br />
          Grow Together.
        </h1>
        <p className="hero-subtitle">
          The exclusive platform for students to buy, sell, and trade<br />
          skills, services, and products within your campus community.
        </p>
        <div className="hero-buttons">
          <Link to="/signup" className="btn-primary">
            Join the Nest <span>→</span>
          </Link>
          <Link to="/login" className="btn-secondary">
            Sign In
          </Link>
        </div>
      </section>

      {/* Image Section */}
      <section className="image-section">
        <div className="hero-image-wrapper">
          <img 
            src={studentsCollaborating} 
            alt="Students collaborating" 
            className="hero-img" 
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-header">
          <h2 className="features-title">Everything you need<br />in one campus app.</h2>
          <p className="features-subtitle">
            From dorm room essentials to academic tutoring, find what you<br />
            need from people you trust.
          </p>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.156 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.596 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
              </svg>
            </div>
            <h3 className="feature-card-title">Marketplace</h3>
            <p className="feature-card-desc">Buy and sell textbooks, electronics, and dorm essentials safely.</p>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917l-7.5-3.5Z"/>
                <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.5a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.5a.5.5 0 0 0-.656-.327L8 10.466 4.176 9.032Z"/>
              </svg>
            </div>
            <h3 className="feature-card-title">Skills Exchange</h3>
            <p className="feature-card-desc">Trade your coding skills for language lessons. Learn from peers.</p>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v2H6V3a2 2 0 0 1 2-2zm3 4V3a3 3 0 1 0-6 0v2H1.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5H11zm-8 1h10v7H3V6z"/>
              </svg>
            </div>
            <h3 className="feature-card-title">Student Services</h3>
            <p className="feature-card-desc">Hire talented designers, photographers, or tutors on campus.</p>
          </div>

          {/* Card 4 */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
              </svg>
            </div>
            <h3 className="feature-card-title">Community Chat</h3>
            <p className="feature-card-desc">Connect instantly with buyers, sellers, and collaborators.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-left">
          <div className="logo-avatar small-avatar">T</div>
          <span className="footer-copyright">TalentNest © 2026</span>
        </div>
        <div className="footer-right">
          <Link to="#">Privacy</Link>
          <Link to="#">Terms</Link>
          <Link to="#">Guidelines</Link>
        </div>
      </footer>
    </div>
  );
};

export default Home;
