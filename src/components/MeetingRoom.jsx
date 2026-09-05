import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Send, Smile, Paperclip, MessageSquare,
  ListTodo, Gavel, Users, CheckCircle2, SkipForward,
  Plus, X, FolderKanban, Clock, MapPin, Link,
  FileText, ChevronRight, AlertCircle, Calendar,
  UserCheck, Mic,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PRESENCE_STATUSES = [
  { id: 'present',   label: 'Présent',    color: '#22c55e' },
  { id: 'absent',    label: 'Absent',     color: '#ef4444' },
  { id: 'excused',   label: 'Excusé',     color: '#f59e0b' },
  { id: 'late',      label: 'En retard',  color: '#f97316' },
  { id: 'delegated', label: 'Représenté', color: '#8b5cf6' },
];

const PV_CIRCUIT = ['draft', 'submitted', 'validated', 'diffused', 'archived'];
const PV_LABELS  = { draft: 'Brouillon', submitted: 'Soumis', validated: 'Validé', diffused: 'Diffusé', archived: 'Archivé' };
const PV_COLORS  = { draft: '#64748b', submitted: '#3b82f6', validated: '#22c55e', diffused: '#8b5cf6', archived: '#94a3b8' };

// ── Fil de discussion interne de la réunion ───────────────────────────────────
function MeetingDiscussion({ meeting }) {
  const { getMeetingMessages, sendMeetingMessage, contacts } = useApp();
  const msgs    = getMeetingMessages(meeting.id);
  const [text, setText] = useState('');
  const endRef  = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMeetingMessage(meeting.id, text.trim());
    setText('');
  };

  const getParticipantInfo = (userId) => {
    if (userId === 'me') return { name: 'Moi', avatar: null };
    return contacts.find(c => c.id === userId) || { name: userId, avatar: null };
  };

  return (
    <div className="meetingroom-discussion">
      {/* Messages */}
      <div className="meetingroom-msgs">
        {msgs.length === 0 && (
          <div className="meetingroom-msgs-empty">
            <MessageSquare size={28} style={{ opacity: .3 }} />
            <span>Démarrez la discussion de cette réunion</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Visible uniquement par les participants
            </span>
          </div>
        )}
        {msgs.map(msg => {
          const isMine = msg.senderId === 'me';
          const sender = getParticipantInfo(msg.senderId);
          return (
            <div key={msg.id} className={`mr-msg-row ${isMine ? 'mine' : 'theirs'}`}>
              {!isMine && (
                <img
                  src={sender.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${sender.name}&backgroundColor=128C7E`}
                  alt=""
                  className="avatar avatar-xs mr-msg-avatar"
                />
              )}
              <div className="mr-msg-bubble-wrap">
                {!isMine && <span className="mr-msg-sender">{sender.name}</span>}
                <div className={`msg-bubble ${isMine ? 'bubble-out' : 'bubble-in'}`}>
                  <p className="msg-text">{msg.text}</p>
                  <div className="msg-footer">
                    <span className="msg-time">{format(new Date(msg.time), 'HH:mm')}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Saisie */}
      <div className="meetingroom-input">
        <button className="icon-btn"><Smile size={20} /></button>
        <button className="icon-btn"><Paperclip size={20} /></button>
        <div className="input-wrap">
          <textarea
            className="message-input"
            placeholder="Message aux participants…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
          />
        </div>
        {text.trim()
          ? <button className="icon-btn send-btn" onClick={handleSend}><Send size={20} /></button>
          : <button className="icon-btn"><Mic size={20} /></button>
        }
      </div>
    </div>
  );
}

// ── Onglet Ordre du jour ──────────────────────────────────────────────────────
function MeetingAgenda({ meeting, onUpdate }) {
  const [newPoint, setNewPoint] = useState('');

  const setAgendaPoint = (agId, changes) => {
    const agenda = meeting.agenda.map(a => a.id === agId ? { ...a, ...changes } : a);
    onUpdate({ agenda });
  };

  const addPoint = () => {
    if (!newPoint.trim()) return;
    const agenda = [...meeting.agenda, {
      id: `ag_${Date.now()}`, title: newPoint.trim(), done: false, postponed: false, notes: '',
    }];
    onUpdate({ agenda });
    setNewPoint('');
  };

  const setPresence = (userId, presence) => {
    const participants = meeting.participants.map(p =>
      p.userId === userId ? { ...p, presence } : p
    );
    onUpdate({ participants });
  };

  const { contacts } = useApp();
  const getUser = (id) => contacts.find(c => c.id === id) || { name: id, avatar: null };

  return (
    <div className="meetingroom-agenda">
      {/* Pointage présence */}
      <div className="mr-section">
        <h4 className="mr-section-title"><Users size={14} /> Présence</h4>
        {meeting.participants.map(p => {
          const u = getUser(p.userId);
          return (
            <div key={p.userId} className="mr-presence-row">
              <img
                src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                alt="" className="avatar avatar-xs"
              />
              <span className="mr-presence-name">{u.name}</span>
              <div className="mr-presence-btns">
                {PRESENCE_STATUSES.map(ps => (
                  <button
                    key={ps.id}
                    className={`mr-pres-btn ${p.presence === ps.id ? 'active' : ''}`}
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

      {/* Points ordre du jour */}
      <div className="mr-section">
        <h4 className="mr-section-title"><ListTodo size={14} /> Ordre du jour</h4>
        {meeting.agenda.map((point, idx) => (
          <div key={point.id} className={`mr-agenda-point ${point.done ? 'done' : point.postponed ? 'postponed' : ''}`}>
            <div className="mr-agenda-point-hdr">
              <span className="mr-agenda-num">{idx + 1}</span>
              <span className="mr-agenda-label">{point.title}</span>
              <div className="mr-agenda-actions">
                <button
                  className={`mr-agenda-btn ${point.done ? 'active-green' : ''}`}
                  onClick={() => setAgendaPoint(point.id, { done: !point.done, postponed: false })}
                >
                  <CheckCircle2 size={13} />
                  {point.done ? 'Traité' : 'Traiter'}
                </button>
                <button
                  className={`mr-agenda-btn ${point.postponed ? 'active-yellow' : ''}`}
                  onClick={() => setAgendaPoint(point.id, { postponed: !point.postponed, done: false })}
                >
                  <SkipForward size={13} />
                  {point.postponed ? 'Reporté' : 'Reporter'}
                </button>
              </div>
            </div>
            <textarea
              className="mr-notes-input"
              placeholder="Notes sur ce point…"
              value={point.notes || ''}
              onChange={e => setAgendaPoint(point.id, { notes: e.target.value })}
              rows={2}
            />
          </div>
        ))}

        {/* Ajouter un point */}
        <div className="mr-add-point">
          <input
            value={newPoint}
            onChange={e => setNewPoint(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPoint(); } }}
            placeholder="Ajouter un point à l'ordre du jour…"
            className="mr-add-input"
          />
          <button className="mr-add-btn" onClick={addPoint} disabled={!newPoint.trim()}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Décisions & Actions ────────────────────────────────────────────────
function MeetingDecisions({ meeting, onUpdate, onTransformToProject }) {
  const [newDecision, setNewDecision] = useState('');
  const [newTask, setNewTask]         = useState('');

  const addDecision = () => {
    if (!newDecision.trim()) return;
    const ref = `DEC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const conductLog = [...(meeting.conductLog || []), {
      type: 'decision', ref, title: newDecision.trim(), time: new Date(),
    }];
    onUpdate({ conductLog });
    setNewDecision('');
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const ref = `TSK-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const conductLog = [...(meeting.conductLog || []), {
      type: 'task', ref, title: newTask.trim(), time: new Date(),
    }];
    onUpdate({ conductLog });
    setNewTask('');
  };

  const closeMeeting = () => {
    onUpdate({
      status: 'closed',
      pvStatus: 'draft',
      pvRef: `PV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    });
  };

  const advancePV = () => {
    const idx = PV_CIRCUIT.indexOf(meeting.pvStatus);
    if (idx >= 0 && idx < PV_CIRCUIT.length - 1) {
      onUpdate({ pvStatus: PV_CIRCUIT[idx + 1] });
    }
  };

  const decisions = (meeting.conductLog || []).filter(l => l.type === 'decision');
  const tasks     = (meeting.conductLog || []).filter(l => l.type === 'task');

  return (
    <div className="meetingroom-decisions">
      {/* Décisions */}
      <div className="mr-section">
        <h4 className="mr-section-title"><Gavel size={14} /> Décisions prises</h4>
        {decisions.length === 0 && (
          <p className="mr-empty">Aucune décision enregistrée.</p>
        )}
        {decisions.map((d, i) => (
          <div key={i} className="mr-log-item mr-log-item--decision">
            <Gavel size={12} />
            <div>
              <span className="mr-log-ref">{d.ref}</span>
              <span className="mr-log-title">{d.title}</span>
            </div>
            <span className="mr-log-time">{format(new Date(d.time), 'HH:mm')}</span>
          </div>
        ))}
        <div className="mr-instant-add">
          <input
            value={newDecision}
            onChange={e => setNewDecision(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDecision(); } }}
            placeholder="Intitulé de la décision…"
          />
          <button className="mr-add-btn" onClick={addDecision} disabled={!newDecision.trim()}>
            <Plus size={13} /> Ajouter
          </button>
        </div>
      </div>

      {/* Actions / Tâches */}
      <div className="mr-section">
        <h4 className="mr-section-title"><ListTodo size={14} /> Actions décidées</h4>
        {tasks.length === 0 && (
          <p className="mr-empty">Aucune action enregistrée.</p>
        )}
        {tasks.map((t, i) => (
          <div key={i} className="mr-log-item mr-log-item--task">
            <ListTodo size={12} />
            <div>
              <span className="mr-log-ref">{t.ref}</span>
              <span className="mr-log-title">{t.title}</span>
            </div>
            <span className="mr-log-time">{format(new Date(t.time), 'HH:mm')}</span>
          </div>
        ))}
        <div className="mr-instant-add">
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
            placeholder="Titre de l'action à créer…"
          />
          <button className="mr-add-btn" onClick={addTask} disabled={!newTask.trim()}>
            <Plus size={13} /> Ajouter
          </button>
        </div>
      </div>

      {/* PV Circuit */}
      <div className="mr-section">
        <h4 className="mr-section-title"><FileText size={14} /> Procès-verbal</h4>
        {!meeting.pvStatus ? (
          <div>
            <p className="mr-empty" style={{ marginBottom: 10 }}>
              Clôturez la réunion pour générer automatiquement le PV.
            </p>
            {meeting.status !== 'closed' && (
              <button className="mr-close-btn" onClick={closeMeeting}>
                <CheckCircle2 size={14} /> Clôturer la réunion
              </button>
            )}
          </div>
        ) : (
          <div className="mr-pv-wrap">
            <div className="mr-pv-ref">{meeting.pvRef}</div>
            <div className="mr-pv-circuit">
              {PV_CIRCUIT.map((key, idx) => {
                const curIdx = PV_CIRCUIT.indexOf(meeting.pvStatus);
                const active = idx <= curIdx;
                return (
                  <div key={key} className={`mr-pv-step ${active ? 'active' : ''}`}>
                    <div className="mr-pv-dot" style={{ background: active ? PV_COLORS[key] : 'rgba(255,255,255,.15)' }} />
                    <span>{PV_LABELS[key]}</span>
                  </div>
                );
              })}
            </div>
            {meeting.pvStatus !== 'archived' && (
              <button className="mr-add-btn" style={{ marginTop: 8 }} onClick={advancePV}>
                <ChevronRight size={13} />
                Passer à : {PV_LABELS[PV_CIRCUIT[PV_CIRCUIT.indexOf(meeting.pvStatus) + 1]] || '—'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transformer en Projet */}
      {(decisions.length > 0 || tasks.length > 0) && (
        <div className="mr-section mr-transform-section">
          <h4 className="mr-section-title"><FolderKanban size={14} /> Transformer en projet</h4>
          <p className="mr-transform-desc">
            Créez un projet à partir des décisions et actions de cette réunion.
            Les décisions deviennent des jalons, les actions des tâches initiales.
          </p>
          <button className="mr-transform-btn" onClick={onTransformToProject}>
            <FolderKanban size={15} />
            Créer un projet depuis cette réunion
          </button>
        </div>
      )}
    </div>
  );
}

// ── MeetingRoom principal ─────────────────────────────────────────────────────
export default function MeetingRoom() {
  const {
    activeMeetingId, setActiveMeetingId,
    getMeeting, updateMeeting, meetingToProject,
    contacts,
  } = useApp();

  const [activeTab, setActiveTab]     = useState('discussion');
  const [showTransform, setShowTransform] = useState(false);
  const [transformData, setTransformData] = useState(null);

  const meeting = getMeeting(activeMeetingId);
  if (!meeting) return null;

  const onUpdate = (changes) => updateMeeting(activeMeetingId, changes);

  const handleTransformToProject = () => {
    const data = meetingToProject(activeMeetingId);
    setTransformData(data);
    setShowTransform(true);
  };

  const getUser = (id) => contacts.find(c => c.id === id) || { name: id };

  const TABS = [
    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'agenda',     label: 'Ordre du jour', icon: ListTodo },
    { id: 'decisions',  label: 'Décisions & Actions', icon: Gavel },
  ];

  const STATUS_COLORS = {
    planned: '#3b82f6', open: '#22c55e', closed: '#64748b', cancelled: '#ef4444',
  };
  const statusColor = STATUS_COLORS[meeting.status] || '#64748b';

  return (
    <div className="meetingroom">
      {/* Header */}
      <div className="meetingroom-header">
        <button
          className="icon-btn back-btn"
          onClick={() => setActiveMeetingId(null)}
          title="Retour aux réunions"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="meetingroom-header-info">
          <div className="meetingroom-status-dot" style={{ background: statusColor }} />
          <div className="meetingroom-header-text">
            <div className="meetingroom-header-name">{meeting.title}</div>
            <div className="meetingroom-header-meta">
              <span><Calendar size={11} /> {format(new Date(meeting.scheduledAt), 'EEEE d MMM à HH:mm', { locale: fr })}</span>
              <span><Clock size={11} /> {meeting.duration} min</span>
              <span><Users size={11} /> {meeting.participants.length} participants</span>
              {meeting.location && <span><MapPin size={11} /> {meeting.location}</span>}
            </div>
          </div>
        </div>

        {/* Statut et actions rapides */}
        <div className="meetingroom-header-actions">
          {meeting.status === 'planned' && (
            <button
              className="mr-open-btn"
              onClick={() => onUpdate({ status: 'open' })}
            >
              Démarrer
            </button>
          )}
          {meeting.link && (
            <a href={meeting.link} target="_blank" rel="noreferrer" className="mr-link-btn" title="Rejoindre en ligne">
              <Link size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="meetingroom-tabs">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`meetingroom-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      <div className="meetingroom-content">
        {activeTab === 'discussion' && <MeetingDiscussion meeting={meeting} />}
        {activeTab === 'agenda'     && <MeetingAgenda meeting={meeting} onUpdate={onUpdate} />}
        {activeTab === 'decisions'  && (
          <MeetingDecisions
            meeting={meeting}
            onUpdate={onUpdate}
            onTransformToProject={handleTransformToProject}
          />
        )}
      </div>

      {/* Modal Transformer en projet */}
      {showTransform && transformData && (
        <TransformToProjectModal
          data={transformData}
          onClose={() => setShowTransform(false)}
        />
      )}
    </div>
  );
}

// ── Modal Transformer en Projet ───────────────────────────────────────────────
function TransformToProjectModal({ data, onClose }) {
  const [form, setForm] = useState({
    name: data.name,
    description: data.description,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const handleCreate = () => {
    // En prod : appel API. Ici on affiche une confirmation
    alert(`Projet "${form.name}" créé avec ${data.milestones.length} jalons.\n\nOuvrez le module Projets pour le voir.`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="meeting-modal-header" style={{ padding: '16px 20px' }}>
          <h3>Créer un projet depuis cette réunion</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="mtg-form-field">
            <label>Nom du projet</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="mtg-form-field">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              style={{ resize: 'vertical', padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="mtg-form-field" style={{ flex: 1 }}>
              <label>Date début</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div className="mtg-form-field" style={{ flex: 1 }}>
              <label>Date fin</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
            </div>
          </div>

          {/* Aperçu jalons */}
          {data.milestones.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Jalons issus des décisions ({data.milestones.length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {data.milestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                    <FolderKanban size={11} style={{ color: '#7c3aed' }} />
                    {m.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button className="btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn-primary-meeting" onClick={handleCreate}>
              <FolderKanban size={14} /> Créer le projet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
