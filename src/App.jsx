import { Component, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SuperAdminProvider } from './context/SuperAdminContext';
import { AdminSocieteProvider } from './context/AdminSocieteContext';
import { AppProvider, useApp } from './context/AppContext';

import LoginPage from './components/LoginPage';
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';
import AdminSocieteLayout from './components/adminsociete/AdminSocieteLayout';
import WorkspaceDashboard from './components/workspace/WorkspaceDashboard';

import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import MeetingRoom from './components/MeetingRoom';
import ContactInfo from './components/ContactInfo';
import Settings from './components/Settings';
import NewChat, { NewGroup } from './components/NewChat';
import SearchModal from './components/SearchModal';
import CallOverlay from './components/CallOverlay';

import './App.css';

class ChatPaneErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Erreur de rendu dans la messagerie :', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ margin: 'auto', padding: 24, textAlign: 'center' }}>
        <h2>Cette discussion ne peut pas s’afficher</h2>
        <p style={{ margin: '12px 0', color: 'var(--text-secondary)' }}>
          {import.meta.env.DEV
            ? this.state.error.message
            : 'Une erreur inattendue est survenue. Rechargez la page et réessayez.'}
        </p>
        <button className="sa-btn sa-btn--primary" onClick={() => window.location.reload()}>
          Recharger la messagerie
        </button>
      </div>
    );
  }
}

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
    messagingError,
    setMessagingError,
    groupInvitations,
    respondGroupInvitation,
    activeCall,
    incomingCall,
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
      {messagingError && (
        <div className="messaging-global-error" role="alert">
          <span>{messagingError}</span>
          <button type="button" onClick={() => setMessagingError('')} aria-label="Fermer">×</button>
        </div>
      )}
      {groupInvitations?.length > 0 && (
        <div className="group-invitation-overlay" role="presentation">
          <section className="group-invitation-dialog" role="dialog" aria-modal="true" aria-labelledby="group-invitation-title">
            <span className="group-invitation-eyebrow">Invitation à rejoindre</span>
            <h2 id="group-invitation-title">{groupInvitations[0].group_name}</h2>
            <p>{groupInvitations[0].invited_by} vous invite à rejoindre ce groupe.</p>
            <div className="group-invitation-actions">
              <button type="button" className="group-invitation-decline" onClick={() => respondGroupInvitation(groupInvitations[0], 'decline')}>Refuser</button>
              <button type="button" className="group-invitation-accept" onClick={() => respondGroupInvitation(groupInvitations[0], 'accept')}>Accepter et rejoindre</button>
            </div>
            {groupInvitations.length > 1 && <small>+ {groupInvitations.length - 1} autre(s) invitation(s) en attente</small>}
          </section>
        </div>
      )}

      <div className="app-container">
        <aside className={`app-sidebar ${sidebarHiddenMobile ? 'hidden-mobile' : ''}`}>
          <Sidebar />
        </aside>
        <main className={`app-main ${mainHiddenMobile ? 'hidden-mobile' : ''}`}>
          <ChatPaneErrorBoundary>
            {activeMeetingId ? <MeetingRoom /> : <ChatWindow />}
          </ChatPaneErrorBoundary>
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
      {(activeCall || incomingCall) && <CallOverlay />}
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

  // Administrateur Société — périmètre limité à sa société
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

  // Dashboards opérationnels limités aux données accessibles par le rôle.
  return (
    <AppProvider>
      <WorkspaceDashboard />
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
