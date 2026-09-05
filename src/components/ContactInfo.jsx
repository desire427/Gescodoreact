import { useState, useRef } from 'react';
import {
  X, Phone, Video, Search, Bell, BellOff, Archive, Trash2,
  ChevronDown, ChevronUp, Ban, ThumbsDown, Users, UserPlus,
  UserMinus, Shield, ShieldOff, Camera, Check, Edit2, UserX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

/* ─── Modal de confirmation ──────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message" style={{ whiteSpace: 'pre-line' }}>{message}</p>
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>Annuler</button>
          <button className={`btn-primary ${danger ? 'btn-danger' : ''}`} onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Panneau : Infos groupe ─────────────────────────────────── */
function GroupInfoPanel({ group, conv, onClose }) {
  const {
    currentUser, contacts, getContact,
    addGroupMember, removeGroupMember, leaveGroup, promoteToAdmin, demoteAdmin,
    updateGroup, archiveConversation, deleteConversation,
    toggleMute, addCall, activeConversationId,
  } = useApp();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [editingDesc, setEditingDesc] = useState(false);
  const [newDesc, setNewDesc] = useState(group.about || '');
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMedia, setShowMedia] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const fileRef = useRef(null);

  const isAdmin = (group.admins || []).includes('me');
  const members = (group.members || []).map((id) =>
    id === 'me' ? currentUser : getContact(id)
  ).filter(Boolean);

  const nonMembers = contacts.filter(
    (c) => !c.isGroup && !(group.members || []).includes(c.id)
  ).filter((c) =>
    c.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateGroup(group.id, { avatar: ev.target.result });
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    if (newName.trim()) { updateGroup(group.id, { name: newName.trim() }); }
    setEditingName(false);
  };

  const handleSaveDesc = () => {
    updateGroup(group.id, { about: newDesc.trim() });
    setEditingDesc(false);
  };

  const handleRemoveMember = (contactId) => {
    setConfirmModal({
      message: `Retirer ${getContact(contactId)?.name || 'ce membre'} du groupe ?`,
      onConfirm: () => { removeGroupMember(group.id, contactId); setConfirmModal(null); },
    });
  };

  const handleMakeAdmin = (contactId) => {
    const ct = getContact(contactId);
    const isAlreadyAdmin = (group.admins || []).includes(contactId);
    setConfirmModal({
      message: isAlreadyAdmin
        ? `Retirer les droits d'admin à ${ct?.name} ?`
        : `Nommer ${ct?.name} administrateur ?`,
      danger: false,
      onConfirm: () => {
        if (isAlreadyAdmin) demoteAdmin(group.id, contactId);
        else promoteToAdmin(group.id, contactId);
        setConfirmModal(null);
      },
    });
  };

  const MemberRow = ({ member, memberId }) => {
    const memberIsAdmin = (group.admins || []).includes(memberId);
    const [showMenu, setShowMenu] = useState(false);
    const isMe = memberId === 'me';
    const src = member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}&backgroundColor=128C7E`;

    return (
      <div className="member-item">
        <img src={src} alt={member.name} className="avatar avatar-md" />
        <div className="member-item-body">
          <span className="member-item-name">{isMe ? 'Vous' : member.name}</span>
          <span className="member-item-about">{member.about || member.phone || ''}</span>
        </div>
        {memberIsAdmin && <span className="member-admin-badge">Admin</span>}
        {isAdmin && !isMe && (
          <div className="menu-wrapper">
            <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}><ChevronDown size={14} /></button>
            {showMenu && (
              <>
                <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
                <div className="dropdown-menu dropdown-right">
                  <button className="dropdown-item" onClick={() => { handleMakeAdmin(memberId); setShowMenu(false); }}>
                    {memberIsAdmin ? <ShieldOff size={15} /> : <Shield size={15} />}
                    <span>{memberIsAdmin ? 'Retirer admin' : 'Nommer admin'}</span>
                  </button>
                  <button className="dropdown-item danger" onClick={() => { handleRemoveMember(memberId); setShowMenu(false); }}>
                    <UserMinus size={15} /><span>Retirer du groupe</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="contact-info-panel">
      {/* Header fixe */}
      <div className="panel-header">
        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        <span className="panel-title">Infos du groupe</span>
      </div>

      {/* Zone scrollable */}
      <div className="contact-info-scroll">
        {/* Photo + nom */}
        <div className="contact-info-hero">
          <div className="group-avatar-edit-wrap" onClick={() => isAdmin && fileRef.current?.click()}>
            <img
              src={group.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(group.name)}&backgroundColor=128C7E`}
              alt={group.name}
              className="avatar avatar-xl"
            />
            {isAdmin && (
              <div className="avatar-photo-overlay"><Camera size={24} /><span>Modifier</span></div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          {editingName ? (
            <div className="group-name-edit">
              <input
                value={newName} onChange={(e) => setNewName(e.target.value)}
                maxLength={25} autoFocus className="group-name-input-inline"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button className="icon-btn" onClick={handleSaveName}><Check size={18} style={{ color: 'var(--wa-green)' }} /></button>
              <button className="icon-btn" onClick={() => setEditingName(false)}><X size={18} /></button>
            </div>
          ) : (
            <div className="group-name-row">
              <h3 className="contact-info-name">{group.name}</h3>
              {isAdmin && <button className="icon-btn" onClick={() => setEditingName(true)}><Edit2 size={16} /></button>}
            </div>
          )}
          <p className="contact-info-phone">Groupe · {members.length} participants</p>
        </div>

        {/* Actions rapides */}
        <div className="contact-quick-actions">
          <button className="quick-action-btn" onClick={() => addCall(group.id, 'voice', 'outgoing')}>
            <Phone size={20} /><span>Appel</span>
          </button>
          <button className="quick-action-btn" onClick={() => addCall(group.id, 'video', 'outgoing')}>
            <Video size={20} /><span>Vidéo</span>
          </button>
          <button className="quick-action-btn" onClick={() => toggleMute(activeConversationId)}>
            {conv?.muted ? <Bell size={20} /> : <BellOff size={20} />}
            <span>{conv?.muted ? 'Activer' : 'Sourdine'}</span>
          </button>
          <button className="quick-action-btn"><Search size={20} /><span>Rechercher</span></button>
        </div>

        {/* Description du groupe */}
        <div className="info-section">
          <div className="info-row group-desc-row">
            <span className="info-label">Description</span>
            {isAdmin && !editingDesc && (
              <button className="icon-btn icon-btn-sm" onClick={() => { setNewDesc(group.about || ''); setEditingDesc(true); }}>
                <Edit2 size={14} />
              </button>
            )}
          </div>
          {editingDesc ? (
            <div className="group-desc-edit">
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                maxLength={512}
                autoFocus
                placeholder="Ajouter une description du groupe"
                className="group-desc-textarea"
                rows={3}
              />
              <div className="group-desc-edit-actions">
                <button className="btn-secondary btn-sm" onClick={() => setEditingDesc(false)}>Annuler</button>
                <button className="btn-primary btn-sm" onClick={handleSaveDesc}>Enregistrer</button>
              </div>
            </div>
          ) : (
            <div className="info-row" style={{ paddingTop: 0 }}>
              <span className="info-value group-desc-value">
                {group.about || (isAdmin ? '+ Ajouter une description' : 'Aucune description')}
              </span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Créé le</span>
            <span className="info-value">
              {group.createdAt ? format(new Date(group.createdAt), 'd MMM yyyy', { locale: fr }) : 'Date inconnue'}
            </span>
          </div>
        </div>

        {/* Médias */}
        <div className="info-section collapsible">
          <button className="section-toggle" onClick={() => setShowMedia(!showMedia)}>
            <span>Médias, liens et documents</span>
            {showMedia ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showMedia && <p className="no-media">Aucun média partagé</p>}
        </div>

        {/* Membres */}
        <div className="info-section">
          <div className="members-header">
            <span className="info-label" style={{ padding: '8px 20px', display: 'block' }}>
              {members.length} participant{members.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Ajouter un membre (admin seulement) */}
          {isAdmin && (
            <button className="member-item add-member-btn" onClick={() => setShowAddMember(!showAddMember)}>
              <div className="add-member-icon"><UserPlus size={20} /></div>
              <div className="member-item-body">
                <span className="member-item-name">Ajouter des participants</span>
              </div>
            </button>
          )}

          {/* Panneau ajout membre */}
          {showAddMember && (
            <div className="add-member-panel">
              <div className="panel-search" style={{ margin: '8px 12px' }}>
                <Search size={14} />
                <input type="text" placeholder="Rechercher" value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)} autoFocus />
              </div>
              {nonMembers.map((c) => (
                <button key={c.id} className="contact-row" onClick={() => { addGroupMember(group.id, c.id); setShowAddMember(false); setMemberSearch(''); }}>
                  <div className="contact-row-avatar">
                    <img src={c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} alt={c.name} className="avatar avatar-md" />
                  </div>
                  <div className="contact-row-body">
                    <span className="contact-row-name">{c.name}</span>
                    <span className="contact-row-about">{c.about || c.phone}</span>
                  </div>
                </button>
              ))}
              {nonMembers.length === 0 && <p className="no-media">Aucun contact à ajouter</p>}
            </div>
          )}

          {/* Liste des membres */}
          {members.map((member) => {
            const memberId = member.id === currentUser.id ? 'me' : member.id;
            return <MemberRow key={memberId} member={member} memberId={memberId} />;
          })}
        </div>

        {/* Actions danger — GROUPE */}
        <div className="info-section danger-section">
          <button className="danger-action-btn" onClick={() => { archiveConversation(activeConversationId); onClose(); }}>
            <Archive size={16} /><span>Archiver la discussion</span>
          </button>
          <button className="danger-action-btn red" onClick={() => setConfirmModal({
            message: 'Quitter ce groupe ?\n\nVous ne pourrez plus envoyer ni recevoir de messages dans ce groupe, et vous n\'aurez plus accès à l\'historique.',
            onConfirm: () => { leaveGroup(group.id); setConfirmModal(null); onClose(); },
          })}>
            <UserX size={16} /><span>Quitter le groupe</span>
          </button>
        </div>

        <div style={{ height: 32 }} />
      </div>

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          danger={confirmModal.danger !== false}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

/* ─── Panneau : Infos contact individuel ─────────────────────── */
function ContactInfoPanel({ contact, conv, onClose }) {
  const {
    activeConversationId, toggleMute, archiveConversation,
    deleteConversation, addCall, blockContact, isBlocked,
  } = useApp();

  const [showMedia, setShowMedia] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const blocked = isBlocked(contact.id);

  const getLastSeen = () => {
    if (contact.online) return 'En ligne';
    if (!contact.lastSeen) return '';
    const d = new Date(contact.lastSeen);
    if (isToday(d)) return `Vu aujourd'hui à ${format(d, 'HH:mm')}`;
    if (isYesterday(d)) return `Vu hier à ${format(d, 'HH:mm')}`;
    return `Vu le ${format(d, 'd MMM', { locale: fr })}`;
  };

  const src = contact.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}&backgroundColor=128C7E`;

  return (
    <div className="contact-info-panel">
      <div className="panel-header">
        <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        <span className="panel-title">Infos du contact</span>
      </div>

      <div className="contact-info-scroll">
        {/* Avatar + nom */}
        <div className="contact-info-hero">
          <img src={src} alt={contact.name} className="avatar avatar-xl" />
          <h3 className="contact-info-name">{contact.name}</h3>
          {contact.phone && <p className="contact-info-phone">{contact.phone}</p>}
          {contact.online && <span className="online-label">En ligne</span>}
          {contact.lastSeen && !contact.online && (
            <span className="last-seen-label">{getLastSeen()}</span>
          )}
        </div>

        {/* Actions rapides */}
        <div className="contact-quick-actions">
          <button className="quick-action-btn" onClick={() => addCall(contact.id, 'voice', 'outgoing')}>
            <Phone size={20} /><span>Appel</span>
          </button>
          <button className="quick-action-btn" onClick={() => addCall(contact.id, 'video', 'outgoing')}>
            <Video size={20} /><span>Vidéo</span>
          </button>
          <button className="quick-action-btn"><Search size={20} /><span>Rechercher</span></button>
          <button className="quick-action-btn" onClick={() => toggleMute(activeConversationId)}>
            {conv?.muted ? <Bell size={20} /> : <BellOff size={20} />}
            <span>{conv?.muted ? 'Activer' : 'Sourdine'}</span>
          </button>
        </div>

        {/* Infos */}
        <div className="info-section">
          <div className="info-row">
            <span className="info-label">Téléphone</span>
            <span className="info-value">{contact.phone || 'Non renseigné'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">À propos</span>
            <span className="info-value">{contact.about || 'Aucune info'}</span>
          </div>
        </div>

        {/* Médias */}
        <div className="info-section collapsible">
          <button className="section-toggle" onClick={() => setShowMedia(!showMedia)}>
            <span>Médias, liens et documents</span>
            {showMedia ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showMedia && <p className="no-media">Aucun média partagé</p>}
        </div>

        {/* Groupes en commun */}
        <div className="info-section collapsible">
          <button className="section-toggle" onClick={() => setShowGroups(!showGroups)}>
            <Users size={15} /><span>Groupes en commun</span>
            {showGroups ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showGroups && <p className="no-media">Aucun groupe en commun</p>}
        </div>

        {/* Actions danger — CONTACT INDIVIDUEL */}
        <div className="info-section danger-section">
          <button className="danger-action-btn" onClick={() => setConfirmModal({
            message: `Signaler ${contact.name} ?\n\nLes 5 derniers messages seront transmis à WhatsApp.`,
            onConfirm: () => setConfirmModal(null),
          })}>
            <ThumbsDown size={16} /><span>Signaler {contact.name}</span>
          </button>
          <button className="danger-action-btn" onClick={() => setConfirmModal({
            message: blocked
              ? `Débloquer ${contact.name} ?\n\nVous pourrez à nouveau recevoir ses messages.`
              : `Bloquer ${contact.name} ?\n\nCette personne ne pourra plus vous envoyer de messages.`,
            danger: !blocked,
            onConfirm: () => { blockContact(contact.id); setConfirmModal(null); },
          })}>
            <Ban size={16} />
            <span>{blocked ? `Débloquer ${contact.name}` : `Bloquer ${contact.name}`}</span>
          </button>
          <button className="danger-action-btn" onClick={() => { archiveConversation(activeConversationId); onClose(); }}>
            <Archive size={16} /><span>Archiver la discussion</span>
          </button>
          <button className="danger-action-btn red" onClick={() => setConfirmModal({
            message: `Supprimer la discussion avec ${contact.name} ?\n\nTous les messages seront définitivement supprimés. Cette action est irréversible.`,
            onConfirm: () => { deleteConversation(activeConversationId); setConfirmModal(null); onClose(); },
          })}>
            <Trash2 size={16} /><span>Supprimer la discussion</span>
          </button>
        </div>

        <div style={{ height: 32 }} />
      </div>

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          danger={confirmModal.danger !== false}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

/* ─── Export principal ───────────────────────────────────────── */
export default function ContactInfo() {
  const { activeConversationId, getContact, getConversation, setShowContactInfo } = useApp();

  const conv = getConversation(activeConversationId);
  const contact = conv ? getContact(conv.contactId) : null;

  if (!contact) return null;

  const onClose = () => setShowContactInfo(false);

  if (contact.isGroup) {
    return <GroupInfoPanel group={contact} conv={conv} onClose={onClose} />;
  }
  return <ContactInfoPanel contact={contact} conv={conv} onClose={onClose} />;
}
