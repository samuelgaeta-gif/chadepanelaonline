import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ id: number, nome: string, email: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect token from URL (for SSO redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      // Clean up URL without refreshing the page
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Failsafe: force loading to false after 3 seconds maximum no matter what
    const failsafe = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    if (token) {
      localStorage.setItem('token', token);
      if (user && user.id) {
        setLoading(false);
        clearTimeout(failsafe);
      } else {
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
          .then(res => {
            if (!res.ok) throw new Error('Not authorized');
            return res.json();
          })
          .then(data => {
            if (mounted) {
              setUser(data.user);
              setLoading(false);
            }
          })
          .catch(() => {
            if (mounted) {
              setToken(null);
              setUser(null);
              localStorage.removeItem('token');
              setLoading(false);
            }
          })
          .finally(() => {
            clearTimeout(failsafe);
          });
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      clearTimeout(failsafe);
    }
    return () => { 
      mounted = false; 
      clearTimeout(failsafe);
    };
  }, [token, user]);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
