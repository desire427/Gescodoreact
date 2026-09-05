import { createContext, useContext, useState, useCallback } from 'react';
import { users } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    // Toujours démarrer sur la page login — pas d'auto-login
    try { localStorage.removeItem('kab_session'); } catch {}
    return null;
  });

  // Vue active : 'messaging' | null (null = dashboard/admin)
  const [activeView, setActiveView] = useState(null);

  const login = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    if (['suspended', 'exited', 'archived'].includes(user.status)) return false;
    setCurrentUser(user);
    setActiveView(null); // démarre sur le dashboard
    return true;
  }, []);

  const goToLogin = useCallback(() => {
    setCurrentUser(null);
    setActiveView(null);
    try { localStorage.removeItem('kab_session'); } catch {}
  }, []);

  const openMessaging = useCallback(() => setActiveView('messaging'), []);
  const closeMessaging = useCallback(() => setActiveView(null), []);

  const isSuperAdmin       = currentUser?.role === 'superAdmin';
  const isAdminSociete     = currentUser?.role === 'adminSociete';
  const isDirecteurGeneral = currentUser?.role === 'directeurGeneral';
  const isManager          = currentUser?.role === 'manager';
  const isMessagingOpen    = activeView === 'messaging';

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      goToLogin,
      openMessaging,
      closeMessaging,
      isMessagingOpen,
      isSuperAdmin,
      isAdminSociete,
      isDirecteurGeneral,
      isManager,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
