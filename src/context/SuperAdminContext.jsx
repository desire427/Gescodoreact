/**
 * SuperAdminContext.jsx
 * Toutes les données superadmin chargées depuis l'API Django.
 * Remplace l'ancienne version mockée.
 */
import {
  createContext, useContext, useState,
  useCallback, useEffect,
} from 'react';
import {
  companiesApi, departmentsApi, usersApi, devicesApi,
  sessionsApi, projectsApi, tasksApi, meetingsApi,
  decisionsApi, auditApi, alertsApi, settingsApi, dashboardApi,
} from '../services/api';
import { WorkspaceContext } from './WorkspaceContext';

const SuperAdminContext = createContext(null);

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Extrait data.results si paginé, sinon data directement. */
const unwrap = (data) => (Array.isArray(data) ? data : data?.results ?? []);

/** Lit toutes les pages DRF : page_size n'est pas activé dans la configuration Django. */
async function listAll(list, params = {}) {
  const rows = [];
  for (let page = 1; ; page += 1) {
    const { data } = await list({ ...params, page });
    rows.push(...unwrap(data));
    if (Array.isArray(data) || !data?.next) return rows;
  }
}

/** Normalise un utilisateur API → format frontend (camelCase). */
function normalizeUser(u) {
  if (!u) return null;
  return {
    id:               u.id,
    name:             u.name             || '',
    email:            u.email            || '',
    phone:            u.phone            || '',
    matricule:        u.matricule        || '',
    about:            u.about            || '',
    avatar:           u.avatar           || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=7c3aed&color=fff`,
    role:             u.role,
    status:           u.status,
    companyId:        u.company          ?? null,
    departmentId:     u.department       ?? null,
    companyName:      u.company_name     || '',
    departmentName:   u.department_name  || '',
    online:           u.is_online        ?? false,
    twoFactorEnabled: u.two_factor_enabled ?? false,
    createdAt:        u.created_at,
    lastLogin:        u.last_login       || null,
    exitedAt:         u.exited_at        || null,
    devices:          (u.devices || []).map(normalizeDevice),
    sessions:         [], // rempli séparément via sessionsApi
    activeSessions:   u.active_sessions  ?? 0,
  };
}

function normalizeDevice(d) {
  return {
    id:         d.id,
    userId:     d.user,
    label:      d.label      || '',
    type:       d.type       || 'desktop',
    os:         d.os         || '',
    lastActive: d.last_active,
    active:     d.is_active  ?? true,
    approved:   d.approved   ?? true,
  };
}

function normalizeSession(s) {
  return {
    id:           s.id,
    userId:       s.user,
    userName:     s.user_name || '',
    userEmail:    s.user_email || '',
    deviceId:     s.device    || null,
    deviceLabel:  s.device_label || '',
    ip:           s.ip_address  || '—',
    location:     '—',
    startedAt:    s.created_at,
    lastActivity: s.device_last_active || s.created_at,
    active:       s.is_active   ?? true,
    revokedAt:    s.revoked_at  || null,
  };
}

function normalizeCompany(c) {
  return {
    id:         c.id,
    name:       c.name        || '',
    code:       c.code        || '',
    logo:       c.logo        || null,
    sector:     c.sector      || '',
    country:    c.country     || '',
    city:       c.city        || '',
    address:    c.address     || '',
    phone:      c.phone       || '',
    email:      c.email       || '',
    status:     c.status,
    createdAt:  c.created_at,
    adminId:    c.admin       || null,
    userCount:  c.user_count  ?? 0,
  };
}

function normalizeProject(p) {
  return {
    id:           p.id,
    ref:          p.ref,
    name:         p.name          || '',
    description:  p.description   || '',
    companyId:    p.company        ?? null,
    departmentId: p.department     ?? null,
    responsableId:p.responsable    ?? null,
    sponsorId:    p.sponsor        ?? null,
    status:       p.status,
    progress:     p.progress       ?? 0,
    startDate:    p.start_date     || null,
    endDate:      p.end_date       || null,
    tags:         p.tags           || [],
    members:      p.members        || [],
    milestones:   (p.milestones || []).map(m => ({
      id:       m.id,
      label:    m.label,
      done:     m.done,
      dueDate:  m.due_date || null,
    })),
    createdAt:    p.created_at,
    taskCount:    p.task_count    ?? 0,
    lateTaskCount:p.late_task_count ?? 0,
  };
}

function normalizeTask(t) {
  return {
    id:             t.id,
    ref:            t.ref,
    title:          t.title        || '',
    description:    t.description  || '',
    projectId:      t.project      ?? null,
    companyId:      t.company      ?? null,
    responsableId:  t.responsable  ?? null,
    validatorId:    t.validator    ?? null,
    priority:       t.priority     || 'normal',
    status:         t.status       || 'todo',
    dueDate:        t.due_date     || null,
    startDate:      t.start_date   || null,
    validatedAt:    t.validated_at || null,
    progress:       t.progress     ?? 0,
    tags:           t.tags         || [],
    history:        t.history      || [],
    isLate:         t.is_late      ?? false,
  };
}

function normalizeMeeting(m) {
  return {
    id:           m.id,
    ref:          m.ref,
    title:        m.title         || '',
    type:         m.type          || 'direction',
    companyId:    m.company        ?? null,
    departmentId: m.department     ?? null,
    projectId:    m.project        ?? null,
    organizerId:  m.organizer      ?? null,
    presidentId:  m.president      ?? null,
    secretaryId:  m.secretary      ?? null,
    status:       m.status         || 'planned',
    pvStatus:     m.pv_status      || null,
    pvRef:        m.pv_ref         || '',
    scheduledAt:  m.scheduled_at,
    duration:     m.duration       ?? 60,
    location:     m.location       || '',
    link:         m.link           || '',
    conductLog:   m.conduct_log    || [],
    agenda:       (m.agenda || []).map(a => ({
      id:        a.id,
      order:     a.order,
      title:     a.title,
      notes:     a.notes || '',
      done:      a.done,
      postponed: a.postponed,
    })),
    participants: (m.participants || []).map(p => ({
      id:       p.id,
      userId:   p.user,
      response: p.response,
      presence: p.presence,
    })),
    createdAt:    m.created_at,
  };
}

function normalizeDecision(d) {
  return {
    id:           d.id,
    ref:          d.ref,
    title:        d.title       || '',
    description:  d.description || '',
    companyId:    d.company      ?? null,
    meetingId:    d.meeting      ?? null,
    projectId:    d.project      ?? null,
    responsableId:d.responsable  ?? null,
    status:       d.status       || 'to_execute',
    dueDate:      d.due_date     || null,
    taskIds:      d.tasks        || [],
    taskCount:    d.task_count   ?? 0,
    createdAt:    d.created_at,
  };
}

function normalizeAuditLog(l) {
  return {
    id:            l.id,
    actorId:       l.actor       ?? null,
    actorName:     l.actor_name  || '',
    action:        l.action,
    label:         l.label,
    severity:      l.severity,
    resource:      l.resource,
    resourceId:    l.resource_id,
    resourceLabel: l.resource_label,
    companyId:     l.company     ?? null,
    companyName:   l.company_name || '',
    ip:            l.ip_address  || '—',
    details:       l.details     || '',
    timestamp:     l.timestamp,
  };
}

function normalizeAlert(a) {
  return {
    id:          a.id,
    title:       a.title,
    message:     a.message,
    severity:    a.severity,
    resolved:    a.resolved,
    companyId:   a.company    ?? null,
    companyName: a.company_name || '',
    createdAt:   a.created_at,
    resolvedAt:  a.resolved_at || null,
  };
}

function normalizeSettings(s) {
  return {
    sessionTimeout:            s.session_timeout,
    maxDevicesPerUser:         s.max_devices_per_user,
    passwordMinLength:         s.password_min_length,
    twoFactorRequired:         s.two_factor_required,
    autoLockSuspectedAccounts: s.auto_lock_suspected_accounts,
    fileMaxSizeMb:             s.file_max_size_mb,
    allowedFileTypes:          s.allowed_file_types || [],
    backupRetentionDays:       s.backup_retention_days,
    maintenanceMode:           s.maintenance_mode,
    platformVersion:           s.platform_version,
    lastBackup:                s.last_backup,
    escaladeSettings:          s.escalade_settings || { enabled: true, responsable: [-3, -1, 0, 1], manager: [3], directeur: [5] },
    rolePermissions:           s.role_permissions || {},
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function SuperAdminProvider({ children }) {
  const [companies,         setCompanies]         = useState([]);
  const [departments,       setDepartments]        = useState([]);
  const [users,             setUsers]              = useState([]);
  const [sessions,          setSessions]           = useState([]);
  const [projects,          setProjects]           = useState([]);
  const [tasks,             setTasks]              = useState([]);
  const [meetings,          setMeetings]           = useState([]);
  const [decisions,         setDecisions]          = useState([]);
  const [auditLogs,         setAuditLogs]          = useState([]);
  const [alerts,            setAlerts]             = useState([]);
  const [platformSettings,  setPlatformSettings]   = useState({
    sessionTimeout: 60, maxDevicesPerUser: 3, passwordMinLength: 8,
    twoFactorRequired: false, autoLockSuspectedAccounts: true,
    fileMaxSizeMb: 20, allowedFileTypes: [], backupRetentionDays: 90,
    maintenanceMode: false, platformVersion: '1.0.0',
    lastBackup: new Date().toISOString(), escaladeSettings: { enabled: true, responsable: [-3, -1, 0, 1], manager: [3], directeur: [5] }, rolePermissions: {},
  });
  const [stats,             setStats]              = useState({
    totalCompanies: 0, activeCompanies: 0, suspendedCompanies: 0,
    totalUsers: 0, activeUsers: 0, suspendedUsers: 0,
    exitedUsers: 0, invitedUsers: 0, onlineUsers: 0, activeSessions: 0,
    totalProjects: 0, activeProjects: 0, totalTasks: 0,
    lateTasks: 0, criticalLateTasks: 0, blockedTasks: 0, doneTasks: 0,
    totalDecisions: 0, pendingDecisions: 0, executedDecisions: 0,
    decisionsWithoutTasks: 0, upcomingMeetings: 0, meetingsWithoutPV: 0,
    unresolvedAlerts: 0, resolvedAlerts: 0,
  });
  const [loading,           setLoading]            = useState(true);
  const [error,             setError]              = useState(null);

  // ── Chargement initial ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          companiesData, departmentsData, usersData, sessionsData,
          projectsData, tasksData, meetingsData, decisionsData,
          auditData, alertsData, settingsRes,
        ] = await Promise.all([
          listAll(companiesApi.list),
          listAll(departmentsApi.list),
          listAll(usersApi.list),
          listAll(sessionsApi.list),
          listAll(projectsApi.list),
          listAll(tasksApi.list),
          listAll(meetingsApi.list),
          listAll(decisionsApi.list),
          listAll(auditApi.list),
          listAll(alertsApi.list),
          settingsApi.get(),
        ]);

        setCompanies(companiesData.map(normalizeCompany));
        setDepartments(departmentsData);
        setUsers(usersData.map(normalizeUser));
        setSessions(sessionsData.map(normalizeSession));
        setProjects(projectsData.map(normalizeProject));
        setTasks(tasksData.map(normalizeTask));
        setMeetings(meetingsData.map(normalizeMeeting));
        setDecisions(decisionsData.map(normalizeDecision));
        setAuditLogs(auditData.map(normalizeAuditLog));
        setAlerts(alertsData.map(normalizeAlert));
        setPlatformSettings(normalizeSettings(settingsRes.data));

        dashboardApi.stats()
          .then(({ data }) => setStats(data))
          .catch((err) => console.warn('Dashboard stats unavailable:', err));
      } catch (err) {
        console.error('SuperAdmin load error:', err);
        setError('Impossible de charger les données. Vérifiez la connexion.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Refresh stats ────────────────────────────────────────────────────────
  const refreshStats = useCallback(async () => {
    try {
      const { data } = await dashboardApi.stats();
      setStats(data);
    } catch { /* silencieux */ }
  }, []);

  // ── SOCIÉTÉS ─────────────────────────────────────────────────────────────

  const createCompany = useCallback(async (formData) => {
    const { data } = await companiesApi.create(formData);
    const company  = normalizeCompany(data);
    setCompanies(prev => [...prev, company]);
    await refreshStats();
    return company;
  }, [refreshStats]);

  const updateCompany = useCallback(async (id, formData) => {
    const { data } = await companiesApi.update(id, formData);
    const company  = normalizeCompany(data);
    setCompanies(prev => prev.map(c => c.id === id ? company : c));
    return company;
  }, []);

  const toggleCompanyStatus = useCallback(async (id, newStatus, reason = '') => {
    const { data } = await companiesApi.changeStatus(id, newStatus, reason);
    const company  = normalizeCompany(data);
    setCompanies(prev => prev.map(c => c.id === id ? company : c));
    await refreshStats();
    return company;
  }, [refreshStats]);

  // ── UTILISATEURS ─────────────────────────────────────────────────────────

  const createUser = useCallback(async (formData) => {
    const { data } = await usersApi.create(formData);
    const user     = normalizeUser(data);
    setUsers(prev => [...prev, user]);
    await refreshStats();
    return user;
  }, [refreshStats]);

  const updateUser = useCallback(async (id, formData) => {
    const { data } = await usersApi.update(id, formData);
    const user     = normalizeUser(data);
    setUsers(prev => prev.map(u => u.id === id ? user : u));
    return user;
  }, []);

  const deleteUser = useCallback(async (userId) => {
    await usersApi.delete(userId);
    setUsers(prev => prev.filter(user => user.id !== userId));
    setSessions(prev => prev.filter(session => session.userId !== userId));
    await refreshStats();
  }, [refreshStats]);

  const changeUserStatus = useCallback(async (userId, newStatus, reason = '') => {
    const { data } = await usersApi.changeStatus(userId, newStatus, reason);
    const user     = normalizeUser(data);
    setUsers(prev => prev.map(u => u.id === userId ? user : u));
    // Révoquer sessions côté local si suspendu/sorti
    if (['suspended', 'exited'].includes(newStatus)) {
      setSessions(prev => prev.map(s =>
        s.userId === userId ? { ...s, active: false } : s
      ));
    }
    await refreshStats();
    // Recharger audit
    try {
      setAuditLogs((await listAll(auditApi.list)).map(normalizeAuditLog));
    } catch { /* silencieux */ }
    return user;
  }, [refreshStats]);

  const changeUserRole = useCallback(async (userId, newRole) => {
    const { data } = await usersApi.changeRole(userId, newRole);
    const user     = normalizeUser(data);
    setUsers(prev => prev.map(u => u.id === userId ? user : u));
    return user;
  }, []);

  // ── APPAREILS ────────────────────────────────────────────────────────────

  const toggleDeviceApproval = useCallback(async (userId, deviceId, approved) => {
    const { data } = await devicesApi.toggleApproval(deviceId, approved);
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        devices: u.devices.map(d =>
          d.id === deviceId ? normalizeDevice(data) : d
        ),
      };
    }));
  }, []);

  // ── DÉPART / TRANSFERT ───────────────────────────────────────────────────

  const getOpenTasksForUser = useCallback((userId) => {
    return tasks.filter(
      t => t.responsableId === userId &&
           !['done', 'cancelled', 'validated'].includes(t.status)
    );
  }, [tasks]);

  const transferAllTasksFromUser = useCallback(async (fromUserId, toUserId) => {
    const { data } = await usersApi.transferTasks(fromUserId, toUserId);
    // Recharger les tâches
    try {
      setTasks((await listAll(tasksApi.list)).map(normalizeTask));
    } catch { /* silencieux */ }
    return data.count || 0;
  }, []);

  // ── SESSIONS ─────────────────────────────────────────────────────────────

  const revokeSession = useCallback(async (sessionId) => {
    await sessionsApi.revoke(sessionId);
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, active: false } : s
    ));
    await refreshStats();
  }, [refreshStats]);

  const revokeAllUserSessions = useCallback(async (userId) => {
    await usersApi.revokeSessions(userId);
    setSessions(prev => prev.map(s =>
      s.userId === userId ? { ...s, active: false } : s
    ));
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, online: false, activeSessions: 0 } : u
    ));
    await refreshStats();
  }, [refreshStats]);

  // ── PROJETS ──────────────────────────────────────────────────────────────

  const createProject = useCallback(async (formData) => {
    const payload = {
      name:           formData.name,
      description:    formData.description || '',
      company:        formData.companyId,
      department:     formData.departmentId || null,
      responsable:    formData.responsableId || null,
      sponsor:        formData.sponsorId || null,
      status:         formData.status || 'draft',
      start_date:     formData.startDate || null,
      end_date:       formData.endDate || null,
      tags:           formData.tags || [],
      members:        formData.members || [],
      milestones_data:(formData.milestones || []).map(m => ({ label: m.label })),
    };
    const { data } = await projectsApi.create(payload);
    const project  = normalizeProject(data);
    setProjects(prev => [...prev, project]);
    await refreshStats();
    return project;
  }, [refreshStats]);

  const updateProject = useCallback(async (id, updates) => {
    const { data } = await projectsApi.update(id, updates);
    const project  = normalizeProject(data);
    setProjects(prev => prev.map(p => p.id === id ? project : p));
    return project;
  }, []);

  const toggleMilestone = useCallback(async (projectId, milestoneId, done) => {
    const { data } = await projectsApi.toggleMilestone(projectId, milestoneId, done);
    // data = jalon mis à jour ; recalcul de la progression fait côté serveur
    // On recharge juste le projet
    try {
      const { data: p } = await projectsApi.get(projectId);
      setProjects(prev => prev.map(proj =>
        proj.id === projectId ? normalizeProject(p) : proj
      ));
    } catch { /* silencieux */ }
    return data;
  }, []);

  // ── RÉUNIONS ─────────────────────────────────────────────────────────────

  const createMeeting = useCallback(async (formData) => {
    const payload = {
      title:           formData.title,
      type:            formData.type,
      company:         formData.companyId,
      department:      formData.departmentId || null,
      project:         formData.projectId || null,
      organizer:       formData.organizerId || null,
      president:       formData.presidentId || null,
      secretary:       formData.secretaryId || null,
      scheduled_at:    formData.scheduledAt,
      duration:        formData.duration || 60,
      location:        formData.location || '',
      agenda_items:    (formData.agenda || []).map(a => ({ title: a.title })),
      participant_ids: (formData.participants || []).map(p =>
        typeof p === 'object' ? p.userId : p
      ),
    };
    const { data } = await meetingsApi.create(payload);
    const meeting  = normalizeMeeting(data);
    setMeetings(prev => [meeting, ...prev]);
    await refreshStats();
    return meeting;
  }, [refreshStats]);

  const updateMeeting = useCallback(async (id, updates) => {
    const payload = {};
    for (const [frontendKey, apiKey] of Object.entries({
      title: 'title', type: 'type', companyId: 'company', departmentId: 'department',
      projectId: 'project', organizerId: 'organizer', presidentId: 'president',
      secretaryId: 'secretary', scheduledAt: 'scheduled_at', duration: 'duration',
      location: 'location', link: 'link',
    })) {
      if (updates[frontendKey] !== undefined) payload[apiKey] = updates[frontendKey] || null;
    }
    if (updates.status      !== undefined) payload.status      = updates.status;
    if (updates.pvStatus    !== undefined) payload.pv_status   = updates.pvStatus;
    if (updates.pvRef       !== undefined) payload.pv_ref      = updates.pvRef;
    const current = meetings.find(meeting => String(meeting.id) === String(id));
    const operations = [];
    if (updates.conductLog  !== undefined) {
      operations.push(meetingsApi.updateConductLog(id, updates.conductLog));
    }
    if (updates.agenda !== undefined) {
      for (const point of updates.agenda) {
        const oldPoint = current?.agenda.find(item => String(item.id) === String(point.id));
        if (oldPoint && ['title', 'notes', 'done', 'postponed'].every(
          field => oldPoint[field] === point[field]
        )) continue;
        const pointId = Number(point.id);
        if (Number.isInteger(pointId) && pointId > 0) {
          operations.push(meetingsApi.updateAgendaPoint(id, pointId, {
            title: point.title, notes: point.notes || '',
            done: !!point.done, postponed: !!point.postponed,
          }));
        } else {
          operations.push(meetingsApi.createAgendaPoint(id, {
            title: point.title, notes: point.notes || '',
          }));
        }
      }
    }
    if (updates.participants !== undefined) {
      for (const participant of updates.participants) {
        const oldParticipant = current?.participants.find(item => item.id === participant.id);
        if (participant.presence !== oldParticipant?.presence && participant.id) {
          operations.push(meetingsApi.setPresence(id, participant.id, participant.presence));
        }
      }
    }
    if (Object.keys(payload).length) operations.push(meetingsApi.update(id, payload));
    await Promise.all(operations);
    const { data } = await meetingsApi.get(id);
    const meeting = normalizeMeeting(data);
    setMeetings(previous => previous.map(item => item.id === meeting.id ? meeting : item));
    return meeting;
  }, [meetings]);

  // ── ALERTES ──────────────────────────────────────────────────────────────

  const resolveAlert = useCallback(async (alertId) => {
    const { data } = await alertsApi.resolve(alertId);
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? normalizeAlert(data) : a
    ));
    await refreshStats();
  }, [refreshStats]);

  // ── PARAMÈTRES ───────────────────────────────────────────────────────────

  const updatePlatformSettings = useCallback(async (updates) => {
    // Convertir camelCase → snake_case pour l'API
    const payload = {};
    const map = {
      sessionTimeout:            'session_timeout',
      maxDevicesPerUser:         'max_devices_per_user',
      passwordMinLength:         'password_min_length',
      twoFactorRequired:         'two_factor_required',
      autoLockSuspectedAccounts: 'auto_lock_suspected_accounts',
      fileMaxSizeMb:             'file_max_size_mb',
      allowedFileTypes:          'allowed_file_types',
      backupRetentionDays:       'backup_retention_days',
      maintenanceMode:           'maintenance_mode',
      platformVersion:           'platform_version',
      escaladeSettings:          'escalade_settings',
      rolePermissions:           'role_permissions',
    };
    Object.entries(updates).forEach(([k, v]) => {
      if (map[k]) payload[map[k]] = v;
    });
    const { data } = await settingsApi.update(payload);
    setPlatformSettings(normalizeSettings(data));
    return data;
  }, []);

  // ── Audit local (pour les actions qui ne passent pas par le serveur) ─────
  const addAuditLog = useCallback(async () => {
    // On recharge juste les derniers logs depuis l'API
    try {
      setAuditLogs((await listAll(auditApi.list)).map(normalizeAuditLog));
    } catch { /* silencieux */ }
  }, []);

  const createDecision = useCallback(async (data) => {
    const { data: created } = await decisionsApi.create({
      title: data.title,
      description: data.description || '',
      company: data.companyId,
      meeting: data.meetingId || null,
      responsable: data.responsableId || null,
      due_date: data.dueDate || null,
    });
    const decision = normalizeDecision(created);
    setDecisions(previous => [...previous, decision]);
    await addAuditLog();
    return decision;
  }, [addAuditLog]);

  const updateDecision = useCallback(async (id, updates) => {
    const { data } = await decisionsApi.update(id, updates);
    const decision = normalizeDecision(data);
    setDecisions(previous => previous.map(item => item.id === id ? decision : item));
    return decision;
  }, []);

  // ── Loader / Erreur ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        background: '#0f172a', color: '#94a3b8',
        fontFamily: 'system-ui, sans-serif', gap: 16,
      }}>
        <span style={{
          width: 32, height: 32, border: '3px solid #1e293b',
          borderTopColor: '#7c3aed', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', display: 'inline-block',
        }} />
        <span style={{ fontSize: 14 }}>Chargement de l'administration…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        background: '#0f172a', color: '#ef4444',
        fontFamily: 'system-ui, sans-serif', gap: 12,
      }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Erreur de chargement</span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>{error}</span>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: '8px 20px', background: '#7c3aed',
            color: '#fff', border: 'none', borderRadius: 8,
            cursor: 'pointer', fontSize: 13,
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  const contextValue = {
    // Données
    companies, departments, users, sessions,
    projects, tasks, meetings, decisions,
    auditLogs, alerts, platformSettings, stats,
    // Sociétés
    createCompany, updateCompany, toggleCompanyStatus,
    // Utilisateurs
    createUser, updateUser, deleteUser, changeUserStatus, changeUserRole,
    // Appareils
    toggleDeviceApproval,
    // Départ
    getOpenTasksForUser, transferAllTasksFromUser,
    // Sessions
    revokeSession, revokeAllUserSessions,
    // Projets
    createProject, updateProject, toggleMilestone,
    // Réunions
    createMeeting, updateMeeting,
    createDecision, updateDecision,
    // Alertes
    resolveAlert,
    // Paramètres
    updatePlatformSettings,
    // Audit
    addAuditLog,
    // Utils
    refreshStats,
  };

  return (
    <SuperAdminContext.Provider value={contextValue}>
      <WorkspaceContext.Provider value={{
        // Référentiels organisationnels — nécessaires à Projects, Meetings, AuditLog
        companies,
        departments,
        // Données métier
        projects, tasks, decisions, meetings, users,
        auditLogs, stats,
        // Actions projets
        createProject, updateProject, toggleMilestone,
        // Actions réunions
        createMeeting, updateMeeting,
        createDecision, updateDecision,
        // Audit
        addAuditLog,
        // Actions tâches (inline pour ProjectKanban)
        createTask: async (data) => {
          const {
            companyId, projectId, responsableId, validatorId,
            startDate, dueDate, ...fields
          } = data;
          const { data: t } = await tasksApi.create({
            ...fields,
            company: companyId,
            project: projectId || null,
            ...(responsableId ? { responsable: responsableId } : {}),
            ...(validatorId ? { validator: validatorId } : {}),
            ...(startDate ? { start_date: startDate } : {}),
            ...(dueDate ? { due_date: dueDate } : {}),
          });
          const task = normalizeTask(t);
          setTasks(prev => [...prev, task]);
          return task;
        },
        updateTask: async (id, updates) => {
          const { data: t } = await tasksApi.update(id, updates);
          const task = normalizeTask(t);
          setTasks(prev => prev.map(tk => tk.id === id ? task : tk));
          return task;
        },
      }}>
        {children}
      </WorkspaceContext.Provider>
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error('useSuperAdmin must be used inside SuperAdminProvider');
  return ctx;
}
