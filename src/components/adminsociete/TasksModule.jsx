import { useState } from 'react';
import {
  Search, Plus, Filter, X, Check, ChevronDown, ListTodo,
  Eye, Calendar, Users, Flag, AlertCircle, Clock, Pause,
  CheckCircle2, CheckCheck, Ban, ArrowRightLeft, Upload,
  ThumbsUp, ThumbsDown, History,
} from 'lucide-react';
import { useAdminSociete } from '../../context/AdminSocieteContext';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Colonnes workflow (CDC 11.2) ──────────────────────────────────────────────
const COLUMNS = [
  { id: 'todo',       label: 'À faire',            color: '#64748b', icon: Clock },
  { id: 'planned',    label: 'Planifiée',           color: '#8b5cf6', icon: Calendar },
  { id: 'in_progress',label: 'En cours',            color: '#3b82f6', icon: Clock },
  { id: 'blocked',    label: 'Bloquée',             color: '#ef4444', icon: AlertCircle },
  { id: 'waiting',    label: 'En attente',          color: '#f59e0b', icon: Pause },
  { id: 'submitted',  label: 'Soumise validation',  color: '#06b6d4', icon: Flag },
  { id: 'rejected',   label: 'Rejetée',             color: '#dc2626', icon: X },
  { id: 'validated',  label: 'Validée',             color: '#22c55e', icon: CheckCircle2 },
  { id: 'done',       label: 'Terminée',            color: '#10b981', icon: CheckCheck },
  { id: 'cancelled',  label: 'Annulée',             color: '#374151', icon: Ban },
];

const PRIO = {
  low:      { label: 'Faible',   color: '#64748b' },
  normal:   { label: 'Normale',  color: '#3b82f6' },
  high:     { label: 'Haute',    color: '#f59e0b' },
  urgent:   { label: 'Urgente',  color: '#ef4444' },
  critical: { label: 'Critique', color: '#dc2626' },
};

