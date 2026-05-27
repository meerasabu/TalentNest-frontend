/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const location = useLocation();
  const [userId, setUserId] = useState(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    return u?.id || null;
  });
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [activeChatId, setActiveChatId] = useState(null);
  
  const activeChatIdRef = useRef(activeChatId);

  // Sync user ID on route change (only update if it actually changed)
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const currentId = currentUser?.id || null;
    setUserId(prev => prev !== currentId ? currentId : prev);
  }, [location.pathname]);

  // Keep activeChatIdRef in sync
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Fetch all unread counts
  const fetchUnreadCounts = useCallback(async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!currentUser) return;
    try {
      // 1. Fetch unread chat count
      const chatRes = await api.get('/chats/unread/count');
      if (chatRes.data.success) {
        setUnreadChatCount(chatRes.data.count);
      }

      // 2. Fetch and calculate unread notification count
      const [buyerRes, sellerRes, restockRes] = await Promise.all([
        api.get(`/orders/buyer/${currentUser.id}`),
        api.get(`/orders/seller/${currentUser.id}`),
        api.get('/notifications').catch(err => {
          console.error('Error fetching restock notifications for counts:', err);
          return { data: { success: false, notifications: [] } };
        })
      ]);

      const deletedSaved = localStorage.getItem(`deleted_notifications_${currentUser.id}`);
      const deletedIds = deletedSaved ? JSON.parse(deletedSaved) : [];
      const readSaved = localStorage.getItem(`read_notifications_${currentUser.id}`);
      const readIds = readSaved ? JSON.parse(readSaved) : [];

      let notifCount = 0;

      if (buyerRes.data.success) {
        buyerRes.data.orders.forEach(o => {
          const notifId = `buyer-${o.id}`;
          if (!deletedIds.includes(notifId) && !readIds.includes(notifId)) {
            notifCount += 1;
          }
        });
      }

      if (sellerRes.data.success) {
        sellerRes.data.orders.forEach(o => {
          const notifId = `seller-${o.id}`;
          if (!deletedIds.includes(notifId) && !readIds.includes(notifId)) {
            notifCount += 1;
          }
        });
      }

      if (restockRes && restockRes.data && restockRes.data.success) {
        if (restockRes.data.notifications) {
          restockRes.data.notifications.forEach(n => {
            const notifId = `restock-${n.id}`;
            if (!deletedIds.includes(notifId) && !readIds.includes(notifId)) {
              notifCount += 1;
            }
          });
        }
        if (restockRes.data.generalNotifications) {
          restockRes.data.generalNotifications.forEach(n => {
            const notifId = `general-${n.id}`;
            if (!deletedIds.includes(notifId) && !readIds.includes(notifId)) {
              notifCount += 1;
            }
          });
        }
      }

      setUnreadNotificationCount(notifCount);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUnreadCounts();
      const interval = setInterval(fetchUnreadCounts, 10000);
      return () => clearInterval(interval);
    }
  }, [userId, fetchUnreadCounts]);

  return (
    <NotificationContext.Provider value={{
      unreadNotificationCount,
      setUnreadNotificationCount,
      unreadChatCount,
      setUnreadChatCount,
      activeChatId,
      setActiveChatId,
      fetchUnreadCounts
    }}>
      {children}
    </NotificationContext.Provider>
  );
};