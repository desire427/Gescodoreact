import {
  Gavel, ListTodo, Flag, Clock, Calendar, ArrowRight,
  Users, CheckCircle2, AlertTriangle, BarChart3, FolderKanban,
} from 'lucide-react';
import { useAdminSociete } from '../../context/AdminSocieteContext';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

function KpiCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <button
      className={`sa-kpi-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ '--kpi-color': color }}
    >
      <div className="sa-kpi-icon"><Icon size={22} /></div>
      <div className="sa-kpi-body">
        <span className="sa-kpi-value">{value}</span>
        <span className="sa-kpi-label">{label}</span>
        {sub && <span className="sa-kpi-sub">{sub}</span>}
      </div>
    </button>
  );
}

function RateGauge({ label, value, color }) {
  const c = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="dg-gauge">
      <div className="dg-gauge-ring" style={{ '--pct': value, '--color': c }}>
        <span className="dg-gauge-value" style={{ color: c }}>{value}%</span>
      </div>
      <span className="dg-gauge-label">{label}</span>
    </div>
  );
}

export default function DashboardDG({ onNavigate }) {
  const { stats, tasks, decisions, meetings, projects, users, auditLogs } = useAdminSociete();
  const now = new Date();

  // Top 5 tâches en retard les plus critiques
  const topLateTasks = tasks
    .filter(t => !['done','cancelled','validated'].includes(t.status) && t.dueDate && new Date(t.dueDate) < now)
    .sort((a, b) => {
      const prioOrder = { critical:0, urgent:1, high:2, normal:3, low:4 };
      return (prioOrder[a.priority]||3) - (prioOrder[b.priority]||3);
    })
    .slice(0, 5);

  // Décisions sans tâche
  const decisionsNoTask = decisions.filter(d =>
    ['to_execute','in_execution'].includes(d.status) && (!d.taskIds || d.taskIds.length === 0)
  );

  // Réunions à venir (3 prochaines)
  const upcomingMeetings = meetings
    .filter(m => m.status === 'planned' && new Date(m.scheduledAt) > now)
    .sort((a,b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 3);

  // Charge par collaborateur (tâches actives par responsable)
  const chargeByUser = users
    .filter(u => u.status === 'active')
    .map(u => ({
      user: u,
      total:   tasks.filter(t => t.responsableId === u.id && !['done','cancelled','validated'].includes(t.status)).length,
      late:    tasks.filter(t => t.responsableId === u.id && t.dueDate && new Date(t.dueDate) < now && !['done','cancelled','validated'].includes(t.status)).length,
      pending: tasks.filter(t => t.responsableId === u.id && t.status === 'submitted').length,
    }))
    .filter(c => c.total > 0)
    .sort((a,b) => b.total - a.total)
    .slice(0, 6);

  // Log récent
  const recentLogs = auditLogs.slice(0, 4);

  const PRIO_COLORS = { critical:'#dc2626', urgent:'#ef4444', high:'#f59e0b', normal:'#3b82f6', low:'#64748b' };
  const PRIO_LABELS = { critical:'Critique', urgent:'Urgente', high:'Haute', normal:'Normale', low:'Faible' };

  return (
    <div className="sa-dashboard">
      {/* ── KPIs principaux ── */}
      <section className="sa-section">
        <h2 className="sa-section-title">Vue d'ensemble — {format(now, 'd MMMM yyyy', { locale: fr })}</h2>
        <div className="sa-kpi-grid">
          <KpiCard icon={Users}       label="Utilisateurs actifs" color="#2563eb"
            value={stats.activeUsers}  sub={`${stats.onlineUsers} en ligne`} onClick={() => onNavigate('users')} />
          <KpiCard icon={FolderKanban} label="Projets actifs"   color="#0891b2"
            value={stats.activeProjects} sub={`${stats.totalProjects} au total`} onClick={() => onNavigate('projects')} />
          <KpiCard icon={Gavel}        label="Décisions en cours" color="#8b5cf6"
            value={stats.pendingDecisions} sub={`${stats.execRate}% exécutées`} onClick={() => onNavigate('decisions')} />
          <KpiCard icon={ListTodo}     label="Tâches en retard"  color="#ef4444"
            value={stats.lateTasks} sub={`dont ${stats.criticalLateTasks} critiques`} onClick={() => onNavigate('tasks')} />
          <KpiCard icon={Flag}         label="À valider"          color="#f59e0b"
            value={stats.submittedTasks} sub="Tâches soumises" onClick={() => onNavigate('tasks')} />
          <KpiCard icon={Calendar}     label="Réunions à venir"   color="#22c55e"
            value={stats.upcomingMeetings} sub={`${stats.meetingsWithoutPV} sans PV`} onClick={() => onNavigate('meetings')} />
        </div>
      </section>

      {/* ── Indicateurs CDC 13.3 ── */}
      <section className="sa-section sa-card">
        <div className="sa-card-header">
          <h3 className="sa-card-title"><BarChart3 size={16} />Indicateurs Direction Générale</h3>
        </div>
        <div className="dg-indicators-grid">
          <RateGauge label="Taux d'exécution décisions" value={stats.execRate} />
          <RateGauge label="Tâches terminées à temps"   value={stats.onTimeRate} />
          <div className="dg-indicator-stat">
            <span className="dg-ind-value" style={{ color: stats.avgLateAge > 5 ? '#ef4444' : stats.avgLateAge > 2 ? '#f59e0b' : '#22c55e' }}>
              {stats.avgLateAge}j
            </span>
            <span className="dg-ind-label">Âge moyen retard</span>
          </div>
          <div className="dg-indicator-stat">
            <span className="dg-ind-value" style={{ color: stats.decisionsWithoutTasks > 0 ? '#f59e0b' : '#22c55e' }}>
              {stats.decisionsWithoutTasks}
            </span>
            <span className="dg-ind-label">Décisions sans tâche</span>
          </div>
          <div className="dg-indicator-stat">
            <span className="dg-ind-value" style={{ color: stats.blockedTasks > 0 ? '#ef4444' : '#22c55e' }}>
              {stats.blockedTasks}
            </span>
            <span className="dg-ind-label">Tâches bloquées</span>
          </div>
          <div className="dg-indicator-stat">
            <span className="dg-ind-value" style={{ color: stats.meetingsWithoutPV > 0 ? '#f59e0b' : '#22c55e' }}>
              {stats.meetingsWithoutPV}
            </span>
            <span className="dg-ind-label">Réunions sans PV</span>
          </div>
        </div>
      </section>

      <div className="sa-dashboard-grid">

        {/* ── Tâches critiques en retard ── */}
        <section className="sa-section sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><AlertTriangle size={16} />Retards critiques</h3>
            <button className="sa-link-btn" onClick={() => onNavigate('tasks')}>
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          {topLateTasks.length === 0 ? (
            <p className="sa-empty">✅ Aucun retard critique.</p>
          ) : (
            <div className="dg-late-list">
              {topLateTasks.map(t => {
                const daysLate = differenceInDays(now, new Date(t.dueDate));
                const responsible = users.find(u => u.id === t.responsableId);
                return (
                  <div key={t.id} className="dg-late-item">
                    <div className="dg-late-prio" style={{ background: (PRIO_COLORS[t.priority]||'#64748b')+'22', color: PRIO_COLORS[t.priority]||'#64748b' }}>
                      {PRIO_LABELS[t.priority]}
                    </div>
                    <div className="dg-late-info">
                      <span className="dg-late-title">{t.title}</span>
                      <span className="dg-late-meta">
                        {responsible?.name || '—'} · {t.ref}
                      </span>
                    </div>
                    <div className="dg-late-days" style={{ color: daysLate > 7 ? '#ef4444' : '#f59e0b' }}>
                      +{daysLate}j
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Décisions sans tâche ── */}
        <section className="sa-section sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Gavel size={16} />Décisions sans action planifiée</h3>
            <button className="sa-link-btn" onClick={() => onNavigate('decisions')}>
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          {decisionsNoTask.length === 0 ? (
            <p className="sa-empty">✅ Toutes les décisions ont des tâches.</p>
          ) : (
            <div className="dg-late-list">
              {decisionsNoTask.slice(0, 4).map(d => (
                <div key={d.id} className="dg-late-item">
                  <div className="dg-late-prio" style={{ background:'rgba(139,92,246,.15)', color:'#a78bfa' }}>
                    {d.status === 'to_execute' ? 'À exécuter' : 'En exécution'}
                  </div>
                  <div className="dg-late-info">
                    <span className="dg-late-title">{d.title}</span>
                    <span className="dg-late-meta">{d.ref} · {format(new Date(d.decisionDate||d.createdAt), 'd MMM yyyy', { locale: fr })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Charge par collaborateur ── */}
        <section className="sa-section sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Users size={16} />Charge par collaborateur</h3>
          </div>
          {chargeByUser.length === 0 ? (
            <p className="sa-empty">Aucune tâche active.</p>
          ) : (
            <div className="dg-charge-list">
              {chargeByUser.map(c => (
                <div key={c.user.id} className="dg-charge-row">
                  <div className="sa-user-cell" style={{ flex: 1 }}>
                    <div className="sa-user-avatar-wrap">
                      <img src={c.user.avatar} alt="" className="sa-avatar-sm" />
                      {c.user.online && <span className="sa-online-dot" />}
                    </div>
                    <div>
                      <div className="sa-user-name">{c.user.name}</div>
                      {c.late > 0 && <div style={{ fontSize:10, color:'#ef4444' }}>{c.late} en retard</div>}
                      {c.pending > 0 && <div style={{ fontSize:10, color:'#f59e0b' }}>{c.pending} à valider</div>}
                    </div>
                  </div>
                  <div className="dg-charge-bar-wrap">
                    <div className="dg-charge-bar">
                      <div
                        className="dg-charge-bar-fill"
                        style={{
                          width: `${Math.min(100, c.total * 10)}%`,
                          background: c.total > 8 ? '#ef4444' : c.total > 5 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                    <span className="dg-charge-count">{c.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Réunions à venir ── */}
        <section className="sa-section sa-card">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Calendar size={16} />Réunions à venir</h3>
            <button className="sa-link-btn" onClick={() => onNavigate('meetings')}>
              Voir tout <ArrowRight size={14} />
            </button>
          </div>
          {upcomingMeetings.length === 0 ? (
            <p className="sa-empty">Aucune réunion planifiée.</p>
          ) : (
            upcomingMeetings.map(m => (
              <div key={m.id} className="dg-meeting-row">
                <div className="dg-meeting-date">
                  <span>{format(new Date(m.scheduledAt), 'd MMM', { locale: fr })}</span>
                  <span>{format(new Date(m.scheduledAt), 'HH:mm')}</span>
                </div>
                <div className="dg-meeting-info">
                  <span className="dg-meeting-title">{m.title}</span>
                  <span className="dg-meeting-meta">{m.participants.length} participants · {m.duration}min</span>
                </div>
              </div>
            ))
          )}
        </section>

        {/* ── Activité récente ── */}
        <section className="sa-section sa-card sa-card--wide">
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Clock size={16} />Activité récente</h3>
            <button className="sa-link-btn" onClick={() => onNavigate('audit')}>
              Journal complet <ArrowRight size={14} />
            </button>
          </div>
          <div className="sa-audit-list">
            {recentLogs.map(log => {
              const sevClass = { info:'sev--info', low:'sev--low', medium:'sev--medium', high:'sev--high', critical:'sev--critical' }[log.severity] || 'sev--info';
              return (
                <div key={log.id} className="sa-audit-row">
                  <span className={`sa-sev-badge ${sevClass}`}>{log.severity}</span>
                  <div className="sa-audit-row-body">
                    <span className="sa-audit-row-label">{log.label}</span>
                    <span className="sa-audit-row-actor">par {log.actorName} · {log.resourceLabel}</span>
                  </div>
                  <span className="sa-audit-row-time">{format(new Date(log.timestamp), 'HH:mm', { locale: fr })}</span>
                </div>
              );
            })}
            {recentLogs.length === 0 && <p className="sa-empty">Aucune activité récente.</p>}
          </div>
        </section>

      </div>
    </div>
  );
}
