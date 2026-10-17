import { useState } from 'react';
import {
  Search, Plus, Filter, X, Check, FolderKanban, Calendar, Users,
  Flag, CheckCircle2, Circle, Building2, ChevronDown,
  AlertCircle, Clock, Pause, CheckCheck, Ban, LayoutGrid,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TASK_COLS = [
  { id: 'todo',        label: 'À faire',            color: '#64748b', icon: Circle },
  { id: 'in_progress', label: 'En cours',           color: '#3b82f6', icon: Clock },
  { id: 'blocked',     label: 'Bloquée',            color: '#ef4444', icon: AlertCircle },
  { id: 'waiting',     label: 'En attente',         color: '#f59e0b', icon: Pause },
  { id: 'submitted',   label: 'Soumise validation', color: '#8b5cf6', icon: Flag },
  { id: 'validated',   label: 'Validée',            color: '#22c55e', icon: CheckCircle2 },
  { id: 'done',        label: 'Terminée',           color: '#10b981', icon: CheckCheck },
  { id: 'cancelled',   label: 'Annulée',            color: '#374151', icon: Ban },
];

const PRIO_COLOR = { low: '#64748b', normal: '#3b82f6', high: '#f59e0b', urgent: '#ef4444', critical: '#dc2626' };
const PRIO_LABEL = { low: 'Faible', normal: 'Normale', high: 'Haute', urgent: 'Urgente', critical: 'Critique' };

const PROJ_STATUS = {
  draft:       { label: 'Brouillon', color: '#64748b' },
  in_progress: { label: 'En cours',  color: '#3b82f6' },
  on_hold:     { label: 'En pause',  color: '#f59e0b' },
  completed:   { label: 'Terminé',   color: '#22c55e' },
  cancelled:   { label: 'Annulé',    color: '#64748b' },
};

const getUser    = (users, id)        => users.find(u => u.id === id)?.name || '—';
const getCompany = (companies, id)    => companies.find(c => c.id === id)?.name || '—';
const getDept    = (departments, id)  => departments.find(d => d.id === id)?.name || '—';

/* ── Progress bar ── */
function Bar({ value, color = '#3b82f6' }) {
  return (
    <div className="gc-bar-track" style={{ height: 6 }}>
      <div className="gc-bar-fill" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

/* ── Task Edit Modal ── */
function TaskEditModal({ task, users, projectCompanyId, onClose, onSave }) {
  const [form, setForm] = useState({
    title:         task.title || '',
    description:   task.description || '',
    responsableId: task.responsableId || '',
    priority:      task.priority || 'normal',
    status:        task.status || 'todo',
    dueDate:       task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    startDate:     task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
    progress:      task.progress || 0,
    validatorId:   task.validatorId || '',
    tags:          (task.tags || []).join(', '),
    proof:         task.proof?.label || '',
  });
  const companyUsers = users.filter(u => u.companyId === projectCompanyId && u.status === 'active');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      ...task, ...form,
      dueDate:   form.dueDate   ? new Date(form.dueDate)   : null,
      startDate: form.startDate ? new Date(form.startDate) : null,
      progress:  Number(form.progress),
      tags:      form.tags.split(',').map(t => t.trim()).filter(Boolean),
      proof:     form.proof ? { type: 'file', label: form.proof, date: new Date() } : task.proof,
    });
  };

  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal gc-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="gc-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3>Modifier la tâche</h3>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--gc-muted)' }}>{task.ref}</span>
          </div>
          <button className="gc-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="gc-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="gc-form-field"><label>Titre *</label><input value={form.title} onChange={e => f('title', e.target.value)} required autoFocus /></div>
            <div className="gc-form-field">
              <label>Description</label>
              <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} className="gc-textarea" />
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Statut</label>
                <select value={form.status} onChange={e => f('status', e.target.value)}>
                  {TASK_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="gc-form-field">
                <label>Priorité</label>
                <select value={form.priority} onChange={e => f('priority', e.target.value)}>
                  {Object.entries(PRIO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Responsable</label>
                <select value={form.responsableId} onChange={e => f('responsableId', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="gc-form-field">
                <label>Validateur</label>
                <select value={form.validatorId} onChange={e => f('validatorId', e.target.value)}>
                  <option value="">— Optionnel —</option>
                  {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field"><label>Date de début</label><input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)} /></div>
              <div className="gc-form-field"><label>Échéance</label><input type="date" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} /></div>
            </div>
            <div className="gc-form-field">
              <label>Avancement : {form.progress}%</label>
              <input type="range" min={0} max={100} step={5} value={form.progress} onChange={e => f('progress', e.target.value)} className="gc-range" />
            </div>
            <div className="gc-form-field"><label>Preuve / Justificatif</label><input value={form.proof} onChange={e => f('proof', e.target.value)} placeholder="Nom du fichier ou description…" /></div>
            <div className="gc-form-field"><label>Tags (séparés par virgule)</label><input value={form.tags} onChange={e => f('tags', e.target.value)} placeholder="ex : urgent, client, technique" /></div>
          </div>
          <div className="gc-modal-footer">
            <button type="button" className="gc-btn gc-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="gc-btn gc-btn--primary"><Check size={14} /> Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Kanban Task Card ── */
function TaskCard({ task, users, isDragging, onDragStart, onEdit }) {
  const prioColor = PRIO_COLOR[task.priority] || '#64748b';
  const isLate = task.dueDate && new Date(task.dueDate) < new Date() && !['done','cancelled','validated'].includes(task.status);

  return (
    <div
      className={`gc-kanban-card ${isDragging ? 'gc-kanban-card--dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onClick={e => { e.stopPropagation(); if (onEdit) onEdit(task); }}
    >
      <div className="gc-kanban-card-head">
        <span className="gc-kanban-ref">{task.ref}</span>
        <span className="gc-kanban-prio" style={{ background: prioColor + '22', color: prioColor }}>{PRIO_LABEL[task.priority]}</span>
      </div>
      <p className="gc-kanban-title">{task.title}</p>
      <div className="gc-kanban-foot">
        <span className="gc-kanban-meta"><Users size={10} />{getUser(users, task.responsableId)}</span>
        {task.dueDate && (
          <span className={`gc-kanban-meta ${isLate ? 'gc-kanban-meta--late' : ''}`}>
            <Calendar size={10} />{format(new Date(task.dueDate), 'd MMM', { locale: fr })}
          </span>
        )}
      </div>
      {task.progress > 0 && <Bar value={task.progress} color={prioColor} />}
    </div>
  );
}

/* ── Kanban Column ── */
function KanbanColumn({ column, tasks, users, onDrop, onDragOver, openAddTask, onEditTask }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="gc-kanban-col">
      <div className="gc-kanban-col-head" style={{ '--col-color': column.color }}>
        <column.icon size={13} style={{ color: column.color }} />
        <span className="gc-kanban-col-title">{column.label}</span>
        <span className="gc-kanban-col-count">{tasks.length}</span>
        <button className="gc-kanban-add-btn" onClick={() => openAddTask(column.id)}>
          <Plus size={12} />
        </button>
      </div>
      <div
        className={`gc-kanban-col-body ${dragOver ? 'gc-kanban-col-body--dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); onDragOver(e); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { setDragOver(false); onDrop(e, column.id); }}
      >
        {tasks.map(task => (
          <TaskCard
            key={task.id} task={task} users={users}
            onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.effectAllowed = 'move'; }}
            onEdit={onEditTask}
          />
        ))}
        {tasks.length === 0 && <div className="gc-kanban-empty">Déposez ici</div>}
      </div>
    </div>
  );
}

/* ── Quick Task Modal ── */
function QuickTaskModal({ projectId, defaultStatus, users, companyId, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', responsableId: '', dueDate: '', priority: 'normal', status: defaultStatus || 'todo' });
  const projUsers = users.filter(u => u.companyId === companyId && u.status === 'active');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, projectId, companyId, origin: 'project', dueDate: form.dueDate ? new Date(form.dueDate) : null, progress: 0, history: [], contributors: [], validatorId: null, tags: [] });
  };

  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal" onClick={e => e.stopPropagation()}>
        <div className="gc-modal-header"><h3>Nouvelle tâche</h3><button className="gc-icon-btn" onClick={onClose}><X size={18} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="gc-modal-body">
            <div className="gc-form-field"><label>Titre *</label><input value={form.title} onChange={e => f('title', e.target.value)} required autoFocus /></div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Responsable</label>
                <select value={form.responsableId} onChange={e => f('responsableId', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {projUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="gc-form-field">
                <label>Priorité</label>
                <select value={form.priority} onChange={e => f('priority', e.target.value)}>
                  {Object.entries(PRIO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Statut initial</label>
                <select value={form.status} onChange={e => f('status', e.target.value)}>
                  {TASK_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="gc-form-field"><label>Échéance</label><input type="date" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} /></div>
            </div>
          </div>
          <div className="gc-modal-footer">
            <button type="button" className="gc-btn gc-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="gc-btn gc-btn--primary"><Check size={14} /> Créer la tâche</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Project Modal ── */
function ProjectModal({ onClose, onSave, users, companies = [], departments = [] }) {
  const [form, setForm] = useState({ name: '', description: '', companyId: '', departmentId: '', responsableId: '', sponsorId: '', startDate: '', endDate: '', status: 'draft', tags: '', milestones: [] });
  const [newMS, setNewMS] = useState('');
  const depts        = departments.filter(d => d.companyId === form.companyId);
  const companyUsers = users.filter(u => u.companyId === form.companyId && u.status === 'active');
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addMilestone = () => {
    if (!newMS.trim()) return;
    setForm(p => ({ ...p, milestones: [...p.milestones, { id: `ms_${Date.now()}`, label: newMS.trim(), done: false, dueDate: null }] }));
    setNewMS('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.companyId) return;
    onSave({ ...form, startDate: form.startDate ? new Date(form.startDate) : null, endDate: form.endDate ? new Date(form.endDate) : null, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), members: form.responsableId ? [form.responsableId] : [], progress: 0 });
  };

  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal gc-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="gc-modal-header"><h3>Nouveau projet</h3><button className="gc-icon-btn" onClick={onClose}><X size={18} /></button></div>
        <form onSubmit={handleSubmit}>
          <div className="gc-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="gc-form-field"><label>Nom du projet *</label><input value={form.name} onChange={e => f('name', e.target.value)} required /></div>
            <div className="gc-form-field"><label>Description</label><textarea value={form.description} onChange={e => f('description', e.target.value)} rows={2} className="gc-textarea" /></div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Société *</label>
                <select value={form.companyId} onChange={e => setForm(p => ({ ...p, companyId: e.target.value, departmentId: '', responsableId: '', sponsorId: '' }))} required>
                  <option value="">— Choisir —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="gc-form-field">
                <label>Direction/Service</label>
                <select value={form.departmentId} onChange={e => f('departmentId', e.target.value)}>
                  <option value="">— Aucun —</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Responsable</label>
                <select value={form.responsableId} onChange={e => f('responsableId', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="gc-form-field">
                <label>Sponsor</label>
                <select value={form.sponsorId} onChange={e => f('sponsorId', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field"><label>Date début</label><input type="date" value={form.startDate} onChange={e => f('startDate', e.target.value)} /></div>
              <div className="gc-form-field"><label>Date fin prévue</label><input type="date" value={form.endDate} onChange={e => f('endDate', e.target.value)} /></div>
            </div>
            <div className="gc-form-field">
              <label>Jalons</label>
              <div className="gc-milestone-add-row">
                <input value={newMS} onChange={e => setNewMS(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMilestone(); } }} placeholder="Nom du jalon…" />
                <button type="button" className="gc-btn gc-btn--ghost" style={{ fontSize: 12 }} onClick={addMilestone}><Plus size={12} /> Ajouter</button>
              </div>
              <div className="gc-milestone-list">
                {form.milestones.map(m => (
                  <div key={m.id} className="gc-milestone-chip">
                    <Circle size={10} /><span>{m.label}</span>
                    <button type="button" onClick={() => setForm(p => ({ ...p, milestones: p.milestones.filter(x => x.id !== m.id) }))}><X size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="gc-form-field"><label>Tags (séparés par virgule)</label><input value={form.tags} onChange={e => f('tags', e.target.value)} placeholder="ex : infrastructure, digital" /></div>
          </div>
          <div className="gc-modal-footer">
            <button type="button" className="gc-btn gc-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="gc-btn gc-btn--primary"><Check size={14} /> Créer le projet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Project Kanban View ── */
function ProjectKanban({ project, onClose }) {
  const { users, tasks, updateProject, toggleMilestone } = useWorkspace();
  const [localTasks, setLocalTasks] = useState(tasks.filter(t => t.projectId === project.id));
  const [addTaskFor, setAddTaskFor]   = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const tasksByCol = (colId) => localTasks.filter(t => t.status === colId);

  const handleDrop = (e, targetColId) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const updated = localTasks.map(t => t.id === taskId ? { ...t, status: targetColId } : t);
    setLocalTasks(updated);
    const done = updated.filter(t => ['done','validated'].includes(t.status)).length;
    if (updated.length > 0) updateProject(project.id, { progress: Math.round((done / updated.length) * 100) });
  };

  const handleAddTask = (taskData) => {
    const newTask = { id: `task_${Date.now()}`, ref: `TSK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`, ...taskData };
    setLocalTasks(prev => [...prev, newTask]);
    setAddTaskFor(null);
  };

  const handleSaveTask = (updatedTask) => {
    const updated = localTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setLocalTasks(updated);
    const done = updated.filter(t => ['done','validated'].includes(t.status)).length;
    if (updated.length > 0) updateProject(project.id, { progress: Math.round((done / updated.length) * 100) });
    setEditingTask(null);
  };

  const st = PROJ_STATUS[project.status] || PROJ_STATUS.draft;

  return (
    <div className="gc-kanban-view">
      <div className="gc-kanban-header">
        <div className="gc-kanban-header-left">
          <button className="gc-btn gc-btn--ghost" style={{ fontSize: 12 }} onClick={onClose}>← Tous les projets</button>
          <div className="gc-kanban-title-wrap">
            <span className="gc-kanban-ref-tag">{project.ref}</span>
            <h2 className="gc-kanban-view-title">{project.name}</h2>
            <span className="gc-badge" style={{ background: st.color + '22', color: st.color }}>{st.label}</span>
          </div>
        </div>
        <div className="gc-kanban-header-right">
          <div className="gc-kanban-progress">
            <span>{project.progress}%</span>
            <Bar value={project.progress} color={st.color} />
          </div>
          <span className="gc-kanban-meta"><Users size={12} />{getUser(users, project.responsableId)}</span>
          {project.endDate && <span className="gc-kanban-meta"><Calendar size={12} />{format(new Date(project.endDate), 'd MMM yyyy', { locale: fr })}</span>}
        </div>
      </div>

      {project.milestones.length > 0 && (
        <div className="gc-milestones-bar">
          {project.milestones.map(m => (
            <button
              key={m.id}
              className={`gc-milestone-btn ${m.done ? 'gc-milestone-btn--done' : ''}`}
              onClick={() => toggleMilestone(project.id, m.id, !m.done)}
            >
              {m.done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div className="gc-kanban-board">
        {TASK_COLS.map(col => (
          <KanbanColumn
            key={col.id} column={col} tasks={tasksByCol(col.id)} users={users}
            onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
            openAddTask={setAddTaskFor} onEditTask={setEditingTask}
          />
        ))}
      </div>

      {addTaskFor && (
        <QuickTaskModal
          projectId={project.id} defaultStatus={addTaskFor}
          users={users} companyId={project.companyId}
          onClose={() => setAddTaskFor(null)} onSave={handleAddTask}
        />
      )}
      {editingTask && (
        <TaskEditModal
          task={editingTask} users={users} projectCompanyId={project.companyId}
          onClose={() => setEditingTask(null)} onSave={handleSaveTask}
        />
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function Projects() {
  const { projects, tasks, users, companies = [], departments = [], createProject } = useWorkspace();
  const [search,        setSearch]      = useState('');
  const [filterStatus,  setFilterStatus] = useState('all');
  const [filterCompany, setFilterComp]  = useState('all');
  const [showFilters,   setShowFilters] = useState(false);
  const [selected,      setSelected]    = useState(null);
  const [showCreate,    setShowCreate]  = useState(false);

  if (selected) {
    const live = projects.find(p => p.id === selected.id) || selected;
    return <ProjectKanban project={live} onClose={() => setSelected(null)} />;
  }

  const filtered = projects.filter(p =>
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.ref.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatus  === 'all' || p.status    === filterStatus) &&
    (filterCompany === 'all' || p.companyId === filterCompany)
  );

  const STATS = [
    { label: 'Total',    value: projects.length,                                        color: '#7c3aed' },
    { label: 'En cours', value: projects.filter(p => p.status === 'in_progress').length, color: '#3b82f6' },
    { label: 'En pause', value: projects.filter(p => p.status === 'on_hold').length,     color: '#f59e0b' },
    { label: 'Terminés', value: projects.filter(p => p.status === 'completed').length,   color: '#22c55e' },
  ];

  return (
    <div className="gc-page">
      <div className="gc-kpi-grid">
        {STATS.map(s => (
          <div key={s.label} className="gc-kpi-card" style={{ '--kpi-accent': s.color }}>
            <div className="gc-kpi-icon"><FolderKanban size={18} /></div>
            <div className="gc-kpi-body">
              <span className="gc-kpi-value">{s.value}</span>
              <span className="gc-kpi-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="gc-toolbar">
        <div className="gc-search-wrap">
          <Search size={14} className="gc-search-icon" />
          <input className="gc-search-input" placeholder="Nom, référence…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`gc-btn gc-btn--ghost ${showFilters ? 'gc-btn--active' : ''}`} onClick={() => setShowFilters(v => !v)}>
          <Filter size={13} /> Filtres <ChevronDown size={11} />
        </button>
        <button className="gc-btn gc-btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Nouveau projet
        </button>
      </div>

      {showFilters && (
        <div className="gc-filters-bar">
          <div className="gc-filter-group">
            <label>Statut</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tous</option>
              {Object.entries(PROJ_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="gc-filter-group">
            <label>Société</label>
            <select value={filterCompany} onChange={e => setFilterComp(e.target.value)}>
              <option value="all">Toutes</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="gc-btn gc-btn--ghost" style={{ fontSize: 12 }} onClick={() => { setFilterStatus('all'); setFilterComp('all'); }}>
            <X size={12} /> Réinitialiser
          </button>
        </div>
      )}

      <p className="gc-count">{filtered.length} projet{filtered.length > 1 ? 's' : ''}</p>

      <div className="gc-projects-grid">
        {filtered.length === 0 && <p className="gc-empty">Aucun projet trouvé.</p>}
        {filtered.map(p => {
          const st        = PROJ_STATUS[p.status] || PROJ_STATUS.draft;
          const projTasks = tasks.filter(t => t.projectId === p.id);
          const lateTasks = projTasks.filter(t =>
            t.dueDate && new Date(t.dueDate) < new Date() && !['done','cancelled','validated'].includes(t.status)
          );
          return (
            <div key={p.id} className="gc-project-card" onClick={() => setSelected(p)}>
              <div className="gc-project-card-head">
                <div className="gc-project-icon" style={{ background: st.color + '20', color: st.color }}>
                  <FolderKanban size={19} />
                </div>
                <div className="gc-project-info">
                  <span className="gc-project-ref">{p.ref}</span>
                  <span className="gc-project-name">{p.name}</span>
                </div>
                <span className="gc-badge" style={{ background: st.color + '22', color: st.color }}>{st.label}</span>
              </div>
              {p.description && <p className="gc-project-desc">{p.description}</p>}
              <div className="gc-project-progress">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--gc-muted)', marginBottom: 5 }}>
                  <span>Avancement</span><span>{p.progress}%</span>
                </div>
                <Bar value={p.progress} color={st.color} />
              </div>
              {p.milestones.length > 0 && (
                <div className="gc-project-milestones">
                  {p.milestones.map(m => (
                    <span key={m.id} className={`gc-milestone-chip-sm ${m.done ? 'done' : ''}`}>
                      {m.done ? <CheckCircle2 size={9} /> : <Circle size={9} />} {m.label}
                    </span>
                  ))}
                </div>
              )}
              <div className="gc-project-card-foot">
                <span className="gc-project-meta"><Building2 size={11} />{getCompany(companies, p.companyId)}</span>
                <span className="gc-project-meta"><Users size={11} />{p.members.length} membres</span>
                <span className="gc-project-meta">
                  <Flag size={11} />{projTasks.length} tâche{projTasks.length > 1 ? 's' : ''}
                  {lateTasks.length > 0 && <span style={{ color: '#ef4444', marginLeft: 4 }}>· {lateTasks.length} en retard</span>}
                </span>
                {p.endDate && <span className="gc-project-meta"><Calendar size={11} />{format(new Date(p.endDate), 'd MMM yyyy', { locale: fr })}</span>}
              </div>
              <div className="gc-project-open-hint"><LayoutGrid size={11} /> Ouvrir le tableau Kanban →</div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <ProjectModal
          users={users} companies={companies} departments={departments}
          onClose={() => setShowCreate(false)}
          onSave={(form) => { createProject(form); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
