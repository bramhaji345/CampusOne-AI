import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, role, { remember = false } = {}) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    (remember ? localStorage : sessionStorage).setItem('token', data.token);
    setUser(data.user);
    window.dispatchEvent(new CustomEvent('campus:auth-changed', { detail: { loggedIn: true, token: data.token } }));
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    window.dispatchEvent(new CustomEvent('campus:auth-changed', { detail: { loggedIn: false } }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
