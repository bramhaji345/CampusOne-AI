import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

function getInitialUser() {
  try {
    const raw = localStorage.getItem('user_profile') || sessionStorage.getItem('user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const cached = getInitialUser();
    if (token && cached) return false;
    return Boolean(token);
  });

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
        storage.setItem('user_profile', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user_profile');
        sessionStorage.removeItem('user_profile');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, role, { remember = false } = {}) => {
    const { data } = await api.post('/auth/login', { email, password, role });
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user_profile');
    sessionStorage.removeItem('user_profile');

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', data.token);
    storage.setItem('user_profile', JSON.stringify(data.user));

    setUser(data.user);
    window.dispatchEvent(new CustomEvent('campus:auth-changed', { detail: { loggedIn: true, token: data.token } }));
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user_profile');
    sessionStorage.removeItem('user_profile');
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
