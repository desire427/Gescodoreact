import { useState } from 'react';
import { Search, Filter, Download, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SEVERITY_INFO = {
  info:     { label: 'Info',     cls: 'gc-sev--info' },
  low:      { label: 'Faible',   cls: 'gc-sev--low' },
  medium:   { label: 'Moyen',    cls: 'gc-sev--medium' },
  high:     { label: 'Élevé',    cls: 'gc-sev--high' },
  critical: { label: 'Critique', cls: 'gc-sev--critical' },
};

const ACTION_GROUPS = [
  { id: 'all',      label: 'Toutes les actions' },
  { id: 'USER',     label: 'Comptes utilisateurs' },
  { id: 'COMPANY',  label: 'Sociétés' },
  { id: 'SESSION',  label: 'Sessions' },
  { id: 'SETTINGS', label: 'Paramètres' },
  { id: 'PROJECT',  label: 'Projets' },
  { id: 'TASK',     label: 'Tâches' },
  { id: 'MEETING',  label: 'Réunions' },
  { id: 'DECISION', label: 'Décisions' },
];

function LogRow({ log, companies }) {
  const [expanded, setExpanded] = useState(false);
  const sev         = SEVERITY_INFO[log.severity] || SEVERITY_INFO.info;
  const companyName = log.companyName
    || companies.find(c => c.id === (log.companyId ?? log.company))?.name
    || '—';

  return (
    <>
      <tr className={`gc-table-row gc-audit-row ${expanded ? 'gc-audit-row--open' : ''}`} onClick={() => setExpanded(v => !v)}>
        <td><span className={`gc-sev-badge ${sev.cls}`}>{sev.label}</span></td>
        <td>
          <div>
            <span className="gc-audit-action-label">{log.label}</span>
            <span className="gc-audit-action-type">{log.action}</span>
          </div>
        </td>
        <td><span className="gc-user-name">{log.actorName}</span></td>
        <td>
          <div>
            <span className="gc-audit-resource-type">{log.resource}</span>
            <span className="gc-table-sub">{log.resourceLabel}</span>
          </div>
        </td>
        <td className="gc-table-sub">{companyName}</td>
        <td className="gc-table-sub">
          {log.timestamp ? format(new Date(log.timestamp), 'd MMM yyyy HH:mm:ss', { locale: fr }) : '—'}
        </td>
        <td>
          <button className="gc-icon-btn" onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="gc-audit-detail-row">
          <td colSpan={7}>
            <div className="gc-audit-detail">
              <div className="gc-audit-detail-main">
                <Info size={13} />
                <span>{log.details || '—'}</span>
              </div>
              <div className="gc-audit-detail-meta">
                <span>IP : {log.ip || log.ip_address || '—'}</span>
                <span>ID log : {log.id}</span>
                <span>ID ressource : {log.resourceId ?? log.resource_id ?? '—'}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLog() {
  const { auditLogs = [], companies = [] } = useWorkspace();
  const [search,         setSearch]       = useState('');
  const [filterSeverity, setFilterSev]    = useState('all');
  const [filterAction,   setFilterAction] = useState('all');
  const [filterCompany,  setFilterComp]   = useState('all');
  const [showFilters,    setShowFilters]  = useState(false);

  const filtered = auditLogs.filter(log => {
    const q          = search.toLowerCase();
    const actorName  = (log.actorName   || log.actor_name   || '').toLowerCase();
    const label      = (log.label       || '').toLowerCase();
    const resLabel   = (log.resourceLabel || log.resource_label || '').toLowerCase();
    const details    = (log.details     || '').toLowerCase();
    const companyId  = log.companyId    ?? log.company ?? null;
    return (
      (actorName.includes(q) || label.includes(q) || resLabel.includes(q) || details.includes(q)) &&
      (filterSeverity === 'all' || log.severity === filterSeverity) &&
      (filterAction   === 'all' || (log.action || '').startsWith(filterAction)) &&
      (filterCompany  === 'all' || String(companyId) === String(filterCompany))
    );
  });

  const handleExport = () => {
    const csv = [
      ['Date','Sévérité','Action','Libellé','Acteur','Ressource','Cible','Société','IP','Détails'].join(';'),
      ...filtered.map(l => {
        const cn = l.companyName || companies.find(c => c.id === (l.companyId ?? l.company))?.name || '';
        return [
          format(new Date(l.timestamp), 'dd/MM/yyyy HH:mm:ss'),
          l.severity, l.action, l.label, l.actorName || l.actor_name || '',
          l.resource, l.resourceLabel || l.resource_label || '', cn,
          l.ip || l.ip_address || '', `"${(l.details || '').replace(/"/g, '""')}"`,
        ].join(';');
      }),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `audit_gescodo_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="gc-page">
      <div className="gc-toolbar">
        <div className="gc-search-wrap">
          <Search size={14} className="gc-search-icon" />
          <input className="gc-search-input" placeholder="Acteur, action, ressource, détails…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`gc-btn gc-btn--ghost ${showFilters ? 'gc-btn--active' : ''}`} onClick={() => setShowFilters(v => !v)}>
          <Filter size={13} /> Filtres <ChevronDown size={11} />
        </button>
        <button className="gc-btn gc-btn--ghost" onClick={handleExport}>
          <Download size={13} /> Exporter CSV
        </button>
      </div>

      {showFilters && (
        <div className="gc-filters-bar">
          <div className="gc-filter-group">
            <label>Sévérité</label>
            <select value={filterSeverity} onChange={e => setFilterSev(e.target.value)}>
              <option value="all">Toutes</option>
              {Object.entries(SEVERITY_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="gc-filter-group">
            <label>Type d'action</label>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              {ACTION_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          <div className="gc-filter-group">
            <label>Société</label>
            <select value={filterCompany} onChange={e => setFilterComp(e.target.value)}>
              <option value="all">Toutes</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="gc-btn gc-btn--ghost" style={{ fontSize: 12 }} onClick={() => { setFilterSev('all'); setFilterAction('all'); setFilterComp('all'); }}>
            <X size={12} /> Réinitialiser
          </button>
        </div>
      )}

      <p className="gc-count">{filtered.length} entrée{filtered.length > 1 ? 's' : ''} — cliquez sur une ligne pour les détails</p>

      <div className="gc-table-wrap">
        <table className="gc-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Sévérité</th>
              <th>Action</th>
              <th>Acteur</th>
              <th>Ressource</th>
              <th>Société</th>
              <th>Date / Heure</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="gc-table-empty">Aucune entrée trouvée.</td></tr>
            )}
            {filtered.map(log => (
              <LogRow key={log.id} log={log} companies={companies} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
