import { createContext, useContext, useState, useCallback } from 'react';
import { WorkspaceContext } from './WorkspaceContext';
import {
  companies as initialCompanies,
  users as initialUsers,
  sessions as initialSessions,
  auditLogs as initialAuditLogs,
  platformSettings as initialPlatformSettings,
  adminAlerts as initialAdminAlerts,
  projects as initialProjects,
  tasks as initialTasks,
  decisions as initialDecisions,
  meetings as initialMeetings,
} from '../data/mockData';

const SuperAdminContext = createContext(null);

export function SuperAdminProvider({ children }) {
  const [companies, setCompanies]               = useState(initialCompanies);
  const [users, setUsers]                       = useState(initialUsers);
  const [sessions, setSessions]                 = useState(initialSessions);
  const [auditLogs, setAuditLogs]               = useState(initialAuditLogs);
  const [platformSettings, setPlatformSettings] = useState(initialPlatformSettings);
  const [alerts, setAlerts]                     = useState(initialAdminAlerts);
  const [projects, setProjects]                 = useState(initialProjects);
  const [tasks, setTasks]                       = useState(initialTasks);
  const [decisions, setDecisions]               = useState(initialDecisions);
  const [meetings, setMeetings]                 = useState(initialMeetings);

  // ── Helpers audit ────────────────────────────────────────────────────────
  const addAuditLog = useCallback((log) => {
    const entry = { id: `log${Date.now()}`, timestamp: new Date(), ip: '192.168.1.10', ...log };
    setAuditLogs(prev => [entry, ...prev]);
  }, []);

  // ── Sociétés ──────────────────────────────────────────────────────────────
  const createCompany = useCallback((data) => {
    const newCompany = { id: `soc${Date.now()}`, status: 'active', createdAt: new Date(), userCount: 0, adminId: null, ...data };
    setCompanies(prev => [...prev, newCompany]);
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: 'COMPANY_CREATED', label: 'Société créée', resource: 'company', resourceId: newCompany.id, resourceLabel: newCompany.name, details: `Création de la société ${newCompany.name} (code: ${newCompany.code}).`, severity: 'info', companyId: newCompany.id });
    return newCompany;
  }, [addAuditLog]);

  const updateCompany = useCallback((id, updates) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: 'COMPANY_UPDATED', label: 'Société modifiée', resource: 'company', resourceId: id, resourceLabel: updates.name || id, details: `Mise à jour : ${Object.keys(updates).join(', ')}.`, severity: 'info', companyId: id });
  }, [addAuditLog]);

  const toggleCompanyStatus = useCallback((id, newStatus, reason = '') => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: 'COMPANY_STATUS_CHANGE', label: `Société ${newStatus}`, resource: 'company', resourceId: id, resourceLabel: companies.find(c => c.id === id)?.name || id, details: `Statut changé vers "${newStatus}". ${reason}`, severity: newStatus === 'suspended' ? 'high' : 'medium', companyId: id });
  }, [addAuditLog, companies]);

  // ── Utilisateurs ─────────────────────────────────────────────────────────
  const createUser = useCallback((data) => {
    const newUser = { id: `u_${Date.now()}`, status: 'invited', online: false, lastSeen: null, createdAt: new Date(), lastLogin: null, devices: [], sessions: [], twoFactorEnabled: false, ...data };
    setUsers(prev => [...prev, newUser]);
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: 'USER_CREATED', label: 'Utilisateur créé', resource: 'user', resourceId: newUser.id, resourceLabel: newUser.name, details: `Invitation envoyée. Rôle : ${newUser.role}. Email : ${newUser.email}.`, severity: 'info', companyId: newUser.companyId });
    return newUser;
  }, [addAuditLog]);

  const updateUser = useCallback((id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const changeUserStatus = useCallback((userId, newStatus, reason = '', actorId = 'u_superadmin', actorName = 'Konan Kouamé') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const updates = { status: newStatus };
      if (newStatus === 'exited') updates.exitedAt = new Date();
      if (newStatus === 'suspended' || newStatus === 'exited') { updates.sessions = []; updates.online = false; }
      return { ...u, ...updates };
    }));
    if (newStatus === 'suspended' || newStatus === 'exited') {
      setSessions(prev => prev.map(s => s.userId === userId ? { ...s, active: false } : s));
      addAuditLog({ actorId, actorName, action: 'SESSION_REVOKE_ALL', label: 'Sessions révoquées', resource: 'user', resourceId: userId, resourceLabel: user.name, details: 'Toutes les sessions actives révoquées suite à changement de statut.', severity: 'high', companyId: user.companyId });
    }
    addAuditLog({ actorId, actorName, action: 'USER_STATUS_CHANGE', label: `Compte ${newStatus}`, resource: 'user', resourceId: userId, resourceLabel: user.name, details: `Statut changé de "${user.status}" vers "${newStatus}". ${reason}`, severity: newStatus === 'exited' || newStatus === 'suspended' ? 'high' : 'medium', companyId: user.companyId });
  }, [users, addAuditLog]);

  const changeUserRole = useCallback((userId, newRole, actorId = 'u_superadmin', actorName = 'Konan Kouamé') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addAuditLog({ actorId, actorName, action: 'USER_ROLE_CHANGE', label: 'Rôle modifié', resource: 'user', resourceId: userId, resourceLabel: user.name, details: `Rôle modifié de "${user.role}" vers "${newRole}".`, severity: 'medium', companyId: user.companyId });
  }, [users, addAuditLog]);

  // ── Appareils ─────────────────────────────────────────────────────────────
  const toggleDeviceApproval = useCallback((userId, deviceId, approved) => {
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, devices: u.devices.map(d => d.id === deviceId ? { ...d, approved } : d) }
        : u
    ));
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: approved ? 'DEVICE_APPROVED' : 'DEVICE_REVOKED', label: approved ? 'Appareil approuvé' : 'Appareil révoqué', resource: 'device', resourceId: deviceId, resourceLabel: user?.name || userId, details: `Appareil ${deviceId} marqué comme ${approved ? 'approuvé' : 'révoqué'}.`, severity: 'medium', companyId: user?.companyId || null });
  }, [users, addAuditLog]);

  // ── Départ collaborateur : transfert de tâches ────────────────────────────
  // Retourne les tâches ouvertes d'un utilisateur (non terminées, non annulées)
  const getOpenTasksForUser = useCallback((userId) => {
    return tasks.filter(t =>
      t.responsableId === userId &&
      !['done', 'cancelled', 'validated'].includes(t.status)
    );
  }, [tasks]);

  // Transfère une tâche individuelle vers un remplaçant
  const transferTask = useCallback((taskId, newResponsableId, actorId = 'u_superadmin', actorName = 'Konan Kouamé') => {
    const task = tasks.find(t => t.id === taskId);
    const newUser = users.find(u => u.id === newResponsableId);
    if (!task || !newUser) return;
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, previousResponsableId: t.responsableId, responsableId: newResponsableId, history: [...(t.history || []), { date: new Date(), action: 'TRANSFERT', actorId, note: `Transféré à ${newUser.name}.`, previousResponsableId: t.responsableId }] }
        : t
    ));
    addAuditLog({ actorId, actorName, action: 'TASK_TRANSFERRED', label: 'Tâche transférée', resource: 'task', resourceId: taskId, resourceLabel: task.title, details: `Tâche transférée à ${newUser.name}.`, severity: 'medium', companyId: task.companyId });
  }, [tasks, users, addAuditLog]);

  // Transfère toutes les tâches ouvertes d'un utilisateur vers un remplaçant
  const transferAllTasksFromUser = useCallback((fromUserId, toUserId, actorId = 'u_superadmin', actorName = 'Konan Kouamé') => {
    const openTasks = tasks.filter(t => t.responsableId === fromUserId && !['done', 'cancelled', 'validated'].includes(t.status));
    const toUser = users.find(u => u.id === toUserId);
    const fromUser = users.find(u => u.id === fromUserId);
    if (!toUser || !fromUser || openTasks.length === 0) return 0;
    setTasks(prev => prev.map(t =>
      t.responsableId === fromUserId && !['done', 'cancelled', 'validated'].includes(t.status)
        ? { ...t, previousResponsableId: t.responsableId, responsableId: toUserId, history: [...(t.history || []), { date: new Date(), action: 'TRANSFERT_MASSE', actorId, note: `Transfert en masse vers ${toUser.name} suite au départ de ${fromUser.name}.` }] }
        : t
    ));
    addAuditLog({ actorId, actorName, action: 'TASKS_BULK_TRANSFER', label: `${openTasks.length} tâches transférées`, resource: 'user', resourceId: fromUserId, resourceLabel: fromUser.name, details: `${openTasks.length} tâche(s) transférée(s) à ${toUser.name}.`, severity: 'high', companyId: fromUser.companyId });
    return openTasks.length;
  }, [tasks, users, addAuditLog]);

  // ── Sessions ──────────────────────────────────────────────────────────────
  const revokeSession = useCallback((sessionId) => {
    const sess = sessions.find(s => s.id === sessionId);
    if (!sess) return;
    const user = users.find(u => u.id === sess.userId);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, active: false } : s));
    setUsers(prev => prev.map(u => u.id === sess.userId ? { ...u, sessions: u.sessions.filter(sid => sid !== sessionId) } : u));
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: 'SESSION_REVOKE', label: 'Session révoquée', resource: 'session', resourceId: sessionId, resourceLabel: user?.name || sess.userId, details: `Session ${sessionId} révoquée (appareil: ${sess.deviceId}).`, severity: 'medium', companyId: user?.companyId || null });
  }, [sessions, users, addAuditLog]);

  const revokeAllUserSessions = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    setSessions(prev => prev.map(s => s.userId === userId ? { ...s, active: false } : s));
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, sessions: [], online: false } : u));
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: 'SESSION_REVOKE_ALL', label: 'Toutes sessions révoquées', resource: 'user', resourceId: userId, resourceLabel: user?.name || userId, details: 'Toutes les sessions actives de cet utilisateur ont été révoquées.', severity: 'high', companyId: user?.companyId || null });
  }, [users, addAuditLog]);

  // ── Projets ───────────────────────────────────────────────────────────────
  const createProject = useCallback((data) => {
    const newProject = { id: `proj${Date.now()}`, ref: `PRJ-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`, status: 'draft', progress: 0, createdAt: new Date(), milestones: [], members: [], tags: [], ...data };
    setProjects(prev => [...prev, newProject]);
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: 'PROJECT_CREATED', label: 'Projet créé', resource: 'project', resourceId: newProject.id, resourceLabel: newProject.name, details: `Projet "${newProject.name}" créé.`, severity: 'info', companyId: newProject.companyId });
    return newProject;
  }, [addAuditLog]);

  const updateProject = useCallback((id, updates) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const toggleMilestone = useCallback((projectId, milestoneId, done) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const milestones = p.milestones.map(m => m.id === milestoneId ? { ...m, done } : m);
      const progress = Math.round((milestones.filter(m => m.done).length / milestones.length) * 100);
      return { ...p, milestones, progress };
    }));
  }, []);

  // ── Réunions ──────────────────────────────────────────────────────────────
  const updateMeeting = useCallback((id, updates) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  // ── Alertes ───────────────────────────────────────────────────────────────
  const resolveAlert = useCallback((alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, resolved: true } : a));
  }, []);

  // ── Paramètres plateforme ─────────────────────────────────────────────────
  const updatePlatformSettings = useCallback((updates) => {
    setPlatformSettings(prev => ({ ...prev, ...updates }));
    addAuditLog({ actorId: 'u_superadmin', actorName: 'Konan Kouamé', action: 'SETTINGS_CHANGE', label: 'Paramètres modifiés', resource: 'platform', resourceId: 'platform', resourceLabel: 'Configuration plateforme', details: `Paramètres modifiés : ${Object.keys(updates).join(', ')}.`, severity: 'medium', companyId: null });
  }, [addAuditLog]);

  // ── Stats agrégées ────────────────────────────────────────────────────────
  const now = new Date();
  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter(c => c.status === 'active').length,
    suspendedCompanies: companies.filter(c => c.status === 'suspended').length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    suspendedUsers: users.filter(u => u.status === 'suspended').length,
    exitedUsers: users.filter(u => u.status === 'exited').length,
    invitedUsers: users.filter(u => u.status === 'invited').length,
    onlineUsers: users.filter(u => u.online).length,
    activeSessions: sessions.filter(s => s.active).length,
    unresolvedAlerts: alerts.filter(a => !a.resolved).length,
    // Projets
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    // Tâches
    totalTasks: tasks.length,
    lateTasks: tasks.filter(t => t.status === 'late' || (t.dueDate && new Date(t.dueDate) < now && !['done', 'cancelled', 'validated'].includes(t.status))).length,
    criticalLateTasks: tasks.filter(t => ['urgent', 'critical'].includes(t.priority) && (t.status === 'late' || (t.dueDate && new Date(t.dueDate) < now && !['done', 'cancelled', 'validated'].includes(t.status)))).length,
    blockedTasks: tasks.filter(t => t.status === 'blocked').length,
    doneTasks: tasks.filter(t => ['done', 'validated'].includes(t.status)).length,
    // Décisions
    totalDecisions: decisions.length,
    pendingDecisions: decisions.filter(d => ['to_execute', 'in_execution'].includes(d.status)).length,
    executedDecisions: decisions.filter(d => d.status === 'executed').length,
    decisionsWithoutResponsable: decisions.filter(d => d.status !== 'executed' && (!d.taskIds || d.taskIds.length === 0)).length,
    // Réunions
    meetingsWithoutPV: meetings.filter(m => m.status === 'closed' && (!m.pvStatus || m.pvStatus === 'draft')).length,
    upcomingMeetings: meetings.filter(m => m.status === 'planned' && new Date(m.scheduledAt) > now).length,
  };

  return (
    <SuperAdminContext.Provider value={{
      // Données
      companies, users, sessions, auditLogs, platformSettings, alerts, stats,
      projects, tasks, decisions, meetings,
      // Sociétés
      createCompany, updateCompany, toggleCompanyStatus,
      // Utilisateurs
      createUser, updateUser, changeUserStatus, changeUserRole,
      // Appareils
      toggleDeviceApproval,
      // Départ collaborateur
      getOpenTasksForUser, transferTask, transferAllTasksFromUser,
      // Sessions
      revokeSession, revokeAllUserSessions,
      // Projets
      createProject, updateProject, toggleMilestone,
      // Réunions
      updateMeeting,
      // Alertes
      resolveAlert,
      // Paramètres
      updatePlatformSettings,
      // Audit
      addAuditLog,
    }}>
      <WorkspaceContext.Provider value={{
        projects, tasks, decisions, meetings,
        createProject, updateProject, toggleMilestone,
        updateMeeting, createTask: null, updateTask: null,
        auditLogs, addAuditLog, users, stats,
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
