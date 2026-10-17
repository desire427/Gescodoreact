import {
  Building2, Users, Shield, Activity, AlertTriangle, CheckCircle2,
  Clock, ArrowRight, FolderKanban, Flag, BarChart3, Calendar,
} from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const ROLES = [
  { id: 'superAdmin',   label: 'Super Admin',        color: '#7c3aed' },
  { id: 'adminSociete', label: 'Admin Société',       color: '#2563eb' },
  { id: 'manager',      label: 'Directeur / Manager', color: '#059669' },
  { id: 'rh',           label: 'Ressources Humaines', color: '#d97706' },
  { id: 'chefProjet',   label: 'Chef de Projet',      color: '#0891b2' },
  { id: 'auditeur',     label: 'Auditeur',             color: '#7c3aed' },
  { id: 'employe',      label: 'Employé',              color: '#475569' },
];

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <button
      className={`gc-kpi-card ${onClick ? 'gc-kpi-card--clickable' : ''}`}
      style={{ '--kpi-accent': color }}
      onClick={onClick}
    >
      <div className="gc-kpi-icon"><Icon size={20} /></div>
      <div className="gc-kpi-body">
        <span className="gc-kpi-value">{value}</span>
        <span className="gc-kpi-label">{label}</span>
        {sub && <span className="gc-kpi-sub">{sub}</span>}
      </div>
    </button>
  );
}

/* ── Alert Card ── */
function AlertItem({ alert, onResolve }) {
  const severityClass = {
    critical: 'gc-alert--critical', high: 'gc-alert--high',
    medium: 'gc-alert--medium', low: 'gc-alert--low',
  }[alert.severity] || 'gc-alert--low';

  return (
    <div className={`gc-alert-item ${severityClass} ${alert.resolved ? 'gc-alert--resolved' : ''}`}>
      <div className="gc-alert-dot" />
      <div className="gc-alert-body">
        <span className="gc-alert-title">{alert.title}</span>
        <span className="gc-alert-msg">{alert.message}</span>
        <span className="gc-alert-time">{format(new Date(alert.createdAt), 'd MMM à HH:mm', { locale: fr })}</span>
      </div>
      {!alert.resolved && (
        <button className="gc-alert-resolve" onClick={() => onResolve(alert.id)} title="Marquer résolu">
          <CheckCircle2 size={15} />
        </button>
      )}
    </div>
  );
}

/* ── Audit Row ── */
function AuditRow({ log }) {
  const cls = {
    critical: 'gc-sev--critical', high: 'gc-sev--high',
    medium: 'gc-sev--medium', low: 'gc-sev--low', info: 'gc-sev--info',
  }[log.severity] || 'gc-sev--info';

  return (
    <div className="gc-audit-row">
      <span className={`gc-sev-badge ${cls}`}>{log.severity}</span>
      <div className="gc-audit-row-body">
        <span className="gc-audit-label">{log.label}</span>
        <span className="gc-audit-actor">par {log.actorName} · {log.resourceLabel}</span>
      </div>
      <span className="gc-audit-time">{format(new Date(log.timestamp), 'HH:mm', { locale: fr })}</span>
    </div>
  );
}

