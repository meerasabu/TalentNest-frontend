import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import '../Dashboard/Index.css'; 
import './EditProfile.css';
import Header from '../Common/Header';
import Sidebar from '../Common/Sidebar';

const EditProfile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Extract existing user from state or localStorage
    const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { 
        id: null,
        firstName: '', 
        lastName: '', 
        email: '',
        department: '',
        graduationYear: '',
        bio: '',
        phoneNumber: '',
        campusLocation: '',
        skills: [],
        profileImage: null,
        bannerImage: null
    };

    const token = localStorage.getItem('token');
    
    // If still no user ID or token, we must redirect to login
    if (!user.id || !token || token === 'undefined') {
        console.warn('No valid user session found, redirecting to login...');
        return <Navigate to="/login" />;
    }

    const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        department: user.department || '',
        graduationYear: user.graduationYear || '',
        phoneNumber: user.phoneNumber || '',
        campusLocation: user.campusLocation || '',
    });

    const [skills, setSkills] = useState(user.skills || []);
    const [newSkill, setNewSkill] = useState('');
    const [loading, setLoading] = useState(false);

    // Image states
    const [profileImgPreview, setProfileImgPreview] = useState(user.profileImage ? window.getImageUrl(user.profileImage) : 'https://placehold.co/150x150');
    const [bannerImgPreview, setBannerImgPreview] = useState(user.bannerImage ? window.getImageUrl(user.bannerImage) : 'https://placehold.co/1200x260/0284c7/ecf0f1');
    const [profileImgFile, setProfileImgFile] = useState(null);
    const [bannerImgFile, setBannerImgFile] = useState(null);

    const profileInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'profile') {
                setProfileImgFile(file);
                setProfileImgPreview(URL.createObjectURL(file));
            } else {
                setBannerImgFile(file);
                setBannerImgPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('firstName', formData.firstName);
        data.append('lastName', formData.lastName);
        data.append('bio', formData.bio);
        data.append('department', formData.department);
        data.append('graduationYear', formData.graduationYear);
        data.append('phoneNumber', formData.phoneNumber);
        data.append('campusLocation', formData.campusLocation);
        data.append('skills', JSON.stringify(skills));
        
        // Pass existing URLs as fallback if no new file selected
        data.append('profileImageUrl', user.profileImage || '');
        data.append('bannerImageUrl', user.bannerImage || '');

        if (profileImgFile) data.append('profileImage', profileImgFile);
        if (bannerImgFile) data.append('bannerImage', bannerImgFile);

        try {
            const response = await api.put(`/profile/${user.id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                alert('Profile updated successfully!');
                navigate('/profile', { state: { user: response.data.user } });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMsg = error.response?.data?.details || error.response?.data?.message || error.message;
            alert(`Failed to update profile: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar Mapping */}
            <Sidebar user={user} handlePrefix={handlePrefix} />

            <main className="dashboard-main edit-prof-main">
                <Header user={user} />

                <div className="content-scrollable edit-prof-scrollable">
                    <button className="back-btn" onClick={() => navigate('/profile', { state: { user } })}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        Back
                    </button>

                    <h1 className="edit-prof-title">Edit Profile</h1>
                    <p className="edit-prof-subtitle">Update your profile information and settings</p>

                    <form onSubmit={handleSubmit}>
                        {/* Interactive Image Selection Section */}
                        <div className="edit-images-section">
                            <div className="banner-edit-container">
                                <img src={bannerImgPreview} alt="Banner" className="banner-preview" />
                                <button type="button" className="banner-overlay" onClick={() => bannerInputRef.current.click()}>
                                    <div className="overlay-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                    </div>
                                </button>
                                <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
                            </div>

                            <div className="profile-pic-edit-container">
                                <img src={profileImgPreview} alt="Avatar" className="profile-pic-preview" />
                                <button type="button" className="img-overlay" onClick={() => profileInputRef.current.click()}>
                                    <div className="overlay-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                    </div>
                                </button>
                                <input type="file" ref={profileInputRef} hidden accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
                            </div>
                        </div>

                        <div className="edit-form-content">
                            <div className="form-sub-section">
                                <h3 className="section-title">Basic Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="firstName">FIRST NAME</label>
                                        <input type="text" id="firstName" className="form-input" value={formData.firstName} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="lastName">LAST NAME</label>
                                        <input type="text" id="lastName" className="form-input" value={formData.lastName} onChange={handleChange} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label htmlFor="bio">BIO</label>
                                        <textarea id="bio" className="form-input" placeholder="Tell others about yourself..." value={formData.bio} onChange={handleChange}></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="department">DEPARTMENT</label>
                                        <select id="department" className="form-input" value={formData.department} onChange={handleChange}>
                                            <option value="" disabled>Select Department</option>
                                            <option value="Business Administration">Business Administration</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Department of CS (PG)">Department of CS (PG)</option>
                                            <option value="Commerce and Management">Commerce and Management</option>
                                            <option value="Humanities">Humanities</option>
                                            <option value="Life Sciences">Life Sciences</option>
                                            <option value="Psychology">Psychology</option>
                                            <option value="Social Work">Social Work</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="graduationYear">GRADUATION YEAR</label>
                                        <select id="graduationYear" className="form-input" value={formData.graduationYear.toString()} onChange={handleChange}>
                                            <option value="" disabled>Select Year</option>
                                            <option value="2023">2023</option>
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                            <option value="2026">2026</option>
                                            <option value="2027">2027</option>
                                            <option value="2028">2028</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-sub-section">
                                <h3 className="section-title">Skills & Expertise</h3>
                                <div className="skills-tags-container">
                                    {skills.map(skill => (
                                        <span key={skill} className="skill-tag">
                                            {skill}
                                            <button type="button" className="remove-skill" onClick={() => handleRemoveSkill(skill)}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="add-skill-group">
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="Add a skill..." 
                                        value={newSkill} 
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                    />
                                    <button type="button" className="btn-add-skill" onClick={handleAddSkill}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="form-sub-section">
                                <h3 className="section-title">Contact Information</h3>
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>UNIVERSITY EMAIL</label>
                                        <input type="email" className="form-input" value={user.email} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="phoneNumber">PHONE NUMBER (OPTIONAL)</label>
                                        <input 
                                            type="text" 
                                            id="phoneNumber" 
                                            className="form-input" 
                                            placeholder="+91 98765 43210" 
                                            value={formData.phoneNumber} 
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                if(val.length > 0 && !val.startsWith('+91 ')) {
                                                    if (val.startsWith('+91')) val = '+91 ' + val.substring(3).trim();
                                                    else val = '+91 ' + val.replace(/^\+?/, '');
                                                }
                                                setFormData({...formData, phoneNumber: val});
                                            }} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="campusLocation">CAMPUS LOCATION</label>
                                        <select id="campusLocation" className="form-input" value={formData.campusLocation} onChange={handleChange}>
                                            <option value="" disabled>Select Location</option>
                                            <option value="Humanities block">Humanities block</option>
                                            <option value="Admin block">Admin block</option>
                                            <option value="PG block">PG block</option>
                                            <option value="Main Block">Main Block</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="edit-prof-footer">
                                <button type="button" className="btn-cancel" onClick={() => navigate('/profile', { state: { user } })}>Cancel</button>
                                <button type="submit" className="btn-save" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditProfile;
