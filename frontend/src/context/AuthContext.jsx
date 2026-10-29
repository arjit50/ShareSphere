import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('sharesphere_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state using JWT cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authApi.getMe();
        if (res.data) {
          setUser(res.data);
          localStorage.setItem('sharesphere_user', JSON.stringify(res.data));
        } else {
          setUser(null);
          localStorage.removeItem('sharesphere_user');
        }
      } catch {
        // Cookie missing, invalid, or expired
        localStorage.removeItem('sharesphere_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const loggedInUser = res.data?.user || res.data;

    setUser(loggedInUser);
    localStorage.setItem('sharesphere_user', JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const newUser = res.data?.user || res.data;

    setUser(newUser);
    localStorage.setItem('sharesphere_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('sharesphere_user');
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('sharesphere_user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
