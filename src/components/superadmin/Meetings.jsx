import { useState } from 'react';
import {
  Plus, Search, Calendar, Clock, Users, MapPin, FileText,
  X, Check, ChevronDown, ChevronRight, Circle,
  CheckCircle2, AlertCircle, SkipForward, ListTodo,
  Gavel, UserCheck, Mic, Link, ArrowLeft, Download,
  Megaphone,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { companies, departments } from '../../data/mockData';
import { format, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Constantes ────────────────────────────────────────────────────────────────
const MEETING_TYPES = [
  { id: 'direction', label: 'Direction' },
  { id: 'service',   label: 'Service' },
  { id: 'projet',    label: 'Projet' },
  { id: 'comite',    label: 'Comité' },
  { id: 'exceptional',label: 'Exceptionnelle' },
];

const PRESENCE_STATUSES = [
  { id: 'present',    label: 'Présent',     color: '#22c55e' },
  { id: 'absent',     label: 'Absent',      color: '#ef4444' },
  { id: 'excused',    label: 'Excusé',      color: '#f59e0b' },
  { id: 'late',       label: 'En retard',   color: '#f97316' },
  { id: 'delegated',  label: 'Représenté',  color: '#8b5cf6' },
];

const RESPONSE_STATUSES = [
  { id: 'present',  label: 'Présent',   color: '#22c55e' },
  { id: 'absent',   label: 'Absent',    color: '#ef4444' },
  { id: 'maybe',    label: 'Peut-être', color: '#f59e0b' },
  { id: 'delegated',label: 'Délégué',   color: '#8b5cf6' },
];

const PV_STATUSES = {
  draft:     { label: 'Brouillon',  color: '#64748b' },
  submitted: { label: 'Soumis',     color: '#3b82f6' },
  validated: { label: 'Validé',     color: '#22c55e' },
  diffused:  { label: 'Diffusé',    color: '#8b5cf6' },
  archived:  { label: 'Archivé',    color: '#94a3b8' },
};

const MTG_STATUS_INFO = {
  planned:   { label: 'Planifiée',  color: '#3b82f6', badgeClass: 'sa-badge--blue' },
  open:      { label: 'En cours',   color: '#22c55e', badgeClass: 'sa-badge--green' },
  closed:    { label: 'Clôturée',   color: '#64748b', badgeClass: 'sa-badge--gray' },
  cancelled: { label: 'Annulée',    color: '#ef4444', badgeClass: 'sa-badge--red' },
};

function getUserName(users, id) { return users.find(u => u.id === id)?.name || '—'; }
function getUserAvatar(users, id) { return users.find(u => u.id === id)?.avatar || null; }

// ── Modal Création Réunion ────────────────────────────────────────────────────
function MeetingCreateModal({ onClose, onSave, users }) {
  const [form, setForm] = useState({
    title: '', type: 'direction', companyId: '', departmentId: '',
    scheduledAt: '', duration: 60, location: '', link: '',
    organizerId: 'u_superadmin', presidentId: '', secretaryId: '',
    participants: [],
    agenda: [{ id: `ag_${Date.now()}`, title: '', done: false, notes: '' }],
    documents: [],
    projectId: null,
  });
  const [newAgendaItem, setNewAgendaItem] = useState('');

  const depts         = departments.filter(d => d.companyId === form.companyId);
  const companyUsers  = users.filter(u => u.companyId === form.companyId && u.status === 'active');
  const nonParticipants = companyUsers.filter(u => !form.participants.includes(u.id));

  const addAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    setForm(p => ({ ...p, agenda: [...p.agenda, { id: `ag_${Date.now()}`, title: newAgendaItem.trim(), done: false, notes: '' }] }));
    setNewAgendaItem('');
  };

  const removeAgendaItem = (id) => setForm(p => ({ ...p, agenda: p.agenda.filter(a => a.id !== id) }));

  const toggleParticipant = (userId) => {
    setForm(p => ({
      ...p,
      participants: p.participants.includes(userId)
        ? p.participants.filter(id => id !== userId)
        : [...p.participants, userId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt || !form.companyId) return;
    onSave({
      ...form,
      scheduledAt: new Date(form.scheduledAt),
      status: 'planned',
      pvStatus: null,
      pvRef: null,
      decisionIds: [],
      taskIds: [],
      createdAt: new Date(),
      participants: form.participants.map(id => ({
        userId: id, response: 'present', presence: null,
      })),
    });
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--lg" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Nouvelle réunion</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit} style={{ maxHeight: '75vh', overflowY: 'auto' }}>

          {/* Titre + Type */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Titre *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="sa-form-field sa-form-field--sm">
              <label>Type *</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {MEETING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Société + Service */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Société *</label>
              <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value, departmentId: '', participants: [], presidentId: '', secretaryId: '' }))} required>
                <option value="">— Choisir —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Direction / Service</label>
              <select value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
                <option value="">— Aucun —</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Durée */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Date et heure *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} required />
            </div>
            <div className="sa-form-field sa-form-field--sm">
              <label>Durée (min)</label>
              <input type="number" min={15} max={480} step={15} value={form.duration} onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))} />
            </div>
          </div>

          {/* Lieu + Lien */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Lieu (physique)</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Salle A, siège social…" />
            </div>
            <div className="sa-form-field">
              <label>Lien (virtuel)</label>
              <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="https://meet.example.com/…" />
            </div>
          </div>

          {/* Président + Secrétaire */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Président de séance</label>
              <select value={form.presidentId} onChange={e => setForm(p => ({ ...p, presidentId: e.target.value }))}>
                <option value="">— Optionnel —</option>
                {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Secrétaire (rédacteur PV)</label>
              <select value={form.secretaryId} onChange={e => setForm(p => ({ ...p, secretaryId: e.target.value }))}>
                <option value="">— Optionnel —</option>
                {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {/* Participants */}
          {form.companyId && (
            <div className="sa-form-field">
              <label>Participants</label>
              <div className="mtg-participant-selector">
                {companyUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    className={`mtg-participant-chip ${form.participants.includes(u.id) ? 'selected' : ''}`}
                    onClick={() => toggleParticipant(u.id)}
                  >
                    <img src={u.avatar} alt="" className="avatar avatar-xs" />
                    <span>{u.name}</span>
                    {form.participants.includes(u.id) && <Check size={11} />}
                  </button>
                ))}
              </div>
              <span className="sa-transfer-note">{form.participants.length} participant(s) sélectionné(s)</span>
            </div>
          )}

          {/* Ordre du jour */}
          <div className="sa-form-field">
            <label>Ordre du jour *</label>
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
                    <button type="button" className="sa-icon-btn" onClick={() => removeAgendaItem(item.id)}><X size={13} /></button>
                  )}
                </div>
              ))}
            </div>
            <div className="mtg-agenda-add-row">
              <input
                value={newAgendaItem}
                onChange={e => setNewAgendaItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAgendaItem(); } }}
                placeholder="Ajouter un point à l'ordre du jour…"
                className="mtg-agenda-input"
              />
              <button type="button" className="sa-btn sa-btn--ghost sa-btn--sm" onClick={addAgendaItem}>
                <Plus size={13} /> Ajouter
              </button>
            </div>
          </div>

          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sa-btn sa-btn--primary"><Check size={15} /> Créer et envoyer les invitations</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vue Conduite de Réunion ───────────────────────────────────────────────────
