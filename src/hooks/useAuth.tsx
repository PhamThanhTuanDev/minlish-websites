import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getUserProfile } from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncAuthFromStorage = async () => {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
      const email = localStorage.getItem('email') || '';
      const userId = localStorage.getItem('userId') || '';
      let fullName =
        localStorage.getItem('fullName') ||
        localStorage.getItem('name') ||
        localStorage.getItem('username') ||
        '';

      if (token) {
        if (!fullName) {
          try {
            const profile = await getUserProfile();
            fullName = (profile?.fullName || '').trim();
            if (fullName) {
              localStorage.setItem('fullName', fullName);
            }
          } catch {
            // Keep auth usable even if profile endpoint is temporarily unavailable.
          }
        }

        setUser({
          id: userId,
          email,
          fullName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    void syncAuthFromStorage();

    const onStorageChanged = () => {
      void syncAuthFromStorage();
    };

    window.addEventListener('storage', onStorageChanged);
    window.addEventListener('focus', onStorageChanged);

    return () => {
      window.removeEventListener('storage', onStorageChanged);
      window.removeEventListener('focus', onStorageChanged);
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('name');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
