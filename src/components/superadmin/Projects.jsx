import { useState, useRef } from 'react';
import {
  Search, Plus, Filter, X, Check, FolderKanban, Calendar, Users,
  Flag, CheckCircle2, Circle, Building2, Tag, LayoutGrid,
  List, ChevronDown, AlertCircle, Clock, Pause, CheckCheck, Ban,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { companies, departments } from '../../data/mockData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Colonnes Kanban des TÂCHES ────────────────────────────────────────────────
const TASK_COLUMNS = [
  { id: 'todo',       label: 'À faire',             color: '#64748b', icon: Circle },
  { id: 'in_progress',label: 'En cours',            color: '#3b82f6', icon: Clock },
  { id: 'blocked',    label: 'Bloquée',             color: '#ef4444', icon: AlertCircle },
  { id: 'waiting',    label: 'En attente',          color: '#f59e0b', icon: Pause },
  { id: 'submitted',  label: 'Soumise validation',  color: '#8b5cf6', icon: Flag },
  { id: 'validated',  label: 'Validée',             color: '#22c55e', icon: CheckCircle2 },
  { id: 'done',       label: 'Terminée',            color: '#10b981', icon: CheckCheck },
  { id: 'cancelled',  label: 'Annulée',             color: '#374151', icon: Ban },
];

const PRIORITY_COLORS = { low:'#64748b', normal:'#3b82f6', high:'#f59e0b', urgent:'#ef4444', critical:'#dc2626' };
const PRIORITY_LABELS = { low:'Faible', normal:'Normale', high:'Haute', urgent:'Urgente', critical:'Critique' };

const PROJECT_STATUS = {
  draft:       { label:'Brouillon', color:'#64748b' },
  in_progress: { label:'En cours',  color:'#3b82f6' },
  on_hold:     { label:'En pause',  color:'#f59e0b' },
  completed:   { label:'Terminé',   color:'#22c55e' },
  cancelled:   { label:'Annulé',    color:'#64748b' },
};

function getUserName(users, id) { return users.find(u => u.id === id)?.name || '—'; }
function getCompanyName(id) { return companies.find(c => c.id === id)?.name || '—'; }
function getDeptName(id)    { return departments.find(d => d.id === id)?.name || '—'; }

function ProgressBar({ value, color = '#3b82f6' }) {
  return (
    <div className="sa-progress-bar-wrap">
      <div className="sa-progress-bar" style={{ width: `${Math.min(100,value)}%`, background: color }} />
    </div>
  );
}

// ── Modal d'édition complète d'une tâche ─────────────────────────────────────
function TaskEditModal({ task, users, projectCompanyId, onClose, onSave }) {
  const [form, setForm] = useState({
    title:          task.title        || '',
    description:    task.description  || '',
    responsableId:  task.responsableId|| '',
    priority:       task.priority     || 'normal',
    status:         task.status       || 'todo',
    dueDate:        task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    startDate:      task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
    progress:       task.progress     || 0,
    validatorId:    task.validatorId  || '',
    tags:           (task.tags || []).join(', '),
    proof:          task.proof?.label || '',
  });

  const companyUsers = users.filter(u =>
    u.companyId === projectCompanyId && u.status === 'active'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...task,
      ...form,
      dueDate:   form.dueDate   ? new Date(form.dueDate)   : null,
      startDate: form.startDate ? new Date(form.startDate) : null,
      progress:  Number(form.progress),
      tags:      form.tags.split(',').map(t => t.trim()).filter(Boolean),
      proof:     form.proof ? { type: 'file', label: form.proof, date: new Date() } : task.proof,
    });
  };

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const colInfo = TASK_COLUMNS.find(c => c.id === form.status);

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--lg" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3>Modifier la tâche</h3>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{task.ref}</span>
          </div>
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit} style={{ maxHeight: '75vh', overflowY: 'auto' }}>

          {/* Titre */}
          <div className="sa-form-field">
            <label>Titre *</label>
            <input value={form.title} onChange={e => f('title', e.target.value)} required autoFocus />
          </div>

          {/* Description */}
          <div className="sa-form-field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => f('description', e.target.value)}
              rows={3}
              style={{ resize:'vertical', padding:'8px 12px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, color:'#e2e8f0', fontSize:13, fontFamily:'inherit' }}
            />
          </div>

          {/* Statut + Priorité */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Statut</label>
              <select value={form.status} onChange={e => f('status', e.target.value)}>
                {TASK_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Priorité</label>
              <select value={form.priority} onChange={e => f('priority', e.target.value)}>
                {Object.entries(PRIORITY_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Responsable + Validateur */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Responsable principal</label>
              <select value={form.responsableId} onChange={e => f('responsableId', e.target.value)}>
                <option value="">— Choisir —</option>
                {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Validateur</label>
              <select value={form.validatorId} onChange={e => f('validatorId', e.target.value)}>
                <option value="">— Optionnel —</option>
                {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Date de début</label>
              <input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)} />
            </div>
            <div className="sa-form-field">
              <label>Échéance</label>
              <input type="date" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} />
            </div>
          </div>

          {/* Avancement */}
          <div className="sa-form-field">
            <label>Avancement : {form.progress}%</label>
            <input
              type="range" min={0} max={100} step={5}
              value={form.progress}
              onChange={e => f('progress', e.target.value)}
              style={{ width:'100%', accentColor: colInfo?.color || '#7c3aed' }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#64748b', marginTop:2 }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* Preuve */}
          <div className="sa-form-field">
            <label>Preuve / Justificatif</label>
            <input
              value={form.proof}
              onChange={e => f('proof', e.target.value)}
              placeholder="Nom du fichier ou description de la preuve…"
            />
          </div>

          {/* Tags */}
          <div className="sa-form-field">
            <label>Tags (séparés par virgule)</label>
            <input
              value={form.tags}
              onChange={e => f('tags', e.target.value)}
              placeholder="ex: urgent, client, technique"
            />
          </div>

          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sa-btn sa-btn--primary">
              <Check size={15} /> Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Carte tâche Kanban ────────────────────────────────────────────────────────
function TaskCard({ task, users, isDragging, onDragStart, onEdit }) {
  const prioColor = PRIORITY_COLORS[task.priority] || '#64748b';
  const isLate = task.dueDate && new Date(task.dueDate) < new Date() && !['done','cancelled','validated'].includes(task.status);

  return (
    <div
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onClick={e => { e.stopPropagation(); onEdit && onEdit(task); }}
    >
      <div className="kanban-card-header">
        <span className="kanban-card-ref">{task.ref}</span>
        <span className="kanban-card-prio" style={{ background: prioColor + '22', color: prioColor }}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>
      <p className="kanban-card-title">{task.title}</p>
      <div className="kanban-card-footer">
        <div className="kanban-card-meta">
          <Users size={11} />
          <span>{getUserName(users, task.responsableId)}</span>
        </div>
        {task.dueDate && (
          <div className={`kanban-card-meta ${isLate ? 'late' : ''}`}>
            <Calendar size={11} />
            <span>{format(new Date(task.dueDate), 'd MMM', { locale: fr })}</span>
          </div>
        )}
      </div>
      {task.progress > 0 && (
        <div style={{ marginTop: 6 }}>
          <ProgressBar value={task.progress} color={prioColor} />
        </div>
      )}
      <div className="kanban-card-edit-hint">Cliquer pour modifier</div>
    </div>
  );
}

// ── Colonne Kanban ────────────────────────────────────────────────────────────
function KanbanColumn({ column, tasks, users, onDrop, onDragOver, openAddTask, onEditTask }) {
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  return (
    <div className="kanban-column">
      <div className="kanban-col-header" style={{ '--col-color': column.color }}>
        <div className="kanban-col-title">
          <column.icon size={14} style={{ color: column.color }} />
          <span>{column.label}</span>
          <span className="kanban-col-count">{tasks.length}</span>
        </div>
        <button
          className="kanban-add-btn"
          onClick={() => openAddTask(column.id)}
          title={`Ajouter une tâche dans ${column.label}`}
        >
          <Plus size={13} />
        </button>
      </div>
      <div
        className={`kanban-col-body ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); onDragOver(e); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { setDragOver(false); onDrop(e, column.id); }}
      >
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            users={users}
            isDragging={draggingId === task.id}
            onDragStart={(e) => {
              setDraggingId(task.id);
              e.dataTransfer.setData('taskId', task.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onEdit={onEditTask}
          />
        ))}
        {tasks.length === 0 && (
          <div className="kanban-col-empty">Déposez une tâche ici</div>
        )}
      </div>
    </div>
  );
}

// ── Modal Ajout Tâche rapide ──────────────────────────────────────────────────
function QuickTaskModal({ projectId, defaultStatus, users, companyId, onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', description: '', responsableId: '',
    dueDate: '', priority: 'normal', status: defaultStatus || 'todo',
  });
  const projUsers = users.filter(u => u.companyId === companyId && u.status === 'active');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...form,
      projectId,
      companyId,
      origin: 'project',
      dueDate: form.dueDate ? new Date(form.dueDate) : null,
      progress: 0,
      history: [],
      contributors: [],
      validatorId: null,
      tags: [],
    });
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Nouvelle tâche</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit}>
          <div className="sa-form-field">
            <label>Titre *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required autoFocus />
          </div>
          <div className="sa-form-field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              style={{ resize: 'vertical', padding: '8px 12px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#e2e8f0', fontSize: 13 }}
            />
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Responsable</label>
              <select value={form.responsableId} onChange={e => setForm(p => ({ ...p, responsableId: e.target.value }))}>
                <option value="">— Choisir —</option>
                {projUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Priorité</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">Faible</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
                <option value="critical">Critique</option>
              </select>
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Statut initial</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {TASK_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Échéance</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sa-btn sa-btn--primary"><Check size={15} /> Créer la tâche</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Création Projet ─────────────────────────────────────────────────────
function ProjectModal({ onClose, onSave, users }) {
  const [form, setForm] = useState({
    name: '', description: '', companyId: '', departmentId: '',
    responsableId: '', sponsorId: '', startDate: '', endDate: '',
    status: 'draft', tags: '',
    milestones: [],
  });
  const [newMS, setNewMS] = useState('');
  const depts = departments.filter(d => d.companyId === form.companyId);
  const companyUsers = users.filter(u => u.companyId === form.companyId && u.status === 'active');

  const addMilestone = () => {
    if (!newMS.trim()) return;
    setForm(p => ({ ...p, milestones: [...p.milestones, { id: `ms_${Date.now()}`, label: newMS.trim(), done: false, dueDate: null }] }));
    setNewMS('');
  };

  const removeMilestone = (id) => setForm(p => ({ ...p, milestones: p.milestones.filter(m => m.id !== id) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.companyId) return;
    onSave({
      ...form,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      members: form.responsableId ? [form.responsableId] : [],
      progress: 0,
    });
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Nouveau projet</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit}>
          <div className="sa-form-field">
            <label>Nom du projet *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="sa-form-field">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              style={{ resize: 'vertical', padding: '8px 12px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: '#e2e8f0', fontSize: 13 }} />
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Société *</label>
              <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value, departmentId: '', responsableId: '', sponsorId: '' }))} required>
                <option value="">— Choisir —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Direction/Service</label>
              <select value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
                <option value="">— Aucun —</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Responsable</label>
              <select value={form.responsableId} onChange={e => setForm(p => ({ ...p, responsableId: e.target.value }))}>
                <option value="">— Choisir —</option>
                {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Sponsor</label>
              <select value={form.sponsorId} onChange={e => setForm(p => ({ ...p, sponsorId: e.target.value }))}>
                <option value="">— Choisir —</option>
                {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field"><label>Date début</label><input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
            <div className="sa-form-field"><label>Date fin prévue</label><input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} /></div>
          </div>
          {/* Jalons */}
          <div className="sa-form-field">
            <label>Jalons</label>
            <div className="sa-milestone-add-row">
              <input value={newMS} onChange={e => setNewMS(e.target.value)} onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addMilestone();}}} placeholder="Nom du jalon…" />
              <button type="button" className="sa-btn sa-btn--ghost sa-btn--sm" onClick={addMilestone}><Plus size={13}/> Ajouter</button>
            </div>
            {form.milestones.map(m => (
              <div key={m.id} className="sa-milestone-tag">
                <Circle size={11} style={{ color:'#64748b' }} />
                <span>{m.label}</span>
                <button type="button" onClick={() => removeMilestone(m.id)}><X size={11}/></button>
              </div>
            ))}
          </div>
          <div className="sa-form-field"><label>Tags (séparés par virgule)</label><input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="ex: infrastructure, digital" /></div>
          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sa-btn sa-btn--primary"><Check size={15} /> Créer le projet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vue Kanban d'un projet ────────────────────────────────────────────────────
function ProjectKanban({ project, onClose }) {
  const { users, tasks, updateProject, toggleMilestone } = useWorkspace();
  const [localTasks, setLocalTasks] = useState(
    tasks.filter(t => t.projectId === project.id)
  );
  const [addTaskFor, setAddTaskFor]   = useState(null);
  const [editingTask, setEditingTask] = useState(null); // tâche en cours d'édition

  // Tâches par colonne
  const tasksByCol = (colId) => localTasks.filter(t => t.status === colId);

  // Drag & drop
  const handleDrop = (e, targetColId) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    setLocalTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: targetColId } : t)
    );
    // Recalcul avancement
    const updated = localTasks.map(t => t.id === taskId ? { ...t, status: targetColId } : t);
    const done  = updated.filter(t => ['done','validated'].includes(t.status)).length;
    const total = updated.length;
    if (total > 0) updateProject(project.id, { progress: Math.round((done/total)*100) });
  };

  const handleAddTask = (taskData) => {
    const newTask = {
      id: `task_${Date.now()}`,
      ref: `TSK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      ...taskData,
    };
    setLocalTasks(prev => [...prev, newTask]);
    setAddTaskFor(null);
  };

  const handleSaveEditedTask = (updatedTask) => {
    setLocalTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    // Recalcul avancement
    const updated = localTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    const done  = updated.filter(t => ['done','validated'].includes(t.status)).length;
    const total = updated.length;
    if (total > 0) updateProject(project.id, { progress: Math.round((done/total)*100) });
    setEditingTask(null);
  };

  const status = PROJECT_STATUS[project.status] || PROJECT_STATUS.draft;
  const doneMS = project.milestones.filter(m => m.done).length;

  return (
    <div className="kanban-view">
      {/* Header projet */}
      <div className="kanban-view-header">
        <div className="kanban-view-info">
          <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={onClose}>
            ← Tous les projets
          </button>
          <div className="kanban-view-title-wrap">
            <span className="kanban-view-ref">{project.ref}</span>
            <h2 className="kanban-view-title">{project.name}</h2>
            <span className="sa-badge" style={{ background: status.color+'22', color: status.color }}>
              {status.label}
            </span>
          </div>
        </div>
        <div className="kanban-view-meta">
          <div className="kanban-view-progress">
            <span>{project.progress}%</span>
            <div className="sa-progress-bar-wrap" style={{ width: 120 }}>
              <div className="sa-progress-bar" style={{ width: `${project.progress}%`, background: status.color }} />
            </div>
          </div>
          <span className="kanban-view-meta-item"><Users size={13} /> {getUserName(users, project.responsableId)}</span>
          {project.endDate && <span className="kanban-view-meta-item"><Calendar size={13} /> {format(new Date(project.endDate), 'd MMM yyyy', { locale: fr })}</span>}
        </div>
      </div>

      {/* Jalons */}
      {project.milestones.length > 0 && (
        <div className="kanban-milestones-bar">
          {project.milestones.map(m => (
            <button
              key={m.id}
              className={`kanban-milestone-btn ${m.done ? 'done' : ''}`}
              onClick={() => toggleMilestone(project.id, m.id, !m.done)}
            >
              {m.done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Tableau Kanban */}
      <div className="kanban-board">
        {TASK_COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasksByCol(col.id)}
            users={users}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            openAddTask={setAddTaskFor}
            onEditTask={setEditingTask}
          />
        ))}
      </div>

      {/* Modal ajout tâche rapide */}
      {addTaskFor && (
        <QuickTaskModal
          projectId={project.id}
          defaultStatus={addTaskFor}
          users={users}
          companyId={project.companyId}
          onClose={() => setAddTaskFor(null)}
          onSave={handleAddTask}
        />
      )}

      {/* Modal édition complète d'une tâche */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          users={users}
          projectCompanyId={project.companyId}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEditedTask}
        />
      )}
    </div>
  );
}

// ── Page principale Projets ───────────────────────────────────────────────────
export default function Projects() {
  const { projects, tasks, decisions, users, createProject } = useWorkspace();
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterComp]  = useState('all');
  const [showFilters, setShowFilters]   = useState(false);
  const [selectedProject, setSelected] = useState(null);
  const [showCreate, setShowCreate]     = useState(false);

  // Si un projet est sélectionné → vue Kanban
  if (selectedProject) {
    const live = projects.find(p => p.id === selectedProject.id) || selectedProject;
    return <ProjectKanban project={live} onClose={() => setSelected(null)} />;
  }

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q))
      && (filterStatus  === 'all' || p.status    === filterStatus)
      && (filterCompany === 'all' || p.companyId === filterCompany);
  });

  return (
    <div className="sa-page">
      {/* KPIs */}
      <div className="sa-kpi-grid sa-kpi-grid--sm">
        {[
          { label: 'Total',     value: projects.length,                                       color: '#7c3aed' },
          { label: 'En cours',  value: projects.filter(p => p.status==='in_progress').length,  color: '#3b82f6' },
          { label: 'En pause',  value: projects.filter(p => p.status==='on_hold').length,      color: '#f59e0b' },
          { label: 'Terminés',  value: projects.filter(p => p.status==='completed').length,    color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="sa-kpi-card" style={{ '--kpi-color': s.color }}>
            <div className="sa-kpi-icon"><FolderKanban size={18} /></div>
            <div className="sa-kpi-body"><span className="sa-kpi-value">{s.value}</span><span className="sa-kpi-label">{s.label}</span></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sa-toolbar">
        <div className="sa-search-wrap">
          <Search size={15} className="sa-search-icon" />
          <input className="sa-search-input" placeholder="Nom, référence…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`sa-btn sa-btn--ghost ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(v => !v)}>
          <Filter size={14} /> Filtres <ChevronDown size={12} />
        </button>
        <button className="sa-btn sa-btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Nouveau projet
        </button>
      </div>

      {showFilters && (
        <div className="sa-filters-bar">
          <div className="sa-filter-group">
            <label>Statut</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tous</option>
              {Object.entries(PROJECT_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="sa-filter-group">
            <label>Société</label>
            <select value={filterCompany} onChange={e => setFilterComp(e.target.value)}>
              <option value="all">Toutes</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={() => { setFilterStatus('all'); setFilterComp('all'); }}>
            <X size={13} /> Réinitialiser
          </button>
        </div>
      )}

      {/* Grille projets — clic → Kanban */}
      <div className="sa-projects-grid">
        {filtered.length === 0 && <p className="sa-empty">Aucun projet trouvé.</p>}
        {filtered.map(p => {
          const st = PROJECT_STATUS[p.status] || PROJECT_STATUS.draft;
          const projTasks = tasks.filter(t => t.projectId === p.id);
          const lateTasks = projTasks.filter(t => t.status === 'late' || (t.dueDate && new Date(t.dueDate) < new Date() && !['done','cancelled','validated'].includes(t.status)));
          return (
            <div key={p.id} className="sa-project-card" onClick={() => setSelected(p)}>
              <div className="sa-project-card-header">
                <div className="sa-project-icon" style={{ background: st.color+'22', color: st.color }}>
                  <FolderKanban size={20} />
                </div>
                <div className="sa-project-main">
                  <div className="sa-project-ref">{p.ref}</div>
                  <div className="sa-project-name">{p.name}</div>
                </div>
                <span className="sa-badge" style={{ background: st.color+'22', color: st.color }}>{st.label}</span>
              </div>
              <p className="sa-project-desc">{p.description}</p>
              <div className="sa-project-progress">
                <div className="sa-project-progress-label"><span>Avancement</span><span>{p.progress}%</span></div>
                <ProgressBar value={p.progress} color={st.color} />
              </div>
              <div className="sa-project-milestones">
                {p.milestones.map(m => (
                  <div key={m.id} className={`sa-milestone-chip ${m.done ? 'done' : ''}`}>
                    {m.done ? <CheckCircle2 size={11} /> : <Circle size={11} />} {m.label}
                  </div>
                ))}
              </div>
              <div className="sa-project-footer">
                <div className="sa-project-meta"><Building2 size={12}/>{getCompanyName(p.companyId)}</div>
                <div className="sa-project-meta"><Users size={12}/>{p.members.length} membres</div>
                <div className="sa-project-meta">
                  <Flag size={12}/>{projTasks.length} tâche{projTasks.length>1?'s':''}
                  {lateTasks.length > 0 && <span className="sa-project-late"> · {lateTasks.length} en retard</span>}
                </div>
                {p.endDate && <div className="sa-project-meta"><Calendar size={12}/>{format(new Date(p.endDate),'d MMM yyyy',{locale:fr})}</div>}
              </div>
              <div className="sa-project-open-hint">
                <LayoutGrid size={12} /> Ouvrir le tableau Kanban →
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <ProjectModal
          users={users}
          onClose={() => setShowCreate(false)}
          onSave={(form) => { createProject(form); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
