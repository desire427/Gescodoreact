import { useState } from 'react';
import { Plus, X, Check, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { companies as allCompanies, departments } from '../data/mockData';

const MEETING_TYPES = [
  { id: 'direction',   label: 'Direction' },
  { id: 'service',     label: 'Service' },
  { id: 'projet',      label: 'Projet' },
  { id: 'comite',      label: 'Comité' },
  { id: 'exceptional', label: 'Exceptionnelle' },
];

export default function MeetingCreateModal({ onClose, onSave }) {
  const { contacts } = useApp();

  const [form, setForm] = useState({
    title: '', type: 'direction', companyId: '',
    departmentId: '', scheduledAt: '', duration: 60,
    location: '', link: '',
    presidentId: '', secretaryId: '',
    participantIds: [],
    agenda: [{ id: `ag_${Date.now()}`, title: '', done: false, notes: '' }],
  });
  const [newAgendaItem, setNewAgendaItem] = useState('');

  // Participants : on utilise les contacts disponibles (messagerie)
  const availableParticipants = contacts.filter(c => !c.isGroup);
  const depts = departments.filter(d => d.companyId === form.companyId);

  const toggleParticipant = (id) => {
    setForm(p => ({
      ...p,
      participantIds: p.participantIds.includes(id)
        ? p.participantIds.filter(x => x !== id)
        : [...p.participantIds, id],
    }));
  };

  const addAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    setForm(p => ({
      ...p,
      agenda: [...p.agenda, { id: `ag_${Date.now()}`, title: newAgendaItem.trim(), done: false, notes: '' }],
    }));
    setNewAgendaItem('');
  };

  const removeAgendaItem = (id) => setForm(p => ({ ...p, agenda: p.agenda.filter(a => a.id !== id) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt) return;
    onSave({
      ...form,
      agenda: form.agenda.filter(a => a.title.trim()),
    });
  };

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box meeting-create-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 0 }}
      >
        {/* Header */}
        <div className="meeting-modal-header">
          <h3>Nouvelle réunion</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="meeting-modal-body">
          {/* Titre + Type */}
          <div className="mtg-form-row">
            <div className="mtg-form-field">
              <label>Titre *</label>
              <input value={form.title} onChange={e => f('title', e.target.value)} required autoFocus />
            </div>
            <div className="mtg-form-field mtg-form-field--sm">
              <label>Type *</label>
              <select value={form.type} onChange={e => f('type', e.target.value)}>
                {MEETING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Durée */}
          <div className="mtg-form-row">
            <div className="mtg-form-field">
              <label>Date et heure *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => f('scheduledAt', e.target.value)} required />
            </div>
            <div className="mtg-form-field mtg-form-field--sm">
              <label>Durée (min)</label>
              <input type="number" min={15} max={480} step={15} value={form.duration} onChange={e => f('duration', Number(e.target.value))} />
            </div>
          </div>

          {/* Lieu + Lien */}
          <div className="mtg-form-row">
            <div className="mtg-form-field">
              <label>Lieu (physique)</label>
              <input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Salle A, siège…" />
            </div>
            <div className="mtg-form-field">
              <label>Lien (virtuel)</label>
              <input value={form.link} onChange={e => f('link', e.target.value)} placeholder="https://meet…" />
            </div>
          </div>

          {/* Participants */}
          <div className="mtg-form-field">
            <label>Participants ({form.participantIds.length} sélectionné{form.participantIds.length > 1 ? 's' : ''})</label>
            <div className="mtg-participant-selector">
              {availableParticipants.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`mtg-participant-chip ${form.participantIds.includes(c.id) ? 'selected' : ''}`}
                  onClick={() => toggleParticipant(c.id)}
                >
                  <img src={c.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}`} alt="" className="avatar avatar-xs" />
                  <span>{c.name}</span>
                  {form.participantIds.includes(c.id) && <Check size={11} />}
                </button>
              ))}
            </div>
          </div>

          {/* Président + Secrétaire */}
          <div className="mtg-form-row">
            <div className="mtg-form-field">
              <label>Président de séance</label>
              <select value={form.presidentId} onChange={e => f('presidentId', e.target.value)}>
                <option value="">— Optionnel —</option>
                {availableParticipants.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="mtg-form-field">
              <label>Secrétaire</label>
              <select value={form.secretaryId} onChange={e => f('secretaryId', e.target.value)}>
                <option value="">— Optionnel —</option>
                {availableParticipants.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {/* Ordre du jour */}
          <div className="mtg-form-field">
            <label>Ordre du jour</label>
            <div className="mtg-agenda-list">
              {form.agenda.map((item, idx) => (
                <div key={item.id} className="mtg-agenda-item-row">
                  <span className="mtg-agenda-num">{idx + 1}.</span>
                  <input
                    value={item.title}
                    onChange={e => setForm(p => ({ ...p, agenda: p.agenda.map(a => a.id === item.id ? { ...a, title: e.target.value } : a) }))}
                    placeholder="Titre du point…"
                    className="mtg-agenda-input"
                  />
                  {form.agenda.length > 1 && (
                    <button type="button" className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => removeAgendaItem(item.id)}><X size={13} /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="mtg-agenda-add-row">
              <input
                value={newAgendaItem}
                onChange={e => setNewAgendaItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAgendaItem(); } }}
                placeholder="Ajouter un point…"
                className="mtg-agenda-input"
              />
              <button type="button" className="btn-ghost" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 12 }} onClick={addAgendaItem}>
                <Plus size={12} /> Ajouter
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="meeting-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary-meeting">
              <Check size={15} /> Créer et inviter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
