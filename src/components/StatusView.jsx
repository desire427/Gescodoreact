import { useState } from 'react';
import { Plus, Camera, Edit3, X, ChevronRight, Eye } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_COLORS = [
  '#128C7E', '#25D366', '#075E54', '#1565C0',
  '#8E24AA', '#E53935', '#F4511E', '#FB8C00',
];

function StatusItem({ status, contact, onView }) {
  const viewed = status.items.every((i) => i.viewed);
  const latest = status.items[status.items.length - 1];

  return (
    <button className="status-item" onClick={() => onView(status)}>
      <div className={`status-avatar-ring ${viewed ? 'viewed' : 'unviewed'}`}>
        <img
          src={contact?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact?.name || '?')}&backgroundColor=128C7E`}
          alt={contact?.name}
          className="avatar avatar-md"
        />
      </div>
      <div className="status-info">
        <span className="status-contact-name">{contact?.name || 'Inconnu'}</span>
        <span className="status-time">
          {formatDistanceToNow(new Date(latest?.time), { addSuffix: true, locale: fr })}
        </span>
      </div>
    </button>
  );
}

function StatusViewer({ status, contact, onClose, onMarkViewed }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const item = status.items[currentIdx];

  const handleNext = () => {
    onMarkViewed(status.id, item.id);
    if (currentIdx < status.items.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  return (
    <div className="status-viewer-overlay" onClick={onClose}>
      <div className="status-viewer" onClick={(e) => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="status-progress-bars">
          {status.items.map((it, i) => (
            <div key={it.id} className="status-progress-bar">
              <div
                className="status-progress-fill"
                style={{ width: i < currentIdx ? '100%' : i === currentIdx ? '50%' : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="status-viewer-header">
          <img
            src={contact?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact?.name || '?')}`}
            alt={contact?.name}
            className="avatar avatar-xs"
          />
          <div>
            <span className="status-viewer-name">{contact?.name}</span>
            <span className="status-viewer-time">
              {format(new Date(item.time), 'HH:mm')}
            </span>
          </div>
          <button className="icon-btn ml-auto" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className="status-viewer-content"
          style={{ background: item.bg || '#128C7E' }}
        >
          {item.type === 'text' && (
            <p className="status-text-content">{item.content}</p>
          )}
          {item.type === 'image' && (
            <img src={item.url} alt="Status" className="status-image" />
          )}
        </div>

        {/* Navigation zones */}
        <div className="status-nav-prev" onClick={handlePrev} />
        <div className="status-nav-next" onClick={handleNext} />
      </div>
    </div>
  );
}

export default function StatusView() {
  const {
    currentUser,
    contacts,
    statuses,
    addStatus,
    markStatusViewed,
  } = useApp();

  const [showAddStatus, setShowAddStatus] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [selectedBg, setSelectedBg] = useState(STATUS_COLORS[0]);
  const [viewingStatus, setViewingStatus] = useState(null);

  const myStatus = statuses.find((s) => s.userId === 'me');
  const othersStatuses = statuses.filter((s) => s.userId !== 'me');

  const getContact = (userId) => {
    if (userId === 'me') return currentUser;
    return contacts.find((c) => c.id === userId);
  };

  const handleAddStatus = () => {
    if (!newStatusText.trim()) return;
    addStatus(newStatusText.trim(), selectedBg);
    setNewStatusText('');
    setShowAddStatus(false);
  };

  const handleView = (status) => {
    setViewingStatus(status);
  };

  return (
    <div className="status-view">
      {/* Mon statut */}
      <div className="status-section-title">Mon statut</div>
      <div className="my-status-row">
        <div className="my-status-avatar">
          <img src={currentUser.avatar} alt="Moi" className="avatar avatar-md" />
          <button
            className="add-status-btn"
            onClick={() => setShowAddStatus(true)}
            title="Ajouter un statut"
          >
            <Plus size={12} />
          </button>
        </div>
        <div className="my-status-info">
          {myStatus ? (
            <button className="status-item-text" onClick={() => handleView(myStatus)}>
              <span className="status-contact-name">Mon statut</span>
              <span className="status-time">
                {formatDistanceToNow(new Date(myStatus.items[myStatus.items.length - 1].time), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </button>
          ) : (
            <div>
              <span className="status-contact-name">Mon statut</span>
              <span className="status-time">Appuyez pour ajouter un statut</span>
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={() => setShowAddStatus(true)}>
          <Edit3 size={16} />
        </button>
        <button className="icon-btn">
          <Camera size={16} />
        </button>
      </div>

      {/* Statuts récents */}
      {othersStatuses.length > 0 && (
        <>
          <div className="status-section-title">Récents</div>
          {othersStatuses.map((s) => (
            <StatusItem
              key={s.id}
              status={s}
              contact={getContact(s.userId)}
              onView={handleView}
            />
          ))}
        </>
      )}

      {othersStatuses.length === 0 && !myStatus && (
        <div className="empty-state">
          <p>Les statuts de vos contacts apparaîtront ici</p>
        </div>
      )}

      {/* Modal ajout statut */}
      {showAddStatus && (
        <div className="modal-overlay" onClick={() => setShowAddStatus(false)}>
          <div className="modal add-status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Ajouter un statut texte</span>
              <button className="icon-btn" onClick={() => setShowAddStatus(false)}>
                <X size={18} />
              </button>
            </div>

            <div
              className="status-preview"
              style={{ background: selectedBg }}
            >
              <p className="status-preview-text">
                {newStatusText || 'Prévisualisation...'}
              </p>
            </div>

            <div className="color-picker">
              {STATUS_COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-btn ${selectedBg === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setSelectedBg(color)}
                />
              ))}
            </div>

            <textarea
              className="status-text-input"
              placeholder="Saisissez votre statut..."
              value={newStatusText}
              onChange={(e) => setNewStatusText(e.target.value)}
              maxLength={700}
              autoFocus
            />
            <div className="status-char-count">{newStatusText.length}/700</div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddStatus(false)}>
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={handleAddStatus}
                disabled={!newStatusText.trim()}
              >
                Publier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewer */}
      {viewingStatus && (
        <StatusViewer
          status={viewingStatus}
          contact={getContact(viewingStatus.userId)}
          onClose={() => setViewingStatus(null)}
          onMarkViewed={markStatusViewed}
        />
      )}
    </div>
  );
}
