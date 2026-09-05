import { useState } from 'react';
import {
  Search, Plus, Filter, X, Check, ChevronDown, Gavel,
  Eye, ArrowRight, AlertCircle, Clock, CheckCircle2,
  XCircle, PauseCircle, ListTodo, History,
} from 'lucide-react';
import { useAdminSociete } from '../../context/AdminSocieteContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── Constantes ────────────────────────────────────────────────────────────────
const STATUSES = {
  to_execute:   { label: 'À exécuter',   color: '#f59e0b', icon: Clock },
  in_execution: { label: 'En exécution', color: '#3b82f6', icon: ArrowRight },
  executed:     { label: 'Exécutée',     color: '#22c55e', icon: CheckCircle2 },
  cancelled:    { label: 'Annulée',      color: '#64748b', icon: XCircle },
  suspended:    { label: 'Suspendue',    color: '#ef4444', icon: PauseCircle },
};

const CONFIDENTIALITY = {
  normal:       { label: 'Normal',       color: '#22c55e' },
  restricted:   { label: 'Restreint',    color: '#f59e0b' },
  confidential: { label: 'Confidentiel', color: '#ef4444' },
};

const ORIGINS = [
  { id: 'meeting', label: 'Réunion' },
  { id: 'message', label: 'Message' },
  { id: 'direction', label: 'Note de Direction' },
  { id: 'direct', label: 'Saisie directe' },
];

