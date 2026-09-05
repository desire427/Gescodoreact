import { useState } from 'react';
import {
  MessageCircle, Circle, Phone, Settings, Search,
  MoreVertical, PenSquare, Archive, Moon, Sun, LogOut,
  Star, BellOff, CalendarDays,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ChatList from './ChatList';
import StatusView from './StatusView';
import CallsView from './CallsView';
import MeetingsView from './MeetingsView';

export default function Sidebar() {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    setShowSettings,
    setShowNewChat,
    setShowNewGroup,
    setShowSearch,
    setShowArchivedChats,
    showArchivedChats,
    archivedCount,
    darkMode,
    setDarkMode,
    totalUnread,
  } = useApp();

  const { goToLogin } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const tabs = [
    { id: 'chats',    icon: MessageCircle, label: 'Discussions' },
    { id: 'meetings', icon: CalendarDays,  label: 'Réunions' },
    { id: 'status',   icon: Circle,        label: 'Statuts' },
    { id: 'calls',    icon: Phone,         label: 'Appels' },
  ];

  const menuItems = [
    {
      icon: PenSquare,
      label: 'Nouveau groupe',
      action: () => { setShowNewGroup(true); setShowMenu(false); },
    },
    {
      icon: Archive,
      label: showArchivedChats ? 'Discussions actives' : 'Discussions archivées',
      action: () => {
        setShowArchivedChats(!showArchivedChats);
        setActiveTab('chats');
        setShowMenu(false);
      },
    },
    {
      icon: Star,
      label: 'Messages importants',
      action: () => { setShowSettings(true); setShowMenu(false); },
    },
    {
      icon: BellOff,
      label: 'Notifications',
      action: () => { setShowSettings(true); setShowMenu(false); },
    },
    {
      icon: darkMode ? Sun : Moon,
      label: darkMode ? 'Mode clair' : 'Mode sombre',
      action: () => { setDarkMode(!darkMode); setShowMenu(false); },
    },
    {
      icon: Settings,
      label: 'Paramètres',
      action: () => { setShowSettings(true); setShowMenu(false); },
    },
    {
      icon: LogOut,
      label: 'Déconnexion',
      action: () => { setShowMenu(false); goToLogin(); },
    },
  ];

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <button
          className="avatar-btn"
          onClick={() => setShowSettings(true)}
          title="Profil"
        >
          <img src={currentUser.avatar} alt={currentUser.name} className="avatar avatar-sm" />
        </button>

        <div className="sidebar-header-actions">
          <button
            className="icon-btn"
            onClick={() => setShowSearch(true)}
            title="Rechercher"
          >
            <Search size={20} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowNewChat(true)}
            title="Nouvelle discussion"
          >
            <PenSquare size={20} />
          </button>
          <div className="menu-wrapper">
            <button
              className="icon-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Plus d'options"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
                <div className="dropdown-menu">
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      className="dropdown-item"
                      onClick={item.action}
                    >
                      <item.icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.id); }}
          >
            <div className="tab-icon-wrap">
              <tab.icon size={18} />
              {tab.id === 'chats' && totalUnread > 0 && (
                <span className="badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
              )}
            </div>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {activeTab === 'chats'    && <ChatList />}
        {activeTab === 'meetings' && <MeetingsView />}
        {activeTab === 'status'   && <StatusView />}
        {activeTab === 'calls'    && <CallsView />}
      </div>
    </div>
  );
}
