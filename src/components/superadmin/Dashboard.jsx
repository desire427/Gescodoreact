import { Building2, Users, Shield, Activity, AlertTriangle, CheckCircle2, Clock, ArrowRight, FolderKanban, Flag, BarChart3, Calendar } from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { roles, companies } from '../../data/mockData';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

function KpiCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <button className={`sa-kpi-card ${onClick ? 'clickable' : ''}`} onClick={onClick} style={{ '--kpi-color': color }}>
      <div className="sa-kpi-icon"><Icon size={22} /></div>
      <div className="sa-kpi-body">
        <span className="sa-kpi-value">{value}</span>
        <span className="sa-kpi-label">{label}</span>
        {sub && <span className="sa-kpi-sub">{sub}</span>}
      </div>
    </button>
  );
}

function AlertCard({ alert, onResolve }) {
  const severityClass = { high: 'alert--high', medium: 'alert--medium', low: 'alert--low', critical: 'alert--critical' }[alert.severity] || 'alert--low';
  return (
    <div className={`sa-alert-item ${severityClass} ${alert.resolved ? 'resolved' : ''}`}>
      <div className="sa-alert-dot" />
      <div className="sa-alert-body">
        <span className="sa-alert-title">{alert.title}</span>
        <span className="sa-alert-message">{alert.message}</span>
        <span className="sa-alert-time">{format(new Date(alert.createdAt), 'd MMM à HH:mm', { locale: fr })}</span>
      </div>
      {!alert.resolved && (
        <button className="sa-alert-resolve" onClick={() => onResolve(alert.id)}><CheckCircle2 size={16} /></button>
      )}
    </div>
  );
}

function AuditRow({ log }) {
  const severityClass = { info: 'sev--info', low: 'sev--low', medium: 'sev--medium', high: 'sev--high', critical: 'sev--critical' }[log.severity] || 'sev--info';
  return (
    <div className="sa-audit-row">
      <span className={`sa-sev-badge ${severityClass}`}>{log.severity}</span>
      <div className="sa-audit-row-body">
        <span className="sa-audit-row-label">{log.label}</span>
        <span className="sa-audit-row-actor">par {log.actorName} · {log.resourceLabel}</span>
      </div>
      <span className="sa-audit-row-time">{format(new Date(log.timestamp), 'HH:mm', { locale: fr })}</span>
    </div>
  );
}

