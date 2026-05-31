import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css'; 
import './SkillDetails.css';
import Header from '../Common/Header';
import { useConfirmation } from '../../context/ConfirmationContext';
import { useToast } from '../../context/ToastContext';

const PREDEFINED_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '01:00 PM - 03:00 PM',
  '03:00 PM - 05:00 PM',
  '05:00 PM - 07:00 PM',
];

// Format a Date object to YYYY-MM-DD
function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const SkillDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { confirm } = useConfirmation();
  const toast = useToast();
  
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // ── Booking modal state ──────────────────────────────────────────────────
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Structured booking details
  const [learningGoal, setLearningGoal] = useState('');
  const [preferredSchedule, setPreferredSchedule] = useState('');
  const [userSkillLevel, setUserSkillLevel] = useState('Beginner');

  const todayStr = toYMD(new Date());

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const response = await api.get(`/skills/${id}`);
        if (response.data.success) {
          setSkill(response.data.skill);
        }
      } catch (error) {
        console.error("Error fetching skill details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSkill();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await api.get(`/reviews/skill/${id}`);
        if (response.data.success) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  // Fetch booked (Accepted) slots whenever the date changes
  useEffect(() => {
    if (!bookingDate || !showBookingModal) return;
    const fetchBookedSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');
      try {
        const res = await api.get(`/orders/skill/${id}/booked-slots?date=${bookingDate}`);
        if (res.data.success) {
          setBookedSlots(res.data.bookedSlots);
        }
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchBookedSlots();
  }, [bookingDate, showBookingModal, id]);

  const openBookingModal = () => {
    setBookingDate('');
    setSelectedSlot('');
    setBookedSlots([]);
    setLearningGoal('');
    setPreferredSchedule('');
    setUserSkillLevel('Beginner');
    setBookingError('');
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingError('');
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate) {
      setBookingError('Please select a date.');
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please select a time slot.');
      return;
    }
    if (!learningGoal.trim()) {
      setBookingError('Please share your learning goal.');
      return;
    }

    setBookingError('');

    await confirm({
      title: 'Confirm Booking Request',
      message: 'Do you want to send a booking request for this session? The slot will be reserved once the provider accepts.',
      type: 'info',
      confirmText: 'Confirm Booking',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const res = await api.post('/orders', {
          buyerId: user.id || 5,
          sellerId: skill.user_id,
          itemType: 'skill',
          itemId: skill.id,
          bookingDate: bookingDate,
          bookingSlot: selectedSlot,
          learningGoal: learningGoal,
          preferredSchedule: preferredSchedule,
          userSkillLevel: userSkillLevel,
        });
        if (res.data.success) {
          setShowBookingModal(false);
          toast.success('Session request sent successfully!');
          navigate('/orders', { state: { user } });
        } else {
          throw new Error(res.data.message || 'Failed to send session request.');
        }
      }
    });
  };

  if (loading) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading skill details...</div>;
  }

  if (!skill) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Skill not found.</div>;
  }

  // Calculate review aggregation details
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + parseFloat(r.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  const commReviews = reviews.filter(r => r.communication_rating !== null);
  const avgComm = commReviews.length > 0
    ? (commReviews.reduce((sum, r) => sum + parseFloat(r.communication_rating), 0) / commReviews.length).toFixed(1)
    : '0.0';

  const teachReviews = reviews.filter(r => r.teaching_rating !== null);
  const avgTeach = teachReviews.length > 0
    ? (teachReviews.reduce((sum, r) => sum + parseFloat(r.teaching_rating), 0) / teachReviews.length).toFixed(1)
    : '0.0';

  const outcomeReviews = reviews.filter(r => r.outcome_rating !== null);
  const avgOutcome = outcomeReviews.length > 0
    ? (outcomeReviews.reduce((sum, r) => sum + parseFloat(r.outcome_rating), 0) / outcomeReviews.length).toFixed(1)
    : '0.0';

  const starPercentages = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => Math.round(parseFloat(r.rating || 0)) === star).length;
    return {
      star,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
    };
  });

  const mainImageUrl = skill.image_urls && skill.image_urls.length > 0 
    ? window.getImageUrl(skill.image_urls[0]) 
    : 'https://placehold.co/1200x500/e6e3df/a39589?text=Skill';

  // Badges calculation
  const isVerifiedAccount = skill.account_status === 'Verified';
  const completedCount = skill.completedSessions || 0;
  const showTopMentorBadge = completedCount >= 5;
  const showCompletionHeroBadge = (skill.completionRate || 100) >= 90 && completedCount >= 2;
  const showSuperResponderBadge = (skill.responseRate || 100) >= 90;

  // Portfolio Links object
  let portfolioObj = { github: '', linkedin: '', portfolio: '', certificates: '' };
  if (skill.portfolio_links) {
    portfolioObj = typeof skill.portfolio_links === 'string'
      ? JSON.parse(skill.portfolio_links)
      : skill.portfolio_links;
  }

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Container */}
      <main className="dashboard-main skill-details-main">
        {/* Header */}
        <Header user={user} />

        {/* Scrollable Content */}
        <div className="skill-details-scroll">
          <div className="sk-viewer-wrapper">
            
            <div className="back-nav-sk" onClick={() => navigate('/skills', { state: { user } })} title="Go Back">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </div>

             { (skill.status === 'Suspended' || skill.account_status === 'Suspended') && (
               <div className="suspension-warning-banner">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                 <span>This tutoring skill listing or the mentor's profile is currently suspended by administrators. Session requests are temporarily disabled.</span>
               </div>
             )}

            {/* Banner Section */}
            <div className="sk-hero-banner">
              <img src={mainImageUrl} alt={skill.title} className="sk-hero-img" />
              <div className="sk-hero-overlay">
                <span className="sk-hero-tag" style={{textTransform: 'uppercase'}}>{skill.category}</span>
                <h1 className="sk-hero-title">{skill.title}</h1>
                <div className="sk-hero-meta">
                  <span><span className="sk-rate-star">★</span> ({totalReviews} Reviews)</span>
                  <span>•</span>
                  <span>
                    <svg style={{display:'inline', marginRight:'4px', verticalAlign:'sub'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg> 
                    {skill.skill_type || 'Online'} Sessions
                  </span>
                  <span>•</span>
                  <span className={`sk-avail-badge ${skill.status === 'Active' ? 'active-badge' : 'completed-badge'}`} style={{padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: skill.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: skill.status === 'Active' ? '#10B981' : '#EF4444'}}>
                    {skill.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            <div className="sk-content-grid">
              {/* Left Column */}
              <div className="sk-content-left">
                
                {/* About block */}
                <div className="sk-section-block">
                  <h3>About this skill</h3>
                  <p className="sk-about-text">
                    {skill.description}
                  </p>
                </div>

                {/* Experience & Setup Details */}
                <div className="sk-section-block">
                  <h3>Mentor Information</h3>
                  <div className="mentor-info-grid-box">
                    <div className="mentor-info-item">
                      <span className="mib-label">Experience Level</span>
                      <span className="mib-val">{skill.experience_level || 'Beginner'}</span>
                    </div>
                    <div className="mentor-info-item">
                      <span className="mib-label">Languages Known</span>
                      <span className="mib-val">{skill.languages_known || 'English'}</span>
                    </div>
                    <div className="mentor-info-item">
                      <span className="mib-label">Session Setup</span>
                      <span className="mib-val">{(skill.session_types && (typeof skill.session_types === 'string' ? skill.session_types : skill.session_types.join(', '))) || '1:1 Session'}</span>
                    </div>
                  </div>
                  {skill.prev_experience && (
                    <div className="prev-experience-block">
                      <span className="mib-label" style={{marginTop: '1rem', display: 'block'}}>Previous Session Experience</span>
                      <p className="sk-about-text" style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>{skill.prev_experience}</p>
                    </div>
                  )}
                </div>

                {/* Topics Covered & Outcomes */}
                <div className="sk-section-block">
                  <div className="topics-outcomes-flex">
                    <div className="topics-box-item">
                      <h3>Topics Covered</h3>
                      {skill.topics_covered ? (
                        <ul className="topics-outcomes-list">
                          {skill.topics_covered.split('\n').filter(t => t.trim()).map((t, idx) => (
                            <li key={idx}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2.5" style={{marginRight: '8px', flexShrink: 0}}><polyline points="20 6 9 17 4 12"></polyline></svg>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="sk-about-text" style={{fontStyle: 'italic', fontSize: '0.9rem'}}>Refer description for topics.</p>
                      )}
                    </div>
                    
                    <div className="outcomes-box-item">
                      <h3>Learning Outcomes</h3>
                      {skill.learning_outcomes ? (
                        <ul className="topics-outcomes-list">
                          {skill.learning_outcomes.split('\n').filter(o => o.trim()).map((o, idx) => (
                            <li key={idx}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" style={{marginRight: '8px', flexShrink: 0}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="sk-about-text" style={{fontStyle: 'italic', fontSize: '0.9rem'}}>Practical, hands-on learning guidance.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Day availability */}
                <div className="sk-section-block">
                  <h3>Availability schedule</h3>
                  <div className="sk-availability-pills">
                    {skill.day_availability ? (
                      (typeof skill.day_availability === 'string' ? skill.day_availability.split(', ') : skill.day_availability).map((day, index) => (
                        <span key={index} className="sk-avail-day-pill">
                          <svg className="sk-avail-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {day}
                        </span>
                      ))
                    ) : (
                      <span className="sk-avail-day-pill">Flexible Days</span>
                    )}
                  </div>
                  <div className="sk-availability-pills" style={{ marginTop: '12px' }}>
                    {skill.available_time_slot ? (
                      skill.available_time_slot.split(', ').map((slot, index) => (
                        <span key={index} className="sk-avail-pill">
                          <svg className="sk-avail-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {slot}
                        </span>
                      ))
                    ) : (
                      <span className="sk-avail-pill">Flexible Time Slots</span>
                    )}
                  </div>
                </div>

                {/* Portfolio & Social Verification links */}
                {(portfolioObj.github || portfolioObj.linkedin || portfolioObj.portfolio || portfolioObj.certificates) && (
                  <div className="sk-section-block">
                    <h3>Mentor Portfolio & Verification</h3>
                    <div className="portfolio-link-showcase">
                      {portfolioObj.github && (
                        <a href={portfolioObj.github} target="_blank" rel="noopener noreferrer" className="portfolio-link-badge">
                          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
                          <span>GitHub Profile</span>
                        </a>
                      )}
                      {portfolioObj.linkedin && (
                        <a href={portfolioObj.linkedin} target="_blank" rel="noopener noreferrer" className="portfolio-link-badge">
                          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {portfolioObj.portfolio && (
                        <a href={portfolioObj.portfolio} target="_blank" rel="noopener noreferrer" className="portfolio-link-badge">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                          <span>Portfolio Website</span>
                        </a>
                      )}
                      {portfolioObj.certificates && (
                        <a href={portfolioObj.certificates} target="_blank" rel="noopener noreferrer" className="portfolio-link-badge">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                          <span>Verification Proof / Cert</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Media Showcase (Demo gallery) */}
                {skill.demo_media && skill.demo_media.length > 0 && (
                  <div className="sk-section-block">
                    <h3>Media & Demos Showcase</h3>
                    <div className="demo-showcase-gallery">
                      {skill.demo_media.map((mediaPath, index) => {
                        const fileUrl = window.getImageUrl(mediaPath);
                        const isVideo = mediaPath.toLowerCase().endsWith('.mp4') || 
                                        mediaPath.toLowerCase().endsWith('.mov') ||
                                        mediaPath.toLowerCase().endsWith('.webm');
                        const isPdf = mediaPath.toLowerCase().endsWith('.pdf');
                        const pathParts = mediaPath.split('-');
                        const cleanName = pathParts.length > 3 
                          ? pathParts.slice(3).join('-') 
                          : (pathParts.slice(2).join('-') || 'Document.pdf');
                        return (
                          <div key={index} className="demo-gallery-card">
                            {isVideo ? (
                              <video src={fileUrl} className="demo-video-player" controls preload="metadata" />
                            ) : isPdf ? (
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="demo-pdf-link">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <line x1="16" y1="13" x2="8" y2="13"></line>
                                  <line x1="16" y1="17" x2="8" y2="17"></line>
                                </svg>
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#DC2626', letterSpacing: '0.05em', marginTop: '4px' }}>OPEN PDF FILE</span>
                                <span style={{ fontSize: '0.65rem', color: '#7F1D1D', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }} title={cleanName}>
                                  {cleanName}
                                </span>
                              </a>
                            ) : (
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                <img src={fileUrl} alt={`Demo ${index + 1}`} className="demo-image-item" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Advanced Verified Reviews */}
                <div className="sk-section-block">
                  <h3>Verified Student Reviews</h3>
                  
                  <div className="reviews-analysis-box">
                    <div className="raa-left">
                      <span className="raa-num">{avgRating}</span>
                      <span className="raa-stars">
                        {'★'.repeat(Math.round(parseFloat(avgRating)))}
                        {'☆'.repeat(5 - Math.round(parseFloat(avgRating)))}
                      </span>
                      <span className="raa-desc">{totalReviews} verified reviews</span>
                    </div>

                    <div className="raa-right">
                      {starPercentages.map(r => (
                        <div key={r.star} className="raa-row">
                          <span className="raa-rlab">{r.star} ★</span>
                          <div className="raa-track">
                            <div className="raa-fill" style={{width: `${r.percentage}%`}}></div>
                          </div>
                          <span className="raa-rpct">{r.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {totalReviews > 0 && (
                    <div className="graded-rating-bars-box">
                      <h4 className="graded-metrics-title">Outcome-Based Graded Metrics</h4>
                      <div className="graded-metrics-grid">
                        <div className="graded-metric-card">
                          <div className="gm-label-row">
                            <span className="gm-label">Teaching Quality</span>
                            <span className="gm-value">{avgTeach} / 5.0</span>
                          </div>
                          <div className="gm-track">
                            <div className="gm-fill teach-fill" style={{width: `${(parseFloat(avgTeach) / 5) * 100}%`}}></div>
                          </div>
                        </div>

                        <div className="graded-metric-card">
                          <div className="gm-label-row">
                            <span className="gm-label">Communication</span>
                            <span className="gm-value">{avgComm} / 5.0</span>
                          </div>
                          <div className="gm-track">
                            <div className="gm-fill comm-fill" style={{width: `${(parseFloat(avgComm) / 5) * 100}%`}}></div>
                          </div>
                        </div>

                        <div className="graded-metric-card">
                          <div className="gm-label-row">
                            <span className="gm-label">Learning Outcomes</span>
                            <span className="gm-value">{avgOutcome} / 5.0</span>
                          </div>
                          <div className="gm-track">
                            <div className="gm-fill outcome-fill" style={{width: `${(parseFloat(avgOutcome) / 5) * 100}%`}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {reviewsLoading ? (
                    <p style={{fontSize: '0.9rem', color: '#666'}}>Loading verified student feedback...</p>
                  ) : reviews.length === 0 ? (
                    <div className="empty-reviews-state">
                      <p>No verified reviews for this tutor yet. Be the first to book a session and leave graded feedback!</p>
                    </div>
                  ) : (
                    <div className="reviews-cards-list">
                      {reviews.map((r, i) => (
                        <div key={r.id || i} className="review-card">
                          <div className="rev-head">
                            <div className="rev-user-grp">
                              <img 
                                src={r.profile_image ? window.getImageUrl(r.profile_image) : `https://placehold.co/40x40/555/fff?text=${r.first_name?.[0] || 'S'}`} 
                                alt={r.first_name} 
                                style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} 
                              />
                              <div className="rev-name-stack">
                                <span className="rn-name">{r.first_name} {r.last_name}</span>
                                <span className="rn-sub">
                                  <span style={{color: '#FBBF24'}}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span> 
                                  <span style={{marginLeft: '8px'}}>{new Date(r.created_at).toLocaleDateString()}</span>
                                </span>
                              </div>
                            </div>
                            <div className="rev-verified-block">
                              <span className="rv-pill">
                                <span className="green-dot"></span> 
                                Verified Session
                              </span>
                              <span className="rv-desc">Completed peer exchange</span>
                            </div>
                          </div>
                          
                          <p className="rev-msg">{r.review_text}</p>

                          {/* Individual review breakdown */}
                          {(r.communication_rating || r.teaching_rating || r.outcome_rating) && (
                            <div className="rev-individual-breakdown">
                              {r.teaching_rating && (
                                <span className="rib-tag">Teaching: <b>{r.teaching_rating}★</b></span>
                              )}
                              {r.communication_rating && (
                                <span className="rib-tag">Comm: <b>{r.communication_rating}★</b></span>
                              )}
                              {r.outcome_rating && (
                                <span className="rib-tag">Outcomes: <b>{r.outcome_rating}★</b></span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {/* Right Column */}
              <div className="sk-content-right">
                
                {/* Tutor info & badges card */}
                <div className="sk-seller-card">
                  <img src={skill.profile_image ? window.getImageUrl(skill.profile_image) : `https://placehold.co/80x80/222/fff?text=${skill.first_name?.[0] || 'U'}${skill.last_name?.[0] || ''}`} alt={skill.first_name} className="sk-seller-avatar" style={{objectFit: 'cover'}} />
                  
                  <div className="mentor-title-verification">
                    <h4 className="sk-seller-name">{skill.first_name} {skill.last_name}</h4>
                    {isVerifiedAccount && (
                      <span className="mentor-verified-checkmark" title="Campus Verified Peer Learner">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#A855F7" stroke="#FFFFFF" strokeWidth="2.5" style={{display:'inline', verticalAlign:'middle'}}><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </span>
                    )}
                  </div>
                  
                  <p className="sk-seller-role">
                    {skill.department ? `${skill.department}` : 'Peer Mentor'}
                    {skill.graduation_year ? ` (Class of ${skill.graduation_year})` : ''}
                  </p>

                  {/* Badges container */}
                  <div className="mentor-trust-badges-row">
                    {isVerifiedAccount && (
                      <span className="mentor-trust-badge verified-peer-badge" title="Verified campus user">Verified Peer</span>
                    )}
                    {showTopMentorBadge && (
                      <span className="mentor-trust-badge top-mentor-badge" title="Completed 5+ sessions">Top Mentor</span>
                    )}
                    {showCompletionHeroBadge && (
                      <span className="mentor-trust-badge completion-hero-badge" title="Has 90%+ completion rate">Completion Hero</span>
                    )}
                    {showSuperResponderBadge && (
                      <span className="mentor-trust-badge responder-badge" title="Response rate is 90%+">Super Responder</span>
                    )}
                  </div>

                  <div className="mentor-stats-grid">
                    <div className="mentor-stat-card">
                      <span className="msc-val">{completedCount}</span>
                      <span className="msc-label">Completed</span>
                    </div>
                    <div className="mentor-stat-card" title="Percentage of booking requests answered">
                      <span className="msc-val">{skill.responseRate || 100}%</span>
                      <span className="msc-label">Response Rate</span>
                    </div>
                    <div className="mentor-stat-card" title="Percentage of accepted bookings completed">
                      <span className="msc-val">{skill.completionRate || 100}%</span>
                      <span className="msc-label">Completion</span>
                    </div>
                    <div className="mentor-stat-card">
                      <span className="msc-val" style={{fontSize: '0.75rem'}}>{skill.responseTime || 'Within 2h'}</span>
                      <span className="msc-label">Avg Response</span>
                    </div>
                  </div>
                  
                  <button 
                    className="sk-btn-primary" 
                    onClick={openBookingModal}
                    disabled={skill.available_quantity === 0 || skill.status !== 'Active' || skill.account_status === 'Suspended'}
                    style={{
                      opacity: (skill.available_quantity === 0 || skill.status !== 'Active' || skill.account_status === 'Suspended') ? 0.5 : 1,
                      cursor: (skill.available_quantity === 0 || skill.status !== 'Active' || skill.account_status === 'Suspended') ? 'not-allowed' : 'pointer',
                      marginTop: '1.5rem'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Request Session
                  </button>
                  
                  <ul className="sk-bullets">
                    <li>Structured requests are sent directly to the tutor.</li>
                    <li>Communication is managed in private session-based chats.</li>
                  </ul>
                </div>

                <div className="sk-terms-card">
                  <div className="sk-terms-header">
                    <svg className="sk-terms-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    Exchange Terms
                  </div>
                  <p className="sk-terms-text">
                    {skill.charge_type === 'Free' 
                      ? 'Free for peers willing to trade skills.' 
                      : `Standard rate of ₹${skill.hourly_rate || '0.00'}/hr applies.`}
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ── Booking Modal (Expanded & Structured) ─────────────────────────────────── */}
      {showBookingModal && (
        <div className="sk-modal-overlay" onClick={closeBookingModal}>
          <div className="sk-modal-card" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="sk-modal-header">
              <div className="sk-modal-header-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <h3 className="sk-modal-title">Request a Skill Session</h3>
              </div>
              <button className="sk-modal-close" onClick={closeBookingModal} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            {/* Selected Skill Summary */}
            <div className="sk-modal-plan-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
              <span>{skill.title}</span>
              <span className="sk-modal-plan-price">
                {skill.charge_type === 'Free' ? 'Free' : `₹${skill.hourly_rate || '0'}/hr`}
              </span>
            </div>

            <div className="sk-modal-scrollable-form" style={{maxHeight: '400px', overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
              {/* Date Picker */}
              <div className="sk-modal-field">
                <label className="sk-modal-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Select Date
                </label>
                <input
                  id="booking-date-input"
                  type="date"
                  className="sk-modal-date-input"
                  value={bookingDate}
                  min={todayStr}
                  onChange={e => {
                    setBookingDate(e.target.value);
                    setSelectedSlot('');
                    setBookingError('');
                  }}
                />
              </div>

              {/* Time Slots */}
              <div className="sk-modal-field">
                <label className="sk-modal-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Select Time Slot
                </label>

                {!bookingDate ? (
                  <p className="sk-modal-slot-hint">Pick a date first to see available slots.</p>
                ) : loadingSlots ? (
                  <p className="sk-modal-slot-hint">Loading available slots…</p>
                ) : (
                  <div className="sk-slot-grid">
                    {(skill?.available_time_slot ? skill.available_time_slot.split(', ') : PREDEFINED_SLOTS).map(slot => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          className={`sk-slot-btn ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                          disabled={isBooked}
                          onClick={() => {
                            if (!isBooked) {
                              setSelectedSlot(slot);
                              setBookingError('');
                            }
                          }}
                          title={isBooked ? 'Already booked' : slot}
                        >
                          {isBooked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '4px', flexShrink: 0}}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                          )}
                          {isSelected && !isBooked && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '4px', flexShrink: 0}}><polyline points="20 6 9 17 4 12"></polyline></svg>
                          )}
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Requester's Skill Level */}
              <div className="sk-modal-field">
                <label className="sk-modal-label">Your Current Skill Level</label>
                <div className="user-skill-level-selector" style={{display: 'flex', gap: '8px'}}>
                  {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      className={`lvl-select-btn ${userSkillLevel === lvl ? 'active' : ''}`}
                      onClick={() => setUserSkillLevel(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Goal */}
              <div className="sk-modal-field">
                <label className="sk-modal-label">What is your learning goal for this session? *</label>
                <textarea
                  className="sk-modal-textarea-input"
                  placeholder="E.g., I want to review my React state setup, clarify useEffect cleanup, and resolve a memory leak in my project."
                  value={learningGoal}
                  onChange={e => setLearningGoal(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {/* Preferred Schedule / Notes */}
              <div className="sk-modal-field">
                <label className="sk-modal-label">Schedule Preference Notes (Optional)</label>
                <input
                  type="text"
                  className="sk-modal-text-input-field"
                  placeholder="E.g., Prefer weekend afternoons if slot shifts are possible."
                  value={preferredSchedule}
                  onChange={e => setPreferredSchedule(e.target.value)}
                />
              </div>
            </div>

            {/* Error */}
            {bookingError && (
              <div className="sk-modal-error">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {bookingError}
              </div>
            )}

            {/* Actions */}
            <div className="sk-modal-actions">
              <button className="sk-modal-btn-cancel" onClick={closeBookingModal} disabled={bookingSubmitting}>
                Cancel
              </button>
              <button
                className="sk-modal-btn-confirm"
                onClick={handleConfirmBooking}
                disabled={bookingSubmitting || !bookingDate || !selectedSlot || !learningGoal.trim()}
              >
                {bookingSubmitting ? (
                  <>
                    <span className="sk-modal-spinner"></span>
                    Booking…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Confirm Request
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SkillDetails;
