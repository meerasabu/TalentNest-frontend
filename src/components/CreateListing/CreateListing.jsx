import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import '../Dashboard/Index.css'; 
import './CreateListing.css';
import Header from '../Common/Header';
import Sidebar from '../Common/Sidebar';

const CreateListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const initialTab = location.state?.initialTab || 'product';

  const [isEditMode, setIsEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : ''; 


  useEffect(() => {
    if (location.state?.editItem) {
      const item = location.state.editItem;
      const type = location.state.type; // 'product', 'skill', or 'service'
      
      setIsEditMode(true);
      setEditItemId(item.id);
      setActiveTab(type);
      
      setFormData({
        title: item.title || '',
        description: item.description || '',
        price: item.price || item.hourly_rate || '',
        condition: item.condition || 'New',
        category: item.category || '',
        chargeType: item.charge_type || 'Paid',
        skillType: item.skill_type || 'Online',
        availableTimeSlot: item.available_time_slot || '',
        serviceType: item.service_type || '',
        standardPlan: item.standard_plan || '',
        groupPlan: item.group_plan || '',
        quantity: item.quantity || 1,
        experienceLevel: item.experience_level || 'Beginner',
        prevExperience: item.prev_experience || '',
        sessionTypes: item.session_types ? item.session_types.split(', ') : [],
        learningOutcomes: item.learning_outcomes || '',
        topicsCovered: item.topics_covered || '',
        languagesKnown: item.languages_known || '',
        dayAvailability: item.day_availability ? item.day_availability.split(', ') : [],
        portfolioLinks: (() => {
          let parsed = { github: '', linkedin: '', portfolio: '', certificates: '' };
          if (item.portfolio_links) {
            try {
              parsed = typeof item.portfolio_links === 'string'
                ? JSON.parse(item.portfolio_links)
                : item.portfolio_links;
            } catch (err) {
              console.error('Error parsing portfolio links:', err);
            }
          }
          return {
            github: parsed.github || '',
            linkedin: parsed.linkedin || '',
            portfolio: parsed.portfolio || '',
            certificates: parsed.certificates || ''
          };
        })()
      });
      
      if (item.available_time_slot) {
        setTimeSlots(item.available_time_slot.split(', '));
      } else {
        setTimeSlots(['']);
      }
      
      if (item.image_urls) {
        setExistingImages(item.image_urls);
        setPreviews(item.image_urls.map(url => window.getImageUrl(url)));
      }

      if (item.demo_media) {
        setExistingDemoMedia(item.demo_media);
        setDemoPreviews(item.demo_media.map(url => window.getImageUrl(url)));
      }
    } else if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
    }
  }, [location.state]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'New',
    category: '', 
    chargeType: 'Paid',
    skillType: 'Online',
    availableTimeSlot: '',
    serviceType: '',
    standardPlan: '',
    groupPlan: '',
    quantity: 1,
    experienceLevel: 'Beginner',
    prevExperience: '',
    sessionTypes: [],
    learningOutcomes: '',
    topicsCovered: '',
    languagesKnown: '',
    dayAvailability: [],
    portfolioLinks: { github: '', linkedin: '', portfolio: '', certificates: '' }
  });

  const [timeSlots, setTimeSlots] = useState(['']);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [demoMedia, setDemoMedia] = useState([]);
  const [demoPreviews, setDemoPreviews] = useState([]);
  const [existingDemoMedia, setExistingDemoMedia] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(url => {
        if (url && !url.startsWith('data:') && !url.startsWith('http')) {
          try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        }
      });
      demoPreviews.forEach(url => {
        if (url && !url.startsWith('data:') && !url.startsWith('http')) {
          try { URL.revokeObjectURL(url); } catch (e) { /* ignore */ }
        }
      });
    };
  }, []);

  const handleTabChange = (tab) => {
    if (isEditMode) return; // Prevent changing tab in edit mode
    setActiveTab(tab);
    setCurrentStep(1);
    setMessage(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(prev => {
        const newImages = [...prev, ...selectedFiles].slice(0, 4 - existingImages.length);
        const newPreviews = [
          ...existingImages.map(url => window.getImageUrl(url)),
          ...newImages.map(file => URL.createObjectURL(file))
        ];
        setPreviews(newPreviews);
        return newImages;
      });
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    if (indexToRemove < existingImages.length) {
      // Removing an existing image
      const updatedExisting = existingImages.filter((_, idx) => idx !== indexToRemove);
      setExistingImages(updatedExisting);
      setPreviews([
        ...updatedExisting.map(url => window.getImageUrl(url)),
        ...images.map(file => URL.createObjectURL(file))
      ]);
    } else {
      // Removing a newly added image
      const relativeIdx = indexToRemove - existingImages.length;
      setImages(prev => {
        const newImages = prev.filter((_, idx) => idx !== relativeIdx);
        setPreviews([
          ...existingImages.map(url => window.getImageUrl(url)),
          ...newImages.map(file => URL.createObjectURL(file))
        ]);
        return newImages;
      });
    }
  };

  const handlePortfolioChange = (e) => {
    setFormData({
      ...formData,
      portfolioLinks: {
        ...formData.portfolioLinks,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleCheckboxChange = (name, value) => {
    const currentList = formData[name] || [];
    const updatedList = currentList.includes(value)
      ? currentList.filter(item => item !== value)
      : [...currentList, value];
    setFormData({ ...formData, [name]: updatedList });
  };

  const handleDemoMediaChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file => 
        /\.(jpe?g|png|gif|webp)$/i.test(file.name) || file.type.startsWith('image/')
      );
      if (selectedFiles.length < Array.from(e.target.files).length) {
        setMessage({ type: 'error', text: 'Only image files (JPEG, PNG, GIF, WebP) are allowed.' });
      }
      setDemoMedia(prev => {
        const newDemos = [...prev, ...selectedFiles].slice(0, 4 - existingDemoMedia.length);
        const newPreviews = [
          ...existingDemoMedia.map(url => window.getImageUrl(url)),
          ...newDemos.map(file => URL.createObjectURL(file))
        ];
        setDemoPreviews(newPreviews);
        return newDemos;
      });
    }
  };

  const handleRemoveDemoMedia = (indexToRemove) => {
    if (indexToRemove < existingDemoMedia.length) {
      const updatedExisting = existingDemoMedia.filter((_, idx) => idx !== indexToRemove);
      setExistingDemoMedia(updatedExisting);
      setDemoPreviews([
        ...updatedExisting.map(url => window.getImageUrl(url)),
        ...demoMedia.map(file => URL.createObjectURL(file))
      ]);
    } else {
      const relativeIdx = indexToRemove - existingDemoMedia.length;
      setDemoMedia(prev => {
        const newDemos = prev.filter((_, idx) => idx !== relativeIdx);
        setDemoPreviews([
          ...existingDemoMedia.map(url => window.getImageUrl(url)),
          ...newDemos.map(file => URL.createObjectURL(file))
        ]);
        return newDemos;
      });
    }
  };

  const totalSteps = activeTab === 'skill' ? 4 : 3;

  const getStepTitle = (step) => {
    if (activeTab === 'product' || activeTab === 'products') {
      if (step === 1) return 'Essential Details';
      if (step === 2) return 'Media & Description';
      return 'Review & Publish';
    }
    if (activeTab === 'skill' || activeTab === 'skills') {
      if (step === 1) return 'Essential Details';
      if (step === 2) return 'Mentorship Details';
      if (step === 3) return 'Availability & Media';
      return 'Review & Publish';
    }
    if (activeTab === 'service' || activeTab === 'services') {
      if (step === 1) return 'Essential Details';
      if (step === 2) return 'Media & Description';
      return 'Review & Publish';
    }
    return '';
  };

  const validateStep = (step) => {
    let stepErrors = [];
    if (activeTab === 'product' || activeTab === 'products') {
      if (step === 1) {
        if (!formData.title || !formData.title.trim()) stepErrors.push('Product Name is required');
        if (!formData.category) stepErrors.push('Category is required');
        if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
          stepErrors.push('Price must be a valid number greater than 0');
        }
        if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity, 10) < 1) {
          stepErrors.push('Quantity must be at least 1');
        }
      } else if (step === 2) {
        if (!formData.description || !formData.description.trim()) {
          stepErrors.push('Description is required');
        }
      }
    } else if (activeTab === 'skill' || activeTab === 'skills') {
      if (step === 1) {
        if (!formData.title || !formData.title.trim()) stepErrors.push('Skill Name is required');
        if (!formData.category) stepErrors.push('Category is required');
        if (formData.chargeType === 'Paid') {
          if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
            stepErrors.push('Hourly rate must be a valid number greater than 0');
          }
        }
      } else if (step === 2) {
        if (!formData.languagesKnown || !formData.languagesKnown.trim()) {
          stepErrors.push('Languages known are required');
        }
        if (!formData.prevExperience || !formData.prevExperience.trim()) {
          stepErrors.push('Previous teaching experience is required');
        }
        if (!formData.topicsCovered || !formData.topicsCovered.trim()) {
          stepErrors.push('Topics covered are required');
        }
        if (!formData.learningOutcomes || !formData.learningOutcomes.trim()) {
          stepErrors.push('Learning outcomes are required');
        }
      } else if (step === 3) {
        const filledSlots = timeSlots.filter(s => s && s.trim() !== '');
        if (filledSlots.length === 0) {
          stepErrors.push('At least one available time slot is required');
        }
      } else if (step === 4) {
        if (!formData.description || !formData.description.trim()) {
          stepErrors.push('Description is required');
        }
      }
    } else if (activeTab === 'service' || activeTab === 'services') {
      if (step === 1) {
        if (!formData.title || !formData.title.trim()) stepErrors.push('Service Name is required');
        if (!formData.serviceType) stepErrors.push('Service type is required');
        if (!formData.standardPlan || isNaN(formData.standardPlan) || parseFloat(formData.standardPlan) <= 0) {
          stepErrors.push('Standard plan price must be a valid number greater than 0');
        }
      } else if (step === 2) {
        if (!formData.description || !formData.description.trim()) {
          stepErrors.push('Description is required');
        }
      }
    }
    return stepErrors;
  };

  const handleNextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      setMessage({ type: 'error', text: `Please fix the following issues: ${stepErrors.join(', ')}` });
      const scrollContainer = document.querySelector('.create-listing-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    setMessage(null);
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setMessage(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Custom Client-Side Validation
    let errors = [];
    for (let s = 1; s <= totalSteps; s++) {
      errors = [...errors, ...validateStep(s)];
    }

    if (errors.length > 0) {
      setMessage({ type: 'error', text: `Please fix the following issues: ${errors.join(', ')}` });
      // Auto-scroll to the top of the container to show the error banner
      const scrollContainer = document.querySelector('.create-listing-scroll');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    setLoading(true);
    setMessage(null);

    // Format portfolio links to ensure they are valid URLs
    const formattedLinks = { ...formData.portfolioLinks };
    Object.keys(formattedLinks).forEach(key => {
      let val = formattedLinks[key];
      if (val && val.trim() !== '') {
        val = val.trim();
        if (!/^https?:\/\//i.test(val)) {
          formattedLinks[key] = `https://${val}`;
        }
      }
    });

    const data = new FormData();
    data.append('userId', user?.id || 1);
    data.append('title', formData.title);
    data.append('description', formData.description);
    
    if (isEditMode) {
      data.append('existingImages', JSON.stringify(existingImages));
    }

    images.forEach((img) => {
      data.append('images', img);
    });

    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const cleanUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
    let endpoint = `${cleanUrl}/api/`;
    let method = isEditMode ? 'put' : 'post';

    if (activeTab === 'product' || activeTab === 'products') {
      endpoint += isEditMode ? `products/${editItemId}` : 'products';
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('condition', formData.condition);
      data.append('quantity', formData.quantity);
    } else if (activeTab === 'skill' || activeTab === 'skills') {
      endpoint += isEditMode ? `skills/${editItemId}` : 'skills';
      data.append('category', formData.category);
      data.append('chargeType', formData.chargeType);
      data.append('availableTimeSlot', timeSlots.filter(s => s.trim() !== '').join(', '));
      data.append('hourlyRate', formData.chargeType === 'Paid' ? formData.price : 0);
      data.append('skillType', formData.skillType);

      data.append('experienceLevel', formData.experienceLevel);
      data.append('prevExperience', formData.prevExperience);
      data.append('sessionTypes', (formData.sessionTypes || []).join(', '));
      data.append('learningOutcomes', formData.learningOutcomes);
      data.append('topicsCovered', formData.topicsCovered);
      data.append('languagesKnown', formData.languagesKnown);
      data.append('dayAvailability', (formData.dayAvailability || []).join(', '));
      data.append('portfolioLinks', JSON.stringify(formattedLinks));

      if (isEditMode) {
        data.append('existingDemoMedia', JSON.stringify(existingDemoMedia));
      }
      demoMedia.forEach((file) => {
        data.append('demoMedia', file);
      });
    } else if (activeTab === 'service' || activeTab === 'services') {
      endpoint += isEditMode ? `services/${editItemId}` : 'services';
      data.append('serviceType', formData.serviceType);
      data.append('standardPlan', formData.standardPlan);
      data.append('groupPlan', formData.groupPlan);
    }

    try {
      const response = await api({
        method: method,
        url: endpoint,
        data: data,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: `Successfully ${isEditMode ? 'updated' : 'published'} your ${activeTab}!` });
      setTimeout(() => navigate(isEditMode ? '/profile' : '/index', { state: { user, activeTab: isEditMode ? `${activeTab}s` : undefined } }), 2000);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Failed to ${isEditMode ? 'update' : 'create'} listing. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  const renderReviewStep = () => {
    return (
      <div className="review-summary-card">
        <div className="review-section">
          <h3 className="review-section-header">Basic Details</h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Title</span>
              <span className="review-value">{formData.title || 'N/A'}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Category</span>
              <span className="review-value">{formData.category || 'N/A'}</span>
            </div>
            {(activeTab === 'product' || activeTab === 'products') && (
              <>
                <div className="review-item">
                  <span className="review-label">Price</span>
                  <span className="review-value">₹{formData.price || '0'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Quantity</span>
                  <span className="review-value">{formData.quantity || '1'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Condition</span>
                  <span className="review-value">{formData.condition || 'New'}</span>
                </div>
              </>
            )}
            {(activeTab === 'service' || activeTab === 'services') && (
              <>
                <div className="review-item">
                  <span className="review-label">Service Type</span>
                  <span className="review-value">{formData.serviceType || 'N/A'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Standard Plan Price</span>
                  <span className="review-value">₹{formData.standardPlan || '0'}</span>
                </div>
                {formData.groupPlan && (
                  <div className="review-item">
                    <span className="review-label">Group Plan Price</span>
                    <span className="review-value">₹{formData.groupPlan}</span>
                  </div>
                )}
              </>
            )}
            {(activeTab === 'skill' || activeTab === 'skills') && (
              <>
                <div className="review-item">
                  <span className="review-label">Charge Type</span>
                  <span className="review-value">{formData.chargeType || 'Paid'}</span>
                </div>
                {formData.chargeType === 'Paid' && (
                  <div className="review-item">
                    <span className="review-label">Hourly Rate</span>
                    <span className="review-value">₹{formData.price || '0'}</span>
                  </div>
                )}
                <div className="review-item">
                  <span className="review-label">Session Type</span>
                  <span className="review-value">{formData.skillType || 'Online'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {(activeTab === 'skill' || activeTab === 'skills') && (
          <>
            <div className="review-section">
              <h3 className="review-section-header">Mentorship Details</h3>
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Experience Level</span>
                  <span className="review-value">{formData.experienceLevel || 'Beginner'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Languages Known</span>
                  <span className="review-value">{formData.languagesKnown || 'N/A'}</span>
                </div>
                <div className="review-item" style={{ gridColumn: 'span 2' }}>
                  <span className="review-label">Previous Experience</span>
                  <span className="review-value" style={{ fontWeight: 'normal', whiteSpace: 'pre-wrap' }}>
                    {formData.prevExperience || 'None'}
                  </span>
                </div>
                <div className="review-item" style={{ gridColumn: 'span 2' }}>
                  <span className="review-label">Offerings / Session Focus</span>
                  <span className="review-value">
                    {formData.sessionTypes && formData.sessionTypes.length > 0
                      ? formData.sessionTypes.join(', ')
                      : 'None selected'}
                  </span>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h3 className="review-section-header">Syllabus Details</h3>
              <div className="review-grid">
                <div className="review-item" style={{ gridColumn: 'span 2' }}>
                  <span className="review-label">Topics Covered</span>
                  <span className="review-value" style={{ fontWeight: 'normal', whiteSpace: 'pre-wrap' }}>
                    {formData.topicsCovered || 'None'}
                  </span>
                </div>
                <div className="review-item" style={{ gridColumn: 'span 2' }}>
                  <span className="review-label">Learning Outcomes</span>
                  <span className="review-value" style={{ fontWeight: 'normal', whiteSpace: 'pre-wrap' }}>
                    {formData.learningOutcomes || 'None'}
                  </span>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h3 className="review-section-header">Availability</h3>
              <div className="review-grid">
                <div className="review-item" style={{ gridColumn: 'span 2' }}>
                  <span className="review-label">Available Days</span>
                  <span className="review-value">
                    {formData.dayAvailability && formData.dayAvailability.length > 0
                      ? formData.dayAvailability.join(', ')
                      : 'None selected'}
                  </span>
                </div>
                <div className="review-item" style={{ gridColumn: 'span 2' }}>
                  <span className="review-label">Time Slots</span>
                  <span className="review-value">
                    {timeSlots.filter(s => s && s.trim() !== '').join(', ') || 'None selected'}
                  </span>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h3 className="review-section-header">Verification & Portfolio</h3>
              <div className="review-grid">
                {formData.portfolioLinks.github && (
                  <div className="review-item">
                    <span className="review-label">GitHub URL</span>
                    <span className="review-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {formData.portfolioLinks.github}
                    </span>
                  </div>
                )}
                {formData.portfolioLinks.linkedin && (
                  <div className="review-item">
                    <span className="review-label">LinkedIn URL</span>
                    <span className="review-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {formData.portfolioLinks.linkedin}
                    </span>
                  </div>
                )}
                {formData.portfolioLinks.portfolio && (
                  <div className="review-item">
                    <span className="review-label">Portfolio URL</span>
                    <span className="review-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {formData.portfolioLinks.portfolio}
                    </span>
                  </div>
                )}
                {formData.portfolioLinks.certificates && (
                  <div className="review-item">
                    <span className="review-label">Proof / Certificate URL</span>
                    <span className="review-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {formData.portfolioLinks.certificates}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="review-section">
          <h3 className="review-section-header">Description</h3>
          <div className="review-value description-box">{formData.description || 'No description provided.'}</div>
        </div>

        <div className="review-section">
          <h3 className="review-section-header">Cover / Media Gallery</h3>
          {previews.length > 0 ? (
            <div className="review-image-previews">
              {previews.map((src, idx) => (
                <img key={idx} src={src} alt={`Cover Preview ${idx + 1}`} className="review-image-thumbnail" />
              ))}
            </div>
          ) : (
            <span className="review-value" style={{ fontWeight: 400, color: '#6B7280' }}>No photos uploaded.</span>
          )}
        </div>

        {(activeTab === 'skill' || activeTab === 'skills') && demoPreviews.length > 0 && (
          <div className="review-section">
            <h3 className="review-section-header">Demo Project Gallery</h3>
            <div className="review-image-previews">
              {demoPreviews.map((src, idx) => (
                <img key={idx} src={src} alt={`Demo Preview ${idx + 1}`} className="review-image-thumbnail" />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Layout matching IndexDashboard */}
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Layout Area */}
      <main className="dashboard-main create-listing-main">
        {/* Top Header */}
        <Header user={user} />

        {/* Page Content Map */}
        <div className="content-scrollable create-listing-scroll">
          <div className="create-listing-wrapper">
            <button 
              type="button" 
              className="back-btn-modern" 
              onClick={() => navigate(isEditMode ? '/profile' : '/index', { state: { user, activeTab: isEditMode ? `${activeTab}s` : undefined } })}
              title="Go Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back</span>
            </button>
            <h1 className="mockup-title">{isEditMode ? 'Edit Listing' : 'Create New Listing'}</h1>
            <p className="mockup-subtitle">{isEditMode ? 'Update your offering for the campus community.' : 'What are you offering to the campus community today?'}</p>
            
            {/* Pill Tab Switcher */}
            <div className="mockup-tab-switcher">
              <button 
                className={`mockup-tab ${activeTab === 'product' ? 'active' : ''}`} 
                onClick={() => handleTabChange('product')} type="button"
              >
                <div style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg> 
                   Product
                </div>
              </button>
              <button 
                className={`mockup-tab ${activeTab === 'skill' ? 'active' : ''}`} 
                onClick={() => handleTabChange('skill')} type="button"
              >
                 <div style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> 
                   Skill
                </div>
              </button>
              <button 
                className={`mockup-tab ${activeTab === 'service' ? 'active' : ''}`} 
                onClick={() => handleTabChange('service')} type="button"
              >
                <div style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> 
                   Service
                </div>
              </button>
            </div>

            {message && (
              <div className={`message-banner ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Inner Form Card */}
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate className="mockup-form-card">
              <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
              
              {/* Wizard Progress Bar */}
              <div className="wizard-progress-bar">
                <div className="wizard-progress-track">
                  <div 
                    className="wizard-progress-fill" 
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                  />
                </div>
                <div className="wizard-steps-indicators">
                  {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNum) => (
                    <div 
                      key={stepNum} 
                      className={`wizard-step-node ${stepNum === currentStep ? 'active' : ''} ${stepNum < currentStep ? 'completed' : ''}`}
                      onClick={() => {
                        if (stepNum < currentStep) {
                          setCurrentStep(stepNum);
                          setMessage(null);
                        } else if (stepNum > currentStep) {
                          let canJump = true;
                          for (let s = currentStep; s < stepNum; s++) {
                            const errors = validateStep(s);
                            if (errors.length > 0) {
                              setMessage({ type: 'error', text: `Please fix issues on Step ${s} first.` });
                              canJump = false;
                              break;
                            }
                          }
                          if (canJump) {
                            setCurrentStep(stepNum);
                            setMessage(null);
                          }
                        }
                      }}
                    >
                      <span className="step-number">{stepNum}</span>
                      <span className="step-title-text">{getStepTitle(stepNum)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="step-section-heading">
                Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
              </h2>

              {/* ----------------- PRODUCT FORM ----------------- */}
              {(activeTab === 'product' || activeTab === 'products') && (
                <div className="wizard-step-content">
                  {currentStep === 1 && (
                    <>
                      <div className="form-group">
                        <label className="mockup-label">Product Name</label>
                        <input 
                          type="text" 
                          name="title"
                          className="mockup-input"
                          placeholder="e.g. Sony WH-1000XM4" 
                          value={formData.title} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      <div className="mockup-split-row">
                        <div className="form-group half">
                          <label className="mockup-label">Category</label>
                          <select name="category" className="mockup-input" value={formData.category} onChange={handleInputChange} required>
                            <option value="" disabled>Select Category</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Books & Notes">Books & Notes</option>
                            <option value="Hostel Essentials">Hostel Essentials</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Handmade">Handmade</option>
                            <option value="Stationery">Stationery</option>
                            <option value="Others">Others</option>
                          </select>
                        </div>
                        <div className="form-group half">
                          <label className="mockup-label">Price</label>
                          <div className="price-input-wrapper">
                            <span className="price-symbol">₹</span>
                            <input type="number" name="price" className="mockup-input price-input" placeholder="0.00" value={formData.price} onChange={handleInputChange} required inputMode="decimal" step="any" />
                          </div>
                        </div>
                      </div>
                      <div className="mockup-split-row">
                        <div className="form-group half">
                          <label className="mockup-label">Quantity</label>
                          <input type="number" name="quantity" className="mockup-input" min="1" value={formData.quantity} onChange={handleInputChange} required inputMode="numeric" />
                        </div>
                        <div className="form-group half">
                          <label className="mockup-label">Condition</label>
                          <select name="condition" className="mockup-input" value={formData.condition} onChange={handleInputChange} required>
                            <option value="New">New</option>
                            <option value="Like New">Like New</option>
                            <option value="Very Good">Very Good</option>
                            <option value="Good">Good</option>
                            <option value="Acceptable">Acceptable</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      {/* Photo Section */}
                      <div className="form-group">
                        <label className="mockup-label">Photos</label>
                        <div className="mockup-photo-area">
                          {previews.map((src, idx) => (
                            <div key={idx} className="photo-thumbnail relative-box">
                              <img src={src} alt={`Preview ${idx + 1}`} />
                              <button type="button" className="remove-img-btn" onClick={() => handleRemoveImage(idx)} title="Remove Image">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          ))}
                          {previews.length < 4 && (
                            <>
                              <div className="photo-drop-zone" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  id="imageUpload" 
                                  onChange={handleImageChange} 
                                  className="file-input" 
                                  multiple 
                                />
                                <label htmlFor="imageUpload" className="upload-trigger" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0}}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 15V8"/><path d="m9 11 3-3 3 3"/></svg>
                                  <span className="upload-text" style={{marginTop: '8px'}}>Upload</span>
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                        <p className="photo-helper-text">Add up to 4 high-quality photos. First image will be the cover.</p>
                      </div>

                      <div className="form-group">
                        <label className="mockup-label">Description</label>
                        <textarea 
                          name="description"
                          className="mockup-input textarea"
                          placeholder="Describe what you're offering in detail..." 
                          value={formData.description} 
                          onChange={handleInputChange} 
                          rows="4"
                          required 
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 3 && renderReviewStep()}
                </div>
              )}

              {/* ----------------- SERVICE FORM ----------------- */}
              {(activeTab === 'service' || activeTab === 'services') && (
                <div className="wizard-step-content">
                  {currentStep === 1 && (
                    <>
                      <div className="form-group">
                        <label className="mockup-label">Service Name</label>
                        <input 
                          type="text" 
                          name="title"
                          className="mockup-input"
                          placeholder="e.g. Laptop Repair" 
                          value={formData.title} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="mockup-label">Service Type</label>
                        <select name="serviceType" className="mockup-input" value={formData.serviceType} onChange={handleInputChange} required>
                          <option value="" disabled>Select Service Type</option>
                          <option value="Design">Design</option>
                          <option value="Cleaning">Cleaning</option>
                          <option value="Writing">Writing</option>
                          <option value="Errands">Errands</option>
                          <option value="Fitness">Fitness</option>
                          <option value="Tech Support">Tech Support</option>
                          <option value="Photography">Photography</option>
                          <option value="Tutoring">Tutoring</option>
                          <option value="Event Help">Event Help</option>
                        </select>
                      </div>
                      <div className="mockup-split-row">
                        <div className="form-group half">
                          <label className="mockup-label">Standard Plan (₹)</label>
                          <div className="price-input-wrapper">
                            <span className="price-symbol">₹</span>
                            <input type="number" name="standardPlan" className="mockup-input price-input" placeholder="0.00" value={formData.standardPlan} onChange={handleInputChange} required inputMode="decimal" step="any" />
                          </div>
                        </div>
                        <div className="form-group half">
                          <label className="mockup-label">Group Plan / hr (₹) (Optional)</label>
                          <div className="price-input-wrapper">
                            <span className="price-symbol">₹</span>
                            <input type="number" name="groupPlan" className="mockup-input price-input" placeholder="0.00" value={formData.groupPlan} onChange={handleInputChange} inputMode="decimal" step="any" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      {/* Photo Section */}
                      <div className="form-group">
                        <label className="mockup-label">Photos</label>
                        <div className="mockup-photo-area">
                          {previews.map((src, idx) => (
                            <div key={idx} className="photo-thumbnail relative-box">
                              <img src={src} alt={`Preview ${idx + 1}`} />
                              <button type="button" className="remove-img-btn" onClick={() => handleRemoveImage(idx)} title="Remove Image">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          ))}
                          {previews.length < 4 && (
                            <>
                              <div className="photo-drop-zone" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  id="imageUpload" 
                                  onChange={handleImageChange} 
                                  className="file-input" 
                                  multiple 
                                />
                                <label htmlFor="imageUpload" className="upload-trigger" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0}}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 15V8"/><path d="m9 11 3-3 3 3"/></svg>
                                  <span className="upload-text" style={{marginTop: '8px'}}>Upload</span>
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                        <p className="photo-helper-text">Add up to 4 high-quality photos. First image will be the cover.</p>
                      </div>

                      <div className="form-group">
                        <label className="mockup-label">Description</label>
                        <textarea 
                          name="description"
                          className="mockup-input textarea"
                          placeholder="Describe what you're offering in detail..." 
                          value={formData.description} 
                          onChange={handleInputChange} 
                          rows="4"
                          required 
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 3 && renderReviewStep()}
                </div>
              )}

              {/* ----------------- SKILL FORM ----------------- */}
              {(activeTab === 'skill' || activeTab === 'skills') && (
                <div className="wizard-step-content">
                  {currentStep === 1 && (
                    <>
                      <div className="form-group">
                        <label className="mockup-label">Skill Name</label>
                        <input 
                          type="text" 
                          name="title"
                          className="mockup-input"
                          placeholder="e.g. Advanced Python Tutoring" 
                          value={formData.title} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="mockup-label">Category</label>
                        <select name="category" className="mockup-input" value={formData.category} onChange={handleInputChange} required>
                          <option value="" disabled>Select Category</option>
                          <option value="Programming">Programming</option>
                          <option value="Languages">Languages</option>
                          <option value="Design">Design</option>
                          <option value="Music">Music</option>
                          <option value="Fitness">Fitness</option>
                          <option value="Academics">Academics</option>
                          <option value="Communication Skills">Communication Skills</option>
                        </select>
                      </div>
                      <div className="mockup-split-row">
                        <div className="form-group half">
                          <label className="mockup-label">Charge</label>
                          <select name="chargeType" className="mockup-input" value={formData.chargeType} onChange={handleInputChange} required>
                            <option value="Paid">Paid</option>
                            <option value="Free">Free</option>
                          </select>
                        </div>
                        <div className="form-group half">
                          <label className="mockup-label">Session Type</label>
                          <select name="skillType" className="mockup-input" value={formData.skillType} onChange={handleInputChange} required>
                            <option value="Online">Online</option>
                            <option value="Offline">Offline</option>
                            <option value="Both">Both</option>
                          </select>
                        </div>
                      </div>

                      {formData.chargeType === 'Paid' && (
                        <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                          <label className="mockup-label">Hourly Rate (₹)</label>
                          <div className="price-input-wrapper">
                            <span className="price-symbol">₹</span>
                            <input 
                              type="number" 
                              name="price" 
                              className="mockup-input price-input" 
                              placeholder="e.g. 150.00" 
                              value={formData.price} 
                              onChange={handleInputChange} 
                              required 
                              inputMode="decimal"
                              step="any"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div className="peer-section-title" style={{ marginTop: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        Peer Learning Profile & Experience
                      </div>

                      <div className="peer-grid-2">
                        <div className="form-group">
                          <label className="mockup-label">Experience Level</label>
                          <select name="experienceLevel" className="mockup-input" value={formData.experienceLevel} onChange={handleInputChange} required>
                            <option value="Beginner">Beginner / Intermediate Mentor</option>
                            <option value="Intermediate">Intermediate Mentor</option>
                            <option value="Advanced">Advanced Mentor / Expert</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="mockup-label">Languages Known</label>
                          <input 
                            type="text" 
                            name="languagesKnown" 
                            className="mockup-input" 
                            placeholder="e.g. English, Hindi, Spanish" 
                            value={formData.languagesKnown} 
                            onChange={handleInputChange} 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="mockup-label">Previous Teaching / Session Experience</label>
                        <textarea 
                          name="prevExperience" 
                          className="mockup-input textarea" 
                          style={{ minHeight: '80px' }}
                          placeholder="Describe any previous tutoring, student mentoring, or peer sessions you have conducted..." 
                          value={formData.prevExperience} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="mockup-label">Offerings & Session Focus Types</label>
                        <div className="checkbox-options-grid">
                          {['1:1 Mentoring', 'Group Session', 'Interview Prep', 'Project Guidance'].map(type => (
                            <div key={type} className="checkbox-option-item">
                              <input 
                                type="checkbox" 
                                id={`session-${type.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                                className="checkbox-input"
                                checked={formData.sessionTypes.includes(type)}
                                onChange={() => handleCheckboxChange('sessionTypes', type)}
                              />
                              <label 
                                htmlFor={`session-${type.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                                className="checkbox-label"
                              >
                                {type}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="peer-section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Syllabus & Learning Details
                      </div>

                      <div className="form-group">
                        <label className="mockup-label">Topics Covered (Comma separated list)</label>
                        <textarea 
                          name="topicsCovered" 
                          className="mockup-input textarea" 
                          style={{ minHeight: '80px' }}
                          placeholder="e.g. Memory management, Pointer operations, OOP concepts, File Handling..." 
                          value={formData.topicsCovered} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>

                      <div className="form-group">
                        <label className="mockup-label">Learning Outcomes (What will the peer achieve?)</label>
                        <textarea 
                          name="learningOutcomes" 
                          className="mockup-input textarea" 
                          style={{ minHeight: '80px' }}
                          placeholder="e.g. Build a complete project, Solve advanced data structures problems, Crack technical interviews..." 
                          value={formData.learningOutcomes} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      {/* Photo Section */}
                      <div className="form-group">
                        <label className="mockup-label">Listing Photos</label>
                        <div className="mockup-photo-area">
                          {previews.map((src, idx) => (
                            <div key={idx} className="photo-thumbnail relative-box">
                              <img src={src} alt={`Preview ${idx + 1}`} />
                              <button type="button" className="remove-img-btn" onClick={() => handleRemoveImage(idx)} title="Remove Image">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          ))}
                          {previews.length < 4 && (
                            <>
                              <div className="photo-drop-zone" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  id="imageUpload" 
                                  onChange={handleImageChange} 
                                  className="file-input" 
                                  multiple 
                                />
                                <label htmlFor="imageUpload" className="upload-trigger" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0}}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 15V8"/><path d="m9 11 3-3 3 3"/></svg>
                                  <span className="upload-text" style={{marginTop: '8px'}}>Upload</span>
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                        <p className="photo-helper-text">Add up to 4 high-quality photos. First image will be the cover.</p>
                      </div>

                      <div className="peer-section-title" style={{ marginTop: '0.5rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        Availability & Scheduling
                      </div>

                      <div className="form-group">
                        <label className="mockup-label">Available Days</label>
                        <div className="checkbox-options-grid">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <div key={day} className="checkbox-option-item">
                              <input 
                                type="checkbox" 
                                id={`day-${day.toLowerCase()}`}
                                className="checkbox-input"
                                checked={formData.dayAvailability.includes(day)}
                                onChange={() => handleCheckboxChange('dayAvailability', day)}
                              />
                              <label 
                                htmlFor={`day-${day.toLowerCase()}`}
                                className="checkbox-label"
                              >
                                {day}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="mockup-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span>Available Time Slots</span>
                          <button 
                            type="button" 
                            onClick={() => setTimeSlots([...timeSlots, ''])}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#4F46E5',
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              transition: 'background-color 0.2s',
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Time Slot
                          </button>
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {timeSlots.map((slot, index) => (
                            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                              <div style={{ flex: 1, position: 'relative' }}>
                                <input 
                                  type="text" 
                                  className="mockup-input" 
                                  placeholder="e.g. Weekends 10AM-2PM" 
                                  value={slot} 
                                  onChange={(e) => {
                                    const newSlots = [...timeSlots];
                                    newSlots[index] = e.target.value;
                                    setTimeSlots(newSlots);
                                  }} 
                                  required 
                                  style={{ paddingLeft: '2.75rem' }}
                                />
                                <svg 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="#9CA3AF" 
                                  strokeWidth="2.5" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  style={{ position: 'absolute', left: '1.15rem', top: '50%', transform: 'translateY(-50%)' }}
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                              </div>
                              {timeSlots.length > 1 && (
                                <button 
                                  type="button" 
                                  className="remove-slot-btn"
                                  onClick={() => setTimeSlots(timeSlots.filter((_, idx) => idx !== index))}
                                  style={{
                                    background: '#FEF2F2',
                                    color: '#EF4444',
                                    border: '1px solid #FEE2E2',
                                    padding: '0.85rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="peer-section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        Portfolio & Social Links (Verification Proof)
                      </div>

                      <div className="portfolio-links-container">
                        <div className="form-group">
                          <label className="mockup-label">GitHub URL</label>
                          <div className="link-input-wrapper">
                            <span className="link-icon-prefix">
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
                            </span>
                            <input 
                              type="text" 
                              name="github" 
                              className="mockup-input link-input-with-prefix" 
                              placeholder="https://github.com/yourusername" 
                              value={formData.portfolioLinks.github || ''} 
                              onChange={handlePortfolioChange} 
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="mockup-label">LinkedIn URL</label>
                          <div className="link-input-wrapper">
                            <span className="link-icon-prefix">
                              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                            </span>
                            <input 
                              type="text" 
                              name="linkedin" 
                              className="mockup-input link-input-with-prefix" 
                              placeholder="https://linkedin.com/in/yourusername" 
                              value={formData.portfolioLinks.linkedin || ''} 
                              onChange={handlePortfolioChange} 
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="mockup-label">Portfolio URL</label>
                          <div className="link-input-wrapper">
                            <span className="link-icon-prefix">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                            </span>
                            <input 
                              type="text" 
                              name="portfolio" 
                              className="mockup-input link-input-with-prefix" 
                              placeholder="https://yourportfolio.com" 
                              value={formData.portfolioLinks.portfolio || ''} 
                              onChange={handlePortfolioChange} 
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="mockup-label">Certificate / Proof URL</label>
                          <div className="link-input-wrapper">
                            <span className="link-icon-prefix">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </span>
                            <input 
                              type="text" 
                              name="certificates" 
                              className="mockup-input link-input-with-prefix" 
                              placeholder="Credentials or Drive link" 
                              value={formData.portfolioLinks.certificates || ''} 
                              onChange={handlePortfolioChange} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="peer-section-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        Optional Portfolio Demo Gallery (Images)
                      </div>

                      <div className="demo-media-box">
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/gif,image/webp" 
                            id="demoUpload" 
                            onChange={handleDemoMediaChange} 
                            className="file-input" 
                            multiple 
                          />
                          <label htmlFor="demoUpload" className="mockup-publish-btn" style={{ background: '#F3F4F6', color: '#374151', cursor: 'pointer', margin: 0, display: 'inline-block' }}>
                            Choose Demo Files
                          </label>
                          <span className="photo-helper-text">
                            Upload up to 4 demo images. Only image files (JPEG, PNG, GIF, WebP) are allowed.
                          </span>
                        </div>

                        <div className="demo-media-grid">
                          {demoPreviews.map((src, idx) => (
                            <div key={idx} className="demo-media-thumbnail relative-box">
                              <img src={src} alt={`Demo ${idx + 1}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                              <button type="button" className="remove-img-btn" onClick={() => handleRemoveDemoMedia(idx)} title="Remove File">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {currentStep === 4 && (
                    <>
                      <div className="form-group">
                        <label className="mockup-label">Description / Bio</label>
                        <textarea 
                          name="description"
                          className="mockup-input textarea"
                          placeholder="Describe what you're offering in detail..." 
                          value={formData.description} 
                          onChange={handleInputChange} 
                          rows="4"
                          required 
                        />
                      </div>

                      <div style={{ marginTop: '1.5rem' }}>
                        {renderReviewStep()}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Form Footer / Step Navigation Actions */}
              <div className="mockup-form-actions">
                <button 
                  key="btn-cancel"
                  type="button"
                  className="cancel-btn" 
                  onClick={() => !loading && navigate(isEditMode ? '/profile' : '/index', { state: { user, activeTab: isEditMode ? `${activeTab}s` : undefined } })}
                  style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                
                {currentStep > 1 && (
                  <button 
                    key="btn-prev"
                    type="button" 
                    className="mockup-publish-btn" 
                    style={{ background: '#F3F4F6', color: '#374151' }} 
                    onClick={handlePrevStep}
                  >
                    Previous
                  </button>
                )}

                {currentStep < totalSteps ? (
                  <button 
                    key="btn-next"
                    type="button" 
                    className="mockup-publish-btn" 
                    onClick={handleNextStep}
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    key="btn-submit"
                    type="submit" 
                    className="mockup-publish-btn" 
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                  >
                    {loading && (
                      <svg className="spinner-icon-btn" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2C6.477 2 2 6.477 2 12a10 10 0 0 0 10 10" strokeLinecap="round" />
                      </svg>
                    )}
                    {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Save Changes' : `Publish ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`)}
                  </button>
                )}
              </div>
            </fieldset>
          </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateListing;
