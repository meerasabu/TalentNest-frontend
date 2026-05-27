/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

import { API_BASE_URL } from '../api/axiosConfig';

const PresenceContext = createContext({ onlineUsers: new Set(), isOnline: () => false });

export const usePresence = () => useContext(PresenceContext);

export const PresenceProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const socketRef = useRef(null);

  const isOnline = useCallback((userId) => {
    if (!userId) return false;
    return onlineUsers.has(Number(userId));
  }, [onlineUsers]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');

    // Only connect if the user is logged in
    if (!user || !token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      // Use a separate namespace path so it doesn't collide with the Messages socket
      // (same server, same default namespace is fine — both authenticate identically)
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Register the current user in the presence room
      socket.emit('join_user', user.id);
    });

    // Full snapshot sent once after join_user — hydrates initial online set
    socket.on('presence_snapshot', ({ onlineUserIds }) => {
      setOnlineUsers(new Set(onlineUserIds.map(Number)));
    });

    // Another user came online
    socket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(Number(userId));
        return next;
      });
    });

    // Another user went offline
    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(Number(userId));
        return next;
      });
    });

    socket.on('connect_error', (err) => {
      console.warn('PresenceContext socket connect error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Run once on mount — user/token won't change mid-session

  return (
    <PresenceContext.Provider value={{ onlineUsers, isOnline }}>
      {children}
    </PresenceContext.Provider>
  );
};
