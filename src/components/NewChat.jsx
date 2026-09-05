import { useState, useRef } from 'react';
import { X, Search, Users, UserPlus, Check, Camera, ArrowRight, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

/* ─── Ligne contact réutilisable ─────────────────────────────── */
function ContactRow({ contact, selected, onSelect, rightElement }) {
  const src = contact.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name)}&backgroundColor=128C7E`;
  return (
    <button className={`contact-row ${selected ? 'selected' : ''}`} onClick={() => onSelect(contact)}>
      <div className="contact-row-avatar">
        <img src={src} alt={contact.name} className="avatar avatar-md" />
        {contact.online && <span className="online-dot" />}
      </div>
      <div className="contact-row-body">
        <span className="contact-row-name">{contact.name}</span>
        <span className="contact-row-about">{contact.about || contact.phone}</span>
      </div>
      {selected && !rightElement && <div className="contact-check"><Check size={14} /></div>}
      {rightElement}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   NOUVELLE DISCUSSION
══════════════════════════════════════════════════════════ */
export default function NewChat() {
  const { contacts, setShowNewChat, createConversation, setShowNewGroup } = useApp();
  const [search, setSearch] = useState('');

  const filtered = contacts
    .filter((c) => !c.isGroup)
    .filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
    );

  const grouped = filtered.reduce((acc, c) => {
    const letter = c.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(c);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
      <div className="side-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <button className="icon-btn" onClick={() => setShowNewChat(false)}><X size={20} /></button>
          <span className="panel-title">Nouvelle discussion</span>
        </div>

        <div className="panel-search">
          <Search size={16} />
          <input type="text" placeholder="Rechercher un contact" value={search}
            onChange={(e) => setSearch(e.target.value)} autoFocus />
        </div>

        <div className="panel-quick-actions">
          <button className="quick-action-list-btn" onClick={() => { setShowNewChat(false); setShowNewGroup(true); }}>
            <div className="quick-action-icon"><Users size={20} /></div>
            <span>Nouveau groupe</span>
          </button>
          <button className="quick-action-list-btn">
            <div className="quick-action-icon"><UserPlus size={20} /></div>
            <span>Nouveau contact</span>
          </button>
        </div>

        <div className="contacts-list">
          {Object.keys(grouped).sort().map((letter) => (
            <div key={letter}>
              <div className="contacts-letter-header">{letter}</div>
              {grouped[letter].map((c) => (
                <ContactRow key={c.id} contact={c} onSelect={(ct) => { createConversation(ct.id); setShowNewChat(false); }} />
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="empty-state"><p>Aucun contact trouvé</p></div>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   NOUVEAU GROUPE — 3 étapes comme WhatsApp
   Étape 1 : sélection des participants
   Étape 2 : nom + photo du groupe
   Étape 3 : (création → ouvre la conv)
══════════════════════════════════════════════════════════ */
export function NewGroup() {
  const { contacts, setShowNewGroup, createGroup, getContact, currentUser } = useApp();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);   // tableau de contacts
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(null); // dataURL
  const fileRef = useRef(null);

  const filterable = contacts.filter((c) => !c.isGroup && c.id !== 'me');
  const filtered = filterable.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (contact) => {
    setSelected((prev) =>
      prev.find((c) => c.id === contact.id)
        ? prev.filter((c) => c.id !== contact.id)
        : [...prev, contact]
    );
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setGroupAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    if (!groupName.trim() || selected.length === 0) return;
    createGroup(groupName.trim(), selected.map((c) => c.id), groupAvatar);
    setShowNewGroup(false);
  };

  const goBack = () => {
    if (step === 1) setShowNewGroup(false);
    else setStep(step - 1);
  };

  return (
    <div className="modal-overlay" onClick={() => setShowNewGroup(false)}>
      <div className="side-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="panel-header">
          <button className="icon-btn" onClick={goBack}><X size={20} /></button>
          <div style={{ flex: 1 }}>
            <span className="panel-title">{step === 1 ? 'Ajouter des participants' : 'Nouveau groupe'}</span>
            {step === 1 && <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{selected.length} / {filterable.length} sélectionné(s)</span>}
          </div>
          {step === 1 && selected.length > 0 && (
            <button className="fab-next" onClick={() => setStep(2)} title="Suivant">
              <ArrowRight size={20} />
            </button>
          )}
        </div>

        {/* ══ ÉTAPE 1 : Sélection des participants ══ */}
        {step === 1 && (
          <>
            {/* Chips des sélectionnés */}
            {selected.length > 0 && (
              <div className="selected-chips">
                {selected.map((c) => (
                  <div key={c.id} className="chip">
                    <img src={c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} className="avatar avatar-xs" alt="" />
                    <span>{c.name.split(' ')[0]}</span>
                    <button onClick={() => toggleSelect(c)} className="chip-remove"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="panel-search">
              <Search size={16} />
              <input type="text" placeholder="Rechercher un contact" value={search}
                onChange={(e) => setSearch(e.target.value)} autoFocus />
              {search && <button className="icon-btn" onClick={() => setSearch('')}><X size={14} /></button>}
            </div>

            <div className="contacts-list">
              {filtered.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  selected={!!selected.find((s) => s.id === c.id)}
                  onSelect={toggleSelect}
                />
              ))}
              {filtered.length === 0 && <div className="empty-state"><p>Aucun contact trouvé</p></div>}
            </div>
          </>
        )}

        {/* ══ ÉTAPE 2 : Nom et photo du groupe ══ */}
        {step === 2 && (
          <div className="group-setup-step">
            {/* Photo du groupe */}
            <div className="group-avatar-picker" onClick={() => fileRef.current?.click()}>
              {groupAvatar ? (
                <img src={groupAvatar} alt="Groupe" className="avatar" style={{ width: 100, height: 100 }} />
              ) : (
                <div className="group-avatar-placeholder">
                  <Camera size={32} />
                  <span>Ajouter une<br/>photo de groupe</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
            </div>

            {/* Nom du groupe */}
            <div className="group-name-field">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nom du groupe"
                maxLength={25}
                autoFocus
                className="group-name-input"
              />
              <span className="group-name-count">{groupName.length}/25</span>
            </div>

            {/* Liste des participants */}
            <div className="group-members-list">
              <p className="group-members-title">Participants · {selected.length + 1}</p>

              {/* Moi (admin) */}
              <div className="contact-row">
                <div className="contact-row-avatar">
                  <img src={currentUser.avatar} alt="Moi" className="avatar avatar-md" />
                </div>
                <div className="contact-row-body">
                  <span className="contact-row-name">Vous</span>
                  <span className="contact-row-about">Admin du groupe</span>
                </div>
                <span className="member-admin-badge">Admin</span>
              </div>

              {selected.map((c) => (
                <div key={c.id} className="contact-row">
                  <div className="contact-row-avatar">
                    <img src={c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} alt={c.name} className="avatar avatar-md" />
                  </div>
                  <div className="contact-row-body">
                    <span className="contact-row-name">{c.name}</span>
                    <span className="contact-row-about">{c.about || c.phone}</span>
                  </div>
                  <button className="icon-btn" onClick={() => toggleSelect(c)} title="Retirer">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Bouton créer */}
            <div className="group-create-footer">
              <button
                className={`fab-create ${groupName.trim() ? 'active' : ''}`}
                onClick={handleCreate}
                disabled={!groupName.trim()}
                title="Créer le groupe"
              >
                <Check size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