/* ── Reporting Section ── */
function ReportingSection({ stats, tasks, decisions, companies = [], onNavigate }) {
  const execRate = decisions.length > 0
    ? Math.round((decisions.filter(d => d.status === 'executed').length / decisions.length) * 100)
    : 0;

  const closedTasks = tasks.filter(t => ['done', 'validated', 'cancelled'].includes(t.status));
  const onTimeTasks = closedTasks.filter(t => t.validatedAt && t.dueDate && new Date(t.validatedAt) <= new Date(t.dueDate));
  const onTimeRate = closedTasks.length > 0 ? Math.round((onTimeTasks.length / closedTasks.length) * 100) : 0;

  const lateTasks = tasks.filter(t =>
    !['done', 'cancelled', 'validated'].includes(t.status) && t.dueDate && new Date(t.dueDate) < new Date()
  );
  const avgLateAge = lateTasks.length > 0
    ? Math.round(lateTasks.reduce((sum, t) => sum + differenceInDays(new Date(), new Date(t.dueDate)), 0) / lateTasks.length)
    : 0;

  const perfBySoc = companies.map(c => {
    const sT = tasks.filter(t => t.companyId === c.id);
    const sD = decisions.filter(d => d.companyId === c.id);
    return {
      company: c,
      taskRate: sT.length > 0 ? Math.round((sT.filter(t => ['done','validated'].includes(t.status)).length / sT.length) * 100) : 0,
      decRate:  sD.length > 0 ? Math.round((sD.filter(d => d.status === 'executed').length / sD.length) * 100) : 0,
      late:     sT.filter(t => !['done','cancelled','validated'].includes(t.status) && t.dueDate && new Date(t.dueDate) < new Date()).length,
    };
  });

  const rateColor = (v) => v >= 70 ? '#22c55e' : v >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <section className="gc-section gc-card gc-card--span2">
      <div className="gc-card-header">
        <h3 className="gc-card-title"><BarChart3 size={15} />Reporting consolidé</h3>
        <button className="gc-link-btn" onClick={() => onNavigate('audit')}>
          Journal d'audit <ArrowRight size={13} />
        </button>
      </div>

      <div className="gc-rep-kpis">
        {[
          { label: "Taux d'exécution décisions", value: `${execRate}%`, sub: `${decisions.filter(d=>d.status==='executed').length}/${decisions.length}`, color: rateColor(execRate) },
          { label: 'Tâches terminées à temps', value: `${onTimeRate}%`, sub: `${onTimeTasks.length}/${closedTasks.length} closes`, color: rateColor(onTimeRate) },
          { label: 'Retards critiques', value: stats.criticalLateTasks, sub: 'Urgente / Critique', color: stats.criticalLateTasks > 0 ? '#ef4444' : '#22c55e' },
          { label: 'Âge moyen retard', value: `${avgLateAge}j`, sub: `${lateTasks.length} en retard`, color: avgLateAge > 5 ? '#ef4444' : avgLateAge > 2 ? '#f59e0b' : '#22c55e' },
          { label: 'Décisions sans tâche', value: stats.decisionsWithoutResponsable, sub: 'Actions non planifiées', color: stats.decisionsWithoutResponsable > 0 ? '#f59e0b' : '#22c55e' },
          { label: 'Réunions sans PV validé', value: stats.meetingsWithoutPV, sub: 'PV en brouillon / absent', color: stats.meetingsWithoutPV > 0 ? '#f59e0b' : '#22c55e' },
        ].map(k => (
          <div key={k.label} className="gc-rep-kpi">
            <span className="gc-rep-kpi-value" style={{ color: k.color }}>{k.value}</span>
            <span className="gc-rep-kpi-label">{k.label}</span>
            <span className="gc-rep-kpi-sub">{k.sub}</span>
          </div>
        ))}
      </div>

      {perfBySoc.length > 0 && (
        <div className="gc-perf-table">
          <div className="gc-perf-header">
            <span>Société</span><span>Tâches</span><span>Décisions</span><span>Retards</span>
          </div>
          {perfBySoc.map(p => (
            <div key={p.company.id} className="gc-perf-row">
              <span className="gc-perf-company">{p.company.name}</span>
              <div className="gc-perf-bar-cell">
                <div className="gc-bar-track">
                  <div className="gc-bar-fill" style={{ width: `${p.taskRate}%`, background: rateColor(p.taskRate) }} />
                </div>
                <span className="gc-bar-pct">{p.taskRate}%</span>
              </div>
              <div className="gc-perf-bar-cell">
                <div className="gc-bar-track">
                  <div className="gc-bar-fill" style={{ width: `${p.decRate}%`, background: rateColor(p.decRate) }} />
                </div>
                <span className="gc-bar-pct">{p.decRate}%</span>
              </div>
              <span className={`gc-badge ${p.late > 0 ? 'gc-badge--danger' : 'gc-badge--success'}`}>{p.late}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Main Dashboard ── */
export default function Dashboard({ onNavigate }) {
  const {
    stats, alerts, auditLogs, users, resolveAlert,
    platformSettings, tasks, decisions, meetings, companies,
  } = useSuperAdmin();

  const recentLogs       = auditLogs.slice(0, 5);
  const activeAlerts     = alerts.filter(a => !a.resolved);
  const roleBreakdown    = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.id).length })).filter(r => r.count > 0);
  const upcomingMeetings = meetings.filter(m => m.status === 'planned' && new Date(m.scheduledAt) > new Date()).slice(0, 3);

  return (
    <div className="gc-dashboard">

      {/* KPIs */}
      <section className="gc-section">
        <h2 className="gc-section-label">Vue d'ensemble</h2>
        <div className="gc-kpi-grid">
          <KpiCard icon={Building2}     label="Sociétés"         color="#7c3aed" value={stats.totalCompanies} sub={`${stats.activeCompanies} actives · ${stats.suspendedCompanies} suspendues`} onClick={() => onNavigate('companies')} />
          <KpiCard icon={Users}         label="Utilisateurs"     color="#2563eb" value={stats.totalUsers}     sub={`${stats.activeUsers} actifs · ${stats.invitedUsers} invités`}               onClick={() => onNavigate('users')} />
          <KpiCard icon={Activity}      label="En ligne"         color="#059669" value={stats.onlineUsers}    sub={`${stats.activeSessions} sessions actives`}                                   onClick={() => onNavigate('sessions')} />
          <KpiCard icon={FolderKanban}  label="Projets actifs"   color="#0891b2" value={stats.activeProjects} sub={`${stats.totalProjects} projets au total`}                                    onClick={() => onNavigate('projects')} />
          <KpiCard icon={Flag}          label="Tâches en retard" color="#f59e0b" value={stats.lateTasks}      sub={`dont ${stats.criticalLateTasks} critiques`}                                  onClick={() => onNavigate('projects')} />
          <KpiCard icon={AlertTriangle} label="Alertes actives"  color="#dc2626" value={stats.unresolvedAlerts} sub={`${alerts.filter(a=>a.resolved).length} résolues`}                         onClick={() => onNavigate('audit')} />
        </div>
      </section>

      {/* Grid */}
      <div className="gc-dashboard-grid">

        {/* Alertes */}
        <section className="gc-section gc-card">
          <div className="gc-card-header">
            <h3 className="gc-card-title"><AlertTriangle size={15} />Alertes</h3>
            {activeAlerts.length === 0 && <span className="gc-badge gc-badge--success">Tout est bon</span>}
          </div>
          <div className="gc-alert-list">
            {alerts.length === 0
              ? <p className="gc-empty">Aucune alerte.</p>
              : alerts.map(a => <AlertItem key={a.id} alert={a} onResolve={resolveAlert} />)
            }
          </div>
        </section>

        {/* Répartition rôles */}
        <section className="gc-section gc-card">
          <div className="gc-card-header">
            <h3 className="gc-card-title"><Shield size={15} />Répartition des rôles</h3>
          </div>
          <div className="gc-roles-breakdown">
            {roleBreakdown.map(r => (
              <div key={r.id} className="gc-role-row">
                <div className="gc-role-dot" style={{ background: r.color }} />
                <span className="gc-role-name">{r.label}</span>
                <div className="gc-bar-track" style={{ flex: 1 }}>
                  <div className="gc-bar-fill" style={{
                    width: `${Math.round((r.count / stats.totalUsers) * 100)}%`,
                    background: r.color,
                  }} />
                </div>
                <span className="gc-role-count">{r.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Réunions à venir */}
        <section className="gc-section gc-card">
          <div className="gc-card-header">
            <h3 className="gc-card-title"><Calendar size={15} />Réunions à venir</h3>
          </div>
          {upcomingMeetings.length === 0
            ? <p className="gc-empty">Aucune réunion planifiée.</p>
            : upcomingMeetings.map(m => (
              <div key={m.id} className="gc-meeting-row">
                <span className="gc-meeting-type">{m.type}</span>
                <div className="gc-meeting-info">
                  <span className="gc-meeting-title">{m.title}</span>
                  <span className="gc-meeting-meta">{m.participants.length} participants</span>
                </div>
                <span className="gc-meeting-date">{format(new Date(m.scheduledAt), 'd MMM HH:mm', { locale: fr })}</span>
              </div>
            ))
          }
          {stats.meetingsWithoutPV > 0 && (
            <div className="gc-alert-item gc-alert--medium" style={{ marginTop: 10 }}>
              <div className="gc-alert-dot" />
              <div className="gc-alert-body">
                <span className="gc-alert-title">{stats.meetingsWithoutPV} réunion(s) sans PV validé</span>
                <span className="gc-alert-msg">Procès-verbaux en attente de validation.</span>
              </div>
            </div>
          )}
        </section>

        {/* Activité récente */}
        <section className="gc-section gc-card gc-card--span2">
          <div className="gc-card-header">
            <h3 className="gc-card-title"><Clock size={15} />Activité récente</h3>
            <button className="gc-link-btn" onClick={() => onNavigate('audit')}>
              Tout voir <ArrowRight size={13} />
            </button>
          </div>
          <div className="gc-audit-list">
            {recentLogs.map(log => <AuditRow key={log.id} log={log} />)}
            {recentLogs.length === 0 && <p className="gc-empty">Aucune activité récente.</p>}
          </div>
        </section>

        {/* Reporting */}
        <ReportingSection
          stats={stats} tasks={tasks} decisions={decisions}
          companies={companies}
          onNavigate={onNavigate}
        />

        {/* Système */}
        <section className="gc-section gc-card">
          <div className="gc-card-header">
            <h3 className="gc-card-title"><Shield size={15} />Système</h3>
          </div>
          <div className="gc-sys-list">
            {[
              ['Version',             platformSettings.platformVersion],
              ['Dernière sauvegarde', format(new Date(platformSettings.lastBackup), 'd MMM à HH:mm', { locale: fr })],
              ['Timeout session',     `${platformSettings.sessionTimeout} min`],
              ['Max appareils',       platformSettings.maxDevicesPerUser],
              ['2FA obligatoire',     platformSettings.twoFactorRequired ? 'Oui' : 'Non'],
              ['Maintenance',         platformSettings.maintenanceMode ? 'Actif' : 'Inactif'],
            ].map(([k, v]) => (
              <div key={k} className="gc-sys-row">
                <span className="gc-sys-key">{k}</span>
                <span className="gc-sys-val">{v}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
