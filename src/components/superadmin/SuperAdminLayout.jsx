import { useState } from 'react';
import {
  LayoutDashboard, Building2, Users, ShieldCheck, BookOpen,
  Smartphone, Settings, LogOut, Bell, ChevronRight, Menu, X,
  ShieldAlert, MessageSquare, FolderKanban, CalendarDays,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import Dashboard from './Dashboard';
import Companies from './Companies';
import UsersManagement from './UsersManagement';
import RolesPermissions from './RolesPermissions';
import AuditLog from './AuditLog';
import SessionsDevices from './SessionsDevices';
import PlatformSettings from './PlatformSettings';
import Projects from './Projects';
import Meetings from './Meetings';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Tableau de bord',      icon: LayoutDashboard },
  { id: 'companies',  label: 'Sociétés',              icon: Building2 },
  { id: 'users',      label: 'Utilisateurs',          icon: Users },
  { id: 'projects',   label: 'Projets',               icon: FolderKanban },
  { id: 'meetings',   label: 'Réunions',              icon: CalendarDays },
  { id: 'roles',      label: 'Rôles & Accès',         icon: ShieldCheck },
  { id: 'audit',      label: 'Journal d\'audit',      icon: BookOpen },
  { id: 'sessions',   label: 'Sessions & Appareils',  icon: Smartphone },
  { id: 'settings',   label: 'Paramètres',            icon: Settings },
];

export default function SuperAdminLayout() {
  const { currentUser, goToLogin, openMessaging } = useAuth();
  const { stats, alerts }                         = useSuperAdmin();
  const [activeSection, setActiveSection]         = useState('dashboard');
  const [sidebarOpen, setSidebarOpen]             = useState(false);

  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard onNavigate={setActiveSection} />;
      case 'companies': return <Companies />;
      case 'users':     return <UsersManagement />;
      case 'projects':  return <Projects />;
      case 'meetings':  return <Meetings />;
      case 'roles':     return <RolesPermissions />;
      case 'audit':     return <AuditLog />;
      case 'sessions':  return <SessionsDevices />;
      case 'settings':  return <PlatformSettings />;
      default:          return <Dashboard onNavigate={setActiveSection} />;
    }
  };

  const handleNav = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  return (
    <div className="sa-root">
      {/* ── Sidebar ── */}
      <aside className={`sa-sidebar ${sidebarOpen ? 'sa-sidebar--open' : ''}`}>

        {/* Logo / Brand */}
        <div className="sa-brand">
          <div className="sa-brand-icon"><ShieldAlert size={22} /></div>
          <div className="sa-brand-text">
            <span className="sa-brand-name">KAB Platform</span>
            <span className="sa-brand-role">Super Administration</span>
          </div>
          <button className="sa-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation principale */}
        <nav className="sa-nav">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                className={`sa-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(item.id)}
              >
                <Icon size={18} className="sa-nav-icon" />
                <span className="sa-nav-label">{item.label}</span>
                {item.id === 'audit' && unresolvedAlerts > 0 && (
                  <span className="sa-nav-badge">{unresolvedAlerts}</span>
                )}
                {isActive && <ChevronRight size={14} className="sa-nav-chevron" />}
              </button>
            );
          })}
        </nav>

        {/* Séparateur */}
        <div className="sa-nav-divider" />

        {/* Bouton Discussions — accès à la messagerie */}
        <div className="sa-nav sa-nav--bottom">
          <button
            className="sa-nav-item sa-nav-item--messaging"
            onClick={() => { setSidebarOpen(false); openMessaging(); }}
          >
            <MessageSquare size={18} className="sa-nav-icon" />
            <span className="sa-nav-label">Discussions</span>
            <span className="sa-nav-tag">Messagerie</span>
          </button>
        </div>

        {/* Footer sidebar */}
        <div className="sa-sidebar-footer">
          <div className="sa-sidebar-user">
            <img src={currentUser?.avatar} alt={currentUser?.name} className="sa-avatar-sm" />
            <div className="sa-sidebar-user-info">
              <span className="sa-sidebar-user-name">{currentUser?.name}</span>
              <span className="sa-sidebar-user-role">Super Administrateur</span>
            </div>
          </div>
          <button className="sa-logout-btn" onClick={goToLogin} title="Se déconnecter">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Overlay mobile sidebar ── */}
      {sidebarOpen && (
        <div className="sa-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main ── */}
      <div className="sa-main">
        {/* Topbar */}
        <header className="sa-topbar">
          <button className="sa-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="sa-topbar-title">
            {NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Administration'}
          </div>
          <div className="sa-topbar-actions">
            <div className="sa-topbar-stats">
              <span className="sa-topbar-stat">
                <span className="dot dot--green" />
                {stats.onlineUsers} en ligne
              </span>
              <span className="sa-topbar-stat">
                <span className="dot dot--blue" />
                {stats.activeSessions} sessions
              </span>
            </div>
            <button className="sa-topbar-bell">
              <Bell size={18} />
              {unresolvedAlerts > 0 && (
                <span className="sa-bell-badge">{unresolvedAlerts}</span>
              )}
            </button>
            {/* Raccourci Discussions dans la topbar */}
            <button
              className="sa-topbar-msg-btn"
              onClick={openMessaging}
              title="Ouvrir les discussions"
            >
              <MessageSquare size={18} />
            </button>
            <img src={currentUser?.avatar} alt="" className="sa-avatar-sm sa-topbar-avatar" />
          </div>
        </header>

        {/* Contenu */}
        <main className="sa-content">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
