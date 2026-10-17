import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock3, ListTodo,
  LogOut, MessageSquare, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { decisionsApi, meetingsApi, projectsApi, tasksApi } from '../../services/api';

const unwrap = (data) => (Array.isArray(data) ? data : data?.results ?? []);
const OPEN_TASKS = new Set(['todo', 'in_progress', 'blocked', 'waiting', 'submitted', 'late']);
const STATUS_LABELS = {
  todo: 'À faire', in_progress: 'En cours', blocked: 'Bloquée',
  waiting: 'En attente', submitted: 'À valider', late: 'En retard',
  validated: 'Validée', done: 'Terminée', cancelled: 'Annulée',
};
const PRIORITY_LABELS = {
  low: 'Basse', normal: 'Normale', high: 'Haute', urgent: 'Urgente', critical: 'Critique',
};

function localDateKey(date) {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

const PRIORITY_STYLE = {
  urgent:   { bg: 'rgba(192,57,43,.1)',  color: '#c0392b', label: 'Urgente' },
  critical: { bg: 'rgba(192,57,43,.12)', color: '#c0392b', label: 'Critique' },
  high:     { bg: 'rgba(219,200,141,.35)', color: '#163346', label: 'Haute' },
  normal:   { bg: 'rgba(22,51,70,.07)',    color: '#163346', label: 'Normale' },
  low:      { bg: 'rgba(107,117,133,.1)',color: '#6b7585', label: 'Basse' },
};

function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE.normal;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '3px',
      fontSize: '11px', fontWeight: 700, background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function TaskSection({ title, icon: Icon, tasks, emptyText, canUpdate, canValidate, savingTask, updateTask, accent }) {
  return (
    <section style={{
      background: '#fff', borderRadius: '12px', padding: '22px',
      border: '1px solid #dfe6e5', borderLeft: `4px solid ${accent}`,
      boxShadow: '0 3px 12px rgba(22,51,70,.035)',
    }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#163346' }}>
        <Icon size={17} color={accent} />
        {title}
        <span style={{
          marginLeft: 'auto', minWidth: '22px', height: '22px', borderRadius: '3px',
          background: '#f7f8fa', color: '#6b7585', fontSize: '12px', fontWeight: 700,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
        }}>{tasks.length}</span>
      </h2>
      {!tasks.length ? (
        <p style={{ color: '#9aa3ae', fontSize: '13px' }}>{emptyText}</p>
      ) : (
        <div style={{ display: 'grid', gap: '1px' }}>
          {tasks.map(task => (
            <article key={task.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: '14px', padding: '12px 0', borderTop: '1px solid #f7f8fa',
            }}>
              <div style={{ display: 'grid', gap: '4px', flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '13px', color: '#163346', fontWeight: 600 }}>{task.title}</strong>
                <span style={{ fontSize: '12px', color: '#9aa3ae' }}>
                  {task.ref}
                  {task.due_date ? ` · Échéance ${task.due_date}` : ''}
                  {task.responsable_info?.name ? ` · ${task.responsable_info.name}` : ''}
                  {' · '}<span style={{ color: '#6b7585' }}>{STATUS_LABELS[task.status] || task.status}</span>
                </span>
                <PriorityBadge priority={task.priority} />
              </div>
              {canValidate && task.status === 'submitted' ? (
                <button
                  style={{
                    border: 'none', background: '#163346', color: '#fff', borderRadius: '8px',
                    padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                    opacity: savingTask === task.id ? .5 : 1, whiteSpace: 'nowrap',
                  }}
                  disabled={savingTask === task.id}
                  onClick={() => updateTask(task, 'validated')}
                >
                  Valider
                </button>
              ) : canUpdate && task.status !== 'submitted' ? (
                <select
                  aria-label={`Mettre à jour ${task.title}`}
                  style={{
                    maxWidth: '150px', padding: '7px 10px', border: '1px solid #d4d8de',
                    borderRadius: '8px', background: '#f4f6f5', color: '#163346',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                  value={task.status}
                  disabled={savingTask === task.id}
                  onChange={event => updateTask(task, event.target.value)}
                >
                  {task.status === 'late' && <option value="late" disabled>En retard</option>}
                  {['todo', 'in_progress', 'blocked', 'waiting', 'submitted'].map(status => (
                    <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                  ))}
                </select>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, accent }) {
  return (
    <article style={{
      display: 'grid', gap: '10px', padding: '20px',
      background: '#fff', borderRadius: '12px',
      border: '1px solid #dfe6e5', borderLeft: `4px solid ${accent}`,
      boxShadow: '0 3px 12px rgba(22,51,70,.035)',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '4px',
        background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={accent} />
      </div>
      <strong style={{ fontSize: '28px', fontWeight: 800, color: '#163346', lineHeight: 1 }}>{value}</strong>
      <span style={{ fontSize: '12px', color: '#9aa3ae', fontWeight: 600 }}>{label}</span>
    </article>
  );
}

export default function WorkspaceDashboard() {
  const { currentUser, openMessaging, goToLogin } = useAuth();
  const [data, setData] = useState({ tasks: [], meetings: [], decisions: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingTask, setSavingTask] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tasks, meetings, decisions, projects] = await Promise.all([
        tasksApi.list(), meetingsApi.list(), decisionsApi.list(), projectsApi.list(),
      ]);
      setData({
        tasks: unwrap(tasks.data),
        meetings: unwrap(meetings.data),
        decisions: unwrap(decisions.data),
        projects: unwrap(projects.data),
      });
    } catch {
      setError("Impossible de charger les données de votre périmètre. Réessayez ou contactez votre administrateur.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateTask = async (task, status) => {
    setSavingTask(task.id);
    setError('');
    try {
      await tasksApi.update(task.id, { status });
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "La mise à jour de la tâche a échoué.");
    } finally {
      setSavingTask(null);
    }
  };

  const activeTasks      = data.tasks.filter(task => OPEN_TASKS.has(task.status));
  const submittedTasks   = data.tasks.filter(task => task.status === 'submitted');
  const upcomingMeetings = data.meetings.filter(meeting =>
    !['closed', 'cancelled'].includes(meeting.status) && new Date(meeting.scheduled_at) >= new Date()
  );
  const today = localDateKey(new Date());
  const weekEndDate = new Date();
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  const weekEnd     = localDateKey(weekEndDate);
  const unfinished  = data.tasks.filter(task => !['done', 'validated', 'cancelled'].includes(task.status));
  const overdueTasks   = unfinished.filter(task => task.due_date && task.due_date < today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const todayTasks     = unfinished.filter(task => task.due_date === today);
  const weekTasks      = unfinished.filter(task => task.due_date > today && task.due_date <= weekEnd);
  const priorityTasks  = unfinished.filter(task => ['urgent', 'critical', 'high'].includes(task.priority));
  const employeeView   = currentUser?.role === 'employe';
  const canValidate    = ['superAdmin', 'adminSociete', 'manager', 'chefProjet'].includes(currentUser?.role);
  const canUpdateOwn   = ['employe', 'rh'].includes(currentUser?.role);

  return (
    <main className="workspace-home" style={{
      minHeight: '100vh', overflow: 'auto',
      padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 48px)',
      background: '#f4f6f5',
      color: '#163346',
      fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    }}>
      {/* Header */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        gap: '20px', flexWrap: 'wrap', marginBottom: '28px',
        paddingBottom: '24px', borderBottom: '1px solid #eef0f3',
      }}>
        <div>
          <span style={{
            display: 'block', fontSize: '11px', fontWeight: 700,
            color: '#8a793c', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '6px',
          }}>
            {currentUser?.companyName || 'Espace de travail'}
          </span>
          <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800, color: '#163346', letterSpacing: '-.3px' }}>
            Bonjour, {currentUser?.name}
          </h1>
          <p style={{ color: '#9aa3ae', fontSize: '13px', margin: 0 }}>
            Votre activité et vos éléments de travail.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={btnStyle} onClick={load} disabled={loading} aria-label="Actualiser">
            <RefreshCw size={15} /> Actualiser
          </button>
          <button style={btnStyle} onClick={openMessaging}>
            <MessageSquare size={15} /> Discussions
          </button>
          <button
            style={{ ...btnStyle, padding: '9px 12px' }}
            onClick={goToLogin}
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" style={{
          padding: '12px 16px', marginBottom: '20px', borderRadius: '4px',
          background: 'rgba(192,57,43,.07)', border: '1px solid rgba(192,57,43,.2)',
          color: '#b91c1c', fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#9aa3ae', fontSize: '14px' }}>Chargement de votre espace…</p>
      ) : (
        <>
          {/* Métriques */}
          <section style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: '14px', marginBottom: '24px',
          }}>
            <MetricCard icon={ListTodo} label={employeeView ? 'Mes tâches ouvertes' : 'Tâches ouvertes'} value={activeTasks.length} accent="#163346" />
            <MetricCard icon={AlertTriangle} label="En retard" value={overdueTasks.length} accent={overdueTasks.length ? '#c0392b' : '#9aa3ae'} />
            <MetricCard icon={CheckCircle2} label="À valider" value={submittedTasks.length} accent="#b9a96e" />
            <MetricCard icon={CalendarDays} label="Réunions à venir" value={upcomingMeetings.length} accent="#1a7a4a" />
          </section>

          {employeeView ? (
            <>
              {priorityTasks.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <TaskSection
                    title="Priorités à traiter" icon={AlertTriangle} tasks={priorityTasks.slice(0, 8)}
                    emptyText="" canUpdate={canUpdateOwn} canValidate={canValidate}
                    savingTask={savingTask} updateTask={updateTask} accent="#c0392b"
                  />
                </div>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))',
                gap: '16px', marginBottom: '20px',
              }}>
                <TaskSection title="En retard" icon={Clock3} tasks={overdueTasks}
                  emptyText="Aucune tâche en retard." canUpdate={canUpdateOwn} canValidate={canValidate}
                  savingTask={savingTask} updateTask={updateTask} accent="#c0392b" />
                <TaskSection title="À faire aujourd'hui" icon={CalendarDays} tasks={todayTasks}
                  emptyText="Aucune tâche prévue aujourd'hui." canUpdate={canUpdateOwn} canValidate={canValidate}
                  savingTask={savingTask} updateTask={updateTask} accent="#163346" />
                <TaskSection title="Cette semaine" icon={ListTodo} tasks={weekTasks}
                  emptyText="Aucune échéance cette semaine." canUpdate={canUpdateOwn} canValidate={canValidate}
                  savingTask={savingTask} updateTask={updateTask} accent="#b9a96e" />
              </div>

              {/* Réunions */}
              <section style={{
                background: '#fff', borderRadius: '4px', padding: '20px',
                border: '1px solid #eef0f3', borderLeft: '4px solid #1a7a4a',
                boxShadow: '0 1px 3px rgba(0,0,0,.04)',
              }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#163346' }}>
                  <CalendarDays size={17} color="#1a7a4a" />
                  Mes réunions à venir
                  <span style={{
                    marginLeft: 'auto', minWidth: '22px', height: '22px', borderRadius: '3px',
                    background: '#f7f8fa', color: '#6b7585', fontSize: '12px', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
                  }}>{upcomingMeetings.length}</span>
                </h2>
                {!upcomingMeetings.length ? (
                  <p style={{ color: '#9aa3ae', fontSize: '13px' }}>Aucune réunion à venir.</p>
                ) : (
                  <div>
                    {upcomingMeetings.slice(0, 8).map(meeting => (
                      <article key={meeting.id} style={{
                        padding: '12px 0', borderTop: '1px solid #f7f8fa',
                        display: 'flex', flexDirection: 'column', gap: '3px',
                      }}>
                        <strong style={{ fontSize: '13px', color: '#163346', fontWeight: 600 }}>{meeting.title}</strong>
                        <span style={{ fontSize: '12px', color: '#9aa3ae' }}>
                          {new Date(meeting.scheduled_at).toLocaleString()} · {meeting.ref}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          ) : (
            <TaskSection
              title="Tâches accessibles dans votre rôle" icon={ListTodo}
              tasks={activeTasks.slice(0, 12)}
              emptyText="Aucune tâche ouverte dans votre périmètre."
              canUpdate={canUpdateOwn} canValidate={canValidate}
              savingTask={savingTask} updateTask={updateTask} accent="#163346"
            />
          )}
        </>
      )}
    </main>
  );
}

const btnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '7px',
  border: '1px solid #d4d8de', background: '#fff', borderRadius: '4px',
  padding: '9px 14px', color: '#163346', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
};
