'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { role: 'admin' | 'guest', username: string }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persisted session
    const storedUser = localStorage.getItem('pes6_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    if (username === 'admin' && password === 'houssem99') {
      const userObj = { role: 'admin', username: 'Admin' };
      setUser(userObj);
      localStorage.setItem('pes6_user', JSON.stringify(userObj));
      return true;
    }
    return false;
  };

  const loginGuest = () => {
    const userObj = { role: 'guest', username: 'Guest' };
    setUser(userObj);
    localStorage.setItem('pes6_user', JSON.stringify(userObj));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pes6_user');
  };

  const value = {
    user,
    loading,
    login,
    loginGuest,
    logout,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