function ReportingSection({ stats, tasks, decisions, meetings, users, onNavigate }) {
  // Taux d'exécution décisions
  const closedDecisions = decisions.filter(d => ['executed', 'cancelled'].includes(d.status)).length;
  const execRate = decisions.length > 0 ? Math.round((decisions.filter(d => d.status === 'executed').length / decisions.length) * 100) : 0;

  // Taux tâches terminées à temps
  const closedTasks = tasks.filter(t => ['done', 'validated', 'cancelled'].includes(t.status));
  const onTimeTasks = closedTasks.filter(t => t.validatedAt && t.dueDate && new Date(t.validatedAt) <= new Date(t.dueDate));
  const onTimeRate  = closedTasks.length > 0 ? Math.round((onTimeTasks.length / closedTasks.length) * 100) : 0;

  // Âge moyen retard
  const lateTasks   = tasks.filter(t => !['done','cancelled','validated'].includes(t.status) && t.dueDate && new Date(t.dueDate) < new Date());
  const avgLateAge  = lateTasks.length > 0
    ? Math.round(lateTasks.reduce((sum, t) => sum + differenceInDays(new Date(), new Date(t.dueDate)), 0) / lateTasks.length)
    : 0;

  // Performance par société
  const perfBySoc = companies.map(c => {
    const socTasks     = tasks.filter(t => t.companyId === c.id);
    const socDone      = socTasks.filter(t => ['done','validated'].includes(t.status)).length;
    const socDecisions = decisions.filter(d => d.companyId === c.id);
    const socExec      = socDecisions.filter(d => d.status === 'executed').length;
    return {
      company: c,
      taskRate: socTasks.length > 0 ? Math.round((socDone / socTasks.length) * 100) : 0,
      decRate:  socDecisions.length > 0 ? Math.round((socExec / socDecisions.length) * 100) : 0,
      lateTasks: socTasks.filter(t => !['done','cancelled','validated'].includes(t.status) && t.dueDate && new Date(t.dueDate) < new Date()).length,
    };
  });

  return (
    <section className="sa-section sa-card sa-card--wide">
      <div className="sa-card-header">
        <h3 className="sa-card-title"><BarChart3 size={16} />Reporting consolidé</h3>
        <button className="sa-link-btn" onClick={() => onNavigate('audit')}>
          Audit <ArrowRight size={14} />
        </button>
      </div>

      {/* Indicateurs globaux */}
      <div className="sa-reporting-kpis">
        <div className="sa-rep-kpi">
          <div className="sa-rep-kpi-value" style={{ color: execRate >= 70 ? '#22c55e' : execRate >= 40 ? '#f59e0b' : '#ef4444' }}>
            {execRate}%
          </div>
          <div className="sa-rep-kpi-label">Taux d'exécution décisions</div>
          <div className="sa-rep-kpi-sub">{decisions.filter(d=>d.status==='executed').length}/{decisions.length} décisions</div>
        </div>
        <div className="sa-rep-kpi">
          <div className="sa-rep-kpi-value" style={{ color: onTimeRate >= 80 ? '#22c55e' : onTimeRate >= 50 ? '#f59e0b' : '#ef4444' }}>
            {onTimeRate}%
          </div>
          <div className="sa-rep-kpi-label">Tâches terminées à temps</div>
          <div className="sa-rep-kpi-sub">{onTimeTasks.length}/{closedTasks.length} tâches closes</div>
        </div>
        <div className="sa-rep-kpi">
          <div className="sa-rep-kpi-value" style={{ color: stats.criticalLateTasks > 0 ? '#ef4444' : '#22c55e' }}>
            {stats.criticalLateTasks}
          </div>
          <div className="sa-rep-kpi-label">Retards critiques</div>
          <div className="sa-rep-kpi-sub">Priorité Urgente/Critique</div>
        </div>
        <div className="sa-rep-kpi">
          <div className="sa-rep-kpi-value" style={{ color: avgLateAge > 5 ? '#ef4444' : avgLateAge > 2 ? '#f59e0b' : '#22c55e' }}>
            {avgLateAge}j
          </div>
          <div className="sa-rep-kpi-label">Âge moyen retard</div>
          <div className="sa-rep-kpi-sub">{lateTasks.length} tâche(s) en retard</div>
        </div>
        <div className="sa-rep-kpi">
          <div className="sa-rep-kpi-value" style={{ color: stats.decisionsWithoutResponsable > 0 ? '#f59e0b' : '#22c55e' }}>
            {stats.decisionsWithoutResponsable}
          </div>
          <div className="sa-rep-kpi-label">Décisions sans tâche</div>
          <div className="sa-rep-kpi-sub">Actions non planifiées</div>
        </div>
        <div className="sa-rep-kpi">
          <div className="sa-rep-kpi-value" style={{ color: stats.meetingsWithoutPV > 0 ? '#f59e0b' : '#22c55e' }}>
            {stats.meetingsWithoutPV}
          </div>
          <div className="sa-rep-kpi-label">Réunions sans PV validé</div>
          <div className="sa-rep-kpi-sub">PV en brouillon ou absent</div>
        </div>
      </div>

      {/* Performance par société */}
      <div className="sa-perf-by-company">
        <div className="sa-perf-header">
          <span>Société</span>
          <span>Tâches terminées</span>
          <span>Décisions exécutées</span>
          <span>Retards</span>
        </div>
        {perfBySoc.map(p => (
          <div key={p.company.id} className="sa-perf-row">
            <span className="sa-perf-company">{p.company.name}</span>
            <div className="sa-perf-bar-cell">
              <div className="sa-role-bar-wrap" style={{ flex: 1 }}>
                <div className="sa-role-bar" style={{ width: `${p.taskRate}%`, background: p.taskRate >= 70 ? '#22c55e' : p.taskRate >= 40 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <span style={{ width: 36, textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>{p.taskRate}%</span>
            </div>
            <div className="sa-perf-bar-cell">
              <div className="sa-role-bar-wrap" style={{ flex: 1 }}>
                <div className="sa-role-bar" style={{ width: `${p.decRate}%`, background: p.decRate >= 70 ? '#22c55e' : '#f59e0b' }} />
              </div>
              <span style={{ width: 36, textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>{p.decRate}%</span>
            </div>
            <span className={`sa-badge ${p.lateTasks > 0 ? 'sa-badge--red' : 'sa-badge--green'}`}>{p.lateTasks}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard({ onNavigate }) {
  const { stats, alerts, auditLogs, users, resolveAlert, platformSettings, tasks, decisions, meetings, projects } = useSuperAdmin();
  const recentLogs   = auditLogs.slice(0, 5);
  const activeAlerts = alerts.filter(a => !a.resolved);
  const roleBreakdown = roles.map(r => ({ ...r, count: users.filter(u => u.role === r.id).length })).filter(r => r.count > 0);
  const upcomingMeetings = meetings.filter(m => m.status === 'planned' && new Date(m.scheduledAt) > new Date()).slice(0, 3);

  return (
    <div className="sa-dashboard">
      {/* KPIs */}
      <section className="sa-section">
        <h2 className="sa-section-title">Vue d'ensemble</h2>
        <div className="sa-kpi-grid">
          <KpiCard icon={Building2} label="Sociétés" color="#7c3aed" value={stats.totalCompanies} sub={`${stats.activeCompanies} actives · ${stats.suspendedCompanies} suspendues`} onClick={() => onNavigate('companies')} />
          <KpiCard icon={Users} label="Utilisateurs" color="#2563eb" value={stats.totalUsers} sub={`${stats.activeUsers} actifs · ${stats.invitedUsers} invités`} onClick={() => onNavigate('users')} />
          <KpiCard icon={Activity} label="En ligne maintenant" color="#059669" value={stats.onlineUsers} sub={`${stats.activeSessions} sessions actives`} onClick={() => onNavigate('sessions')} />
          <KpiCard icon={FolderKanban} label="Projets actifs" color="#0891b2" value={stats.activeProjects} sub={`${stats.totalProjects} projets au total`} onClick={() => onNavigate('projects')} />
          <KpiCard icon={Flag} label="Tâches en retard" color="#f59e0b" value={stats.lateTasks} sub={`dont ${stats.criticalLateTasks} critiques`} onClick={() => onNavigate('projects')} />
          <KpiCard icon={AlertTriangle} label="Alertes actives" color="#dc2626" value={stats.unresolvedAlerts} sub={`${alerts.filter(a=>a.resolved).length} résolues`} onClick={() => onNavigate('audit')} />
        </div>
      </section>

      {/* Dashboard grid */}
      <div className="sa-dashboard-grid">
        {/* Alertes */}
        <section className="sa-section sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><AlertTriangle size={16}/>Alertes</h3>
            {activeAlerts.length === 0 && <span className="sa-badge sa-badge--green">Tout est bon</span>}
          </div>
          <div className="sa-alert-list">
            {alerts.length === 0
              ? <p className="sa-empty">Aucune alerte.</p>
              : alerts.map(a => <AlertCard key={a.id} alert={a} onResolve={resolveAlert}/>)
            }
          </div>
        </section>

        {/* Répartition rôles */}
        <section className="sa-section sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Shield size={16}/>Répartition des rôles</h3>
          </div>
          <div className="sa-role-breakdown">
            {roleBreakdown.map(r => (
              <div key={r.id} className="sa-role-row">
                <div className="sa-role-dot" style={{ background: r.color }}/>
                <span className="sa-role-name">{r.label}</span>
                <div className="sa-role-bar-wrap">
                  <div className="sa-role-bar" style={{ width: `${Math.round((r.count/stats.totalUsers)*100)}%`, background: r.color }}/>
                </div>
                <span className="sa-role-count">{r.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Réunions à venir */}
        <section className="sa-section sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Calendar size={16}/>Réunions à venir</h3>
          </div>
          {upcomingMeetings.length === 0
            ? <p className="sa-empty">Aucune réunion planifiée.</p>
            : upcomingMeetings.map(m => (
              <div key={m.id} className="sa-audit-row">
                <span className="sa-sev-badge sev--info">{m.type}</span>
                <div className="sa-audit-row-body">
                  <span className="sa-audit-row-label">{m.title}</span>
                  <span className="sa-audit-row-actor">{m.participants.length} participants</span>
                </div>
                <span className="sa-audit-row-time">
                  {format(new Date(m.scheduledAt), 'd MMM HH:mm', { locale: fr })}
                </span>
              </div>
            ))
          }
          {stats.meetingsWithoutPV > 0 && (
            <div className="sa-alert-item alert--medium" style={{ marginTop: 8 }}>
              <div className="sa-alert-dot"/>
              <div className="sa-alert-body">
                <span className="sa-alert-title">{stats.meetingsWithoutPV} réunion(s) sans PV validé</span>
                <span className="sa-alert-message">Des procès-verbaux restent en attente de validation.</span>
              </div>
            </div>
          )}
        </section>

        {/* Journal récent */}
        <section className="sa-section sa-card sa-card--wide">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Clock size={16}/>Activité récente</h3>
            <button className="sa-link-btn" onClick={() => onNavigate('audit')}>Tout voir <ArrowRight size={14}/></button>
          </div>
          <div className="sa-audit-list">
            {recentLogs.map(log => <AuditRow key={log.id} log={log}/>)}
          </div>
        </section>

        {/* Reporting consolidé */}
        <ReportingSection
          stats={stats} tasks={tasks} decisions={decisions}
          meetings={meetings} users={users} onNavigate={onNavigate}
        />

        {/* Infos système */}
        <section className="sa-section sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Shield size={16}/>Système</h3>
          </div>
          <div className="sa-sys-list">
            <div className="sa-sys-row"><span className="sa-sys-key">Version</span><span className="sa-sys-val">{platformSettings.platformVersion}</span></div>
            <div className="sa-sys-row"><span className="sa-sys-key">Dernière sauvegarde</span><span className="sa-sys-val">{format(new Date(platformSettings.lastBackup),'d MMM à HH:mm',{locale:fr})}</span></div>
            <div className="sa-sys-row"><span className="sa-sys-key">Timeout session</span><span className="sa-sys-val">{platformSettings.sessionTimeout} min</span></div>
            <div className="sa-sys-row"><span className="sa-sys-key">Max appareils</span><span className="sa-sys-val">{platformSettings.maxDevicesPerUser}</span></div>
            <div className="sa-sys-row"><span className="sa-sys-key">2FA obligatoire</span><span className="sa-sys-val"><span className={`sa-badge ${platformSettings.twoFactorRequired ? 'sa-badge--green':'sa-badge--gray'}`}>{platformSettings.twoFactorRequired ? 'Oui':'Non'}</span></span></div>
            <div className="sa-sys-row"><span className="sa-sys-key">Maintenance</span><span className="sa-sys-val"><span className={`sa-badge ${platformSettings.maintenanceMode ? 'sa-badge--red':'sa-badge--green'}`}>{platformSettings.maintenanceMode ? 'Actif':'Inactif'}</span></span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
