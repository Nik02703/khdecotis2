'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem('khd_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }
  }, []);

  const login = (email, password) => {
    const storedUsers = JSON.parse(localStorage.getItem('khd_users') || '[]');
    const foundUser = storedUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser({ name: foundUser.name, email: foundUser.email });
      localStorage.setItem('khd_user', JSON.stringify({ name: foundUser.name, email: foundUser.email }));
      return true;
    }
    return false;
  };

  const register = (name, email, password) => {
    const storedUsers = JSON.parse(localStorage.getItem('khd_users') || '[]');
    if (storedUsers.some(u => u.email === email)) {
      return false; // Email exists
    }
    const newUser = { name, email, password };
    storedUsers.push(newUser);
    localStorage.setItem('khd_users', JSON.stringify(storedUsers));
    
    setUser({ name, email });
    localStorage.setItem('khd_user', JSON.stringify({ name, email }));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('khd_user');
  };

  return (
    <AuthContext.Provider value={{ user, isMounted, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isMounted: false,
      login: () => false,
      register: () => false,
      logout: () => {},
    };
  }
  return context;
}
