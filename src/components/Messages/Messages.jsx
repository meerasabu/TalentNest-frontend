import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../../api/axiosConfig';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css';
import './Messages.css';
import Header from '../Common/Header';
import io from 'socket.io-client';
import { useNotifications } from '../../context/NotificationContext';
import { usePresence } from '../../context/PresenceContext';

const Messages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user') || 'null');
  const { orderId } = location.state || {};
  const { fetchUnreadCounts } = useNotifications() || { fetchUnreadCounts: () => {} };
  const { isOnline } = usePresence();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePrefix = user?.email ? user.email.split('@')[0].toUpperCase() : 'USER';
  
  const [partnerGroups, setPartnerGroups] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewOrderId, setReviewOrderId] = useState(null);

  // Graded ratings
  const [communicationRating, setCommunicationRating] = useState(0);
  const [teachingRating, setTeachingRating] = useState(0);
  const [outcomeRating, setOutcomeRating] = useState(0);
  const [commHover, setCommHover] = useState(0);
  const [teachHover, setTeachHover] = useState(0);
  const [outcomeHover, setOutcomeHover] = useState(0);
  // Product-specific trust metrics
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [sellerCommRating, setSellerCommRating] = useState(0);
  const [productQualityHover, setProductQualityHover] = useState(0);
  const [valueHover, setValueHover] = useState(0);
  const [sellerCommHover, setSellerCommHover] = useState(0);

  // Session-based states
  const [activeChatId, setActiveChatId] = useState(null);
  const [unreadSessions, setUnreadSessions] = useState({});
  const [showHistory, setShowHistory] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const tabsContainerRef = useRef(null);
  const historyRef = useRef(null);

  const activeGroup = partnerGroups.find(g => g.partner_id === activePartnerId);

  const filteredPartnerGroups = useMemo(() => {
    if (!searchQuery.trim()) return partnerGroups;
    return partnerGroups.filter(g => 
      (g.partner_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [partnerGroups, searchQuery]);

  const sortedChats = useMemo(() => {
    return activeGroup ? [...activeGroup.chats].sort((a,b) => new Date(a.created_at) - new Date(b.created_at)) : [];
  }, [activeGroup]);

  const activeChats = useMemo(() => {
    return sortedChats.filter(c => !c.is_closed);
  }, [sortedChats]);

  const closedChats = useMemo(() => {
    return sortedChats.filter(c => c.is_closed);
  }, [sortedChats]);

  const effectiveChatId = useMemo(() => {
    if (sortedChats.length === 0) return null;
    const exists = sortedChats.some(c => c.chat_id === activeChatId);
    if (exists) return activeChatId;
    
    // Priority 1: accepted & active sessions
    const activeSession = activeChats.find(c => c.order_status === 'Accepted' && c.chat_status !== 'Completed' && c.chat_status !== 'Cancelled');
    // Priority 2: pending sessions
    const pendingSession = activeChats.find(c => c.order_status === 'Pending');
    // Priority 3: fallback to latest active session
    const fallbackActive = activeChats[activeChats.length - 1];
    
    return activeSession?.chat_id || pendingSession?.chat_id || fallbackActive?.chat_id || sortedChats[sortedChats.length - 1]?.chat_id || null;
  }, [sortedChats, activeChats, activeChatId]);

  const currentChat = useMemo(() => {
    return sortedChats.find(c => c.chat_id === effectiveChatId) || null;
  }, [sortedChats, effectiveChatId]);

  useEffect(() => {
    setDetailsExpanded(false);
  }, [effectiveChatId]);

  const canType = useMemo(() => {
    return currentChat && currentChat.chat_status === 'Active' && currentChat.order_status === 'Accepted';
  }, [currentChat]);

  const messagesEndRef = useRef(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get(`/chats/${user?.id}`);
      if (res.data.success) {
        const groups = {};
        res.data.chats.forEach(chat => {
          if(!groups[chat.partner_id]) {
            groups[chat.partner_id] = {
              partner_id: chat.partner_id,
              partner_name: chat.partner_name,
              partner_image: chat.partner_image,
              chats: []
            };
          }
          groups[chat.partner_id].chats.push(chat);
        });
        const groupArr = Object.values(groups);
        setPartnerGroups(groupArr);
        return { groupArr, rawChats: res.data.chats };
      }
      return { groupArr: [], rawChats: [] };
    } catch (err) {
      console.error('Error fetching chats:', err);
      return { groupArr: [], rawChats: [] };
    }
  }, [user]);

  useEffect(() => {
    const initChats = async () => {
      setLoading(true);
      const fetched = await fetchChats();
      const rawChats = fetched?.rawChats || [];
      const groups = fetched?.groupArr || [];

      if (orderId) {
        const existingChat = rawChats.find(c => c.order_id === orderId);
        if (existingChat) {
          setActivePartnerId(existingChat.partner_id);
          setActiveChatId(existingChat.chat_id);
        } else {
          // Create new chat
          const createRes = await api.post(`/chats`, {
            orderId,
            userId: user?.id
          });
          if (createRes.data.success) {
            const updated = await fetchChats();
            const newlyCreated = updated.rawChats.find(c => c.order_id === orderId);
            if (newlyCreated) {
              setActivePartnerId(newlyCreated.partner_id);
              setActiveChatId(newlyCreated.chat_id);
            }
          }
        }
      } else if (groups.length > 0 && !activePartnerId && window.innerWidth > 768) {
        setActivePartnerId(groups[0].partner_id);
      }
      setLoading(false);
    };
    initChats();
  }, [user, orderId, fetchChats, activePartnerId]);

  const socketRef = useRef(null);
  const activePartnerIdRef = useRef(activePartnerId);
  const sortedChatsRef = useRef([]);
  const activeChatIdRef = useRef(effectiveChatId);

  // Keep refs in sync so that the socket event listener always has current active values
  useEffect(() => {
    activePartnerIdRef.current = activePartnerId;
  }, [activePartnerId]);

  useEffect(() => {
    sortedChatsRef.current = sortedChats;
  }, [sortedChats]);

  useEffect(() => {
    activeChatIdRef.current = effectiveChatId;
  }, [effectiveChatId]);

  const markMessagesAsRead = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      await api.post(`/chats/chat/${chatId}/read`);
      if (fetchUnreadCounts) {
        fetchUnreadCounts();
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [fetchUnreadCounts]);

  const markMessagesAsReadRef = useRef(markMessagesAsRead);
  useEffect(() => {
    markMessagesAsReadRef.current = markMessagesAsRead;
  }, [markMessagesAsRead]);

  useEffect(() => {
    if (effectiveChatId) {
      markMessagesAsRead(effectiveChatId);
    }
  }, [effectiveChatId, markMessagesAsRead]);

  const fetchMessages = useCallback(async (partnerId) => {
    try {
      const res = await api.get(`/chats/user/${user?.id}/partner/${partnerId}/messages`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [user]);

  // Socket connection initialization
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socket = io(API_BASE_URL, {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('join_user', user?.id);
    });

    socket.on('new_message', (msg) => {
      // Append message if it belongs to one of the active partner's chats
      const isRelevant = sortedChatsRef.current.some(c => c.chat_id === msg.chat_id);

      if (isRelevant) {
        setMessages(prev => {
          if (prev.some(m => m.message_id === msg.message_id)) return prev;
          // Filter out the optimistic temp message
          const filtered = prev.filter(m => !(m.isTemp && m.sender_id === msg.sender_id && m.message_text === msg.message_text));
          return [...filtered, msg];
        });

        // Set unread if message is for a background session
        if (msg.chat_id !== activeChatIdRef.current && msg.sender_id !== user?.id) {
          setUnreadSessions(prev => ({ ...prev, [msg.chat_id]: true }));
        } else if (msg.chat_id === activeChatIdRef.current && msg.sender_id !== user?.id) {
          markMessagesAsReadRef.current(msg.chat_id);
        }
      }

      // Always fetch chats to keep the list updated in real-time
      fetchChats();
    });

    socket.on('chat_completed', () => {
      fetchChats();
      const currentActivePartnerId = activePartnerIdRef.current;
      if (currentActivePartnerId) {
        fetchMessages(currentActivePartnerId);
      }
    });

    socket.on('chat_cancelled', () => {
      fetchChats();
      const currentActivePartnerId = activePartnerIdRef.current;
      if (currentActivePartnerId) {
        fetchMessages(currentActivePartnerId);
      }
    });

    socket.on('chat_restricted', () => {
      fetchChats();
      const currentActivePartnerId = activePartnerIdRef.current;
      if (currentActivePartnerId) {
        fetchMessages(currentActivePartnerId);
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
      alert(err.message || 'An error occurred.');
      fetchChats();
      const currentActivePartnerId = activePartnerIdRef.current;
      if (currentActivePartnerId) {
        fetchMessages(currentActivePartnerId);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, fetchChats, fetchMessages]);

  const fetchMessagesRef = useRef(fetchMessages);
  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  // Fetch messages once on partner switch
  useEffect(() => {
    if (activePartnerId) {
      fetchMessagesRef.current(activePartnerId);
    }
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, effectiveChatId]);



  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setSelectedImage(file);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !effectiveChatId || !socketRef.current || imageUploading) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    let uploadedUrl = null;
    if (selectedImage) {
      setImageUploading(true);
      try {
        const data = new FormData();
        data.append('image', selectedImage);
        
        const res = await api.post('/chats/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data.success) {
          uploadedUrl = res.data.url;
        }
      } catch (err) {
        console.error('Error uploading chat image:', err);
        alert('Failed to upload image. Please try again.');
        setImageUploading(false);
        return;
      } finally {
        setImageUploading(false);
      }
    }

    // Add temporary message for optimistic UI
    const tempMsg = {
      message_id: `temp-${Date.now()}`,
      isTemp: true,
      chat_id: effectiveChatId,
      sender_id: user?.id,
      message_text: msgText,
      image_url: uploadedUrl || undefined,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    // Emit send_message event via WebSocket
    socketRef.current.emit('send_message', {
      chatId: effectiveChatId,
      senderId: user?.id,
      text: msgText,
      imageUrl: uploadedUrl
    });

    // Reset selected image states
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const markCompleted = async (chatId) => {
    if(!window.confirm("Are you sure you want to mark this order as completed?")) return;
    try {
      const res = await api.post(`/chats/${chatId}/complete`);
      if (res.data.success) {
        fetchChats();
      }
    } catch (error) {
      console.error("Error marking complete:", error);
      alert("Failed to mark as completed.");
    }
  };

  const cancelOrder = async (orderId) => {
    if(!window.confirm("Are you sure you want to cancel this order? This will restore inventory and disable the chat.")) return;
    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        alert("Order cancelled successfully.");
        fetchChats();
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.message || "Failed to cancel order.");
    }
  };

  const submitReport = async () => {
    try {
      const res = await api.post(`/chats/report`, {
        reporterId: user?.id,
        reportedId: activePartnerId,
        reason: reportReason,
        chatId: currentChat?.chat_id,
        itemId: currentChat?.item_id,
        itemType: currentChat?.item_type
      });
      if (res.data.success) {
        alert("Report submitted successfully.");
        setReportModalOpen(false);
        setReportReason('');
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report.");
    }
  };

  const submitReview = async () => {
    try {
      const isSkill = currentChat?.item_type === 'skill';
      const isProduct = currentChat?.item_type === 'product';
      const res = await api.post(`/reviews`, {
        reviewerId: user?.id,
        reviewedId: activePartnerId,
        orderId: reviewOrderId,
        rating: reviewRating,
        reviewText: reviewText,
        communicationRating: isSkill ? communicationRating : (isProduct ? sellerCommRating : null),
        teachingRating: isSkill ? teachingRating : (isProduct ? productQualityRating : null),
        outcomeRating: isSkill ? outcomeRating : (isProduct ? valueRating : null)
      });
      if (res.data.success) {
        alert("Review submitted successfully!");
        setReviewModalOpen(false);
        setReviewText('');
        setReviewRating(5);
        setCommunicationRating(0);
        setTeachingRating(0);
        setOutcomeRating(0);
        setProductQualityRating(0);
        setValueRating(0);
        setSellerCommRating(0);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(error.response?.data?.message || "Failed to submit review.");
    }
  };

  const updateArrowVisibility = useCallback(() => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftArrow(scrollLeft > 2);
      setShowRightArrow(scrollWidth - scrollLeft - clientWidth > 2);
    }
  }, []);

  const handleScroll = () => {
    updateArrowVisibility();
  };

  useEffect(() => {
    updateArrowVisibility();
    window.addEventListener('resize', updateArrowVisibility);
    return () => window.removeEventListener('resize', updateArrowVisibility);
  }, [activeChats.length, updateArrowVisibility]);

  useEffect(() => {
    const handleHistoryClickOutside = (event) => {
      if (historyRef.current && !historyRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleHistoryClickOutside);
    return () => document.removeEventListener('mousedown', handleHistoryClickOutside);
  }, []);

  const scrollLeftFn = () => {
    tabsContainerRef.current?.scrollBy({ left: -120, behavior: 'smooth' });
  };

  const scrollRightFn = () => {
    tabsContainerRef.current?.scrollBy({ left: 120, behavior: 'smooth' });
  };

  const closeSession = async (chatId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to archive/close this session? You can restore it from Session History anytime.")) return;
    try {
      const res = await api.post(`/chats/${chatId}/close`);
      if (res.data.success) {
        const fetched = await fetchChats();
        const rawChats = fetched?.rawChats || [];
        const activeGroupChats = rawChats.filter(c => c.partner_id === activePartnerId);
        
        // Find next chat to auto-select
        const remainingActive = activeGroupChats.filter(c => !c.is_closed);
        if (remainingActive.length > 0) {
          const activeSession = remainingActive.find(c => c.order_status === 'Accepted' && c.chat_status !== 'Completed' && c.chat_status !== 'Cancelled');
          const pendingSession = remainingActive.find(c => c.order_status === 'Pending');
          const fallback = remainingActive[remainingActive.length - 1];
          setActiveChatId(activeSession?.chat_id || pendingSession?.chat_id || fallback?.chat_id || null);
        } else if (activeGroupChats.length > 0) {
          setActiveChatId(activeGroupChats[activeGroupChats.length - 1].chat_id);
        } else {
          setActiveChatId(null);
        }
      }
    } catch (err) {
      console.error('Error closing session:', err);
      alert('Failed to close session.');
    }
  };

  const restoreSession = async (chatId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/chats/${chatId}/reopen`);
      if (res.data.success) {
        await fetchChats();
        setActiveChatId(chatId);
      }
    } catch (err) {
      console.error('Error restoring session:', err);
      alert('Failed to restore session.');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPartnerAvatar = (obj) => {
    const imgPath = obj.partner_image || obj.profile_image;
    if (imgPath && imgPath !== 'undefined' && imgPath !== 'null' && imgPath !== '/uploads/undefined') {
      return <img src={`${API_BASE_URL}${imgPath}`} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />;
    }
    const name = obj.partner_name || (obj.first_name ? `${obj.first_name} ${obj.last_name || ''}` : null) || 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      const firstInitial = parts[0] && parts[0][0] ? parts[0][0] : '';
      const secondInitial = parts[1] && parts[1][0] ? parts[1][0] : '';
      return (firstInitial + secondInitial).toUpperCase() || 'U';
    }
    return name[0] ? name[0].toUpperCase() : 'U';
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      <main className="dashboard-main">
        <Header user={user} showSearch={false} />

        <div className={`chat-layout ${activePartnerId ? 'has-active-chat' : ''}`}>
          <div className="chat-sidebar">
            <h2 className="chat-sidebar-title">Messages</h2>
            <div className="chat-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" width="16" height="16">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search chats..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="chat-list">
              {loading ? (
                <div className="chat-loading">Loading chats...</div>
              ) : filteredPartnerGroups.length === 0 ? (
                <div className="chat-empty">
                  {searchQuery.trim() ? "No chats found matching search." : "No active chats."}
                </div>
              ) : (
                filteredPartnerGroups.map(group => (
                  <div 
                    key={group.partner_id} 
                    className={`chat-list-item ${activePartnerId === group.partner_id ? 'active' : ''}`}
                    onClick={() => setActivePartnerId(group.partner_id)}
                  >
                    <div className="chat-avatar">
                      {getPartnerAvatar(group)}
                      {isOnline(group.partner_id) && <span className="online-indicator" />}
                    </div>
                    <div className="chat-item-info">
                      <div className="chat-item-header">
                        <span className="chat-name">{group.partner_name}</span>
                      </div>
                      <div className="chat-item-preview">
                        {group.chats.filter(c => !c.is_closed && c.chat_status !== 'Completed' && c.chat_status !== 'Cancelled').length} Active Session(s)
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chat-main">
            {activeGroup ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-user">
                    <button 
                      className="chat-back-btn" 
                      onClick={() => setActivePartnerId(null)}
                      aria-label="Back to chats list"
                      style={{
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        marginRight: '0.5rem'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div className="chat-avatar">
                      {getPartnerAvatar(activeGroup)}
                    </div>
                    <div className="chat-header-info">
                      <h3>{activeGroup.partner_name}</h3>
                    </div>
                  </div>
                </div>

                {/* Horizontal session tabs with carousel */}
                {sortedChats.length > 0 && (
                  <div className="chat-session-tabs-wrapper">
                    {/* Left scroll arrow */}
                    {activeChats.length > 3 && showLeftArrow && (
                      <button className="carousel-arrow-btn left" onClick={scrollLeftFn} aria-label="Scroll left">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </button>
                    )}

                    <div 
                      ref={tabsContainerRef}
                      onScroll={handleScroll}
                      className={`chat-session-tabs ${activeChats.length > 3 ? 'has-carousel' : ''} ${showLeftArrow ? 'fade-left' : ''} ${showRightArrow ? 'fade-right' : ''}`}
                    >
                      {activeChats.length === 0 ? (
                        <div className="no-active-sessions-msg">No active sessions. Open Session History to restore.</div>
                      ) : (
                        activeChats.map(c => (
                          <button
                            key={c.chat_id}
                            className={`session-tab-btn ${c.chat_id === effectiveChatId ? 'active' : ''}`}
                            onClick={() => {
                              setActiveChatId(c.chat_id);
                              setUnreadSessions(prev => ({ ...prev, [c.chat_id]: false }));
                            }}
                          >
                            <span className="session-tab-title">{c.item_title || 'Request'}</span>
                            {unreadSessions[c.chat_id] && <span className="session-unread-dot" />}
                            <span className={`session-tab-badge ${c.order_status ? c.order_status.toLowerCase() : 'active'}`}>
                              {c.order_status || 'Active'}
                            </span>
                            <span 
                              className="session-close-icon"
                              onClick={(e) => closeSession(c.chat_id, e)}
                              title="Archive Session"
                            >
                              ✕
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Right scroll arrow */}
                    {activeChats.length > 3 && showRightArrow && (
                      <button 
                        className="carousel-arrow-btn right" 
                        onClick={scrollRightFn} 
                        aria-label="Scroll right"
                        style={{ right: closedChats.length > 0 ? '7.5rem' : '0.75rem' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    )}

                    {/* Session History dropdown trigger */}
                    {closedChats.length > 0 && (
                      <div className="session-history-wrapper" ref={historyRef}>
                        <button 
                          className={`history-toggle-btn ${showHistory ? 'active' : ''}`}
                          onClick={() => setShowHistory(!showHistory)}
                          title="Session History"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="10"></circle></svg>
                          History ({closedChats.length})
                        </button>
                        
                        {showHistory && (
                          <div className="session-history-dropdown">
                            <div className="history-dropdown-header">
                              <h4>Closed Sessions</h4>
                            </div>
                            <div className="history-dropdown-list">
                              {closedChats.map(c => (
                                <div 
                                  key={c.chat_id}
                                  className={`history-item-pill ${c.chat_id === effectiveChatId ? 'selected' : ''}`}
                                  onClick={() => {
                                    setActiveChatId(c.chat_id);
                                    setShowHistory(false);
                                  }}
                                >
                                  <div className="history-item-details">
                                    <span className="history-item-title">{c.item_title || 'Request'}</span>
                                    <span className={`session-tab-badge ${c.order_status ? c.order_status.toLowerCase() : 'active'}`}>
                                      {c.order_status || 'Active'}
                                    </span>
                                  </div>
                                  <button 
                                    className="session-restore-btn"
                                    onClick={(e) => restoreSession(c.chat_id, e)}
                                    title="Restore Session"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Fixed session details/actions bar */}
                {currentChat && (
                  <div className={`chat-session-info-bar ${detailsExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="session-info-header-row">
                      <div className="session-info-meta-basic">
                        <span className="session-info-type">{currentChat.item_type || 'Request'}</span>
                        <h4 className="session-info-title">{currentChat.item_title || 'Request'}</h4>
                        {currentChat.chat_status === 'Completed' || currentChat.order_status === 'Completed' ? (
                          <span className="session-badge completed">Completed</span>
                        ) : currentChat.chat_status === 'Cancelled' || currentChat.order_status === 'Cancelled' ? (
                          <span className="session-badge cancelled">Cancelled</span>
                        ) : currentChat.order_status === 'Pending' ? (
                          <span className="session-badge pending">Pending</span>
                        ) : (
                          <span className="session-badge active">Active</span>
                        )}
                      </div>
                      <button 
                        className={`session-details-toggle-btn ${detailsExpanded ? 'expanded' : 'collapsed'}`}
                        onClick={() => setDetailsExpanded(!detailsExpanded)}
                        title={detailsExpanded ? "Hide Details" : "Show Details"}
                        aria-label={detailsExpanded ? "Hide Details" : "Show Details"}
                        aria-expanded={detailsExpanded}
                      >
                        <svg className="toggle-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                    </div>

                    <div className={`session-info-details-row ${detailsExpanded ? 'expanded' : 'collapsed'}`}>
                      {/* Booking details for service/skill sessions */}
                      {(currentChat.item_type === 'service' || currentChat.item_type === 'skill') && (
                        <div className="session-info-badges-container">
                          {currentChat.selected_plan_type && (
                            <span className="session-info-badge plan-badge">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                              {currentChat.selected_plan_type}{currentChat.selected_price ? ` · ₹${currentChat.selected_price}` : ''}
                            </span>
                          )}
                          {currentChat.booking_date && (
                            <span className={`session-info-badge ${currentChat.item_type === 'skill' ? 'skill-date-badge' : 'date-badge'}`}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              {new Date(currentChat.booking_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                            </span>
                          )}
                          {currentChat.booking_slot && (
                            <span className={`session-info-badge ${currentChat.item_type === 'skill' ? 'skill-slot-badge' : 'slot-badge'}`}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              {currentChat.booking_slot}
                            </span>
                          )}
                        </div>
                      )}
                      {currentChat.item_type === 'skill' && (currentChat.user_skill_level || currentChat.learning_goal || currentChat.preferred_schedule) && (
                        <div className="session-skill-details-panel" style={{
                          marginTop: '10px',
                          marginBottom: '10px',
                          padding: '12px 14px',
                          backgroundColor: '#F9F5FF',
                          borderLeft: '3px solid #7E22CE',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          color: '#581C87',
                          width: '100%',
                          textAlign: 'left',
                          boxSizing: 'border-box'
                        }}>
                          {currentChat.user_skill_level && (
                            <div>
                              <strong style={{ color: '#7E22CE', marginRight: '6px' }}>Target Skill Level:</strong>
                              <span style={{ textTransform: 'capitalize', color: '#1E1B4B' }}>{currentChat.user_skill_level}</span>
                            </div>
                          )}
                          {currentChat.learning_goal && (
                            <div>
                              <strong style={{ color: '#7E22CE', marginRight: '6px' }}>Learning Goal:</strong>
                              <span style={{ color: '#1E1B4B', lineHeight: '1.4' }}>{currentChat.learning_goal}</span>
                            </div>
                          )}
                          {currentChat.preferred_schedule && (
                            <div>
                              <strong style={{ color: '#7E22CE', marginRight: '6px' }}>Preferred Schedule:</strong>
                              <span style={{ color: '#1E1B4B' }}>{currentChat.preferred_schedule}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="session-info-actions">
                        {/* Mark as Completed */}
                        {currentChat.chat_status === 'Active' && currentChat.order_status === 'Accepted' && (
                          <button 
                            className="session-header-action-btn complete-btn" 
                            onClick={() => markCompleted(currentChat.chat_id)}
                          >
                            Mark as Completed
                          </button>
                        )}
                        
                        {/* Cancel Request */}
                        {currentChat.chat_status === 'Active' && (currentChat.order_status === 'Accepted' || currentChat.order_status === 'Pending') && (
                          <button 
                            className="session-header-action-btn cancel-btn" 
                            onClick={() => cancelOrder(currentChat.order_id)}
                          >
                            Cancel Request
                          </button>
                        )}
                        
                        {/* Leave a Review */}
                        {(currentChat.chat_status === 'Completed' || currentChat.order_status === 'Completed') && (
                          <button 
                            className="session-header-action-btn review-btn" 
                            onClick={() => {
                              setReviewOrderId(currentChat.order_id);
                              setReviewRating(5);
                              setCommunicationRating(0);
                              setTeachingRating(0);
                              setOutcomeRating(0);
                              setReviewText('');
                              setReviewModalOpen(true);
                            }}
                          >
                            Leave a Review
                          </button>
                        )}
                        
                        {/* Report */}
                        <button 
                          className="session-header-action-btn report-btn" 
                          onClick={() => { setReportModalOpen(true); }}
                        >
                          Report
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="chat-messages">
                  {/* Messages timeline for activeChatId */}
                  {effectiveChatId && (
                    <div className="chat-session-messages-list">
                      {messages
                        .filter(m => m.chat_id === effectiveChatId)
                        .map((msg, mIdx) => {
                          const isMe = msg.sender_id === user?.id;
                          const chatMsgs = messages.filter(m => m.chat_id === effectiveChatId);
                          const showTime = mIdx === chatMsgs.length - 1 || chatMsgs[mIdx + 1]?.sender_id !== msg.sender_id;
                          
                          return (
                            <div key={msg.message_id || mIdx} className={`message-row ${isMe ? 'me' : 'them'}`}>
                              {!isMe && (
                                <div className="msg-avatar-small">
                                  {getPartnerAvatar(activeGroup)}
                                </div>
                              )}
                              <div className="message-content">
                                <div className="message-bubble">
                                  {msg.image_url && (
                                    <div className="chat-msg-image-wrap" style={{ marginBottom: msg.message_text ? '8px' : '0' }}>
                                      <img 
                                        src={msg.image_url} 
                                        alt="Uploaded attachment" 
                                        onClick={() => window.open(msg.image_url, '_blank')}
                                      />
                                    </div>
                                  )}
                                  {msg.message_text && <span style={{ display: 'block', wordBreak: 'break-word' }}>{msg.message_text}</span>}
                                </div>
                                {showTime && <span className="message-time">{formatTime(msg.created_at)}</span>}
                              </div>
                            </div>
                          );
                        })
                      }
                      
                      {/* System Notices in Timeline */}
                      {currentChat && (currentChat.chat_status === 'Completed' || currentChat.order_status === 'Completed') && (
                        <div className="chat-system-notice completed">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '6px'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          This request has been marked as completed.
                        </div>
                      )}
                      
                      {currentChat && (currentChat.chat_status === 'Cancelled' || currentChat.order_status === 'Cancelled') && (
                        <div className="chat-system-notice cancelled">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '6px'}}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                          This request has been cancelled.
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {canType ? (
                  <div className="chat-input-wrapper-outer" style={{ position: 'relative', width: '100%' }}>
                    {imagePreview && (
                      <div className="chat-image-preview-container">
                        <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img src={imagePreview} alt="Selected attachment preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {imageUploading && (
                            <div style={{
                              position: 'absolute',
                              top: 0, left: 0, right: 0, bottom: 0,
                              backgroundColor: 'rgba(0,0,0,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <svg className="spinner-icon-btn" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                                <path d="M12 2C6.477 2 2 6.477 2 12a10 10 0 0 0 10 10" strokeLinecap="round" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#334155' }}>{selectedImage?.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{(selectedImage?.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={clearSelectedImage}
                          disabled={imageUploading}
                          style={{
                            background: '#fee2e2',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}
                          title="Remove attachment"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                      <button 
                        type="button" 
                        className="icon-btn attachment-btn" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading}
                        title="Attach image"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                      />
                      <input 
                        type="text" 
                        placeholder="Type your message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={imageUploading}
                      />
                      <button type="submit" className="send-btn" disabled={(!newMessage.trim() && !selectedImage) || imageUploading}>
                        {imageUploading ? (
                          <svg className="spinner-icon-btn" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                            <path d="M12 2C6.477 2 2 6.477 2 12a10 10 0 0 0 10 10" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="chat-input-disabled">
                    {currentChat?.chat_status === 'Restricted' ? (
                      <span>This conversation has been restricted by an admin. Chat is disabled.</span>
                    ) : currentChat?.order_status === 'Pending' ? (
                      <span>Chat will become active once the seller accepts your request.</span>
                    ) : currentChat?.chat_status === 'Cancelled' || currentChat?.order_status === 'Cancelled' ? (
                      <span>This order has been cancelled. Chat is disabled.</span>
                    ) : (
                      <span>This conversation is marked as completed. Chat is disabled.</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="chat-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <h3>Your Messages</h3>
                <p>Select a chat from the sidebar to start messaging.</p>
              </div>
            )}
          </div>
        </div>

        {/* Report Modal */}
        {reportModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Report Conversation</h3>
              <p>Please provide a reason for reporting this conversation.</p>
              <textarea 
                value={reportReason} 
                onChange={e => setReportReason(e.target.value)}
                placeholder="Reason..."
                rows="4"
              ></textarea>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setReportModalOpen(false)}>Cancel</button>
                <button className="btn-danger" onClick={submitReport} disabled={!reportReason.trim()}>Submit Report</button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '480px', width: '90%' }}>
              <h3>Leave a Review</h3>
              <p>Rate your experience with this order.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4B5563' }}>Overall Rating</span>
                <div className="rating-selector" style={{ display: 'flex', justifyContent: 'center' }}>
                  {[1,2,3,4,5].map(star => (
                    <svg 
                      key={star}
                      onClick={() => setReviewRating(star)}
                      width="32" height="32" viewBox="0 0 24 24" 
                      fill={star <= reviewRating ? "#F59E0B" : "none"} 
                      stroke={star <= reviewRating ? "#F59E0B" : "#D1D5DB"} 
                      strokeWidth="2"
                      style={{cursor:'pointer', margin: '0 4px'}}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  ))}
                </div>
              </div>

              {currentChat?.item_type === 'skill' && (
                <div className="ord-graded-metrics" style={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', textAlign: 'left', display: 'block' }}>
                    Session Graded Metrics
                  </span>
                  
                  {/* Communication Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Communication</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          onClick={() => setCommunicationRating(star)}
                          onMouseEnter={() => setCommHover(star)}
                          onMouseLeave={() => setCommHover(0)}
                          width="20" height="20" viewBox="0 0 24 24" 
                          fill={star <= (commHover || communicationRating) ? "#F59E0B" : "none"} 
                          stroke={star <= (commHover || communicationRating) ? "#F59E0B" : "#D1D5DB"} 
                          strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      ))}
                    </div>
                  </div>

                  {/* Teaching Quality Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Teaching Quality</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          onClick={() => setTeachingRating(star)}
                          onMouseEnter={() => setTeachHover(star)}
                          onMouseLeave={() => setTeachHover(0)}
                          width="20" height="20" viewBox="0 0 24 24" 
                          fill={star <= (teachHover || teachingRating) ? "#F59E0B" : "none"} 
                          stroke={star <= (teachHover || teachingRating) ? "#F59E0B" : "#D1D5DB"} 
                          strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      ))}
                    </div>
                  </div>

                  {/* Learning Outcomes Rating */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151' }}>Learning Outcomes</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          onClick={() => setOutcomeRating(star)}
                          onMouseEnter={() => setOutcomeHover(star)}
                          onMouseLeave={() => setOutcomeHover(0)}
                          width="20" height="20" viewBox="0 0 24 24" 
                          fill={star <= (outcomeHover || outcomeRating) ? "#F59E0B" : "none"} 
                          stroke={star <= (outcomeHover || outcomeRating) ? "#F59E0B" : "#D1D5DB"} 
                          strokeWidth="2"
                          style={{ cursor: 'pointer' }}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentChat?.item_type === 'product' && (
                <div style={{
                  backgroundColor: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  marginBottom: '16px',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px', textAlign: 'left', display: 'block' }}>
                    🛡️ Verified Purchase Metrics
                  </span>
                  {[
                    { label: 'Product Quality', val: productQualityRating, hover: productQualityHover, setVal: setProductQualityRating, setHover: setProductQualityHover },
                    { label: 'Value for Money', val: valueRating, hover: valueHover, setVal: setValueRating, setHover: setValueHover },
                    { label: 'Seller Communication', val: sellerCommRating, hover: sellerCommHover, setVal: setSellerCommRating, setHover: setSellerCommHover }
                  ].map(({ label, val, hover, setVal, setHover }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0C4A6E' }}>{label}</span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star}
                            onClick={() => setVal(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            width="20" height="20" viewBox="0 0 24 24"
                            fill={star <= (hover || val) ? "#F59E0B" : "none"}
                            stroke={star <= (hover || val) ? "#F59E0B" : "#D1D5DB"}
                            strokeWidth="2"
                            style={{ cursor: 'pointer' }}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <textarea 
                value={reviewText} 
                onChange={e => setReviewText(e.target.value)}
                placeholder="Write your review..."
                rows="4"
                style={{ width: '100%', boxSizing: 'border-box' }}
              ></textarea>
              
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setReviewModalOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={submitReview}>Submit Review</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
