import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { WorkspaceContext } from './WorkspaceContext';
import {
  users as allUsers,
  sessions as allSessions,
  auditLogs as allLogs,
  projects as allProjects,
  tasks as allTasks,
  decisions as allDecisions,
  meetings as allMeetings,
  companies,
  departments,
  roles,
} from '../data/mockData';

const AdminSocieteContext = createContext(null);

export function AdminSocieteProvider({ children, companyId, currentUserId }) {
  // ── Données filtrées sur la société ──────────────────────────────────────
  const [users, setUsers]         = useState(() => allUsers.filter(u => u.companyId === companyId || u.id === currentUserId));
  const [sessions, setSessions]   = useState(() => allSessions.filter(s => users.map(u => u.id).includes(s.userId)));
  const [auditLogs, setAuditLogs] = useState(() => allLogs.filter(l => l.companyId === companyId || l.companyId === null));
  const [projects, setProjects]   = useState(() => allProjects.filter(p => p.companyId === companyId));
  const [tasks, setTasks]         = useState(() => allTasks.filter(t => t.companyId === companyId));
  const [decisions, setDecisions] = useState(() => allDecisions.filter(d => d.companyId === companyId));
  const [meetings, setMeetings]   = useState(() => allMeetings.filter(m => m.companyId === companyId));

  const company = companies.find(c => c.id === companyId);
  const companyDepts = departments.filter(d => d.companyId === companyId);

  // ── Audit ─────────────────────────────────────────────────────────────────
  const addAuditLog = useCallback((log) => {
    const entry = {
      id: `log${Date.now()}`,
      timestamp: new Date(),
      ip: '10.0.0.1',
      companyId,
      ...log,
    };
    setAuditLogs(prev => [entry, ...prev]);
  }, [companyId]);

  // ── Utilisateurs (périmètre société) ─────────────────────────────────────
  const createUser = useCallback((data) => {
    const newUser = {
      id: `u_${Date.now()}`,
      status: 'invited',
      online: false,
      lastSeen: null,
      createdAt: new Date(),
      lastLogin: null,
      devices: [],
      sessions: [],
      twoFactorEnabled: false,
      companyId,
      ...data,
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'USER_CREATED', label: 'Utilisateur créé',
      resource: 'user', resourceId: newUser.id, resourceLabel: newUser.name,
      details: `Invitation envoyée. Rôle : ${newUser.role}. Email : ${newUser.email}.`,
      severity: 'info',
    });
    return newUser;
  }, [companyId, currentUserId, users, addAuditLog]);

  const updateUser = useCallback((id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const changeUserStatus = useCallback((userId, newStatus, reason = '') => {
    const user = users.find(u => u.id === userId);
    if (!user || user.companyId !== companyId) return; // sécurité périmètre
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const updates = { status: newStatus };
      if (newStatus === 'exited') updates.exitedAt = new Date();
      if (['suspended', 'exited'].includes(newStatus)) { updates.sessions = []; updates.online = false; }
      return { ...u, ...updates };
    }));
    if (['suspended', 'exited'].includes(newStatus)) {
      setSessions(prev => prev.map(s => s.userId === userId ? { ...s, active: false } : s));
    }
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'USER_STATUS_CHANGE', label: `Compte ${newStatus}`,
      resource: 'user', resourceId: userId, resourceLabel: user.name,
      details: `Statut changé de "${user.status}" vers "${newStatus}". ${reason}`,
      severity: ['exited', 'suspended'].includes(newStatus) ? 'high' : 'medium',
    });
  }, [users, companyId, currentUserId, addAuditLog]);

  const changeUserRole = useCallback((userId, newRole) => {
    const user = users.find(u => u.id === userId);
    if (!user || user.companyId !== companyId) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'USER_ROLE_CHANGE', label: 'Rôle modifié',
      resource: 'user', resourceId: userId, resourceLabel: user.name,
      details: `Rôle modifié de "${user.role}" vers "${newRole}".`,
      severity: 'medium',
    });
  }, [users, companyId, currentUserId, addAuditLog]);

  const toggleDeviceApproval = useCallback((userId, deviceId, approved) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, devices: u.devices.map(d => d.id === deviceId ? { ...d, approved } : d) } : u
    ));
  }, []);

  const getOpenTasksForUser = useCallback((userId) => {
    return tasks.filter(t => t.responsableId === userId && !['done', 'cancelled', 'validated'].includes(t.status));
  }, [tasks]);

  const transferAllTasksFromUser = useCallback((fromUserId, toUserId) => {
    const openTasks = tasks.filter(t => t.responsableId === fromUserId && !['done', 'cancelled', 'validated'].includes(t.status));
    const toUser = users.find(u => u.id === toUserId);
    const fromUser = users.find(u => u.id === fromUserId);
    if (!toUser || !fromUser) return 0;
    setTasks(prev => prev.map(t =>
      t.responsableId === fromUserId && !['done', 'cancelled', 'validated'].includes(t.status)
        ? { ...t, previousResponsableId: t.responsableId, responsableId: toUserId, history: [...(t.history || []), { date: new Date(), action: 'TRANSFERT_MASSE', note: `Transfert vers ${toUser.name}.` }] }
        : t
    ));
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'TASKS_BULK_TRANSFER', label: `${openTasks.length} tâches transférées`,
      resource: 'user', resourceId: fromUserId, resourceLabel: fromUser.name,
      details: `${openTasks.length} tâche(s) transférée(s) à ${toUser.name}.`,
      severity: 'high',
    });
    return openTasks.length;
  }, [tasks, users, currentUserId, addAuditLog]);

  const revokeSession = useCallback((sessionId) => {
    const sess = sessions.find(s => s.id === sessionId);
    if (!sess) return;
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, active: false } : s));
    setUsers(prev => prev.map(u => u.id === sess.userId ? { ...u, sessions: u.sessions.filter(sid => sid !== sessionId) } : u));
  }, [sessions]);

  const revokeAllUserSessions = useCallback((userId) => {
    setSessions(prev => prev.map(s => s.userId === userId ? { ...s, active: false } : s));
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, sessions: [], online: false } : u));
  }, []);

  // ── Projets ───────────────────────────────────────────────────────────────
  const createProject = useCallback((data) => {
    const newProject = {
      id: `proj${Date.now()}`,
      ref: `PRJ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      status: 'draft', progress: 0, createdAt: new Date(),
      milestones: [], members: [], tags: [], companyId, ...data,
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, [companyId]);

  const updateProject = useCallback((id, updates) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const toggleMilestone = useCallback((projectId, milestoneId, done) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const milestones = p.milestones.map(m => m.id === milestoneId ? { ...m, done } : m);
      const progress = milestones.length > 0 ? Math.round((milestones.filter(m => m.done).length / milestones.length) * 100) : 0;
      return { ...p, milestones, progress };
    }));
  }, []);

  // ── Tâches ────────────────────────────────────────────────────────────────
  const createTask = useCallback((data) => {
    const newTask = {
      id: `task_${Date.now()}`,
      ref: `TSK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      status: 'todo', progress: 0, history: [],
      contributors: [], tags: [], companyId, createdAt: new Date(), ...data,
    };
    setTasks(prev => [...prev, newTask]);
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'TASK_CREATED', label: 'Tâche créée',
      resource: 'task', resourceId: newTask.id, resourceLabel: newTask.title,
      details: `Tâche "${newTask.title}" créée. Responsable : ${newTask.responsableId}.`,
      severity: 'info',
    });
    return newTask;
  }, [companyId, currentUserId, users, addAuditLog]);

  const updateTask = useCallback((id, updates) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const history = [...(t.history || []), {
        date: new Date(), actorId: currentUserId,
        changes: Object.keys(updates).join(', '),
      }];
      return { ...t, ...updates, history };
    }));
  }, [currentUserId]);

  const submitTask = useCallback((taskId, proofLabel) => {
    updateTask(taskId, {
      status: 'submitted',
      proof: proofLabel ? { type: 'file', label: proofLabel, date: new Date() } : null,
    });
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'TASK_SUBMITTED', label: 'Tâche soumise pour validation',
      resource: 'task', resourceId: taskId, resourceLabel: tasks.find(t => t.id === taskId)?.title || taskId,
      details: proofLabel ? `Preuve fournie : ${proofLabel}` : 'Aucune preuve jointe.',
      severity: 'info',
    });
  }, [updateTask, currentUserId, users, tasks, addAuditLog]);

  const validateTask = useCallback((taskId, comment = '') => {
    updateTask(taskId, {
      status: 'validated',
      validatedAt: new Date(),
      validatedBy: currentUserId,
      validationComment: comment,
    });
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'TASK_VALIDATED', label: 'Tâche validée',
      resource: 'task', resourceId: taskId, resourceLabel: tasks.find(t => t.id === taskId)?.title || taskId,
      details: comment || 'Validation sans commentaire.',
      severity: 'info',
    });
  }, [updateTask, currentUserId, users, tasks, addAuditLog]);

  const rejectTask = useCallback((taskId, reason) => {
    updateTask(taskId, { status: 'in_progress', rejectedAt: new Date(), rejectionReason: reason });
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'TASK_REJECTED', label: 'Tâche rejetée',
      resource: 'task', resourceId: taskId, resourceLabel: tasks.find(t => t.id === taskId)?.title || taskId,
      details: `Motif du rejet : ${reason}`,
      severity: 'medium',
    });
  }, [updateTask, currentUserId, users, tasks, addAuditLog]);

  // ── Décisions ─────────────────────────────────────────────────────────────
  const createDecision = useCallback((data) => {
    const ref = `DEC-${new Date().getFullYear()}-${String(Date.now()).slice(-6).padStart(6, '0')}`;
    const newDecision = {
      id: `dec_${Date.now()}`,
      ref,
      status: 'to_execute',
      taskIds: [],
      history: [{ date: new Date(), status: 'to_execute', actorId: currentUserId, note: 'Décision créée.' }],
      companyId,
      createdAt: new Date(),
      authorId: currentUserId,
      ...data,
    };
    setDecisions(prev => [...prev, newDecision]);
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'DECISION_CREATED', label: 'Décision créée',
      resource: 'decision', resourceId: newDecision.id, resourceLabel: newDecision.title,
      details: `Décision "${newDecision.title}" créée. Statut : À exécuter.`,
      severity: 'info',
    });
    return newDecision;
  }, [companyId, currentUserId, users, addAuditLog]);

  const updateDecision = useCallback((id, updates) => {
    setDecisions(prev => prev.map(d => {
      if (d.id !== id) return d;
      const history = [...(d.history || []), {
        date: new Date(), status: updates.status || d.status,
        actorId: currentUserId,
        note: updates.historyNote || `Mise à jour : ${Object.keys(updates).join(', ')}.`,
      }];
      return { ...d, ...updates, history };
    }));
  }, [currentUserId]);

  const changeDecisionStatus = useCallback((id, newStatus, justification = '') => {
    const decision = decisions.find(d => d.id === id);
    if (!decision) return;
    // Règle CDC 10.1 : "Exécutée" uniquement si toutes les tâches liées sont validées OU force avec justification
    if (newStatus === 'executed') {
      const linkedTasks = tasks.filter(t => decision.taskIds?.includes(t.id));
      const allValidated = linkedTasks.every(t => ['validated', 'done'].includes(t.status));
      if (!allValidated && !justification) return; // bloqué sans justification
    }
    updateDecision(id, { status: newStatus, historyNote: justification || `Statut changé vers "${newStatus}".` });
    addAuditLog({
      actorId: currentUserId,
      actorName: users.find(u => u.id === currentUserId)?.name || 'Admin',
      action: 'DECISION_STATUS_CHANGE', label: `Décision ${newStatus}`,
      resource: 'decision', resourceId: id, resourceLabel: decision.title,
      details: justification || `Statut changé vers "${newStatus}".`,
      severity: newStatus === 'executed' ? 'high' : 'medium',
    });
  }, [decisions, tasks, updateDecision, currentUserId, users, addAuditLog]);

  // ── Réunions ──────────────────────────────────────────────────────────────
  const updateMeeting = useCallback((id, updates) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  // ── Stats agrégées (périmètre société) ────────────────────────────────────
  const now = new Date();
  const stats = useMemo(() => {
    const lateTasks = tasks.filter(t =>
      !['done', 'cancelled', 'validated'].includes(t.status) &&
      t.dueDate && new Date(t.dueDate) < now
    );
    const closedTasks = tasks.filter(t => ['done', 'validated', 'cancelled'].includes(t.status));
    const onTimeTasks = closedTasks.filter(t => t.validatedAt && t.dueDate && new Date(t.validatedAt) <= new Date(t.dueDate));
    const avgLateAge = lateTasks.length > 0
      ? Math.round(lateTasks.reduce((sum, t) => {
          const diff = Math.floor((now - new Date(t.dueDate)) / (1000 * 60 * 60 * 24));
          return sum + diff;
        }, 0) / lateTasks.length)
      : 0;

    return {
      // Utilisateurs
      totalUsers:        users.length,
      activeUsers:       users.filter(u => u.status === 'active').length,
      suspendedUsers:    users.filter(u => u.status === 'suspended').length,
      invitedUsers:      users.filter(u => u.status === 'invited').length,
      onlineUsers:       users.filter(u => u.online).length,
      activeSessions:    sessions.filter(s => s.active).length,
      // Projets
      totalProjects:     projects.length,
      activeProjects:    projects.filter(p => p.status === 'in_progress').length,
      // Tâches
      totalTasks:        tasks.length,
      lateTasks:         lateTasks.length,
      criticalLateTasks: tasks.filter(t => ['urgent', 'critical'].includes(t.priority) && lateTasks.some(lt => lt.id === t.id)).length,
      blockedTasks:      tasks.filter(t => t.status === 'blocked').length,
      submittedTasks:    tasks.filter(t => t.status === 'submitted').length,
      onTimeRate:        closedTasks.length > 0 ? Math.round((onTimeTasks.length / closedTasks.length) * 100) : 0,
      avgLateAge,
      // Décisions
      totalDecisions:    decisions.length,
      pendingDecisions:  decisions.filter(d => ['to_execute', 'in_execution'].includes(d.status)).length,
      executedDecisions: decisions.filter(d => d.status === 'executed').length,
      decisionsWithoutTasks: decisions.filter(d => d.status !== 'executed' && (!d.taskIds || d.taskIds.length === 0)).length,
      execRate: decisions.length > 0 ? Math.round((decisions.filter(d => d.status === 'executed').length / decisions.length) * 100) : 0,
      // Réunions
      meetingsWithoutPV: meetings.filter(m => m.status === 'closed' && (!m.pvStatus || m.pvStatus === 'draft')).length,
      upcomingMeetings:  meetings.filter(m => m.status === 'planned' && new Date(m.scheduledAt) > now).length,
    };
  }, [users, sessions, projects, tasks, decisions, meetings]);

  return (
    <AdminSocieteContext.Provider value={{
      // Données
      company, companyDepts, users, sessions, auditLogs,
      projects, tasks, decisions, meetings, stats,
      roles, companies,
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
      updateMeeting,
      // Audit
      addAuditLog,
    }}>
      <WorkspaceContext.Provider value={{
        projects, tasks, decisions, meetings,
        createProject, updateProject, toggleMilestone,
        updateMeeting, createTask, updateTask,
        auditLogs, addAuditLog, users, stats,
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
