import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function resolve(pref) {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return pref;
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(() => localStorage.getItem('theme') || 'light');
  const [theme, setResolved] = useState(() => resolve(localStorage.getItem('theme') || 'light'));

  useEffect(() => {
    const applied = resolve(pref);
    setResolved(applied);
    document.documentElement.setAttribute('data-theme', applied);
    localStorage.setItem('theme', pref);
  }, [pref]);

  const toggleTheme = () => setPref((t) => (resolve(t) === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, pref, toggleTheme, setTheme: setPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
