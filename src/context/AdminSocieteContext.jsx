/**
 * AdminSocieteContext.jsx
 * Données de l'Administrateur Société, chargées depuis l'API Django.
 * Périmètre filtré sur la société de l'utilisateur connecté.
 */
import {
  createContext, useContext, useState,
  useCallback, useEffect, useMemo,
} from 'react';
import { WorkspaceContext } from './WorkspaceContext';
import {
  usersApi, sessionsApi, projectsApi, tasksApi,
  decisionsApi, meetingsApi, auditApi, departmentsApi,
  companiesApi,
} from '../services/api';

const AdminSocieteContext = createContext(null);

// ─── Helpers ────────────────────────────────────────────────────────────────

const unwrap = (data) => (Array.isArray(data) ? data : data?.results ?? []);

function normalizeUser(u) {
  return {
    id:               u.id,
    name:             u.name             || '',
    email:            u.email            || '',
    phone:            u.phone            || '',
    matricule:        u.matricule        || '',
    about:            u.about            || '',
    avatar:           u.avatar           || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=2563eb&color=fff`,
    role:             u.role,
    status:           u.status,
    companyId:        u.company          ?? null,
    departmentId:     u.department       ?? null,
    online:           u.is_online        ?? false,
    twoFactorEnabled: u.two_factor_enabled ?? false,
    createdAt:        u.created_at,
    lastLogin:        u.last_login       || null,
    exitedAt:         u.exited_at        || null,
    devices:          (u.devices || []).map(d => ({
      id:         d.id,
      label:      d.label      || '',
      type:       d.type       || 'desktop',
      os:         d.os         || '',
      lastActive: d.last_active,
      active:     d.is_active  ?? true,
      approved:   d.approved   ?? true,
    })),
    activeSessions: u.active_sessions ?? 0,
  };
}

function normalizeProject(p) {
  return {
    id:           p.id, ref: p.ref,
    name:         p.name        || '',
    description:  p.description || '',
    companyId:    p.company     ?? null,
    departmentId: p.department  ?? null,
    responsableId:p.responsable ?? null,
    sponsorId:    p.sponsor     ?? null,
    status:       p.status,
    progress:     p.progress    ?? 0,
    startDate:    p.start_date  || null,
    endDate:      p.end_date    || null,
    tags:         p.tags        || [],
    members:      p.members     || [],
    milestones:   (p.milestones || []).map(m => ({
      id: m.id, label: m.label, done: m.done, dueDate: m.due_date || null,
    })),
    createdAt: p.created_at,
  };
}

function normalizeTask(t) {
  return {
    id: t.id, ref: t.ref,
    title:         t.title        || '',
    description:   t.description  || '',
    projectId:     t.project      ?? null,
    companyId:     t.company      ?? null,
    responsableId: t.responsable  ?? null,
    validatorId:   t.validator    ?? null,
    priority:      t.priority     || 'normal',
    status:        t.status       || 'todo',
    dueDate:       t.due_date     || null,
    startDate:     t.start_date   || null,
    validatedAt:   t.validated_at || null,
    progress:      t.progress     ?? 0,
    tags:          t.tags         || [],
    history:       t.history      || [],
  };
}

function normalizeDecision(d) {
  return {
    id: d.id, ref: d.ref,
    title:         d.title       || '',
    description:   d.description || '',
    companyId:     d.company     ?? null,
    meetingId:     d.meeting     ?? null,
    responsableId: d.responsable ?? null,
    status:        d.status      || 'to_execute',
    dueDate:       d.due_date    || null,
    taskIds:       d.tasks       || [],
    createdAt:     d.created_at,
  };
}

function normalizeMeeting(m) {
  return {
    id: m.id, ref: m.ref,
    title:        m.title        || '',
    type:         m.type         || 'direction',
    companyId:    m.company      ?? null,
    departmentId: m.department   ?? null,
    organizerId:  m.organizer    ?? null,
    presidentId:  m.president    ?? null,
    secretaryId:  m.secretary    ?? null,
    status:       m.status       || 'planned',
    pvStatus:     m.pv_status    || null,
    pvRef:        m.pv_ref       || '',
    scheduledAt:  m.scheduled_at,
    duration:     m.duration     ?? 60,
    location:     m.location     || '',
    link:         m.link         || '',
    conductLog:   m.conduct_log  || [],
    agenda:       (m.agenda || []).map(a => ({
      id: a.id, order: a.order, title: a.title,
      notes: a.notes || '', done: a.done, postponed: a.postponed,
    })),
    participants: (m.participants || []).map(p => ({
      id: p.id, userId: p.user, response: p.response, presence: p.presence,
    })),
    createdAt: m.created_at,
  };
}

function normalizeAuditLog(l) {
  return {
    id: l.id,
    actorName:     l.actor_name     || '',
    action:        l.action,
    label:         l.label,
    severity:      l.severity,
    resource:      l.resource,
    resourceId:    l.resource_id,
    resourceLabel: l.resource_label || '',
    companyId:     l.company        ?? null,
    companyName:   l.company_name   || '',
    ip:            l.ip_address     || '—',
    details:       l.details        || '',
    timestamp:     l.timestamp,
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AdminSocieteProvider({ children, companyId, currentUserId }) {
  const [company,    setCompany]    = useState(null);
  const [departments,setDepartments]= useState([]);
  const [users,      setUsers]      = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [auditLogs,  setAuditLogs]  = useState([]);
  const [projects,   setProjects]   = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [decisions,  setDecisions]  = useState([]);
  const [meetings,   setMeetings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // ── Chargement initial filtré sur la société ─────────────────────────────
  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          companyRes, depsRes, usersRes, sessionsRes,
          projectsRes, tasksRes, decisionsRes, meetingsRes, auditRes,
        ] = await Promise.all([
          companiesApi.get(companyId),
          departmentsApi.list({ company: companyId, page_size: 200 }),
          usersApi.list({ company: companyId, page_size: 200 }),
          sessionsApi.list({ page_size: 200 }),
          projectsApi.list({ company: companyId, page_size: 200 }),
          tasksApi.list({ company: companyId, page_size: 200 }),
          decisionsApi.list({ company: companyId, page_size: 200 }),
          meetingsApi.list({ company: companyId, page_size: 200 }),
          auditApi.list({ company: companyId, page_size: 100 }),
        ]);
        setCompany(companyRes.data);
        setDepartments(unwrap(depsRes.data));
        const usersNorm = unwrap(usersRes.data).map(normalizeUser);
        setUsers(usersNorm);
        // Sessions : filtrer côté client sur les userId de la société
        const userIds = new Set(usersNorm.map(u => u.id));
        setSessions(unwrap(sessionsRes.data).filter(s => userIds.has(s.user ?? s.userId)));
        setProjects(unwrap(projectsRes.data).map(normalizeProject));
        setTasks(unwrap(tasksRes.data).map(normalizeTask));
        setDecisions(unwrap(decisionsRes.data).map(normalizeDecision));
        setMeetings(unwrap(meetingsRes.data).map(normalizeMeeting));
        setAuditLogs(unwrap(auditRes.data).map(normalizeAuditLog));
      } catch (err) {
        console.error('AdminSociete load error:', err);
        setError('Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const currentUserName = useCallback(() =>
    users.find(u => u.id === currentUserId)?.name || 'Admin Société'
  , [users, currentUserId]);

  // ── Audit — recharge depuis API ──────────────────────────────────────────
  const addAuditLog = useCallback(async () => {
    try {
      const { data } = await auditApi.list({ company: companyId, page_size: 100 });
      setAuditLogs(unwrap(data).map(normalizeAuditLog));
    } catch { /* silencieux */ }
  }, [companyId]);

  // ── Utilisateurs ─────────────────────────────────────────────────────────

  const createUser = useCallback(async (data) => {
    const payload = { ...data, company: companyId, department: data.departmentId || null };
    delete payload.departmentId;
    const { data: u } = await usersApi.create(payload);
    const user = normalizeUser(u);
    setUsers(prev => [...prev, user]);
    await addAuditLog();
    return user;
  }, [companyId, addAuditLog]);

  const updateUser = useCallback(async (id, updates) => {
    const { data: u } = await usersApi.update(id, updates);
    const user = normalizeUser(u);
    setUsers(prev => prev.map(x => x.id === id ? user : x));
    return user;
  }, []);

  const changeUserStatus = useCallback(async (userId, newStatus, reason = '') => {
    const { data: u } = await usersApi.changeStatus(userId, newStatus, reason);
    const user = normalizeUser(u);
    setUsers(prev => prev.map(x => x.id === userId ? user : x));
    if (['suspended', 'exited'].includes(newStatus)) {
      setSessions(prev => prev.map(s =>
        (s.userId ?? s.user) === userId ? { ...s, is_active: false } : s
      ));
    }
    await addAuditLog();
    return user;
  }, [addAuditLog]);

  const changeUserRole = useCallback(async (userId, newRole) => {
    const { data: u } = await usersApi.changeRole(userId, newRole);
    const user = normalizeUser(u);
    setUsers(prev => prev.map(x => x.id === userId ? user : x));
    return user;
  }, []);

  const toggleDeviceApproval = useCallback(async (userId, deviceId, approved) => {
    const { data } = await import('../services/api').then(m =>
      m.devicesApi.toggleApproval(deviceId, approved)
    );
    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, devices: u.devices.map(d => d.id === deviceId ? { ...d, approved } : d) }
        : u
    ));
  }, []);

  const getOpenTasksForUser = useCallback((userId) =>
    tasks.filter(t =>
      t.responsableId === userId &&
      !['done', 'cancelled', 'validated'].includes(t.status)
    )
  , [tasks]);

  const transferAllTasksFromUser = useCallback(async (fromUserId, toUserId) => {
    const { data } = await usersApi.transferTasks(fromUserId, toUserId);
    try {
      const { data: t } = await tasksApi.list({ company: companyId, page_size: 200 });
      setTasks(unwrap(t).map(normalizeTask));
    } catch { /* silencieux */ }
    return data.count || 0;
  }, [companyId]);

  const revokeSession = useCallback(async (sessionId) => {
    await sessionsApi.revoke(sessionId);
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, is_active: false } : s
    ));
  }, []);

  const revokeAllUserSessions = useCallback(async (userId) => {
    await usersApi.revokeSessions(userId);
    setSessions(prev => prev.map(s =>
      (s.userId ?? s.user) === userId ? { ...s, is_active: false } : s
    ));
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, online: false } : u
    ));
  }, []);

  // ── Projets ───────────────────────────────────────────────────────────────

  const createProject = useCallback(async (data) => {
    const payload = {
      name: data.name, description: data.description || '',
      company: companyId, department: data.departmentId || null,
      responsable: data.responsableId || null, sponsor: data.sponsorId || null,
      status: data.status || 'draft',
      start_date: data.startDate || null, end_date: data.endDate || null,
      tags: data.tags || [], members: data.members || [],
      milestones_data: (data.milestones || []).map(m => ({ label: m.label })),
    };
    const { data: p } = await projectsApi.create(payload);
    const project = normalizeProject(p);
    setProjects(prev => [...prev, project]);
    return project;
  }, [companyId]);

  const updateProject = useCallback(async (id, updates) => {
    const { data: p } = await projectsApi.update(id, updates);
    const project = normalizeProject(p);
    setProjects(prev => prev.map(x => x.id === id ? project : x));
    return project;
  }, []);

  const toggleMilestone = useCallback(async (projectId, milestoneId, done) => {
    await projectsApi.toggleMilestone(projectId, milestoneId, done);
    try {
      const { data: p } = await projectsApi.get(projectId);
      setProjects(prev => prev.map(x => x.id === projectId ? normalizeProject(p) : x));
    } catch { /* silencieux */ }
  }, []);

  // ── Tâches ────────────────────────────────────────────────────────────────

  const createTask = useCallback(async (data) => {
    const {
      companyId: taskCompanyId, projectId, responsableId, validatorId,
      startDate, dueDate, ...fields
    } = data;
    const { data: t } = await tasksApi.create({
      ...fields,
      company: companyId || taskCompanyId,
      project: projectId || null,
      ...(responsableId ? { responsable: responsableId } : {}),
      ...(validatorId ? { validator: validatorId } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(dueDate ? { due_date: dueDate } : {}),
    });
    const task = normalizeTask(t);
    setTasks(prev => [...prev, task]);
    await addAuditLog();
    return task;
  }, [companyId, addAuditLog]);

  const updateTask = useCallback(async (id, updates) => {
    const { data: t } = await tasksApi.update(id, updates);
    const task = normalizeTask(t);
    setTasks(prev => prev.map(x => x.id === id ? task : x));
    return task;
  }, []);

  const submitTask = useCallback(async (taskId, proofLabel) => {
    const updates = { status: 'submitted' };
    if (proofLabel) updates.proof = { type: 'file', label: proofLabel };
    return updateTask(taskId, updates);
  }, [updateTask]);

  const validateTask = useCallback(async (taskId, comment = '') => {
    return updateTask(taskId, {
      status: 'validated',
      validated_at: new Date().toISOString(),
    });
  }, [updateTask]);

  const rejectTask = useCallback(async (taskId, reason) => {
    return updateTask(taskId, { status: 'in_progress' });
  }, [updateTask]);

  // ── Décisions ─────────────────────────────────────────────────────────────

  const createDecision = useCallback(async (data) => {
    const { data: d } = await decisionsApi.create({
      title: data.title, description: data.description || '',
      company: companyId, meeting: data.meetingId || null,
      responsable: data.responsableId || null,
      due_date: data.dueDate || null,
    });
    const decision = normalizeDecision(d);
    setDecisions(prev => [...prev, decision]);
    await addAuditLog();
    return decision;
  }, [companyId, addAuditLog]);

  const updateDecision = useCallback(async (id, updates) => {
    const { data: d } = await decisionsApi.update(id, updates);
    const decision = normalizeDecision(d);
    setDecisions(prev => prev.map(x => x.id === id ? decision : x));
    return decision;
  }, []);

  const changeDecisionStatus = useCallback(async (id, newStatus, justification = '') => {
    const { data: d } = await decisionsApi.changeStatus(id, newStatus);
    const decision = normalizeDecision(d);
    setDecisions(prev => prev.map(x => x.id === id ? decision : x));
    await addAuditLog();
    return decision;
  }, [addAuditLog]);

  // ── Réunions ──────────────────────────────────────────────────────────────

  const createMeeting = useCallback(async (formData) => {
    const { data } = await meetingsApi.create({
      title: formData.title,
      type: formData.type,
      company: companyId,
      department: formData.departmentId || null,
      project: formData.projectId || null,
      organizer: currentUserId,
      president: formData.presidentId || null,
      secretary: formData.secretaryId || null,
      scheduled_at: formData.scheduledAt,
      duration: formData.duration || 60,
      location: formData.location || '',
      agenda_items: (formData.agenda || []).map(item => ({ title: item.title })),
      participant_ids: (formData.participants || []).map(participant =>
        typeof participant === 'object' ? participant.userId : participant
      ),
    });
    const meeting = normalizeMeeting(data);
    setMeetings(previous => [meeting, ...previous]);
    await addAuditLog();
    return meeting;
  }, [companyId, currentUserId, addAuditLog]);

  const updateMeeting = useCallback(async (id, updates) => {
    const payload = {};
    if (updates.status     !== undefined) payload.status     = updates.status;
    if (updates.pvStatus   !== undefined) payload.pv_status  = updates.pvStatus;
    if (updates.pvRef      !== undefined) payload.pv_ref     = updates.pvRef;
    const current = meetings.find(meeting => String(meeting.id) === String(id));
    const operations = [];
    if (updates.conductLog !== undefined) {
      operations.push(meetingsApi.updateConductLog(id, updates.conductLog));
    }
    if (updates.agenda !== undefined) {
      for (const point of updates.agenda) {
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

  // ── Stats agrégées ────────────────────────────────────────────────────────

  const now = new Date();
  const stats = useMemo(() => {
    const lateTasks = tasks.filter(t =>
      !['done', 'cancelled', 'validated'].includes(t.status) &&
      t.dueDate && new Date(t.dueDate) < now
    );
    const closedTasks   = tasks.filter(t => ['done', 'validated', 'cancelled'].includes(t.status));
    const onTimeTasks   = closedTasks.filter(t =>
      t.validatedAt && t.dueDate && new Date(t.validatedAt) <= new Date(t.dueDate)
    );
    const avgLateAge = lateTasks.length > 0
      ? Math.round(lateTasks.reduce((sum, t) =>
          sum + Math.floor((now - new Date(t.dueDate)) / 86400000), 0
        ) / lateTasks.length)
      : 0;

    return {
      totalUsers:        users.length,
      activeUsers:       users.filter(u => u.status === 'active').length,
      suspendedUsers:    users.filter(u => u.status === 'suspended').length,
      invitedUsers:      users.filter(u => u.status === 'invited').length,
      onlineUsers:       users.filter(u => u.online).length,
      activeSessions:    sessions.filter(s => s.is_active ?? s.active ?? false).length,
      totalProjects:     projects.length,
      activeProjects:    projects.filter(p => p.status === 'in_progress').length,
      totalTasks:        tasks.length,
      lateTasks:         lateTasks.length,
      criticalLateTasks: lateTasks.filter(t => ['urgent','critical'].includes(t.priority)).length,
      blockedTasks:      tasks.filter(t => t.status === 'blocked').length,
      submittedTasks:    tasks.filter(t => t.status === 'submitted').length,
      onTimeRate:        closedTasks.length > 0
        ? Math.round((onTimeTasks.length / closedTasks.length) * 100) : 0,
      avgLateAge,
      totalDecisions:    decisions.length,
      pendingDecisions:  decisions.filter(d => ['to_execute','in_execution'].includes(d.status)).length,
      executedDecisions: decisions.filter(d => d.status === 'executed').length,
      decisionsWithoutTasks: decisions.filter(d => d.status !== 'executed' && (!d.taskIds || d.taskIds.length === 0)).length,
      execRate: decisions.length > 0
        ? Math.round((decisions.filter(d => d.status === 'executed').length / decisions.length) * 100) : 0,
      meetingsWithoutPV: meetings.filter(m => m.status === 'closed' && (!m.pvStatus || m.pvStatus === 'draft')).length,
      upcomingMeetings:  meetings.filter(m => m.status === 'planned' && new Date(m.scheduledAt) > now).length,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, sessions, projects, tasks, decisions, meetings]);

  // ── Écran de chargement ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', height:'100vh', background:'#0f172a',
        color:'#94a3b8', fontFamily:'system-ui, sans-serif', gap:16,
      }}>
        <span style={{
          width:32, height:32, border:'3px solid #1e293b',
          borderTopColor:'#2563eb', borderRadius:'50%',
          animation:'spin 0.8s linear infinite', display:'inline-block',
        }}/>
        <span style={{ fontSize:14 }}>Chargement…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', height:'100vh', background:'#0f172a',
        color:'#ef4444', fontFamily:'system-ui, sans-serif', gap:12,
      }}>
        <span style={{ fontSize:16, fontWeight:600 }}>Erreur de chargement</span>
        <span style={{ fontSize:13, color:'#94a3b8' }}>{error}</span>
        <button onClick={() => window.location.reload()} style={{
          marginTop:8, padding:'8px 20px', background:'#2563eb',
          color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13,
        }}>Réessayer</button>
      </div>
    );
  }

  return (
    <AdminSocieteContext.Provider value={{
      company, departments, users, sessions, auditLogs,
      projects, tasks, decisions, meetings, stats,
      // Utilisateurs
      createUser, updateUser, changeUserStatus, changeUserRole,
      toggleDeviceApproval, getOpenTasksForUser, transferAllTasksFromUser,
      revokeSession, revokeAllUserSessions,
      // Projets
      createProject, updateProject, toggleMilestone,
      // Tâches
      createTask, updateTask, submitTask, validateTask, rejectTask,
      // Décisions
      createDecision, updateDecision, changeDecisionStatus,
      // Réunions
      createMeeting, updateMeeting,
      // Audit
      addAuditLog,
    }}>
      <WorkspaceContext.Provider value={{
        companies:   company ? [company] : [],
        departments,
        projects, tasks, decisions, meetings, users,
        auditLogs, stats,
        createProject, updateProject, toggleMilestone,
        createMeeting,
        updateMeeting,
        createTask, updateTask,
        addAuditLog,
      }}>
        {children}
      </WorkspaceContext.Provider>
    </AdminSocieteContext.Provider>
  );
}

export function useAdminSociete() {
  const ctx = useContext(AdminSocieteContext);
  if (!ctx) throw new Error('useAdminSociete must be used inside AdminSocieteProvider');
  return ctx;
}
