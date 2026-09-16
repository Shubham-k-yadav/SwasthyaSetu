import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';











const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('swasthya_setu_user') : null;
      const token = typeof window !== 'undefined' ? localStorage.getItem('swasthya_setu_token') : null;
      if (savedUser && token) {
        return JSON.parse(savedUser);
      }
    } catch (e) {}
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('swasthya_setu_token') : null;
    return !!token;
  });
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('swasthya_setu_token') : null;
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await api.auth.getMe(token);
      if (response?.user) {
        setUser(response.user);
        localStorage.setItem('swasthya_setu_user', JSON.stringify(response.user));
      }
    } catch (e) {
      // Only clear token if server explicitly rejected auth (e.g. 401 Unauthorized, 403 Forbidden)
      if (e.status === 401 || e.status === 403 || String(e.message || '').toLowerCase().includes('token') || String(e.message || '').toLowerCase().includes('denied')) {
        localStorage.removeItem('swasthya_setu_token');
        localStorage.removeItem('swasthya_setu_user');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password, portal) => {
    const response = await api.auth.login(email, password, portal);
    localStorage.setItem('swasthya_setu_token', response.token);
    if (response.user) {
      localStorage.setItem('swasthya_setu_user', JSON.stringify(response.user));
      setUser(response.user);
    }
    return true;
  };

  const logout = () => {
    localStorage.removeItem('swasthya_setu_token');
    localStorage.removeItem('swasthya_setu_user');
    setUser(null);
    navigate('/admin/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
