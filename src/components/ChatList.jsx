import { useState } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Pin,
  BellOff,
  Archive,
  Trash2,
  Check,
  CheckCheck,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Hier';
  if (isThisWeek(d)) return format(d, 'EEEE', { locale: fr });
  return format(d, 'dd/MM/yyyy');
}

function MessageStatus({ status, isMine }) {
  if (!isMine) return null;
  if (status === 'sent') return <Clock size={12} className="msg-status" />;
  if (status === 'delivered') return <CheckCheck size={12} className="msg-status" />;
  if (status === 'read') return <CheckCheck size={12} className="msg-status read" />;
  return <Check size={12} className="msg-status" />;
}

function ConvItem({ conv, contact, onOpen, onContextMenu }) {
  const { activeConversationId, currentUser } = useApp();
  const isActive = activeConversationId === conv.id;
  const lastMsg = conv.lastMessage;
  const isMine = String(lastMsg?.senderId) === String(currentUser.id);

  const getLastMsgPreview = () => {
    if (!lastMsg) return 'Démarrer une conversation...';
    if (lastMsg.type === 'image') return '📷 Photo';
    if (lastMsg.type === 'audio') return '🎵 Audio';
    if (lastMsg.type === 'video') return '🎥 Vidéo';
    if (lastMsg.type === 'document') return '📄 Document';
    if (contact?.isGroup && !isMine) {
      const sender = lastMsg.senderId;
      return `~${sender}: ${lastMsg.text}`;
    }
    return lastMsg.text;
  };

  const avatarSrc = contact?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact?.name || '?')}&backgroundColor=128C7E&fontFamily=Arial&fontSize=40`;

  return (
    <div
      className={`conv-item ${isActive ? 'active' : ''} ${conv.unread > 0 ? 'has-unread' : ''}`}
      onClick={() => onOpen(conv.id)}
      onContextMenu={(e) => onContextMenu(e, conv)}
    >
      <div className="conv-avatar-wrap">
        <img
          src={avatarSrc}
          alt={contact?.name}
          className="avatar avatar-md"
          onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact?.name || '?')}`; }}
        />
        {contact?.online && !contact?.isGroup && <span className="online-dot" />}
      </div>

      <div className="conv-body">
        <div className="conv-top">
          <span className="conv-name">
            {conv.pinned && <Pin size={11} className="pin-icon" />}
            {contact?.name || 'Inconnu'}
          </span>
          <span className={`conv-time ${conv.unread > 0 ? 'unread-time' : ''}`}>
            {formatTime(lastMsg?.time)}
          </span>
        </div>
        <div className="conv-bottom">
          <span className="conv-preview">
            {isMine && (
              <MessageStatus status={lastMsg?.status} isMine={true} />
            )}
            {getLastMsgPreview()}
          </span>
          <div className="conv-badges">
            {conv.muted && <BellOff size={12} className="muted-icon" />}
            {conv.unread > 0 && (
              <span className={`unread-badge ${conv.muted ? 'muted' : ''}`}>
                {conv.unread > 99 ? '99+' : conv.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatList() {
  const {
    conversations,
    getContact,
    openConversation,
    togglePin,
    toggleMute,
    archiveConversation,
    deleteConversation,
    leaveGroup,
    archivedCount,
    showArchivedChats,
    setShowArchivedChats,
  } = useApp();

  const [contextMenu, setContextMenu] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const contact = getContact(c.contactId);
    return contact?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleContextMenu = (e, conv) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, conv });
  };

  const closeMenu = () => setContextMenu(null);

  const pinnedConvs = filtered.filter((c) => c.pinned);
  const unpinnedConvs = filtered.filter((c) => !c.pinned);

  return (
    <div className="chat-list">
      {/* Search in list */}
      <div className="chat-list-search">
        <input
          type="text"
          placeholder="Rechercher ou démarrer une discussion"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Archived banner */}
      {!showArchivedChats && archivedCount > 0 && (
        <button className="archived-banner" onClick={() => setShowArchivedChats(true)}>
          <Archive size={16} />
          <span>Archivées</span>
          <span className="archived-count">{archivedCount}</span>
          <ChevronRight size={14} className="ml-auto" />
        </button>
      )}

      {showArchivedChats && (
        <button className="archived-banner back" onClick={() => setShowArchivedChats(false)}>
          <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
          <span>Retour aux discussions</span>
        </button>
      )}

      {/* Conversations list */}
      <div className="conv-list">
        {pinnedConvs.length > 0 && (
          <div className="conv-section-label">Épinglées</div>
        )}
        {pinnedConvs.map((conv) => (
          <ConvItem key={conv.id} conv={conv} contact={getContact(conv.contactId)}
            onOpen={openConversation} onContextMenu={handleContextMenu} />
        ))}

        {pinnedConvs.length > 0 && unpinnedConvs.length > 0 && (
          <div className="conv-section-label">Toutes les discussions</div>
        )}
        {unpinnedConvs.map((conv) => (
          <ConvItem key={conv.id} conv={conv} contact={getContact(conv.contactId)}
            onOpen={openConversation} onContextMenu={handleContextMenu} />
        ))}

        {filtered.length === 0 && (
          <div className="empty-state"><p>Aucune discussion trouvée</p></div>
        )}
      </div>

      {/* Menu contextuel (clic droit) */}
      {contextMenu && (() => {
        const conv = contextMenu.conv;
        const contact = getContact(conv.contactId);
        const isGroup = contact?.isGroup;
        return (
          <>
            <div className="menu-backdrop" onClick={closeMenu} />
            <div className="dropdown-menu context-menu"
              style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}>

              <button className="dropdown-item" onClick={() => { togglePin(conv.id); closeMenu(); }}>
                <Pin size={15} />
                <span>{conv.pinned ? 'Désépingler' : 'Épingler'}</span>
              </button>

              <button className="dropdown-item" onClick={() => { toggleMute(conv.id); closeMenu(); }}>
                <BellOff size={15} />
                <span>{conv.muted ? 'Activer les notifications' : 'Mettre en sourdine'}</span>
              </button>

              <button className="dropdown-item" onClick={() => { archiveConversation(conv.id); closeMenu(); }}>
                <Archive size={15} />
                <span>{conv.archived ? 'Désarchiver' : 'Archiver'}</span>
              </button>

              {/* Groupe → Quitter | Contact → Supprimer avec confirmation */}
              {isGroup ? (
                <button className="dropdown-item danger" onClick={() => {
                  closeMenu();
                  setConfirmModal({
                    message: `Quitter le groupe "${contact?.name}" ?\n\nVous ne pourrez plus voir les messages ni envoyer de nouveaux messages.`,
                    onConfirm: () => { leaveGroup(conv.id); setConfirmModal(null); },
                  });
                }}>
                  <Trash2 size={15} />
                  <span>Quitter le groupe</span>
                </button>
              ) : (
                <button className="dropdown-item danger" onClick={() => {
                  closeMenu();
                  setConfirmModal({
                    message: `Supprimer la discussion avec ${contact?.name} ?\n\nTous les messages seront définitivement supprimés. Cette action est irréversible.`,
                    onConfirm: () => { deleteConversation(conv.id); setConfirmModal(null); },
                  });
                }}>
                  <Trash2 size={15} />
                  <span>Supprimer la discussion</span>
                </button>
              )}
            </div>
          </>
        );
      })()}

      {/* Modal de confirmation */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message" style={{ whiteSpace: 'pre-line' }}>
              {confirmModal.message}
            </p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmModal(null)}>
                Annuler
              </button>
              <button className="btn-primary btn-danger" onClick={confirmModal.onConfirm}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