// ── Modal Création Tâche ──────────────────────────────────────────────────────
function TaskCreateModal({ onClose, onSave }) {
  const { users, decisions, projects } = useAdminSociete();
  const [form, setForm] = useState({
    title: '', description: '', responsableId: '', validatorId: '',
    priority: 'normal', status: 'todo', origin: 'direct',
    decisionId: '', projectId: '',
    startDate: '', dueDate: '', tags: '',
    confidentiality: 'normal',
    contributors: [],
  });

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const activeUsers = users.filter(u => u.status === 'active');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      startDate: form.startDate ? new Date(form.startDate) : null,
      dueDate:   form.dueDate   ? new Date(form.dueDate)   : null,
      tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--lg" style={{ maxWidth:640 }} onClick={e=>e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Nouvelle tâche</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit} style={{ maxHeight:'75vh', overflowY:'auto' }}>
          <div className="sa-form-field">
            <label>Titre *</label>
            <input value={form.title} onChange={e=>f('title',e.target.value)} required autoFocus />
          </div>
          <div className="sa-form-field">
            <label>Description</label>
            <textarea value={form.description} onChange={e=>f('description',e.target.value)} rows={2}
              style={{ resize:'vertical', padding:'8px 12px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, color:'#e2e8f0', fontSize:13, fontFamily:'inherit' }} />
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Responsable principal</label>
              <select value={form.responsableId} onChange={e=>f('responsableId',e.target.value)}>
                <option value="">— Choisir —</option>
                {activeUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Validateur</label>
              <select value={form.validatorId} onChange={e=>f('validatorId',e.target.value)}>
                <option value="">— Optionnel —</option>
                {activeUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Priorité</label>
              <select value={form.priority} onChange={e=>f('priority',e.target.value)}>
                {Object.entries(PRIO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Confidentialité</label>
              <select value={form.confidentiality} onChange={e=>f('confidentiality',e.target.value)}>
                <option value="normal">Normal</option>
                <option value="restricted">Restreint</option>
                <option value="confidential">Confidentiel</option>
              </select>
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field"><label>Date de début</label><input type="date" value={form.startDate} onChange={e=>f('startDate',e.target.value)}/></div>
            <div className="sa-form-field"><label>Échéance *</label><input type="date" value={form.dueDate} onChange={e=>f('dueDate',e.target.value)}/></div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Origine</label>
              <select value={form.origin} onChange={e=>f('origin',e.target.value)}>
                <option value="direct">Création directe</option>
                <option value="decision">Décision</option>
                <option value="meeting">Réunion</option>
                <option value="project">Projet</option>
                <option value="message">Message</option>
              </select>
            </div>
            {form.origin==='decision' && (
              <div className="sa-form-field">
                <label>Décision liée</label>
                <select value={form.decisionId} onChange={e=>f('decisionId',e.target.value)}>
                  <option value="">— Choisir —</option>
                  {decisions.map(d=><option key={d.id} value={d.id}>{d.ref} — {d.title}</option>)}
                </select>
              </div>
            )}
            {form.origin==='project' && (
              <div className="sa-form-field">
                <label>Projet lié</label>
                <select value={form.projectId} onChange={e=>f('projectId',e.target.value)}>
                  <option value="">— Choisir —</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="sa-form-field"><label>Tags</label><input value={form.tags} onChange={e=>f('tags',e.target.value)} placeholder="ex: urgent, client, projet"/></div>
          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sa-btn sa-btn--primary"><Check size={15}/> Créer la tâche</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Soumission preuve ───────────────────────────────────────────────────
function SubmitProofModal({ task, onClose, onSubmit }) {
  const [proof, setProof] = useState('');
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--sm" onClick={e=>e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Soumettre pour validation</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="sa-modal-body">
          <p style={{ fontSize:13, color:'#94a3b8', marginBottom:10 }}>
            Tâche : <strong style={{ color:'#f1f5f9' }}>{task.title}</strong>
          </p>
          <div className="sa-form-field">
            <label>Preuve / Justificatif</label>
            <input value={proof} onChange={e=>setProof(e.target.value)} placeholder="Nom du fichier, lien ou description de la preuve…" autoFocus />
          </div>
          <p style={{ fontSize:11, color:'#475569', marginTop:6 }}>La preuve est optionnelle mais recommandée.</p>
        </div>
        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
          <button className="sa-btn sa-btn--primary" onClick={() => { onSubmit(proof); onClose(); }}>
            <Upload size={14}/> Soumettre
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Rejet ───────────────────────────────────────────────────────────────
function RejectModal({ task, onClose, onReject }) {
  const [reason, setReason] = useState('');
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--sm" onClick={e=>e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Rejeter la tâche</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="sa-modal-body">
          <p style={{ fontSize:13, color:'#94a3b8', marginBottom:10 }}>
            Tâche : <strong style={{ color:'#f1f5f9' }}>{task.title}</strong>
          </p>
          <div className="sa-form-field">
            <label>Motif du rejet *</label>
            <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} autoFocus
              style={{ resize:'vertical', padding:'8px 10px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, color:'#e2e8f0', fontSize:13, fontFamily:'inherit' }}
              placeholder="Expliquer les corrections à apporter…" />
          </div>
        </div>
        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
          <button className="sa-btn sa-btn--danger" disabled={!reason.trim()} onClick={() => { onReject(reason); onClose(); }}>
            <ThumbsDown size={14}/> Rejeter
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panneau détail tâche ──────────────────────────────────────────────────────
function TaskDetail({ task, onClose }) {
  const { updateTask, submitTask, validateTask, rejectTask, transferAllTasksFromUser, users } = useAdminSociete();
  const [modal, setModal] = useState(null); // 'submit' | 'reject' | 'transfer' | 'edit'
  const [editForm, setEditForm] = useState({ ...task, dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '', startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '', tags: (task.tags||[]).join(', '), proof: task.proof?.label||'' });
  const [transferTo, setTransferTo] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const now = new Date();
  const col = COLUMNS.find(c=>c.id===task.status)||COLUMNS[0];
  const isLate = task.dueDate && new Date(task.dueDate) < now && !['done','validated','cancelled'].includes(task.status);
  const daysLate = isLate ? differenceInDays(now, new Date(task.dueDate)) : 0;
  const responsible = users.find(u=>u.id===task.responsableId);
  const validator   = users.find(u=>u.id===task.validatorId);
  const colleagues  = users.filter(u=>u.id!==task.responsableId && u.status==='active');

  const handleSaveEdit = () => {
    updateTask(task.id, {
      ...editForm,
      dueDate:   editForm.dueDate   ? new Date(editForm.dueDate)   : null,
      startDate: editForm.startDate ? new Date(editForm.startDate) : null,
      tags: editForm.tags.split(',').map(t=>t.trim()).filter(Boolean),
      progress: Number(editForm.progress),
      proof: editForm.proof ? { type:'file', label:editForm.proof, date:new Date() } : task.proof,
    });
    setShowEdit(false);
  };

  const ef = (k,v) => setEditForm(p=>({...p,[k]:v}));
  const prioC = PRIO[task.priority]||PRIO.normal;

  return (
    <div className="sa-detail-overlay" onClick={onClose}>
      <div className="sa-detail-panel sa-detail-panel--wide" onClick={e=>e.stopPropagation()}>
        <div className="sa-detail-header">
          <button className="sa-icon-btn" onClick={onClose}><X size={18}/></button>
          <h3>Détail tâche</h3>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span className="sa-badge" style={{ background:col.color+'22', color:col.color }}>{col.label}</span>
            {isLate && <span className="sa-badge sa-badge--red">+{daysLate}j retard</span>}
          </div>
        </div>

        <div className="sa-detail-body">
          {/* En-tête tâche */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'monospace', fontSize:10, color:'#64748b', marginBottom:4 }}>{task.ref}</div>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#f1f5f9', margin:0 }}>{task.title}</h2>
              {task.description && <p style={{ fontSize:13, color:'#94a3b8', marginTop:6, lineHeight:1.5 }}>{task.description}</p>}
            </div>
            <span className="sa-badge" style={{ background:prioC.color+'22', color:prioC.color, flexShrink:0 }}>{prioC.label}</span>
          </div>

          {/* Infos */}
          <div className="sa-detail-section">
            <div className="sa-detail-row"><span className="sa-detail-key">Responsable</span>
              <div className="sa-user-cell" style={{ gap:6 }}>
                {responsible && <img src={responsible.avatar} alt="" style={{ width:22, height:22, borderRadius:'50%' }}/>}
                <span>{responsible?.name||'—'}</span>
              </div>
            </div>
            <div className="sa-detail-row"><span className="sa-detail-key">Validateur</span><span>{validator?.name||'—'}</span></div>
            <div className="sa-detail-row"><span className="sa-detail-key">Début</span><span>{task.startDate ? format(new Date(task.startDate),'d MMM yyyy',{locale:fr}) : '—'}</span></div>
            <div className="sa-detail-row"><span className="sa-detail-key">Échéance</span>
              <span style={{ color: isLate ? '#ef4444' : 'inherit' }}>
                {task.dueDate ? format(new Date(task.dueDate),'d MMM yyyy',{locale:fr}) : '—'}
                {isLate && ` (+${daysLate}j)`}
              </span>
            </div>
            <div className="sa-detail-row"><span className="sa-detail-key">Avancement</span>
              <div style={{ flex:1, maxWidth:200 }}>
                <div className="sa-progress-bar-wrap"><div className="sa-progress-bar" style={{ width:`${task.progress||0}%`, background:col.color }}/></div>
                <span style={{ fontSize:11, color:'#64748b' }}>{task.progress||0}%</span>
              </div>
            </div>
            {task.proof && (
              <div className="sa-detail-row"><span className="sa-detail-key">Preuve</span><span style={{ color:'#22c55e' }}>✓ {task.proof.label}</span></div>
            )}
            {task.rejectionReason && (
              <div className="sa-detail-row"><span className="sa-detail-key">Motif rejet</span><span style={{ color:'#ef4444' }}>{task.rejectionReason}</span></div>
            )}
          </div>

          {/* Actions selon statut */}
          <div className="sa-detail-section">
            <span className="sa-detail-section-title">Actions</span>
            <div className="sa-detail-actions">
              {/* Modifier */}
              <button className="sa-btn sa-btn--ghost" onClick={() => setShowEdit(v=>!v)}>
                ✏️ Modifier
              </button>
              {/* Démarrer */}
              {task.status === 'todo' && (
                <button className="sa-btn sa-btn--primary" onClick={() => updateTask(task.id,{status:'in_progress'})}>
                  <Clock size={13}/> Démarrer
                </button>
              )}
              {/* Bloquer */}
              {task.status === 'in_progress' && (
                <button className="sa-btn sa-btn--ghost" onClick={() => updateTask(task.id,{status:'blocked'})}>
                  <AlertCircle size={13}/> Marquer bloquée
                </button>
              )}
              {/* Débloquer */}
              {task.status === 'blocked' && (
                <button className="sa-btn sa-btn--primary" onClick={() => updateTask(task.id,{status:'in_progress'})}>
                  Reprendre
                </button>
              )}
              {/* Soumettre */}
              {['in_progress','rejected'].includes(task.status) && (
                <button className="sa-btn sa-btn--primary" onClick={() => setModal('submit')}>
                  <Upload size={13}/> Soumettre pour validation
                </button>
              )}
              {/* Valider */}
              {task.status === 'submitted' && (
                <>
                  <button className="sa-btn sa-btn--primary" onClick={() => validateTask(task.id,'Validé par Admin.')}>
                    <ThumbsUp size={13}/> Valider
                  </button>
                  <button className="sa-btn sa-btn--danger" onClick={() => setModal('reject')}>
                    <ThumbsDown size={13}/> Rejeter
                  </button>
                </>
              )}
              {/* Clôturer */}
              {task.status === 'validated' && (
                <button className="sa-btn sa-btn--primary" onClick={() => updateTask(task.id,{status:'done'})}>
                  <CheckCheck size={13}/> Clôturer
                </button>
              )}
              {/* Annuler */}
              {!['done','cancelled','validated'].includes(task.status) && (
                <button className="sa-btn sa-btn--ghost" style={{ color:'#64748b' }} onClick={() => updateTask(task.id,{status:'cancelled'})}>
                  <Ban size={13}/> Annuler
                </button>
              )}
            </div>
          </div>

          {/* Formulaire d'édition inline */}
          {showEdit && (
            <div className="sa-detail-section task-edit-section">
              <span className="sa-detail-section-title">Modifier la tâche</span>
              <div className="sa-form-field"><label>Titre</label><input value={editForm.title} onChange={e=>ef('title',e.target.value)}/></div>
              <div className="sa-form-row">
                <div className="sa-form-field"><label>Priorité</label>
                  <select value={editForm.priority} onChange={e=>ef('priority',e.target.value)}>
                    {Object.entries(PRIO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="sa-form-field"><label>Statut</label>
                  <select value={editForm.status} onChange={e=>ef('status',e.target.value)}>
                    {COLUMNS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="sa-form-row">
                <div className="sa-form-field"><label>Échéance</label><input type="date" value={editForm.dueDate} onChange={e=>ef('dueDate',e.target.value)}/></div>
                <div className="sa-form-field"><label>Avancement %</label>
                  <input type="range" min={0} max={100} step={5} value={editForm.progress} onChange={e=>ef('progress',e.target.value)} style={{ accentColor:'#3b82f6' }}/>
                  <span style={{ fontSize:11, color:'#64748b' }}>{editForm.progress}%</span>
                </div>
              </div>
              <div className="sa-form-field"><label>Preuve</label><input value={editForm.proof} onChange={e=>ef('proof',e.target.value)} placeholder="Nom du fichier ou description…"/></div>
              <div className="sa-form-field"><label>Tags</label><input value={editForm.tags} onChange={e=>ef('tags',e.target.value)}/></div>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={() => setShowEdit(false)}>Annuler</button>
                <button className="sa-btn sa-btn--primary sa-btn--sm" onClick={handleSaveEdit}><Check size={13}/> Enregistrer</button>
              </div>
            </div>
          )}

          {/* Transfert */}
          {!['done','validated','cancelled'].includes(task.status) && (
            <div className="sa-detail-section">
              <span className="sa-detail-section-title"><ArrowRightLeft size={13}/> Transférer</span>
              <div className="sa-transfer-row">
                <select className="sa-transfer-select" value={transferTo} onChange={e=>setTransferTo(e.target.value)}>
                  <option value="">— Sélectionner un remplaçant —</option>
                  {colleagues.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button className="sa-btn sa-btn--primary sa-btn--sm" disabled={!transferTo}
                  onClick={() => { updateTask(task.id,{responsableId:transferTo, previousResponsableId:task.responsableId}); setTransferTo(''); }}>
                  <ArrowRightLeft size={13}/> Transférer
                </button>
              </div>
            </div>
          )}

          {/* Historique */}
          <div className="sa-detail-section">
            <span className="sa-detail-section-title"><History size={13}/> Historique</span>
            <div className="dec-history-list">
              {(task.history||[]).length === 0 && <p className="sa-empty" style={{ padding:'4px 0' }}>Aucune modification.</p>}
              {(task.history||[]).map((h,i) => (
                <div key={i} className="dec-history-item">
                  <div className="dec-history-dot" style={{ background:'#3b82f6' }}/>
                  <div className="dec-history-body">
                    <span className="dec-history-status">{h.action||`Modifié : ${h.changes}`}</span>
                    {h.note && <span className="dec-history-note">{h.note}</span>}
                    <span className="dec-history-time">{format(new Date(h.date),'d MMM yyyy HH:mm',{locale:fr})}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modals dans le panneau */}
        {modal==='submit' && <SubmitProofModal task={task} onClose={()=>setModal(null)} onSubmit={(proof)=>submitTask(task.id,proof)}/>}
        {modal==='reject' && <RejectModal task={task} onClose={()=>setModal(null)} onReject={(reason)=>rejectTask(task.id,reason)}/>}
      </div>
    </div>
  );
}

// ── Page principale Tâches ────────────────────────────────────────────────────
function KanbanColumn({ column, tasks, users, onSelectTask, onDropTask }) {
  const [dragOver, setDragOver] = useState(false);
  const ColumnIcon = column.icon;

  return (
    <div className="kanban-column" style={{ minWidth: 200, maxWidth: 220 }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { setDragOver(false); onDropTask(e, column.id); }}
    >
      <div className="kanban-col-header" style={{ '--col-color': column.color }}>
        <div className="kanban-col-title">
          <ColumnIcon size={13} style={{ color: column.color }} />
          <span>{column.label}</span>
          <span className="kanban-col-count">{tasks.length}</span>
        </div>
      </div>
      <div className={`kanban-col-body ${dragOver ? 'drag-over' : ''}`}>
        {tasks.map(task => {
          const priority = PRIO[task.priority] || PRIO.normal;
          const responsible = users.find(user => user.id === task.responsableId);
          return (
            <div key={task.id} className="kanban-card" draggable
              onDragStart={e => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.effectAllowed = 'move'; }}
              onClick={() => onSelectTask(task)}
            >
              <div className="kanban-card-header">
                <span className="kanban-card-ref">{task.ref}</span>
                <span className="kanban-card-prio" style={{ background: priority.color + '22', color: priority.color }}>{priority.label}</span>
              </div>
              <p className="kanban-card-title">{task.title}</p>
              <div className="kanban-card-footer">
                <div className="kanban-card-meta"><Users size={10} /><span>{responsible?.name || '—'}</span></div>
                {task.dueDate && <div className="kanban-card-meta"><Calendar size={10} /><span>{format(new Date(task.dueDate), 'd MMM', { locale: fr })}</span></div>}
              </div>
              {(task.progress || 0) > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div className="sa-progress-bar-wrap"><div className="sa-progress-bar" style={{ width: `${task.progress}%`, background: column.color }} /></div>
                </div>
              )}
            </div>
          );
        })}
        {tasks.length === 0 && <div className="kanban-col-empty">Vide</div>}
      </div>
    </div>
  );
}

export default function TasksModule() {
  const { tasks, stats, createTask } = useAdminSociete();
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrio, setFilterPrio]     = useState('all');
  const [showFilters, setShowFilters]   = useState(false);
  const [viewMode, setViewMode]         = useState('table'); // table | kanban
  const [selected, setSelected]         = useState(null);
  const [showCreate, setShowCreate]     = useState(false);
  const { users }                       = useAdminSociete();

  const now = new Date();
  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    return (t.title.toLowerCase().includes(q)||t.ref?.toLowerCase().includes(q))
      && (filterStatus==='all'||t.status===filterStatus)
      && (filterPrio==='all'||t.priority===filterPrio);
  });

  // Vue Kanban
  const [kanbanTasks, setKanbanTasks] = useState(tasks);
  const { updateTask } = useAdminSociete();

  const handleKanbanDrop = (e, targetStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) updateTask(taskId, { status: targetStatus });
  };

  return (
    <div className="sa-page">
      {/* KPIs */}
      <div className="sa-kpi-grid sa-kpi-grid--sm">
        {[
          { label:'Total',        value: tasks.length,              color:'#3b82f6' },
          { label:'En retard',    value: stats.lateTasks,           color:'#ef4444' },
          { label:'À valider',    value: stats.submittedTasks,      color:'#f59e0b' },
          { label:'Terminées',    value: tasks.filter(t=>['done','validated'].includes(t.status)).length, color:'#22c55e' },
        ].map(s=>(
          <div key={s.label} className="sa-kpi-card" style={{ '--kpi-color':s.color }}>
            <div className="sa-kpi-icon"><ListTodo size={18}/></div>
            <div className="sa-kpi-body"><span className="sa-kpi-value">{s.value}</span><span className="sa-kpi-label">{s.label}</span></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sa-toolbar">
        <div className="sa-search-wrap">
          <Search size={15} className="sa-search-icon"/>
          <input className="sa-search-input" placeholder="Titre, référence…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <button className={`sa-btn sa-btn--ghost ${showFilters?'active':''}`} onClick={()=>setShowFilters(v=>!v)}>
          <Filter size={14}/> Filtres <ChevronDown size={12}/>
        </button>
        <div className="sa-filter-tabs">
          <button className={`sa-filter-tab ${viewMode==='table'?'active':''}`} onClick={()=>setViewMode('table')}>Tableau</button>
          <button className={`sa-filter-tab ${viewMode==='kanban'?'active':''}`} onClick={()=>setViewMode('kanban')}>Kanban</button>
        </div>
        <button className="sa-btn sa-btn--primary" onClick={()=>setShowCreate(true)}>
          <Plus size={15}/> Nouvelle tâche
        </button>
      </div>

      {showFilters && (
        <div className="sa-filters-bar">
          <div className="sa-filter-group">
            <label>Statut</label>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="all">Tous</option>
              {COLUMNS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="sa-filter-group">
            <label>Priorité</label>
            <select value={filterPrio} onChange={e=>setFilterPrio(e.target.value)}>
              <option value="all">Toutes</option>
              {Object.entries(PRIO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={()=>{setFilterStatus('all');setFilterPrio('all');}}>
            <X size={13}/> Réinitialiser
          </button>
        </div>
      )}

      {/* Vue tableau */}
      {viewMode === 'table' && (
        <>
          <div className="sa-results-count">{filtered.length} tâche{filtered.length>1?'s':''}</div>
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr><th>Référence</th><th>Titre</th><th>Responsable</th><th>Priorité</th><th>Statut</th><th>Échéance</th><th>%</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.length===0 && <tr><td colSpan={8} className="sa-table-empty">Aucune tâche.</td></tr>}
                {filtered.map(t => {
                  const col = COLUMNS.find(c=>c.id===t.status)||COLUMNS[0];
                  const pr  = PRIO[t.priority]||PRIO.normal;
                  const resp = users.find(u=>u.id===t.responsableId);
                  const isLate = t.dueDate && new Date(t.dueDate)<now && !['done','validated','cancelled'].includes(t.status);
                  return (
                    <tr key={t.id} className="sa-table-row" onClick={()=>setSelected(t)}>
                      <td><span style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{t.ref}</span></td>
                      <td><span className="sa-user-name">{t.title}</span></td>
                      <td className="sa-table-sub">{resp?.name||'—'}</td>
                      <td><span className="sa-badge" style={{ background:pr.color+'22', color:pr.color }}>{pr.label}</span></td>
                      <td><span className="sa-badge" style={{ background:col.color+'22', color:col.color }}>{col.label}</span></td>
                      <td className="sa-table-sub" style={{ color:isLate?'#ef4444':'inherit' }}>
                        {t.dueDate ? format(new Date(t.dueDate),'d MMM yyyy',{locale:fr}) : '—'}
                        {isLate && ` (+${differenceInDays(now,new Date(t.dueDate))}j)`}
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div className="sa-progress-bar-wrap" style={{ width:60 }}>
                            <div className="sa-progress-bar" style={{ width:`${t.progress||0}%`, background:col.color }}/>
                          </div>
                          <span style={{ fontSize:10, color:'#64748b' }}>{t.progress||0}%</span>
                        </div>
                      </td>
                      <td><button className="sa-icon-btn" onClick={e=>{e.stopPropagation();setSelected(t);}}><Eye size={15}/></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Vue Kanban */}
      {viewMode === 'kanban' && (
        <div className="tasks-kanban-board">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasks.filter(task => task.status === column.id)}
              users={users}
              onSelectTask={setSelected}
              onDropTask={handleKanbanDrop}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <TaskCreateModal onClose={()=>setShowCreate(false)} onSave={(data)=>{createTask(data);setShowCreate(false);}}/>
      )}
      {selected && (
        <TaskDetail task={tasks.find(t=>t.id===selected.id)||selected} onClose={()=>setSelected(null)}/>
      )}
    </div>
  );
}
