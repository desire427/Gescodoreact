import { useState } from 'react';
import {
  Plus, Search, Calendar, Clock, Users, MapPin, FileText,
  X, Check, ChevronDown, ChevronRight, Circle,
  CheckCircle2, SkipForward, ListTodo,
  Gavel, Link, ArrowLeft, Download, Video, Filter,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import MeetingVideoRoom from '../MeetingVideoRoom';
import { format, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';

const MEETING_TYPES = [
  { id: 'direction',   label: 'Direction' },
  { id: 'service',     label: 'Service' },
  { id: 'projet',      label: 'Projet' },
  { id: 'comite',      label: 'Comité' },
  { id: 'exceptional', label: 'Exceptionnelle' },
];

const PRESENCE_STATUSES = [
  { id: 'present',   label: 'Présent',     color: '#22c55e' },
  { id: 'absent',    label: 'Absent',      color: '#ef4444' },
  { id: 'excused',   label: 'Excusé',      color: '#f59e0b' },
  { id: 'late',      label: 'En retard',   color: '#f97316' },
  { id: 'delegated', label: 'Représenté',  color: '#8b5cf6' },
];

const PV_STATUSES = {
  draft:     { label: 'Brouillon', color: '#64748b' },
  submitted: { label: 'Soumis',    color: '#3b82f6' },
  validated: { label: 'Validé',    color: '#22c55e' },
  diffused:  { label: 'Diffusé',   color: '#8b5cf6' },
  archived:  { label: 'Archivé',   color: '#94a3b8' },
};

const MTG_STATUS = {
  planned:   { label: 'Planifiée', color: '#3b82f6' },
  open:      { label: 'En cours',  color: '#22c55e' },
  closed:    { label: 'Clôturée',  color: '#64748b' },
  cancelled: { label: 'Annulée',   color: '#ef4444' },
};

const getUser = (users, id) => users.find(u => u.id === id)?.name || '—';

/* ── Meeting Create Modal ── */
function MeetingCreateModal({ onClose, onSave, users, companies = [], departments = [], isSuperAdmin, currentUserId }) {
  const [form, setForm] = useState({
    title: '', type: 'direction',
    companyId: isSuperAdmin ? '' : String(companies[0]?.id || ''),
    departmentId: '', scheduledAt: '', duration: 60, location: '',
    organizerId: currentUserId || '', presidentId: '', secretaryId: '',
    participants: [],
    agenda: [{ id: `ag_${Date.now()}`, title: '', done: false, notes: '' }],
    projectId: null,
  });
  const [newAgenda, setNewAgenda] = useState('');
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);

  const depts        = departments.filter(d => Number(d.companyId) === Number(form.companyId));
  const companyUsers = users.filter(u => Number(u.companyId) === Number(form.companyId) && u.status === 'active');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addAgendaItem = () => {
    if (!newAgenda.trim()) return;
    setForm(p => ({ ...p, agenda: [...p.agenda, { id: `ag_${Date.now()}`, title: newAgenda.trim(), done: false, notes: '' }] }));
    setNewAgenda('');
  };

  const toggleParticipant = (userId) => {
    setForm(p => ({
      ...p,
      participants: p.participants.includes(userId)
        ? p.participants.filter(id => id !== userId)
        : [...p.participants, userId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledAt || !form.companyId) return;
    setSaving(true); setError('');
    try {
      await onSave({
        ...form,
        companyId: Number(form.companyId),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        organizerId: form.organizerId ? Number(form.organizerId) : null,
        presidentId: form.presidentId ? Number(form.presidentId) : null,
        secretaryId: form.secretaryId ? Number(form.secretaryId) : null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        participants: form.participants.map(id => ({ userId: Number(id) })),
      });
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail || 'Création impossible.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal gc-modal--lg" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="gc-modal-header">
          <h3>Nouvelle réunion</h3>
          <button className="gc-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="gc-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="gc-form-row">
              <div className="gc-form-field"><label>Titre *</label><input value={form.title} onChange={e => f('title', e.target.value)} required /></div>
              <div className="gc-form-field gc-form-field--sm">
                <label>Type *</label>
                <select value={form.type} onChange={e => f('type', e.target.value)}>
                  {MEETING_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="gc-form-row">
              {isSuperAdmin && (
                <div className="gc-form-field">
                  <label>Société *</label>
                  <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value, departmentId: '', participants: [], presidentId: '', secretaryId: '' }))} required>
                    <option value="">— Choisir —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div className="gc-form-field">
                <label>Direction / Service</label>
                <select value={form.departmentId} onChange={e => f('departmentId', e.target.value)}>
                  <option value="">— Aucun —</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field"><label>Date et heure *</label><input type="datetime-local" value={form.scheduledAt} onChange={e => f('scheduledAt', e.target.value)} required /></div>
              <div className="gc-form-field gc-form-field--sm"><label>Durée (min)</label><input type="number" min={15} max={480} step={15} value={form.duration} onChange={e => f('duration', Number(e.target.value))} /></div>
            </div>
            <div className="gc-form-field"><label>Lieu physique</label><input value={form.location} onChange={e => f('location', e.target.value)} placeholder="Salle A, siège social…" /></div>
            <p style={{ fontSize: 12, color: 'var(--gc-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Video size={13} /> Une salle vidéo interne sera créée automatiquement.
            </p>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Président de séance</label>
                <select value={form.presidentId} onChange={e => f('presidentId', e.target.value)}>
                  <option value="">— Optionnel —</option>
                  {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="gc-form-field">
                <label>Secrétaire (rédacteur PV)</label>
                <select value={form.secretaryId} onChange={e => f('secretaryId', e.target.value)}>
                  <option value="">— Optionnel —</option>
                  {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            {form.companyId && (
              <div className="gc-form-field">
                <label>Participants</label>
                <div className="gc-participant-selector">
                  {companyUsers.map(u => (
                    <button key={u.id} type="button"
                      className={`gc-participant-chip ${form.participants.includes(u.id) ? 'gc-participant-chip--selected' : ''}`}
                      onClick={() => toggleParticipant(u.id)}
                    >
                      <img src={u.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                      <span>{u.name}</span>
                      {form.participants.includes(u.id) && <Check size={10} />}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: 'var(--gc-muted)' }}>{form.participants.length} participant(s) sélectionné(s)</span>
              </div>
            )}
            <div className="gc-form-field">
              <label>Ordre du jour</label>
              <div className="gc-agenda-list">
                {form.agenda.map((item, idx) => (
                  <div key={item.id} className="gc-agenda-item-row">
                    <span className="gc-agenda-num">{idx + 1}.</span>
                    <input
                      value={item.title}
                      onChange={e => setForm(p => ({ ...p, agenda: p.agenda.map(a => a.id === item.id ? { ...a, title: e.target.value } : a) }))}
                      placeholder="Titre du point…"
                    />
                    {form.agenda.length > 1 && <button type="button" className="gc-icon-btn" onClick={() => setForm(p => ({ ...p, agenda: p.agenda.filter(a => a.id !== item.id) }))}><X size={12} /></button>}
                  </div>
                ))}
              </div>
              <div className="gc-agenda-add-row">
                <input value={newAgenda} onChange={e => setNewAgenda(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAgendaItem(); } }} placeholder="Ajouter un point…" />
                <button type="button" className="gc-btn gc-btn--ghost" style={{ fontSize: 12 }} onClick={addAgendaItem}><Plus size={12} /> Ajouter</button>
              </div>
            </div>
            {error && <p role="alert" style={{ color: '#b91c1c', fontSize: 12 }}>{error}</p>}
          </div>
          <div className="gc-modal-footer">
            <button type="button" className="gc-btn gc-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="gc-btn gc-btn--primary" disabled={saving}>
              <Check size={14} /> {saving ? 'Création…' : 'Créer et envoyer les invitations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Meeting Conduct View ── */
function MeetingConduct({ meeting, onClose }) {
  const { users, decisions, updateMeeting, createDecision, createTask, updateDecision } = useWorkspace();
  const [local, setLocal]             = useState(meeting);
  const [videoOpen, setVideoOpen]     = useState(false);
  const [opError, setOpError]         = useState('');
  const [newDecTitle, setNewDecTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const update = (changes) => {
    setLocal(prev => ({ ...prev, ...changes }));
    if (updateMeeting) {
      updateMeeting(meeting.id, changes).catch(err => setOpError(err.response?.data?.detail || err.message || 'Enregistrement impossible.'));
    }
  };

  const setPresence = (userId, presence) => {
    const participants = local.participants.map(p => p.userId === userId ? { ...p, presence } : p);
    update({ participants });
  };

  const setAgendaPoint = (agId, changes, persist = true) => {
    const agenda = local.agenda.map(a => a.id === agId ? { ...a, ...changes } : a);
    setLocal(prev => ({ ...prev, agenda }));
    if (persist) updateMeeting(meeting.id, { agenda }).catch(err => setOpError(err.response?.data?.detail || err.message || 'Enregistrement impossible.'));
  };

  const addDecision = async () => {
    if (!newDecTitle.trim()) return;
    setOpError('');
    try {
      const decision = await createDecision({ title: newDecTitle.trim(), meetingId: meeting.id, companyId: meeting.companyId });
      const conductLog = [...(local.conductLog || []), { type: 'decision', id: decision.id, ref: decision.ref, title: decision.title, time: new Date().toISOString() }];
      setLocal(prev => ({ ...prev, conductLog }));
      await updateMeeting(meeting.id, { conductLog });
      setNewDecTitle('');
    } catch (err) { setOpError(err.response?.data?.detail || err.message || 'Création impossible.'); }
  };

  const decToTask = async (decLog) => {
    if (!decLog.id) return;
    setOpError('');
    try {
      const task = await createTask({ title: decLog.title, description: `Tâche issue de la décision ${decLog.ref || decLog.id} — réunion ${meeting.ref}.`, companyId: meeting.companyId, projectId: meeting.projectId || null, origin: 'decision' });
      const decision = decisions.find(d => d.id === decLog.id);
      if (decision) await updateDecision(decision.id, { tasks: [...(decision.taskIds || []), task.id] });
      const conductLog = [...(local.conductLog || []), { type: 'task', id: task.id, ref: task.ref, title: task.title, decisionId: decLog.id, time: new Date().toISOString() }];
      setLocal(prev => ({ ...prev, conductLog }));
      await updateMeeting(meeting.id, { conductLog });
    } catch (err) { setOpError(err.response?.data?.detail || err.message || 'Transformation impossible.'); }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    setOpError('');
    try {
      const task = await createTask({ title: newTaskTitle.trim(), description: `Action décidée — réunion ${meeting.ref}.`, companyId: meeting.companyId, projectId: meeting.projectId || null, origin: 'meeting' });
      const conductLog = [...(local.conductLog || []), { type: 'task', id: task.id, ref: task.ref, title: task.title, time: new Date().toISOString() }];
      setLocal(prev => ({ ...prev, conductLog }));
      await updateMeeting(meeting.id, { conductLog });
      setNewTaskTitle('');
    } catch (err) { setOpError(err.response?.data?.detail || err.message || 'Création impossible.'); }
  };

  const closeMeeting = () => update({ status: 'closed', pvStatus: 'draft', pvRef: `PV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` });
  const pvKeys = Object.keys(PV_STATUSES);

  return (
    <div className="gc-conduct-overlay">
      <div className="gc-conduct-panel">
        {/* Header */}
        <div className="gc-conduct-header">
          <button className="gc-btn gc-btn--ghost" style={{ fontSize: 12 }} onClick={onClose}><ArrowLeft size={13} /> Retour</button>
          <div className="gc-conduct-title">
            <span className="gc-ref-tag">{local.ref}</span>
            <h2>{local.title}</h2>
          </div>
          <div className="gc-conduct-actions">
            {local.status !== 'closed' && (
              <button className="gc-btn gc-btn--ghost" onClick={() => setVideoOpen(true)}><Video size={13} /> Visioconférence</button>
            )}
            {local.status !== 'closed'
              ? <button className="gc-btn gc-btn--primary" onClick={closeMeeting}><Check size={13} /> Clôturer</button>
              : <span className="gc-badge gc-badge--muted">Clôturée</span>
            }
          </div>
        </div>

        {opError && <p role="alert" style={{ color: '#b91c1c', padding: '8px 24px', fontSize: 12 }}>{opError}</p>}

        <div className="gc-conduct-body">
          <div className="gc-conduct-main">
            {/* Info bar */}
            <div className="gc-conduct-info-bar">
              <span><Clock size={12} /> {format(new Date(local.scheduledAt), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}</span>
              <span><Clock size={12} /> {local.duration} min</span>
              {local.location && <span><MapPin size={12} /> {local.location}</span>}
              {local.link && <a href={local.link} target="_blank" rel="noreferrer" className="gc-conduct-link"><Link size={12} /> Lien réunion</a>}
            </div>

            {/* Présence */}
            <section className="gc-conduct-section">
              <h3 className="gc-conduct-section-title"><Users size={14} /> Pointage de présence</h3>
              <div className="gc-presence-list">
                {local.participants.map(p => {
                  const u = users.find(u => u.id === p.userId);
                  if (!u) return null;
                  return (
                    <div key={p.userId} className="gc-presence-row">
                      <img src={u.avatar} alt="" className="gc-presence-avatar" />
                      <span className="gc-presence-name">{u.name}</span>
                      <div className="gc-presence-btns">
                        {PRESENCE_STATUSES.map(ps => (
                          <button key={ps.id}
                            className={`gc-presence-btn ${p.presence === ps.id ? 'gc-presence-btn--active' : ''}`}
                            style={p.presence === ps.id ? { background: ps.color + '22', color: ps.color, borderColor: ps.color + '80' } : {}}
                            onClick={() => setPresence(p.userId, ps.id)}
                          >{ps.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Ordre du jour */}
            <section className="gc-conduct-section">
              <h3 className="gc-conduct-section-title"><ListTodo size={14} /> Ordre du jour</h3>
              {local.agenda.map((point, idx) => (
                <div key={point.id} className={`gc-agenda-point ${point.done ? 'gc-agenda-point--done' : point.postponed ? 'gc-agenda-point--postponed' : ''}`}>
                  <div className="gc-agenda-point-head">
                    <span className="gc-agenda-point-num">{idx + 1}</span>
                    <span className="gc-agenda-point-title">{point.title}</span>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                      <button
                        className={`gc-btn ${point.done ? 'gc-btn--primary' : 'gc-btn--ghost'}`}
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => setAgendaPoint(point.id, { done: !point.done, postponed: false })}
                      >
                        <CheckCircle2 size={11} /> {point.done ? 'Traité' : 'Marquer traité'}
                      </button>
                      <button
                        className={`gc-btn ${point.postponed ? 'gc-btn--danger' : 'gc-btn--ghost'}`}
                        style={{ fontSize: 11, padding: '4px 8px' }}
                        onClick={() => setAgendaPoint(point.id, { postponed: !point.postponed, done: false })}
                      >
                        <SkipForward size={11} /> {point.postponed ? 'Reporté' : 'Reporter'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="gc-agenda-notes"
                    placeholder="Notes sur ce point…"
                    value={point.notes || ''}
                    onChange={e => setAgendaPoint(point.id, { notes: e.target.value }, false)}
                    onBlur={() => updateMeeting(meeting.id, { agenda: local.agenda }).catch(err => setOpError(err.message))}
                    rows={2}
                  />
                </div>
              ))}
            </section>

            {/* Décisions */}
            <section className="gc-conduct-section">
              <h3 className="gc-conduct-section-title"><Gavel size={14} /> Décisions prises</h3>
              {(local.conductLog || []).filter(l => l.type === 'decision').map((d, i) => (
                <div key={i} className="gc-conduct-log-item gc-conduct-log-item--decision">
                  <Gavel size={12} />
                  <div style={{ flex: 1 }}>
                    <span className="gc-ref-tag" style={{ marginRight: 6 }}>{d.ref}</span>
                    <span style={{ fontSize: 13 }}>{d.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--gc-muted)' }}>{format(new Date(d.time), 'HH:mm', { locale: fr })}</span>
                  {d.id && !(local.conductLog || []).some(item => item.type === 'task' && item.decisionId === d.id) && (
                    <button className="gc-btn gc-btn--ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => decToTask(d)}>→ Tâche</button>
                  )}
                </div>
              ))}
              <div className="gc-conduct-quick-add">
                <input value={newDecTitle} onChange={e => setNewDecTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDecision(); } }} placeholder="Intitulé de la décision…" />
                <button className="gc-btn gc-btn--primary" style={{ fontSize: 12 }} onClick={addDecision} disabled={!newDecTitle.trim()}><Plus size={12} /> Ajouter</button>
              </div>
            </section>

            {/* Tâches */}
            <section className="gc-conduct-section">
              <h3 className="gc-conduct-section-title"><ListTodo size={14} /> Actions décidées</h3>
              {(local.conductLog || []).filter(l => l.type === 'task').map((t, i) => (
                <div key={i} className="gc-conduct-log-item gc-conduct-log-item--task">
                  <ListTodo size={12} />
                  <div style={{ flex: 1 }}>
                    <span className="gc-ref-tag" style={{ marginRight: 6 }}>{t.ref}</span>
                    <span style={{ fontSize: 13 }}>{t.title}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--gc-muted)' }}>{format(new Date(t.time), 'HH:mm', { locale: fr })}</span>
                </div>
              ))}
              <div className="gc-conduct-quick-add">
                <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }} placeholder="Titre de la tâche à créer…" />
                <button className="gc-btn gc-btn--primary" style={{ fontSize: 12 }} onClick={addTask} disabled={!newTaskTitle.trim()}><Plus size={12} /> Ajouter</button>
              </div>
            </section>
          </div>

          {/* PV Panel */}
          <div className="gc-pv-panel">
            <h3 className="gc-conduct-section-title"><FileText size={14} /> Procès-verbal</h3>
            {local.pvRef && <div className="gc-pv-ref">{local.pvRef}</div>}

            {local.pvStatus && (
              <div className="gc-pv-circuit">
                {pvKeys.map((key, idx) => {
                  const pv = PV_STATUSES[key];
                  const currentIdx = pvKeys.indexOf(local.pvStatus);
                  const isPassed = idx <= currentIdx;
                  return (
                    <div key={key} className={`gc-pv-step ${isPassed ? 'gc-pv-step--active' : ''}`}>
                      <div className="gc-pv-step-dot" style={{ background: isPassed ? pv.color : 'var(--gc-line)' }} />
                      <span>{pv.label}</span>
                      {idx < pvKeys.length - 1 && <div className="gc-pv-step-line" />}
                    </div>
                  );
                })}
              </div>
            )}

            {local.pvStatus && local.pvStatus !== 'archived' && (() => {
              const nextKey = pvKeys[pvKeys.indexOf(local.pvStatus) + 1];
              return nextKey ? (
                <button className="gc-btn gc-btn--primary" style={{ fontSize: 12, marginTop: 12, width: '100%' }} onClick={() => update({ pvStatus: nextKey })}>
                  <ChevronRight size={12} /> Passer à : {PV_STATUSES[nextKey].label}
                </button>
              ) : null;
            })()}

            {local.status === 'closed' && (
              <div className="gc-pv-summary">
                <div className="gc-pv-summary-title">Participants</div>
                {local.participants.map(p => {
                  const u = users.find(u => u.id === p.userId);
                  const ps = PRESENCE_STATUSES.find(s => s.id === p.presence);
                  return u ? (
                    <div key={p.userId} className="gc-pv-participant-row">
                      <span>{u.name}</span>
                      {ps && <span className="gc-badge" style={{ background: ps.color + '22', color: ps.color, fontSize: 10 }}>{ps.label}</span>}
                    </div>
                  ) : null;
                })}

                <div className="gc-pv-summary-title" style={{ marginTop: 14 }}>Décisions</div>
                {(local.conductLog || []).filter(l => l.type === 'decision').length === 0
                  ? <p style={{ color: 'var(--gc-muted)', fontSize: 12 }}>Aucune décision.</p>
                  : (local.conductLog || []).filter(l => l.type === 'decision').map((d, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, padding: '4px 0' }}>
                      <Gavel size={11} style={{ flexShrink: 0, marginTop: 2 }} />{d.title}
                    </div>
                  ))
                }

                <div className="gc-pv-summary-title" style={{ marginTop: 14 }}>Actions</div>
                {(local.conductLog || []).filter(l => l.type === 'task').length === 0
                  ? <p style={{ color: 'var(--gc-muted)', fontSize: 12 }}>Aucune action.</p>
                  : (local.conductLog || []).filter(l => l.type === 'task').map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, fontSize: 12, padding: '4px 0' }}>
                      <ListTodo size={11} style={{ flexShrink: 0, marginTop: 2 }} />{t.title}
                    </div>
                  ))
                }

                <button className="gc-btn gc-btn--ghost" style={{ fontSize: 12, marginTop: 14, width: '100%' }}>
                  <Download size={12} /> Exporter le PV (PDF)
                </button>
              </div>
            )}

            {!local.pvStatus && local.status !== 'closed' && (
              <p style={{ color: 'var(--gc-muted)', fontSize: 12, marginTop: 10 }}>Clôturez la réunion pour générer le PV.</p>
            )}
          </div>
        </div>
      </div>
      {videoOpen && <MeetingVideoRoom meeting={local} users={users} onClose={() => setVideoOpen(false)} />}
    </div>
  );
}

/* ── Meeting Card ── */
function MeetingCard({ meeting, users, onClick }) {
  const st          = MTG_STATUS[meeting.status] || MTG_STATUS.planned;
  const pv          = meeting.pvStatus ? PV_STATUSES[meeting.pvStatus] : null;
  const isUpcoming  = isFuture(new Date(meeting.scheduledAt));
  const presenceCnt = meeting.participants.filter(p => p.presence === 'present').length;
  const typeLabel   = MEETING_TYPES.find(t => t.id === meeting.type)?.label || meeting.type;

  return (
    <div className={`gc-meeting-card ${isUpcoming ? 'gc-meeting-card--upcoming' : ''}`} onClick={onClick}>
      <div className="gc-meeting-card-head">
        <span className="gc-meeting-type-badge" style={{ background: st.color + '20', color: st.color }}>{typeLabel}</span>
        <span className="gc-badge" style={{ background: st.color + '22', color: st.color }}>{st.label}</span>
        {pv && <span className="gc-badge" style={{ background: pv.color + '22', color: pv.color, fontSize: 10 }}>PV : {pv.label}</span>}
      </div>

      <span className="gc-ref-tag" style={{ marginTop: 10, display: 'inline-block' }}>{meeting.ref}</span>
      <h3 className="gc-meeting-card-title">{meeting.title}</h3>

      <div className="gc-meeting-card-meta">
        <span><Calendar size={11} /> {format(new Date(meeting.scheduledAt), 'EEEE d MMM yyyy', { locale: fr })}</span>
        <span><Clock size={11} /> {format(new Date(meeting.scheduledAt), 'HH:mm')} · {meeting.duration} min</span>
        {meeting.location && <span><MapPin size={11} /> {meeting.location}</span>}
        <span><Users size={11} /> {meeting.participants.length} participants{meeting.status === 'closed' && ` · ${presenceCnt} présents`}</span>
      </div>

      {meeting.agenda.length > 0 && (
        <div className="gc-meeting-card-agenda">
          {meeting.agenda.slice(0, 3).map((a, i) => (
            <div key={a.id} className={`gc-agenda-preview-item ${a.done ? 'done' : a.postponed ? 'postponed' : ''}`}>
              <span>{i + 1}. {a.title}</span>
              {a.done && <CheckCircle2 size={10} style={{ color: '#22c55e' }} />}
              {a.postponed && <SkipForward size={10} style={{ color: '#f59e0b' }} />}
            </div>
          ))}
          {meeting.agenda.length > 3 && <span style={{ fontSize: 11, color: 'var(--gc-muted)' }}>+{meeting.agenda.length - 3} point(s)</span>}
        </div>
      )}

      <div className="gc-meeting-card-foot">
        <span>Organisateur : {getUser(users, meeting.organizerId)}</span>
        {meeting.presidentId && <span>Président : {getUser(users, meeting.presidentId)}</span>}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function Meetings() {
  const { meetings, users, companies = [], departments = [], createMeeting } = useWorkspace();
  const { currentUser, isSuperAdmin } = useAuth();
  const [search,        setSearch]       = useState('');
  const [filterStatus,  setFilterStatus] = useState('all');
  const [filterCompany, setFilterComp]   = useState('all');
  const [showFilters,   setShowFilters]  = useState(false);
  const [showCreate,    setShowCreate]   = useState(false);
  const [conducting,    setConducting]   = useState(null);

  if (conducting) {
    return <MeetingConduct meeting={meetings.find(m => m.id === conducting.id) || conducting} onClose={() => setConducting(null)} />;
  }

  const handleCreate = async (data) => { await createMeeting(data); setShowCreate(false); };

  const filtered = meetings.filter(m =>
    (m.title.toLowerCase().includes(search.toLowerCase()) || m.ref.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus  === 'all' || m.status    === filterStatus) &&
    (filterCompany === 'all' || m.companyId === filterCompany)
  );

  const sorted = [...filtered].sort((a, b) => {
    const af = isFuture(new Date(a.scheduledAt));
    const bf = isFuture(new Date(b.scheduledAt));
    if (af && !bf) return -1;
    if (!af && bf) return 1;
    return new Date(b.scheduledAt) - new Date(a.scheduledAt);
  });

  const upcoming = meetings.filter(m => m.status === 'planned' && isFuture(new Date(m.scheduledAt))).length;
  const noPV     = meetings.filter(m => m.status === 'closed' && (!m.pvStatus || m.pvStatus === 'draft')).length;
  const closed   = meetings.filter(m => m.status === 'closed').length;

  return (
    <div className="gc-page">
      {/* KPIs */}
      <div className="gc-kpi-grid">
        {[
          { label: 'Total',          value: meetings.length, color: '#7c3aed' },
          { label: 'À venir',        value: upcoming,        color: '#3b82f6' },
          { label: 'Clôturées',      value: closed,          color: '#64748b' },
          { label: 'Sans PV validé', value: noPV,            color: noPV > 0 ? '#f59e0b' : '#22c55e' },
        ].map(s => (
          <div key={s.label} className="gc-kpi-card" style={{ '--kpi-accent': s.color }}>
            <div className="gc-kpi-icon"><Calendar size={18} /></div>
            <div className="gc-kpi-body">
              <span className="gc-kpi-value">{s.value}</span>
              <span className="gc-kpi-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="gc-toolbar">
        <div className="gc-search-wrap">
          <Search size={14} className="gc-search-icon" />
          <input className="gc-search-input" placeholder="Titre, référence…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="gc-filter-pills">
          {['all', 'planned', 'open', 'closed', 'cancelled'].map(s => (
            <button key={s} className={`gc-filter-pill ${filterStatus === s ? 'gc-filter-pill--active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'Toutes' : MTG_STATUS[s]?.label || s}
            </button>
          ))}
        </div>
        {isSuperAdmin && (
          <button className={`gc-btn gc-btn--ghost ${showFilters ? 'gc-btn--active' : ''}`} onClick={() => setShowFilters(v => !v)}>
            <Filter size={13} /> Société <ChevronDown size={11} />
          </button>
        )}
        <button className="gc-btn gc-btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouvelle réunion
        </button>
      </div>

      {showFilters && isSuperAdmin && (
        <div className="gc-filters-bar">
          <div className="gc-filter-group">
            <label>Société</label>
            <select value={filterCompany} onChange={e => setFilterComp(e.target.value)}>
              <option value="all">Toutes</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      )}

      <p className="gc-count">{sorted.length} réunion{sorted.length > 1 ? 's' : ''}</p>

      <div className="gc-meetings-grid">
        {sorted.length === 0 && <p className="gc-empty">Aucune réunion trouvée.</p>}
        {sorted.map(m => (
          <MeetingCard key={m.id} meeting={m} users={users} onClick={() => setConducting(m)} />
        ))}
      </div>

      {showCreate && (
        <MeetingCreateModal
          users={users} companies={companies} departments={departments}
          isSuperAdmin={isSuperAdmin} currentUserId={currentUser?.id}
          onClose={() => setShowCreate(false)} onSave={handleCreate}
        />
      )}
    </div>
  );
}
