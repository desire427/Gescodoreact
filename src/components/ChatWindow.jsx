import { useState, useRef, useEffect } from 'react';
import {
  Search, Phone, Video, MoreVertical, Smile, Paperclip,
  Mic, Send, ArrowLeft, BellOff, Trash2, Archive, Pin,
  UserCheck, X, AtSign, Megaphone, Users, Briefcase, FolderKanban,
  Reply,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import MessageBubble from './MessageBubble';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Labels types de canaux ───────────────────────────────────────────────────
const CHANNEL_TYPE_INFO = {
  annonce:   { label: 'Canal Annonce', icon: Megaphone,    color: '#ef4444' },
  direction: { label: 'Groupe Direction', icon: Briefcase, color: '#7c3aed' },
  service:   { label: 'Groupe Service', icon: Users,       color: '#2563eb' },
  projet:    { label: 'Groupe Projet', icon: FolderKanban, color: '#059669' },
  standard:  { label: 'Groupe', icon: Users,               color: '#64748b' },
};

function DateSeparator({ date }) {
  const d = new Date(date);
  let label;
  if (isToday(d))      label = "Aujourd'hui";
  else if (isYesterday(d)) label = 'Hier';
  else                 label = format(d, 'd MMMM yyyy', { locale: fr });
  return <div className="date-separator"><span>{label}</span></div>;
}

function groupMessagesByDate(msgs) {
  const groups = [];
  let currentDate = null;
  msgs.forEach((msg) => {
    const msgDate = format(new Date(msg.time), 'yyyy-MM-dd');
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ type: 'date', date: msg.time, id: `date-${msgDate}` });
    }
    groups.push({ type: 'message', msg });
  });
  return groups;
}

// ── Bandeau type de canal ─────────────────────────────────────────────────────
function ChannelBanner({ contact }) {
  if (!contact?.channelType || contact.channelType === 'standard') return null;
  const info = CHANNEL_TYPE_INFO[contact.channelType] || CHANNEL_TYPE_INFO.standard;
  const Icon = info.icon;
  return (
    <div className="channel-banner" style={{ background: info.color + '18', borderColor: info.color + '40' }}>
      <Icon size={13} style={{ color: info.color, flexShrink: 0 }} />
      <span style={{ color: info.color }}>{info.label}</span>
      {contact.announcersOnly && (
        <span className="channel-announce-tag">Publication réservée aux admins</span>
      )}
    </div>
  );
}

