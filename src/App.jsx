import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SuperAdminProvider } from './context/SuperAdminContext';
import { AdminSocieteProvider } from './context/AdminSocieteContext';
import { AppProvider, useApp } from './context/AppContext';

import LoginPage from './components/LoginPage';
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';
import AdminSocieteLayout from './components/adminsociete/AdminSocieteLayout';

import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import MeetingRoom from './components/MeetingRoom';
import ContactInfo from './components/ContactInfo';
import Settings from './components/Settings';
import NewChat, { NewGroup } from './components/NewChat';
import SearchModal from './components/SearchModal';

import './App.css';

// ── Shell messagerie ──────────────────────────────────────────────────────────
function MessagingShell() {
  const {
    darkMode,
    showSettings,
    showContactInfo,
    activeConversationId,
    activeMeetingId,
    showNewChat,
    showNewGroup,
    showSearch,
  } = useApp();

  const { closeMessaging } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const sidebarHiddenMobile = !!activeConversationId || !!activeMeetingId || showSettings;
  const mainHiddenMobile    = !activeConversationId && !activeMeetingId;

  return (
    <div className={`app-root ${darkMode ? 'dark' : 'light'}`}>
      <div className="back-to-dashboard-bar">
        <button className="back-to-dashboard-btn" onClick={closeMessaging}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Retour au tableau de bord
        </button>
      </div>

      <div className="app-container">
        <aside className={`app-sidebar ${sidebarHiddenMobile ? 'hidden-mobile' : ''}`}>
          <Sidebar />
        </aside>
        <main className={`app-main ${mainHiddenMobile ? 'hidden-mobile' : ''}`}>
          {activeMeetingId ? <MeetingRoom /> : <ChatWindow />}
        </main>
        {showContactInfo && activeConversationId && !activeMeetingId && (
          <aside className="app-contact-info desktop-only-panel">
            <ContactInfo />
          </aside>
        )}
      </div>

      {showSettings && <div className="full-overlay settings-overlay"><Settings /></div>}
      {showContactInfo && activeConversationId && !activeMeetingId && (
        <div className="full-overlay contact-overlay"><ContactInfo /></div>
      )}
      {showNewChat  && <NewChat />}
      {showNewGroup && <NewGroup />}
      {showSearch   && <SearchModal />}
    </div>
  );
}

// ── Routeur principal ─────────────────────────────────────────────────────────
function AppRouter() {
  const { currentUser, isMessagingOpen } = useAuth();

  if (!currentUser) return <LoginPage />;

  // Messagerie ouverte depuis n'importe quel rôle
  if (isMessagingOpen) {
    return (
      <AppProvider>
        <MessagingShell />
      </AppProvider>
    );
  }

  // Super Admin
  if (currentUser.role === 'superAdmin') {
    return (
      <SuperAdminProvider>
        <SuperAdminLayout />
      </SuperAdminProvider>
    );
  }

  // Admin Société / DG — dashboard filtré sur sa société
  if (currentUser.role === 'adminSociete' && currentUser.companyId) {
    return (
      <AdminSocieteProvider
        companyId={currentUser.companyId}
        currentUserId={currentUser.id}
      >
        <AdminSocieteLayout />
      </AdminSocieteProvider>
    );
  }

  // Autres rôles (manager, employe, rh, chefProjet, auditeur)
  // → Interface messagerie directement (leur dashboard sera ajouté ensuite)
  return (
    <AppProvider>
      <MessagingShell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
