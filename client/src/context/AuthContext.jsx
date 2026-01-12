import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../utils/api';

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

  const login = async (username, password) => {
    const userObj = await apiLogin(username, password);
    if (userObj) {
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

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  const value = {
    user,
    loading,
    login,
    loginGuest,
    logout,
    isAdmin: user?.role === 'admin',
    token: user?.token
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