// ── Popup @mentions ───────────────────────────────────────────────────────────
function MentionPicker({ members, contacts, query, onSelect }) {
  const filtered = members
    .map(id => contacts.find(c => c.id === id))
    .filter(c => c && c.name?.toLowerCase().includes(query.toLowerCase()));

  if (!filtered.length) return null;
  return (
    <div className="mention-picker">
      {filtered.map(c => (
        <button key={c.id} className="mention-picker-item" onClick={() => onSelect(c.name)}>
          <img src={c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} alt="" className="avatar avatar-xs" />
          <span>{c.name}</span>
        </button>
      ))}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ChatWindow() {
  const {
    activeConversationId,
    getMessages, getContact, getConversation,
    sendMessage, deleteMessage, setShowContactInfo, showContactInfo,
    setActiveConversationId, togglePin, toggleMute, archiveConversation,
    deleteConversation, addCall, leaveGroup, contacts,
    saveDraft, getDraft, replyingTo, setReplyingTo,
    currentUser, sendTyping, typingUsers, setMessagingError, setShowSearch,
    appSettings,
  } = useApp();

  const [inputText, setInputText]     = useState('');
  const [showMenu, setShowMenu]       = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const typingTimerRef = useRef(null);
  // @mentions
  const [mentionQuery, setMentionQuery]   = useState(null); // string | null
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const getDraftRef = useRef(getDraft);
  getDraftRef.current = getDraft;

  const conv    = getConversation(activeConversationId);
  const contact = conv ? getContact(conv.contactId) : null;
  const msgs    = getMessages(activeConversationId);
  const grouped = groupMessagesByDate(msgs);
  const isGroup = contact?.isGroup;
  const isAnnounce = contact?.channelType === 'annonce';
  const activeTypers = typingUsers?.[String(activeConversationId)] || [];

  // Charger le brouillon quand on change de conversation
  useEffect(() => {
    if (activeConversationId) {
      const draft = getDraftRef.current ? getDraftRef.current(activeConversationId) : '';
      setInputText(draft || '');
      inputRef.current?.focus();
    }
  }, [activeConversationId]);

  // Sauvegarder le brouillon à chaque frappe
  useEffect(() => {
    if (activeConversationId && saveDraft) {
      saveDraft(activeConversationId, inputText);
    }
  }, [inputText, activeConversationId, saveDraft]);

  useEffect(() => () => {
    clearTimeout(typingTimerRef.current);
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const sent = await sendMessage(activeConversationId, inputText.trim(), 'text', replyingTo);
    if (sent) {
      setInputText('');
      setReplyingTo(null);
      setShowEmojiBar(false);
      if (saveDraft) saveDraft(activeConversationId, '');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const type = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio' : 'document';
    const sent = await sendMessage(activeConversationId, inputText.trim(), type, replyingTo, file);
    if (sent) {
      setInputText('');
      setReplyingTo(null);
    }
  };

  const startRecording = async (event) => {
    event.preventDefault();
    if (recorderRef.current?.state === 'recording') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = chunkEvent => {
        if (chunkEvent.data.size) chunks.push(chunkEvent.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        recorderRef.current = null;
        setIsRecording(false);
        const audio = new File(chunks, `voice-message-${Date.now()}.webm`, {
          type: recorder.mimeType || 'audio/webm',
        });
        await sendMessage(activeConversationId, '', 'audio', null, audio);
      };
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setMessagingError(error.message || 'L’accès au microphone a été refusé.');
    }
  };

  const stopRecording = (event) => {
    event.preventDefault();
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const handleKeyDown = (e) => {
    if (mentionQuery !== null) {
      if (e.key === 'Escape') { setMentionQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && appSettings.chat.enterToSend) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    sendTyping(activeConversationId, Boolean(val.trim()));
    clearTimeout(typingTimerRef.current);
    if (val.trim()) {
      typingTimerRef.current = setTimeout(
        () => sendTyping(activeConversationId, false), 1200
      );
    }
    // Détecter @mention
    const match = val.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const handleMentionSelect = (name) => {
    setInputText(prev => prev.replace(/@\w*$/, `@${name} `));
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const quickEmojis = ['😊', '😂', '❤️', '👍', '😍', '🎉', '🙏', '🔥', '😢', '😮', '👏', '🤔'];

  const menuItems = [
    { label: conv?.pinned ? 'Désépingler' : 'Épingler', icon: Pin, action: () => { togglePin(activeConversationId); setShowMenu(false); } },
    { label: conv?.muted ? 'Activer les notifications' : 'Sourdine', icon: BellOff, action: () => { toggleMute(activeConversationId); setShowMenu(false); } },
    { label: isGroup ? 'Infos du groupe' : 'Infos du contact', icon: UserCheck, action: () => { setShowContactInfo(true); setShowMenu(false); } },
    { label: conv?.archived ? 'Désarchiver' : 'Archiver', icon: Archive, action: () => { archiveConversation(activeConversationId); setShowMenu(false); } },
    isGroup
      ? { label: 'Quitter le groupe', icon: Trash2, danger: true, action: () => { setShowMenu(false); setConfirmModal({ message: `Quitter "${contact?.name}" ?`, onConfirm: () => { leaveGroup(activeConversationId); setConfirmModal(null); } }); } }
      : { label: 'Supprimer la discussion', icon: Trash2, danger: true, action: () => { setShowMenu(false); setConfirmModal({ message: `Supprimer la discussion avec ${contact?.name} ? Action irréversible.`, onConfirm: () => { deleteConversation(activeConversationId); setConfirmModal(null); } }); } },
  ];

  if (!activeConversationId || !conv) {
    return (
      <div className="chat-window-empty">
        <div className="empty-chat-content">
          <div className="empty-chat-icon">
            <svg viewBox="0 0 303 172" width="280" fill="none">
              <path d="M229.565 160.229C262.212 149.245 286 118.292 286 81.5C286 36.4741 249.526 0 204.5 0C183.564 0 164.415 7.99075 150 21.1089C135.585 7.99075 116.436 0 95.5 0C50.4741 0 14 36.4741 14 81.5C14 118.292 37.7883 149.245 70.4353 160.229C84.9047 164.839 100.245 167.5 116.092 167.5H187.908C203.755 167.5 219.095 164.839 229.565 160.229Z" fill="currentColor" opacity="0.06" />
            </svg>
          </div>
          <h2>KAB Platform</h2>
          <p>Messagerie professionnelle sécurisée.</p>
          <p className="empty-hint">Sélectionnez une discussion pour commencer</p>
        </div>
      </div>
    );
  }

  const avatarSrc = contact?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact?.name || '?')}&backgroundColor=128C7E`;

  const getStatusText = () => {
    if (contact?.channelType && CHANNEL_TYPE_INFO[contact.channelType]) {
      return `${contact.members?.length || 0} membres · ${CHANNEL_TYPE_INFO[contact.channelType].label}`;
    }
    if (contact?.isGroup) return `${contact.members?.length || 0} participants`;
    if (contact?.online) return 'En ligne';
    if (contact?.lastSeen) {
      const d = new Date(contact.lastSeen);
      if (isToday(d)) return `Vu aujourd'hui à ${format(d, 'HH:mm')}`;
      if (isYesterday(d)) return `Vu hier à ${format(d, 'HH:mm')}`;
      return `Vu le ${format(d, 'd MMM', { locale: fr })}`;
    }
    return '';
  };

  const canWrite = !isAnnounce
    || (contact?.admins || []).some(id => String(id) === String(currentUser.id));

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button className="icon-btn back-btn" onClick={() => setActiveConversationId(null)} title="Retour">
          <ArrowLeft size={20} />
        </button>
        <button className="chat-header-info" onClick={() => setShowContactInfo(!showContactInfo)}>
          {contact?.channelType && CHANNEL_TYPE_INFO[contact.channelType] ? (
            <div className="channel-avatar" style={{ background: CHANNEL_TYPE_INFO[contact.channelType].color + '22' }}>
              {(() => { const I = CHANNEL_TYPE_INFO[contact.channelType].icon; return <I size={20} style={{ color: CHANNEL_TYPE_INFO[contact.channelType].color }} />; })()}
            </div>
          ) : (
            <img src={avatarSrc} alt={contact?.name} className="avatar avatar-sm" />
          )}
          <div className="chat-header-text">
            <div className="chat-contact-name-row">
              <span className="chat-contact-name">{contact?.name || 'Inconnu'}</span>
              {contact?.channelType === 'annonce' && <span className="channel-type-badge">ANNONCE</span>}
            </div>
            <span className="chat-contact-status">
              {activeTypers.length ? 'En train d’écrire…' : getStatusText()}
            </span>
          </div>
        </button>
        <div className="chat-header-actions">
          {!isGroup && (
            <>
              <button className="icon-btn" title="Appel vidéo" onClick={() => addCall(conv.contactId, 'video', 'outgoing')}><Video size={20} /></button>
              <button className="icon-btn" title="Appel vocal"  onClick={() => addCall(conv.contactId, 'voice', 'outgoing')}><Phone size={20} /></button>
            </>
          )}
          <button className="icon-btn" title="Rechercher" onClick={() => setShowSearch(true)}><Search size={20} /></button>
          <div className="menu-wrapper">
            <button className="icon-btn" onClick={() => setShowMenu(!showMenu)} title="Plus d'options">
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
                <div className="dropdown-menu dropdown-right">
                  {menuItems.map(item => (
                    <button key={item.label} className={`dropdown-item ${item.danger ? 'danger' : ''}`} onClick={item.action}>
                      <item.icon size={15} /><span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bandeau type de canal */}
      <ChannelBanner contact={contact} />

      {/* Messages */}
      <div className="messages-area">
        <div className="messages-bg" />
        <div className="messages-list">
          {grouped.map(item =>
            item.type === 'date'
              ? <DateSeparator key={item.id} date={item.date} />
              : (
                <MessageBubble
                  key={item.msg.id}
                  msg={item.msg}
                  convId={activeConversationId}
                  isMine={String(item.msg.senderId) === String(currentUser.id)}
                  contact={contact?.isGroup ? getContact(item.msg.senderId) : contact}
                  onDelete={(msgId) => deleteMessage(activeConversationId, msgId)}
                />
              )
          )}
          {msgs.length === 0 && (
            <div className="no-messages">
              <div className="no-messages-bubble">
                🔒 Les échanges de cette conversation sont confidentiels.
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bandeau de réponse */}
      {replyingTo && (
        <div className="reply-bar">
          <Reply size={14} style={{ color: 'var(--wa-green-dark)', flexShrink: 0 }} />
          <div className="reply-bar-content">
            <span className="reply-bar-name">{replyingTo.senderName}</span>
            <span className="reply-bar-text">{replyingTo.text?.slice(0, 80)}{replyingTo.text?.length > 80 ? '…' : ''}</span>
          </div>
          <button className="icon-btn" onClick={() => setReplyingTo(null)}><X size={16} /></button>
        </div>
      )}

      {/* Emoji quick bar */}
      {showEmojiBar && (
        <div className="emoji-bar">
          <div className="emoji-bar-inner">
            {quickEmojis.map(e => <button key={e} className="emoji-btn" onClick={() => handleEmojiClick(e)}>{e}</button>)}
          </div>
          <button className="icon-btn" onClick={() => setShowEmojiBar(false)}><X size={16} /></button>
        </div>
      )}

      {/* Zone de saisie */}
      {canWrite ? (
        <div className="input-bar" style={{ position: 'relative' }}>
          {/* Popup @mention */}
          {mentionQuery !== null && isGroup && (
            <MentionPicker
              members={contact?.members || []}
              contacts={contacts}
              query={mentionQuery}
              onSelect={handleMentionSelect}
            />
          )}

          <button className={`icon-btn emoji-toggle ${showEmojiBar ? 'active' : ''}`} onClick={() => setShowEmojiBar(!showEmojiBar)} title="Emoji">
            <Smile size={22} />
          </button>
          <button className="icon-btn" title="Joindre un fichier" onClick={() => fileRef.current?.click()}>
            <Paperclip size={22} />
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
            onChange={handleFileChange}
          />
          {isGroup && (
            <button
              className="icon-btn"
              title="Mentionner"
              onClick={() => { setInputText(prev => prev + '@'); inputRef.current?.focus(); setMentionQuery(''); }}
            >
              <AtSign size={20} />
            </button>
          )}

          <div className="input-wrap">
            <textarea
              ref={inputRef}
              className="message-input"
              placeholder={isAnnounce ? 'Canal en lecture seule pour les membres' : 'Saisissez un message…'}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>

          {inputText.trim() ? (
            <button className="icon-btn send-btn" onClick={handleSend} title="Envoyer"><Send size={22} /></button>
          ) : (
            <button
              className={`icon-btn ${isRecording ? 'recording' : ''}`}
              title="Message vocal"
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
            >
              <Mic size={22} />
            </button>
          )}
        </div>
      ) : (
        <div className="channel-readonly-bar">
          <Megaphone size={14} />
          <span>Ce canal est en lecture seule pour les membres. Seuls les admins peuvent publier.</span>
        </div>
      )}

      {/* Modal confirmation */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p>{confirmModal.message}</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmModal(null)}>Annuler</button>
              <button className="btn-danger" onClick={confirmModal.onConfirm}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
