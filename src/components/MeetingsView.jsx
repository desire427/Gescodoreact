import { useState } from 'react';
import {
  Plus, Calendar, Clock, Users, CheckCircle2, Circle,
  Search, Video,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, isFuture, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import MeetingCreateModal from './MeetingCreateModal';

const STATUS_COLORS = {
  planned:   { color: '#3b82f6', label: 'Planifiée' },
  open:      { color: '#22c55e', label: 'En cours'  },
  closed:    { color: '#64748b', label: 'Clôturée'  },
  cancelled: { color: '#ef4444', label: 'Annulée'   },
};

const TYPE_LABELS = {
  direction:   'Direction',
  service:     'Service',
  projet:      'Projet',
  comite:      'Comité',
  exceptional: 'Exceptionnelle',
};

export default function MeetingsView() {
  const { meetings, activeMeetingId, setActiveMeetingId, createMeeting, contacts } = useApp();
  const [search, setSearch]         = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.ref?.toLowerCase().includes(search.toLowerCase())
  );

  // Trier : en cours > à venir > passées
  const sorted = [...filtered].sort((a, b) => {
    const oa = a.status === 'open' ? 0 : isFuture(new Date(a.scheduledAt)) ? 1 : 2;
    const ob = b.status === 'open' ? 0 : isFuture(new Date(b.scheduledAt)) ? 1 : 2;
    if (oa !== ob) return oa - ob;
    return new Date(a.scheduledAt) - new Date(b.scheduledAt);
  });

  const upcomingCount = meetings.filter(m => m.status === 'planned' && isFuture(new Date(m.scheduledAt))).length;

  return (
    <div className="meetings-sidebar">
      {/* Header */}
      <div className="meetings-sidebar-header">
        <span className="meetings-sidebar-title">Réunions</span>
        {upcomingCount > 0 && (
          <span className="meetings-sidebar-badge">{upcomingCount}</span>
        )}
        <button
          className="icon-btn"
          title="Nouvelle réunion"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Recherche */}
      <div className="meetings-search-wrap">
        <Search size={14} className="meetings-search-icon" />
        <input
          className="meetings-search-input"
          placeholder="Rechercher une réunion…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Liste */}
      <div className="meetings-list">
        {sorted.length === 0 && (
          <div className="meetings-empty">
            <Calendar size={32} style={{ opacity: .3 }} />
            <span>Aucune réunion</span>
            <button className="meetings-empty-btn" onClick={() => setShowCreate(true)}>
              Planifier une réunion
            </button>
          </div>
        )}
        {sorted.map(m => {
          const st = STATUS_COLORS[m.status] || STATUS_COLORS.planned;
          const isActive = activeMeetingId === m.id;
          const isUpcoming = isFuture(new Date(m.scheduledAt)) && m.status === 'planned';
          const isToday = new Date(m.scheduledAt).toDateString() === new Date().toDateString();
          const unreadMsgs = m.lastMessage ? 1 : 0;

          return (
            <button
              key={m.id}
              className={`meeting-item ${isActive ? 'active' : ''} ${isUpcoming ? 'upcoming' : ''}`}
              onClick={() => setActiveMeetingId(m.id)}
            >
              {/* Indicateur statut */}
              <div className="meeting-item-dot" style={{ background: st.color }} />

              <div className="meeting-item-body">
                <div className="meeting-item-row1">
                  <span className="meeting-item-title">{m.title}</span>
                  <span className="meeting-item-time">
                    {isToday
                      ? format(new Date(m.scheduledAt), 'HH:mm')
                      : format(new Date(m.scheduledAt), 'd MMM', { locale: fr })
                    }
                  </span>
                </div>
                <div className="meeting-item-row2">
                  <span className="meeting-item-type" style={{ color: st.color }}>
                    {TYPE_LABELS[m.type] || m.type}
                  </span>
                  <span className="meeting-item-meta">
                    <Users size={11} /> {m.participants.length}
                  </span>
                  <span className="meeting-item-meta">
                    <Clock size={11} /> {m.duration}min
                  </span>
                </div>
                {/* Aperçu dernier message discussion */}
                {m.lastMessage && (
                  <span className="meeting-item-last-msg">
                    {m.lastMessage.text?.slice(0, 40)}{m.lastMessage.text?.length > 40 ? '…' : ''}
                  </span>
                )}
              </div>

              {/* Badge non-lu / statut PV */}
              <div className="meeting-item-right">
                {m.pvStatus && m.pvStatus !== 'archived' && (
                  <span className="meeting-pv-mini-badge">PV</span>
                )}
                {m.status === 'open' && (
                  <span className="meeting-live-dot" title="En cours" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showCreate && (
        <MeetingCreateModal
          onClose={() => setShowCreate(false)}
          onSave={(data) => { createMeeting(data); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
