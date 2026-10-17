/**
 * AuthContext.jsx
 * Gestion de l'authentification via l'API Django JWT.
 * La messagerie (AppProvider / MessagingShell) reste inchangée.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi, TokenStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // currentUser : objet renvoyé par /auth/me/ ou null
  const [currentUser, setCurrentUser] = useState(null);
  // loading initial : on tente de restaurer la session depuis localStorage
  const [bootstrapping, setBootstrapping] = useState(true);
  // vue active : null (dashboard) | 'messaging'
  const [activeView, setActiveView] = useState(null);

  // ── Restauration de session au démarrage ────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const access = TokenStorage.getAccess();
      if (!access) {
        setBootstrapping(false);
        return;
      }
      try {
        const { data } = await authApi.me();
        setCurrentUser(normalizeUser(data));
      } catch {
        // Token invalide ou expiré — le refresh interceptor aura tenté le renouvellement
        TokenStorage.clear();
        setCurrentUser(null);
      } finally {
        setBootstrapping(false);
      }
    };
    restore();
  }, []);

  // ── Écoute l'événement de déconnexion forcée (token révoqué côté serveur) ──
  useEffect(() => {
    const handler = () => {
      setCurrentUser(null);
      setActiveView(null);
    };
    window.addEventListener('gescodo:logout', handler);
    return () => window.removeEventListener('gescodo:logout', handler);
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    TokenStorage.setTokens(data.access, data.refresh);
    const user = normalizeUser(data.user);
    setCurrentUser(user);
    setActiveView(null);
    return user;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────
  const goToLogin = useCallback(async () => {
    const refresh = TokenStorage.getRefresh();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch { /* ignore */ }
    TokenStorage.clear();
    setCurrentUser(null);
    setActiveView(null);
  }, []);

  // ── Messagerie ──────────────────────────────────────────────────────────
  const openMessaging  = useCallback(() => setActiveView('messaging'), []);
  const closeMessaging = useCallback(() => setActiveView(null), []);
  const updateAuthenticatedUser = useCallback((updates) => {
    setCurrentUser(previous => previous ? { ...previous, ...updates } : previous);
  }, []);

  // ── Dérivés ─────────────────────────────────────────────────────────────
  const isSuperAdmin       = currentUser?.role === 'superAdmin';
  const isAdminSociete     = currentUser?.role === 'adminSociete';
  const isManager          = currentUser?.role === 'manager';
  const isMessagingOpen    = activeView === 'messaging';

  if (bootstrapping) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f172a', color: '#94a3b8',
        fontFamily: 'system-ui, sans-serif', fontSize: 14, gap: 12,
      }}>
        <span style={{
          width: 20, height: 20, border: '2px solid #334155',
          borderTopColor: '#7c3aed', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', display: 'inline-block',
        }} />
        Chargement…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      goToLogin,
      openMessaging,
      closeMessaging,
      updateAuthenticatedUser,
      isMessagingOpen,
      isSuperAdmin,
      isAdminSociete,
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

// ─── Normalisation champs API → format frontend ───────────────────────────────
// Le backend renvoie snake_case ; le frontend utilisait camelCase avec les mocks.
function normalizeUser(u) {
  if (!u) return null;
  // Construire l'URL absolue si l'avatar est un chemin relatif
  let avatar = u.avatar || null;
  if (avatar && !avatar.startsWith('http')) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    avatar = `${base}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
  }
  return {
    id:               u.id,
    name:             u.name,
    email:            u.email,
    phone:            u.phone          || '',
    matricule:        u.matricule      || '',
    about:            u.about          || '',
    avatar,
    role:             u.role,
    status:           u.status,
    companyId:        u.company        ?? u.company_id  ?? null,
    departmentId:     u.department     ?? u.department_id ?? null,
    isOnline:         u.is_online      ?? false,
    twoFactorEnabled: u.two_factor_enabled ?? false,
    createdAt:        u.created_at,
    lastLogin:        u.last_login,
    exitedAt:         u.exited_at      || null,
    // champs enrichis (UserSerializer complet)
    companyName:      u.company_name   || '',
    departmentName:   u.department_name || '',
    devices:          (u.devices || []).map(normalizeDevice),
    activeSessions:   u.active_sessions ?? 0,
  };
}

function normalizeDevice(d) {
  return {
    id:         d.id,
    label:      d.label,
    type:       d.type,
    os:         d.os       || '',
    lastActive: d.last_active,
    isActive:   d.is_active,
    approved:   d.approved,
  };
}
