import { useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneCall } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

function formatCallTime(date) {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Hier ' + format(d, 'HH:mm');
  return format(d, 'dd MMM, HH:mm', { locale: fr });
}

function CallIcon({ call }) {
  if (call.missed) return <PhoneMissed size={14} className="call-icon missed" />;
  if (call.type === 'incoming') return <PhoneIncoming size={14} className="call-icon incoming" />;
  return <PhoneOutgoing size={14} className="call-icon outgoing" />;
}

function CallItem({ call, contact, onCall }) {
  const avatarSrc =
    contact?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact?.name || '?')}&backgroundColor=128C7E`;

  return (
    <div className="call-item">
      <img src={avatarSrc} alt={contact?.name} className="avatar avatar-md" />

      <div className="call-body">
        <span className={`call-contact-name ${call.missed ? 'missed' : ''}`}>
          {contact?.name || 'Inconnu'}
        </span>
        <div className="call-meta">
          <CallIcon call={call} />
          <span className="call-type-label">
            {call.callType === 'video' ? 'Appel vidéo' : 'Appel vocal'}
            {call.duration ? ` · ${call.duration}` : ''}
          </span>
        </div>
      </div>

      <div className="call-right">
        <span className="call-time">{formatCallTime(call.time)}</span>
        <button
          className="icon-btn call-back-btn"
          onClick={() => onCall(contact?.id, call.callType)}
          title={call.callType === 'video' ? 'Rappeler en vidéo' : 'Rappeler'}
        >
          {call.callType === 'video' ? <Video size={18} /> : <Phone size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function CallsView() {
  const { calls, contacts, addCall, createConversation } = useApp();
  const [showDialer, setShowDialer] = useState(false);

  const getContact = (id) => contacts.find((c) => c.id === id);

  const handleCall = (contactId, callType) => {
    addCall(contactId, callType, 'outgoing');
    createConversation(contactId);
  };

  // Grouper par date
  const grouped = [];
  let lastDate = null;

  calls.forEach((call) => {
    const dateKey = format(new Date(call.time), 'yyyy-MM-dd');
    if (dateKey !== lastDate) {
      lastDate = dateKey;
      const d = new Date(call.time);
      let label;
      if (isToday(d)) label = "Aujourd'hui";
      else if (isYesterday(d)) label = 'Hier';
      else label = format(d, 'd MMMM', { locale: fr });
      grouped.push({ type: 'header', label, key: dateKey });
    }
    grouped.push({ type: 'call', call });
  });

  return (
    <div className="calls-view">
      <div className="calls-actions-row">
        <button className="new-call-btn" onClick={() => setShowDialer(true)}>
          <PhoneCall size={16} />
          <span>Nouvel appel</span>
        </button>
      </div>

      {showDialer && (
        <div className="modal-overlay" onClick={() => setShowDialer(false)}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <span>Nouvel appel 1 à 1</span>
              <button className="icon-btn" onClick={() => setShowDialer(false)}>×</button>
            </div>
            <div className="contacts-list">
              {contacts.map(contact => (
                <div className="contact-row" key={contact.id}>
                  <img
                    src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}`}
                    alt=""
                    className="avatar avatar-sm"
                  />
                  <span className="contact-row-name">{contact.name}</span>
                  <button
                    className="icon-btn"
                    title="Appel audio"
                    onClick={() => { addCall(contact.id, 'voice'); setShowDialer(false); }}
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    className="icon-btn"
                    title="Appel vidéo"
                    onClick={() => { addCall(contact.id, 'video'); setShowDialer(false); }}
                  >
                    <Video size={18} />
                  </button>
                </div>
              ))}
              {contacts.length === 0 && <p className="empty-state">Aucun contact disponible</p>}
            </div>
          </div>
        </div>
      )}

      <div className="calls-list">
        {grouped.map((item) =>
          item.type === 'header' ? (
            <div key={item.key} className="calls-date-header">
              {item.label}
            </div>
          ) : (
            <CallItem
              key={item.call.id}
              call={item.call}
              contact={getContact(item.call.contactId)}
              onCall={handleCall}
            />
          )
        )}

        {calls.length === 0 && (
          <div className="empty-state">
            <Phone size={40} className="empty-icon" />
            <p>Aucun appel récent</p>
          </div>
        )}
      </div>
    </div>
  );
}
