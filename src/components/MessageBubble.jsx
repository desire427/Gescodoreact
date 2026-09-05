import { useState, useRef } from 'react';
import { format } from 'date-fns';
import {
  Check, CheckCheck, Clock, Trash2, Reply, Copy, Star,
  Forward, ListTodo, CalendarPlus, Gavel, Pin,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

// ── Statut du message ────────────────────────────────────────────────────────
function StatusIcon({ status }) {
  if (status === 'sending')   return <Clock size={12} />;
  if (status === 'sent')      return <Check size={12} />;
  if (status === 'delivered') return <CheckCheck size={12} />;
  if (status === 'read')      return <CheckCheck size={12} style={{ color: '#53bdeb' }} />;
  return null;
}

// ── Réactions disponibles ────────────────────────────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

// ── Menu "Transformer en…" ────────────────────────────────────────────────────
function TransformMenu({ msg, onTransform, onClose }) {
  const items = [
    { icon: ListTodo,    label: 'Transformer en tâche',          action: 'task' },
    { icon: Gavel,       label: 'Transformer en décision',        action: 'decision' },
    { icon: CalendarPlus,label: 'Ajouter à l\'ordre du jour',    action: 'meeting' },
    { icon: Pin,         label: 'Épingler le message',            action: 'pin' },
    { icon: Forward,     label: 'Transférer',                     action: 'forward' },
  ];
  return (
    <div className="transform-menu" onClick={e => e.stopPropagation()}>
      <div className="transform-menu-backdrop" onClick={onClose} />
      <div className="transform-menu-popup">
        <div className="transform-menu-title">Actions sur ce message</div>
        {items.map(item => (
          <button
            key={item.action}
            className="transform-menu-item"
            onClick={() => { onTransform(item.action, msg); onClose(); }}
          >
            <item.icon size={15} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Bulle de message principale ───────────────────────────────────────────────
export default function MessageBubble({ msg, isMine, onDelete, contact, convId }) {
  const { setReplyingTo, toggleStarMessage, pinMessage, addReaction } = useApp();
  const [showActions, setShowActions]     = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [transformNotif, setTransformNotif] = useState(null);

  const time = msg.time ? format(new Date(msg.time), 'HH:mm') : '';

  // Message système
  if (msg.type === 'system') {
    return <div className="msg-system"><span>{msg.text}</span></div>;
  }

  const handleCopy   = () => { navigator.clipboard.writeText(msg.text); setShowActions(false); };
  const handleReply  = () => { setReplyingTo({ id: msg.id, text: msg.text, senderName: isMine ? 'Vous' : contact?.name || 'Contact' }); setShowActions(false); };
  const handleStar   = () => { toggleStarMessage(convId, msg.id); setShowActions(false); };
  const handleDelete = () => { onDelete(msg.id); setShowActions(false); };

  const handleReaction = (emoji) => {
    if (addReaction) addReaction(convId, msg.id, emoji);
    setShowReactions(false);
    setShowActions(false);
  };

  const handleTransform = (action, message) => {
    const labels = {
      task:     '✅ Tâche créée depuis ce message',
      decision: '⚖️ Décision créée depuis ce message',
      meeting:  '📅 Ajouté à l\'ordre du jour',
      pin:      '📌 Message épinglé',
      forward:  '↪️ Message transféré',
    };
    setTransformNotif(labels[action] || 'Action effectuée');
    if (action === 'pin' && pinMessage) pinMessage(convId, msg.id);
    setTimeout(() => setTransformNotif(null), 2500);
  };

  // Rendu réactions existantes sur ce message
  const reactions = msg.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, count]) => count > 0);

  return (
    <div
      className={`msg-row ${isMine ? 'mine' : 'theirs'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {/* Avatar (groupes / contact tiers) */}
      {!isMine && contact && !contact.isGroup && (
        <img
          src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}`}
          alt={contact.name}
          className="avatar avatar-xs msg-avatar"
        />
      )}

      <div className="msg-bubble-wrap">

        {/* ── Actions au survol ── */}
        {showActions && (
          <div className={`msg-actions ${isMine ? 'actions-left' : 'actions-right'}`}>
            {/* Réactions rapides */}
            <div className="msg-reaction-trigger">
              <button
                className="msg-action-btn"
                title="Réagir"
                onClick={() => setShowReactions(v => !v)}
              >😊</button>
              {showReactions && (
                <div className="msg-reaction-picker">
                  {QUICK_REACTIONS.map(e => (
                    <button key={e} className="msg-reaction-emoji" onClick={() => handleReaction(e)}>{e}</button>
                  ))}
                </div>
              )}
            </div>
            <button className="msg-action-btn" title="Répondre"  onClick={handleReply}><Reply size={14} /></button>
            <button
              className="msg-action-btn"
              title={msg.starred ? 'Retirer l\'étoile' : 'Étoiler'}
              onClick={handleStar}
            >
              <Star size={14} style={{ fill: msg.starred ? 'var(--wa-green)' : 'none', color: msg.starred ? 'var(--wa-green)' : undefined }} />
            </button>
            <button className="msg-action-btn" title="Plus d\'actions" onClick={() => setShowTransform(v => !v)}>
              ···
            </button>
            {isMine && (
              <button className="msg-action-btn danger" title="Supprimer" onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Menu Transformer en… ── */}
        {showTransform && (
          <TransformMenu
            msg={msg}
            onTransform={handleTransform}
            onClose={() => setShowTransform(false)}
          />
        )}

        {/* ── Bulle ── */}
        <div className={`msg-bubble ${isMine ? 'bubble-out' : 'bubble-in'} ${msg.pinned ? 'pinned' : ''}`}>
          {/* Nom expéditeur dans les groupes */}
          {!isMine && contact?.isGroup && (
            <span className="msg-sender-name" style={{ color: stringToColor(contact.id || '') }}>
              {contact.name}
            </span>
          )}

          {/* Message cité */}
          {msg.replyTo && (
            <div className="msg-reply-preview">
              <div className="msg-reply-bar" />
              <span className="msg-reply-text">{msg.replyTo.text}</span>
            </div>
          )}

          {/* Texte avec @mentions surlignées */}
          {msg.type === 'text' && (
            <p className="msg-text">
              {renderTextWithMentions(msg.text)}
              {msg.starred && <Star size={10} style={{ display:'inline', marginLeft:4, fill:'var(--wa-green)', color:'var(--wa-green)', verticalAlign:'middle' }} />}
              {msg.pinned && <Pin size={10} style={{ display:'inline', marginLeft:4, color:'#f59e0b', verticalAlign:'middle' }} />}
            </p>
          )}

          {msg.type === 'image' && (
            <div className="msg-media">
              <img src={msg.url} alt="Image" className="msg-image" />
              {msg.text && <p className="msg-caption">{msg.text}</p>}
            </div>
          )}

          {msg.type === 'audio' && (
            <div className="msg-audio">
              <div className="audio-waveform">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="wave-bar" style={{ height: `${8 + Math.sin(i) * 8 + 4}px` }} />
                ))}
              </div>
              <span className="audio-duration">0:30</span>
            </div>
          )}

          {msg.type === 'document' && (
            <div className="msg-document">
              <div className="msg-doc-icon">📄</div>
              <div className="msg-doc-info">
                <span className="msg-doc-name">{msg.fileName || 'Document'}</span>
                <span className="msg-doc-size">{msg.fileSize || ''}</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="msg-footer">
            <span className="msg-time">{time}</span>
            {isMine && <span className="msg-status-icon"><StatusIcon status={msg.status} /></span>}
          </div>
        </div>

        {/* ── Réactions affichées ── */}
        {reactionEntries.length > 0 && (
          <div className={`msg-reactions-bar ${isMine ? 'mine' : ''}`}>
            {reactionEntries.map(([emoji, count]) => (
              <button key={emoji} className="msg-reaction-chip" onClick={() => handleReaction(emoji)}>
                {emoji} {count > 1 && <span>{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* ── Notification transformation ── */}
        {transformNotif && (
          <div className="msg-transform-notif">{transformNotif}</div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function renderTextWithMentions(text) {
  if (!text) return null;
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="msg-mention">{part}</span>
      : part
  );
}

function stringToColor(str) {
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
