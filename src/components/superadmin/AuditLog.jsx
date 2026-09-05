import { useState } from 'react';
import { Search, Filter, Download, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { companies, roles } from '../../data/mockData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SEVERITY_INFO = {
  info:     { label: 'Info',     class: 'sev--info' },
  low:      { label: 'Faible',   class: 'sev--low' },
  medium:   { label: 'Moyen',    class: 'sev--medium' },
  high:     { label: 'Élevé',    class: 'sev--high' },
  critical: { label: 'Critique', class: 'sev--critical' },
};

const ACTION_GROUPS = [
  { id: 'all',    label: 'Toutes les actions' },
  { id: 'USER',   label: 'Comptes utilisateurs' },
  { id: 'COMPANY', label: 'Sociétés' },
  { id: 'SESSION', label: 'Sessions' },
  { id: 'SETTINGS', label: 'Paramètres' },
];

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_INFO[log.severity] || SEVERITY_INFO.info;
  const company = companies.find(c => c.id === log.companyId);

  return (
    <>
      <tr
        className={`sa-table-row sa-audit-log-row ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(v => !v)}
      >
        <td>
          <span className={`sa-sev-badge ${sev.class}`}>{sev.label}</span>
        </td>
        <td>
          <div className="sa-audit-action-cell">
            <span className="sa-audit-action-label">{log.label}</span>
            <span className="sa-audit-action-type">{log.action}</span>
          </div>
        </td>
        <td>
          <div className="sa-audit-actor">
            <span className="sa-audit-actor-name">{log.actorName}</span>
          </div>
        </td>
        <td>
          <div className="sa-audit-resource">
            <span className="sa-audit-resource-type">{log.resource}</span>
            <span className="sa-audit-resource-label">{log.resourceLabel}</span>
          </div>
        </td>
        <td className="sa-table-sub">
          {company?.name || '—'}
        </td>
        <td className="sa-table-sub">
          {format(new Date(log.timestamp), 'd MMM yyyy HH:mm:ss', { locale: fr })}
        </td>
        <td>
          <button className="sa-icon-btn">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="sa-audit-detail-row">
          <td colSpan={7}>
            <div className="sa-audit-detail">
              <div className="sa-audit-detail-row">
                <Info size={13} />
                <span className="sa-audit-detail-text">{log.details}</span>
              </div>
              <div className="sa-audit-detail-meta">
                <span>IP : {log.ip}</span>
                <span>ID log : {log.id}</span>
                <span>ID ressource : {log.resourceId}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLog() {
  const { auditLogs } = useWorkspace();
  const [search, setSearch]             = useState('');
  const [filterSeverity, setFilterSev]  = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterCompany, setFilterComp]  = useState('all');
  const [showFilters, setShowFilters]   = useState(false);

  const filtered = auditLogs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch =
      log.actorName.toLowerCase().includes(q) ||
      log.label.toLowerCase().includes(q) ||
      log.resourceLabel.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);
    const matchSev     = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchAction  = filterAction   === 'all' || log.action.startsWith(filterAction);
    const matchCompany = filterCompany  === 'all' || log.companyId === filterCompany;
    return matchSearch && matchSev && matchAction && matchCompany;
  });

  const handleExport = () => {
    const csv = [
      ['Date', 'Sévérité', 'Action', 'Libellé', 'Acteur', 'Ressource', 'Cible', 'Société', 'IP', 'Détails'].join(';'),
      ...filtered.map(l => [
        format(new Date(l.timestamp), 'dd/MM/yyyy HH:mm:ss'),
        l.severity,
        l.action,
        l.label,
        l.actorName,
        l.resource,
        l.resourceLabel,
        companies.find(c => c.id === l.companyId)?.name || '',
        l.ip,
        `"${l.details}"`,
      ].join(';')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_kab_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sa-page">
      <div className="sa-toolbar">
        <div className="sa-search-wrap">
          <Search size={15} className="sa-search-icon" />
          <input
            className="sa-search-input"
            placeholder="Acteur, action, ressource, détails…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`sa-btn sa-btn--ghost ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <Filter size={14} /> Filtres <ChevronDown size={12} />
        </button>
        <button className="sa-btn sa-btn--ghost" onClick={handleExport}>
          <Download size={14} /> Exporter CSV
        </button>
      </div>

      {showFilters && (
        <div className="sa-filters-bar">
          <div className="sa-filter-group">
            <label>Sévérité</label>
            <select value={filterSeverity} onChange={e => setFilterSev(e.target.value)}>
              <option value="all">Toutes</option>
              {Object.entries(SEVERITY_INFO).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="sa-filter-group">
            <label>Type d'action</label>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              {ACTION_GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          <div className="sa-filter-group">
            <label>Société</label>
            <select value={filterCompany} onChange={e => setFilterComp(e.target.value)}>
              <option value="all">Toutes</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={() => { setFilterSev('all'); setFilterAction('all'); setFilterComp('all'); }}>
            <X size={13} /> Réinitialiser
          </button>
        </div>
      )}

      <div className="sa-results-count">
        {filtered.length} entrée{filtered.length > 1 ? 's' : ''} — cliquez sur une ligne pour voir les détails
      </div>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Sévérité</th>
              <th>Action</th>
              <th>Acteur</th>
              <th>Ressource</th>
              <th>Société</th>
              <th>Date/Heure</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="sa-table-empty">Aucune entrée trouvée.</td></tr>
            )}
            {filtered.map(log => <LogRow key={log.id} log={log} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