function MeetingConduct({ meeting, onClose }) {
  const { users, updateMeeting } = useWorkspace();
  const [localMeeting, setLocal] = useState(meeting);

  const update = (changes) => {
    setLocal(prev => ({ ...prev, ...changes }));
    if (updateMeeting) updateMeeting(meeting.id, changes);
  };

  // Présence d'un participant
  const setPresence = (userId, presence) => {
    const participants = localMeeting.participants.map(p =>
      p.userId === userId ? { ...p, presence } : p
    );
    update({ participants });
  };

  // Statut d'un point de l'ordre du jour
  const setAgendaPoint = (agId, changes) => {
    const agenda = localMeeting.agenda.map(a => a.id === agId ? { ...a, ...changes } : a);
    update({ agenda });
  };

  // Ajouter une décision depuis la conduite
  const [newDecisionTitle, setNewDecisionTitle] = useState('');
  const addInstantDecision = () => {
    if (!newDecisionTitle.trim()) return;
    const ref = `DEC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const decisionIds = [...(localMeeting.decisionIds || []), ref];
    update({ decisionIds });
    // Stocker dans l'historique local du meeting
    const conductLog = [...(localMeeting.conductLog || []), {
      type: 'decision', ref, title: newDecisionTitle.trim(), time: new Date(),
    }];
    update({ conductLog });
    setNewDecisionTitle('');
  };

  // Ajouter une tâche depuis la conduite
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const addInstantTask = () => {
    if (!newTaskTitle.trim()) return;
    const ref = `TSK-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const taskIds = [...(localMeeting.taskIds || []), ref];
    update({ taskIds });
    const conductLog = [...(localMeeting.conductLog || []), {
      type: 'task', ref, title: newTaskTitle.trim(), time: new Date(),
    }];
    update({ conductLog });
    setNewTaskTitle('');
  };

  const closeMeeting = () => {
    update({ status: 'closed', pvStatus: 'draft', pvRef: `PV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` });
  };

  const pvStatusKeys = Object.keys(PV_STATUSES);

  return (
    <div className="mtg-conduct-overlay">
      <div className="mtg-conduct-panel">

        {/* Header */}
        <div className="mtg-conduct-header">
          <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={onClose}>
            <ArrowLeft size={14} /> Retour
          </button>
          <div className="mtg-conduct-title">
            <span className="sa-project-ref">{localMeeting.ref}</span>
            <h2>{localMeeting.title}</h2>
          </div>
          <div className="mtg-conduct-actions">
            {localMeeting.status !== 'closed' ? (
              <button className="sa-btn sa-btn--primary" onClick={closeMeeting}>
                <Check size={14} /> Clôturer la réunion
              </button>
            ) : (
              <span className="sa-badge sa-badge--gray">Réunion clôturée</span>
            )}
          </div>
        </div>

        <div className="mtg-conduct-body">
          <div className="mtg-conduct-main">

            {/* Infos réunion */}
            <div className="mtg-info-bar">
              <span><Clock size={13} /> {format(new Date(localMeeting.scheduledAt), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</span>
              <span><Clock size={13} /> {localMeeting.duration} min</span>
              {localMeeting.location && <span><MapPin size={13} /> {localMeeting.location}</span>}
              {localMeeting.link && <a href={localMeeting.link} target="_blank" rel="noreferrer" className="mtg-link"><Link size={13} /> Lien réunion</a>}
            </div>

            {/* Pointage présence */}
            <section className="mtg-section">
              <h3 className="mtg-section-title"><Users size={15} /> Pointage de présence</h3>
              <div className="mtg-presence-list">
                {localMeeting.participants.map(p => {
                  const user = users.find(u => u.id === p.userId);
                  if (!user) return null;
                  return (
                    <div key={p.userId} className="mtg-presence-row">
                      <img src={user.avatar} alt="" className="sa-avatar-sm" />
                      <span className="mtg-presence-name">{user.name}</span>
                      <div className="mtg-presence-btns">
                        {PRESENCE_STATUSES.map(ps => (
                          <button
                            key={ps.id}
                            className={`mtg-presence-btn ${p.presence === ps.id ? 'active' : ''}`}
                            style={p.presence === ps.id ? { background: ps.color + '22', color: ps.color, borderColor: ps.color + '60' } : {}}
                            onClick={() => setPresence(p.userId, ps.id)}
                          >
                            {ps.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Ordre du jour — conduite point par point */}
            <section className="mtg-section">
              <h3 className="mtg-section-title"><ListTodo size={15} /> Ordre du jour</h3>
              {localMeeting.agenda.map((point, idx) => (
                <div key={point.id} className={`mtg-agenda-point ${point.done ? 'done' : point.postponed ? 'postponed' : ''}`}>
                  <div className="mtg-agenda-point-header">
                    <span className="mtg-agenda-point-num">{idx + 1}</span>
                    <span className="mtg-agenda-point-title">{point.title}</span>
                    <div className="mtg-agenda-point-actions">
                      <button
                        className={`sa-btn sa-btn--sm ${point.done ? 'sa-btn--primary' : 'sa-btn--ghost'}`}
                        onClick={() => setAgendaPoint(point.id, { done: !point.done, postponed: false })}
                      >
                        <CheckCircle2 size={12} /> {point.done ? 'Traité' : 'Marquer traité'}
                      </button>
                      <button
                        className={`sa-btn sa-btn--sm ${point.postponed ? 'sa-btn--danger' : 'sa-btn--ghost'}`}
                        onClick={() => setAgendaPoint(point.id, { postponed: !point.postponed, done: false })}
                      >
                        <SkipForward size={12} /> {point.postponed ? 'Reporté' : 'Reporter'}
                      </button>
                    </div>
                  </div>
                  {/* Notes sur ce point */}
                  <textarea
                    className="mtg-point-notes"
                    placeholder="Notes sur ce point…"
                    value={point.notes || ''}
                    onChange={e => setAgendaPoint(point.id, { notes: e.target.value })}
                    rows={2}
                  />
                </div>
              ))}
            </section>

            {/* Créer une décision instantanément */}
            <section className="mtg-section">
              <h3 className="mtg-section-title"><Gavel size={15} /> Décisions prises</h3>
              {(localMeeting.conductLog || []).filter(l => l.type === 'decision').map((d, i) => (
                <div key={i} className="mtg-log-item mtg-log-item--decision">
                  <Gavel size={13} />
                  <div>
                    <span className="mtg-log-ref">{d.ref}</span>
                    <span className="mtg-log-title">{d.title}</span>
                    <span className="mtg-log-time">{format(new Date(d.time), 'HH:mm', { locale: fr })}</span>
                  </div>
                </div>
              ))}
              <div className="mtg-instant-add">
                <input
                  value={newDecisionTitle}
                  onChange={e => setNewDecisionTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInstantDecision(); } }}
                  placeholder="Intitulé de la décision…"
                />
                <button className="sa-btn sa-btn--primary sa-btn--sm" onClick={addInstantDecision} disabled={!newDecisionTitle.trim()}>
                  <Plus size={13} /> Ajouter
                </button>
              </div>
            </section>

            {/* Créer une tâche instantanément */}
            <section className="mtg-section">
              <h3 className="mtg-section-title"><ListTodo size={15} /> Actions décidées</h3>
              {(localMeeting.conductLog || []).filter(l => l.type === 'task').map((t, i) => (
                <div key={i} className="mtg-log-item mtg-log-item--task">
                  <ListTodo size={13} />
                  <div>
                    <span className="mtg-log-ref">{t.ref}</span>
                    <span className="mtg-log-title">{t.title}</span>
                    <span className="mtg-log-time">{format(new Date(t.time), 'HH:mm', { locale: fr })}</span>
                  </div>
                </div>
              ))}
              <div className="mtg-instant-add">
                <input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInstantTask(); } }}
                  placeholder="Titre de la tâche à créer…"
                />
                <button className="sa-btn sa-btn--primary sa-btn--sm" onClick={addInstantTask} disabled={!newTaskTitle.trim()}>
                  <Plus size={13} /> Ajouter
                </button>
              </div>
            </section>

          </div>

          {/* Panneau PV */}
          <div className="mtg-pv-panel">
            <h3 className="mtg-section-title"><FileText size={15} /> Procès-verbal</h3>
            {localMeeting.pvRef && (
              <div className="mtg-pv-ref">{localMeeting.pvRef}</div>
            )}

            {/* Circuit PV */}
            {localMeeting.pvStatus && (
              <div className="mtg-pv-circuit">
                {pvStatusKeys.map((key, idx) => {
                  const pv = PV_STATUSES[key];
                  const currentIdx = pvStatusKeys.indexOf(localMeeting.pvStatus);
                  const isPassed = idx <= currentIdx;
                  return (
                    <div key={key} className={`mtg-pv-step ${isPassed ? 'active' : ''}`}>
                      <div className="mtg-pv-step-dot" style={{ background: isPassed ? pv.color : 'rgba(255,255,255,.1)' }} />
                      <span className="mtg-pv-step-label">{pv.label}</span>
                      {idx < pvStatusKeys.length - 1 && <div className="mtg-pv-step-line" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Avancer le circuit PV */}
            {localMeeting.pvStatus && localMeeting.pvStatus !== 'archived' && (
              <div className="mtg-pv-actions">
                {(() => {
                  const currentIdx = pvStatusKeys.indexOf(localMeeting.pvStatus);
                  const nextKey = pvStatusKeys[currentIdx + 1];
                  if (!nextKey) return null;
                  return (
                    <button
                      className="sa-btn sa-btn--primary sa-btn--sm"
                      onClick={() => update({ pvStatus: nextKey })}
                    >
                      <ChevronRight size={13} /> Passer à : {PV_STATUSES[nextKey].label}
                    </button>
                  );
                })()}
              </div>
            )}

            {/* Résumé PV */}
            {localMeeting.status === 'closed' && (
              <div className="mtg-pv-summary">
                <div className="mtg-pv-section-title">Participants</div>
                {localMeeting.participants.map(p => {
                  const u = users.find(u => u.id === p.userId);
                  const ps = PRESENCE_STATUSES.find(s => s.id === p.presence);
                  return u ? (
                    <div key={p.userId} className="mtg-pv-participant-row">
                      <span>{u.name}</span>
                      {ps && <span className="sa-badge" style={{ background: ps.color+'22', color: ps.color, fontSize: 10 }}>{ps.label}</span>}
                    </div>
                  ) : null;
                })}

                <div className="mtg-pv-section-title" style={{ marginTop: 12 }}>Décisions</div>
                {(localMeeting.conductLog || []).filter(l => l.type === 'decision').length === 0
                  ? <p className="sa-empty" style={{ padding: '4px 0', fontSize: 12 }}>Aucune décision.</p>
                  : (localMeeting.conductLog || []).filter(l => l.type === 'decision').map((d, i) => (
                    <div key={i} className="mtg-pv-decision-row"><Gavel size={11} />{d.title}</div>
                  ))
                }

                <div className="mtg-pv-section-title" style={{ marginTop: 12 }}>Actions</div>
                {(localMeeting.conductLog || []).filter(l => l.type === 'task').length === 0
                  ? <p className="sa-empty" style={{ padding: '4px 0', fontSize: 12 }}>Aucune action.</p>
                  : (localMeeting.conductLog || []).filter(l => l.type === 'task').map((t, i) => (
                    <div key={i} className="mtg-pv-decision-row"><ListTodo size={11} />{t.title}</div>
                  ))
                }

                <button className="sa-btn sa-btn--ghost sa-btn--sm" style={{ marginTop: 12, width: '100%' }}>
                  <Download size={13} /> Exporter le PV (PDF)
                </button>
              </div>
            )}

            {!localMeeting.pvStatus && localMeeting.status !== 'closed' && (
              <p className="sa-empty" style={{ fontSize: 12 }}>Clôturez la réunion pour générer le PV.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carte réunion ─────────────────────────────────────────────────────────────
function MeetingCard({ meeting, users, onClick }) {
  const st = MTG_STATUS_INFO[meeting.status] || MTG_STATUS_INFO.planned;
  const pv = meeting.pvStatus ? PV_STATUSES[meeting.pvStatus] : null;
  const isUpcoming = isFuture(new Date(meeting.scheduledAt));
  const presenceCount = meeting.participants.filter(p => p.presence === 'present').length;

  return (
    <div className={`mtg-card ${isUpcoming ? 'upcoming' : ''}`} onClick={onClick}>
      <div className="mtg-card-header">
        <div className="mtg-card-type-badge" style={{ background: st.color + '22', color: st.color }}>
          {MEETING_TYPES.find(t => t.id === meeting.type)?.label || meeting.type}
        </div>
        <span className={`sa-badge ${st.badgeClass}`}>{st.label}</span>
        {pv && <span className="sa-badge" style={{ background: pv.color + '22', color: pv.color, fontSize: 10 }}>PV : {pv.label}</span>}
      </div>

      <div className="mtg-card-ref">{meeting.ref}</div>
      <h3 className="mtg-card-title">{meeting.title}</h3>

      <div className="mtg-card-meta">
        <span><Calendar size={12} /> {format(new Date(meeting.scheduledAt), 'EEEE d MMM yyyy', { locale: fr })}</span>
        <span><Clock size={12} /> {format(new Date(meeting.scheduledAt), 'HH:mm')} · {meeting.duration} min</span>
        {meeting.location && <span><MapPin size={12} /> {meeting.location}</span>}
        <span><Users size={12} /> {meeting.participants.length} participants
          {meeting.status === 'closed' && ` · ${presenceCount} présents`}
        </span>
      </div>

      {meeting.agenda.length > 0 && (
        <div className="mtg-card-agenda-preview">
          {meeting.agenda.slice(0, 3).map((a, i) => (
            <div key={a.id} className={`mtg-card-agenda-item ${a.done ? 'done' : a.postponed ? 'postponed' : ''}`}>
              <span>{i + 1}. {a.title}</span>
              {a.done && <CheckCircle2 size={11} style={{ color: '#22c55e' }} />}
              {a.postponed && <SkipForward size={11} style={{ color: '#f59e0b' }} />}
            </div>
          ))}
          {meeting.agenda.length > 3 && <span className="mtg-card-more">+{meeting.agenda.length - 3} point(s)</span>}
        </div>
      )}

      <div className="mtg-card-footer">
        <span>Organisateur : {getUserName(users, meeting.organizerId)}</span>
        {meeting.presidentId && <span>Président : {getUserName(users, meeting.presidentId)}</span>}
      </div>
    </div>
  );
}

// ── Page principale Réunions ──────────────────────────────────────────────────
export default function Meetings() {
  const { meetings, users } = useWorkspace();
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterComp]  = useState('all');
  const [showCreate, setShowCreate]   = useState(false);
  const [conducting, setConducting]   = useState(null); // meeting en conduite
  const [localMeetings, setLocalMeetings] = useState(meetings);

  // Vue conduite
  if (conducting) {
    return (
      <MeetingConduct
        meeting={localMeetings.find(m => m.id === conducting.id) || conducting}
        onClose={() => setConducting(null)}
      />
    );
  }

  const handleCreate = (data) => {
    const newMeeting = {
      id: `reu_${Date.now()}`,
      ref: `REU-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      ...data,
    };
    setLocalMeetings(prev => [newMeeting, ...prev]);
    setShowCreate(false);
  };

  const filtered = localMeetings.filter(m => {
    const q = search.toLowerCase();
    return (m.title.toLowerCase().includes(q) || m.ref.toLowerCase().includes(q))
      && (filterStatus  === 'all' || m.status    === filterStatus)
      && (filterCompany === 'all' || m.companyId === filterCompany);
  });

  // Trier : à venir d'abord, puis chronologique inversé
  const sorted = [...filtered].sort((a, b) => {
    const af = isFuture(new Date(a.scheduledAt));
    const bf = isFuture(new Date(b.scheduledAt));
    if (af && !bf) return -1;
    if (!af && bf) return 1;
    return new Date(b.scheduledAt) - new Date(a.scheduledAt);
  });

  // Stats
  const upcoming  = localMeetings.filter(m => m.status === 'planned' && isFuture(new Date(m.scheduledAt))).length;
  const noPV      = localMeetings.filter(m => m.status === 'closed' && (!m.pvStatus || m.pvStatus === 'draft')).length;
  const closed    = localMeetings.filter(m => m.status === 'closed').length;

  return (
    <div className="sa-page">
      {/* KPIs */}
      <div className="sa-kpi-grid sa-kpi-grid--sm">
        {[
          { label: 'Total', value: localMeetings.length, color: '#7c3aed' },
          { label: 'À venir', value: upcoming, color: '#3b82f6' },
          { label: 'Clôturées', value: closed, color: '#64748b' },
          { label: 'Sans PV validé', value: noPV, color: noPV > 0 ? '#f59e0b' : '#22c55e' },
        ].map(s => (
          <div key={s.label} className="sa-kpi-card" style={{ '--kpi-color': s.color }}>
            <div className="sa-kpi-icon"><Calendar size={18} /></div>
            <div className="sa-kpi-body"><span className="sa-kpi-value">{s.value}</span><span className="sa-kpi-label">{s.label}</span></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sa-toolbar">
        <div className="sa-search-wrap">
          <Search size={15} className="sa-search-icon" />
          <input className="sa-search-input" placeholder="Titre, référence…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="sa-filter-tabs">
          {['all', 'planned', 'open', 'closed', 'cancelled'].map(s => (
            <button key={s} className={`sa-filter-tab ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'Toutes' : MTG_STATUS_INFO[s]?.label || s}
            </button>
          ))}
        </div>
        <button className="sa-btn sa-btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Nouvelle réunion
        </button>
      </div>

      {/* Filtre société */}
      <div className="sa-filters-bar" style={{ padding: '8px 12px' }}>
        <div className="sa-filter-group">
          <label>Société</label>
          <select value={filterCompany} onChange={e => setFilterComp(e.target.value)}>
            <option value="all">Toutes</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="sa-results-count">{sorted.length} réunion{sorted.length > 1 ? 's' : ''}</div>

      {/* Grille */}
      <div className="mtg-grid">
        {sorted.length === 0 && <p className="sa-empty">Aucune réunion trouvée.</p>}
        {sorted.map(m => (
          <MeetingCard
            key={m.id}
            meeting={m}
            users={users}
            onClick={() => setConducting(m)}
          />
        ))}
      </div>

      {showCreate && (
        <MeetingCreateModal
          users={users}
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}