// ── Modal création décision ───────────────────────────────────────────────────
function DecisionCreateModal({ onClose, onSave }) {
  const { users, companyDepts, tasks } = useAdminSociete();
  const [form, setForm] = useState({
    title: '', description: '', origin: 'direct', originRef: '',
    departmentId: '', projectId: '',
    confidentiality: 'normal', decisionDate: new Date().toISOString().split('T')[0],
    dueDate: '', taskIds: [],
  });

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, decisionDate: form.decisionDate ? new Date(form.decisionDate) : new Date(), dueDate: form.dueDate ? new Date(form.dueDate) : null });
  };

  const availableTasks = tasks.filter(t => !['done','validated','cancelled'].includes(t.status));

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--lg" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Nouvelle décision</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit} style={{ maxHeight:'75vh', overflowY:'auto' }}>

          {/* Intitulé */}
          <div className="sa-form-field">
            <label>Intitulé *</label>
            <input value={form.title} onChange={e => f('title', e.target.value)} required autoFocus placeholder="Résumé court et explicite…" />
          </div>

          {/* Description */}
          <div className="sa-form-field">
            <label>Description détaillée</label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} placeholder="Texte détaillé de la décision…"
              style={{ resize:'vertical', padding:'8px 12px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:8, color:'#e2e8f0', fontSize:13, fontFamily:'inherit' }} />
          </div>

          {/* Origine + Référence */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Origine</label>
              <select value={form.origin} onChange={e => f('origin', e.target.value)}>
                {ORIGINS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Référence source</label>
              <input value={form.originRef} onChange={e => f('originRef', e.target.value)} placeholder="Ex: REU-2026-018" />
            </div>
          </div>

          {/* Dates */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Date de décision *</label>
              <input type="date" value={form.decisionDate} onChange={e => f('decisionDate', e.target.value)} required />
            </div>
            <div className="sa-form-field">
              <label>Échéance d'exécution</label>
              <input type="date" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} />
            </div>
          </div>

          {/* Direction + Confidentialité */}
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Direction / Service</label>
              <select value={form.departmentId} onChange={e => f('departmentId', e.target.value)}>
                <option value="">— Aucun —</option>
                {companyDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Confidentialité</label>
              <select value={form.confidentiality} onChange={e => f('confidentiality', e.target.value)}>
                {Object.entries(CONFIDENTIALITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Lier des tâches existantes */}
          {availableTasks.length > 0 && (
            <div className="sa-form-field">
              <label>Tâches liées (optionnel)</label>
              <div className="dec-task-selector">
                {availableTasks.map(t => (
                  <button
                    key={t.id} type="button"
                    className={`dec-task-chip ${form.taskIds.includes(t.id) ? 'selected' : ''}`}
                    onClick={() => f('taskIds', form.taskIds.includes(t.id) ? form.taskIds.filter(id => id !== t.id) : [...form.taskIds, t.id])}
                  >
                    <ListTodo size={11} />
                    {t.title}
                    {form.taskIds.includes(t.id) && <Check size={11} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sa-btn sa-btn--primary"><Check size={15} /> Créer la décision</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Panneau détail décision ───────────────────────────────────────────────────
function DecisionDetail({ decision, onClose }) {
  const { changeDecisionStatus, tasks, createTask, users } = useAdminSociete();
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [justification, setJustification] = useState('');
  const [newTaskTitle, setNewTaskTitle]   = useState('');
  const [showForce, setShowForce]         = useState(false);

  const st    = STATUSES[decision.status] || STATUSES.to_execute;
  const cf    = CONFIDENTIALITY[decision.confidentiality] || CONFIDENTIALITY.normal;
  const linked = tasks.filter(t => (decision.taskIds||[]).includes(t.id));
  const allValidated = linked.length > 0 && linked.every(t => ['validated','done'].includes(t.status));

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'executed' && !allValidated && !justification.trim()) {
      setShowForce(true);
      return;
    }
    changeDecisionStatus(decision.id, newStatus, justification);
    setShowForce(false);
    setJustification('');
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask({
      title: newTaskTitle.trim(),
      origin: 'decision',
      originRef: decision.ref,
      decisionId: decision.id,
      responsableId: '',
      priority: 'normal',
    });
    setNewTaskTitle('');
  };

  const NEXT_STATUS = {
    to_execute:   'in_execution',
    in_execution: 'executed',
  };

  return (
    <div className="sa-detail-overlay" onClick={onClose}>
      <div className="sa-detail-panel sa-detail-panel--wide" onClick={e => e.stopPropagation()}>
        <div className="sa-detail-header">
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
          <h3>Décision</h3>
          <span className="sa-badge" style={{ background: st.color+'22', color: st.color }}>{st.label}</span>
        </div>
        <div className="sa-detail-body">

          {/* En-tête */}
          <div className="dec-detail-top">
            <span className="dec-ref">{decision.ref}</span>
            <h2 className="dec-title">{decision.title}</h2>
            <span className="dec-cf-badge" style={{ background: cf.color+'22', color: cf.color }}>{cf.label}</span>
          </div>

          {decision.description && (
            <p className="dec-description">{decision.description}</p>
          )}

          {/* Infos */}
          <div className="sa-detail-section">
            <div className="sa-detail-row"><span className="sa-detail-key">Origine</span><span>{ORIGINS.find(o=>o.id===decision.origin)?.label} {decision.originRef ? `— ${decision.originRef}` : ''}</span></div>
            <div className="sa-detail-row"><span className="sa-detail-key">Date de décision</span><span>{decision.decisionDate ? format(new Date(decision.decisionDate), 'd MMM yyyy', { locale: fr }) : '—'}</span></div>
            <div className="sa-detail-row"><span className="sa-detail-key">Échéance</span><span>{decision.dueDate ? format(new Date(decision.dueDate), 'd MMM yyyy', { locale: fr }) : '—'}</span></div>
            <div className="sa-detail-row"><span className="sa-detail-key">Auteur</span><span>{users.find(u=>u.id===decision.authorId)?.name || '—'}</span></div>
          </div>

          {/* Changer statut */}
          <div className="sa-detail-section">
            <span className="sa-detail-section-title">Changer le statut</span>
            <div className="dec-status-list">
              {Object.entries(STATUSES).map(([key, val]) => {
                const Icon = val.icon;
                return (
                  <button
                    key={key}
                    className={`dec-status-btn ${decision.status === key ? 'active' : ''}`}
                    style={{ '--sc': val.color }}
                    onClick={() => handleStatusChange(key)}
                  >
                    <Icon size={13} />
                    {val.label}
                    {decision.status === key && <Check size={12} />}
                  </button>
                );
              })}
            </div>
            {/* Force clôture avec justification */}
            {showForce && (
              <div className="dec-force-wrap">
                <p className="dec-force-warning">
                  <AlertCircle size={13} /> Toutes les tâches ne sont pas validées. Justifiez la clôture forcée :
                </p>
                <textarea
                  className="dec-force-input"
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Justification obligatoire…"
                  rows={2}
                />
                <div style={{ display:'flex', gap:8, marginTop:6 }}>
                  <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={() => setShowForce(false)}>Annuler</button>
                  <button className="sa-btn sa-btn--danger sa-btn--sm" disabled={!justification.trim()} onClick={() => { changeDecisionStatus(decision.id, 'executed', justification); setShowForce(false); setJustification(''); }}>
                    Forcer la clôture
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tâches liées */}
          <div className="sa-detail-section">
            <span className="sa-detail-section-title"><ListTodo size={13} /> Tâches liées ({linked.length})</span>
            {linked.map(t => {
              const ts = { todo:'À faire', in_progress:'En cours', blocked:'Bloquée', waiting:'En attente', submitted:'Soumise', validated:'Validée', done:'Terminée', cancelled:'Annulée', late:'En retard' };
              return (
                <div key={t.id} className="sa-open-task-row">
                  <div className="sa-open-task-info">
                    <span className="sa-open-task-title">{t.title}</span>
                    <span className="sa-open-task-meta">{t.ref} · {users.find(u=>u.id===t.responsableId)?.name || '—'}</span>
                  </div>
                  <span className={`sa-badge ${['validated','done'].includes(t.status)?'sa-badge--green':t.status==='late'?'sa-badge--red':'sa-badge--orange'}`}>
                    {ts[t.status]||t.status}
                  </span>
                </div>
              );
            })}
            {/* Créer une nouvelle tâche depuis cette décision */}
            <div className="dec-add-task-row">
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();handleCreateTask();} }}
                placeholder="Créer une tâche depuis cette décision…"
                className="mr-add-input"
              />
              <button className="mr-add-btn" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                <Plus size={13} /> Créer
              </button>
            </div>
          </div>

          {/* Historique */}
          <div className="sa-detail-section">
            <span className="sa-detail-section-title"><History size={13} /> Historique</span>
            <div className="dec-history-list">
              {(decision.history||[]).map((h, i) => {
                const s = STATUSES[h.status];
                return (
                  <div key={i} className="dec-history-item">
                    <div className="dec-history-dot" style={{ background: s?.color||'#64748b' }} />
                    <div className="dec-history-body">
                      <span className="dec-history-status">{s?.label||h.status}</span>
                      {h.note && <span className="dec-history-note">{h.note}</span>}
                      <span className="dec-history-time">{format(new Date(h.date), 'd MMM yyyy HH:mm', { locale: fr })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale Décisions ─────────────────────────────────────────────────
export default function DecisionsModule() {
  const { decisions, stats } = useAdminSociete();
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterConf, setFilterConf]     = useState('all');
  const [showFilters, setShowFilters]   = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [selected, setSelected]         = useState(null);
  const { createDecision }              = useAdminSociete();

  const filtered = decisions.filter(d => {
    const q = search.toLowerCase();
    return (d.title.toLowerCase().includes(q) || d.ref?.toLowerCase().includes(q))
      && (filterStatus==='all' || d.status===filterStatus)
      && (filterConf==='all'   || d.confidentiality===filterConf);
  });

  // Trier : à exécuter → en exécution → autres
  const sorted = [...filtered].sort((a,b) => {
    const ord = { to_execute:0, in_execution:1, suspended:2, executed:3, cancelled:4 };
    return (ord[a.status]||2)-(ord[b.status]||2);
  });

  return (
    <div className="sa-page">
      {/* KPIs */}
      <div className="sa-kpi-grid sa-kpi-grid--sm">
        {[
          { label:'Total',       value: decisions.length,      color:'#8b5cf6' },
          { label:'À exécuter',  value: decisions.filter(d=>d.status==='to_execute').length,   color:'#f59e0b' },
          { label:'En exécution',value: decisions.filter(d=>d.status==='in_execution').length, color:'#3b82f6' },
          { label:'Exécutées',   value: decisions.filter(d=>d.status==='executed').length,     color:'#22c55e' },
        ].map(s => (
          <div key={s.label} className="sa-kpi-card" style={{ '--kpi-color': s.color }}>
            <div className="sa-kpi-icon"><Gavel size={18} /></div>
            <div className="sa-kpi-body"><span className="sa-kpi-value">{s.value}</span><span className="sa-kpi-label">{s.label}</span></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="sa-toolbar">
        <div className="sa-search-wrap">
          <Search size={15} className="sa-search-icon" />
          <input className="sa-search-input" placeholder="Intitulé, référence…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`sa-btn sa-btn--ghost ${showFilters?'active':''}`} onClick={() => setShowFilters(v=>!v)}>
          <Filter size={14} /> Filtres <ChevronDown size={12} />
        </button>
        <button className="sa-btn sa-btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Nouvelle décision
        </button>
      </div>

      {showFilters && (
        <div className="sa-filters-bar">
          <div className="sa-filter-group">
            <label>Statut</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tous</option>
              {Object.entries(STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="sa-filter-group">
            <label>Confidentialité</label>
            <select value={filterConf} onChange={e => setFilterConf(e.target.value)}>
              <option value="all">Toutes</option>
              {Object.entries(CONFIDENTIALITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={() => { setFilterStatus('all'); setFilterConf('all'); }}><X size={13}/> Réinitialiser</button>
        </div>
      )}

      <div className="sa-results-count">{sorted.length} décision{sorted.length>1?'s':''}</div>

      {/* Table */}
      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Référence</th><th>Intitulé</th><th>Origine</th>
              <th>Statut</th><th>Confidentialité</th><th>Date</th><th>Tâches</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length===0 && <tr><td colSpan={8} className="sa-table-empty">Aucune décision.</td></tr>}
            {sorted.map(d => {
              const st = STATUSES[d.status]||STATUSES.to_execute;
              const cf = CONFIDENTIALITY[d.confidentiality]||CONFIDENTIALITY.normal;
              return (
                <tr key={d.id} className="sa-table-row" onClick={() => setSelected(d)}>
                  <td><span style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{d.ref}</span></td>
                  <td><span className="sa-user-name">{d.title}</span></td>
                  <td className="sa-table-sub">{ORIGINS.find(o=>o.id===d.origin)?.label||'—'}</td>
                  <td><span className="sa-badge" style={{ background:st.color+'22', color:st.color }}>{st.label}</span></td>
                  <td><span className="sa-badge" style={{ background:cf.color+'22', color:cf.color }}>{cf.label}</span></td>
                  <td className="sa-table-sub">{d.decisionDate ? format(new Date(d.decisionDate),'d MMM yyyy',{locale:fr}) : '—'}</td>
                  <td className="sa-table-sub">{(d.taskIds||[]).length}</td>
                  <td><button className="sa-icon-btn" onClick={e=>{e.stopPropagation();setSelected(d);}}><Eye size={15}/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <DecisionCreateModal
          onClose={() => setShowCreate(false)}
          onSave={(data) => { createDecision(data); setShowCreate(false); }}
        />
      )}
      {selected && (
        <DecisionDetail
          decision={decisions.find(d=>d.id===selected.id)||selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
