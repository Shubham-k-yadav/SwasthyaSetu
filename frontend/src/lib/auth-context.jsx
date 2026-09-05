import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';











const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('swasthya_setu_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await api.auth.getMe(token);
      setUser(response.user);
    } catch (e) {
      localStorage.removeItem('swasthya_setu_token');
      setUser(null);
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
    setUser(response.user);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('swasthya_setu_token');
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
