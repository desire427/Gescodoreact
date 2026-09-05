import { useState } from 'react';
import {
  LayoutDashboard, Users, FolderKanban, CalendarDays,
  Gavel, ListTodo, BookOpen, MessageSquare,
  LogOut, Bell, ChevronRight, Menu, X, Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdminSociete } from '../../context/AdminSocieteContext';

// Réutilisation des modules Super Admin existants
import Projects from '../superadmin/Projects';
import AuditLog from '../superadmin/AuditLog';
import Meetings from '../superadmin/Meetings';

// Modules propres à l'Admin Société / DG
import DashboardDG from './DashboardDG';
import DecisionsModule from './DecisionsModule';
import TasksModule from './TasksModule';
import UsersManagementAS from './UsersManagementAS';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Tableau de bord',   icon: LayoutDashboard },
  { id: 'users',      label: 'Utilisateurs',       icon: Users },
  { id: 'projects',   label: 'Projets',            icon: FolderKanban },
  { id: 'meetings',   label: 'Réunions',           icon: CalendarDays },
  { id: 'decisions',  label: 'Décisions',          icon: Gavel },
  { id: 'tasks',      label: 'Tâches',             icon: ListTodo },
  { id: 'audit',      label: 'Journal d\'audit',   icon: BookOpen },
];

export default function AdminSocieteLayout() {
  const { currentUser, goToLogin, openMessaging } = useAuth();
  const { company, stats }                         = useAdminSociete();
  const [activeSection, setActiveSection]          = useState('dashboard');
  const [sidebarOpen, setSidebarOpen]              = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardDG onNavigate={setActiveSection} />;
      case 'users':     return <UsersManagementAS />;
      case 'projects':  return <Projects />;
      case 'meetings':  return <Meetings />;
      case 'decisions': return <DecisionsModule />;
      case 'tasks':     return <TasksModule />;
      case 'audit':     return <AuditLog />;
      default:          return <DashboardDG onNavigate={setActiveSection} />;
    }
  };

  const handleNav = (id) => { setActiveSection(id); setSidebarOpen(false); };

  return (
    <div className="sa-root">
      {/* ── Sidebar ── */}
      <aside className={`sa-sidebar ${sidebarOpen ? 'sa-sidebar--open' : ''}`}>
        {/* Brand */}
        <div className="sa-brand">
          <div className="sa-brand-icon" style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
            <Building2 size={22} />
          </div>
          <div className="sa-brand-text">
            <span className="sa-brand-name">{company?.name || 'KAB'}</span>
            <span className="sa-brand-role" style={{ color: '#2563eb' }}>Admin Société / DG</span>
          </div>
          <button className="sa-sidebar-close" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>

        {/* Navigation */}
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
                {item.id === 'tasks' && stats.submittedTasks > 0 && (
                  <span className="sa-nav-badge">{stats.submittedTasks}</span>
                )}
                {item.id === 'decisions' && stats.pendingDecisions > 0 && (
                  <span className="sa-nav-badge" style={{ background: '#f59e0b' }}>{stats.pendingDecisions}</span>
                )}
                {isActive && <ChevronRight size={14} className="sa-nav-chevron" />}
              </button>
            );
          })}
        </nav>

        {/* Séparateur + Discussions */}
        <div className="sa-nav-divider" />
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

        {/* Footer */}
        <div className="sa-sidebar-footer">
          <div className="sa-sidebar-user">
            <img src={currentUser?.avatar} alt={currentUser?.name} className="sa-avatar-sm" />
            <div className="sa-sidebar-user-info">
              <span className="sa-sidebar-user-name">{currentUser?.name}</span>
              <span className="sa-sidebar-user-role" style={{ color: '#2563eb' }}>Admin Société / DG</span>
            </div>
          </div>
          <button className="sa-logout-btn" onClick={goToLogin} title="Se déconnecter">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sa-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="sa-main">
        <header className="sa-topbar">
          <button className="sa-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="sa-topbar-title">
            {NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Tableau de bord'}
          </div>
          <div className="sa-topbar-actions">
            <div className="sa-topbar-stats">
              <span className="sa-topbar-stat"><span className="dot dot--green" />{stats.onlineUsers} en ligne</span>
              <span className="sa-topbar-stat"><span className="dot dot--blue" />{stats.activeSessions} sessions</span>
            </div>
            <button className="sa-topbar-bell">
              <Bell size={18} />
              {(stats.submittedTasks + stats.lateTasks) > 0 && (
                <span className="sa-bell-badge" />
              )}
            </button>
            <button className="sa-topbar-msg-btn" onClick={openMessaging} title="Messagerie">
              <MessageSquare size={18} />
            </button>
            <img src={currentUser?.avatar} alt="" className="sa-avatar-sm sa-topbar-avatar" />
          </div>
        </header>
        <main className="sa-content">{renderSection()}</main>
      </div>
    </div>
  );
}
