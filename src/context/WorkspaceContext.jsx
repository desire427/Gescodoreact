/**
 * WorkspaceContext — Contexte proxy partagé.
 *
 * Les modules partagés (Projects, Meetings, AuditLog…)
 * utilisent useWorkspace() au lieu de useSuperAdmin() ou useAdminSociete().
 *
 * SuperAdminProvider et AdminSocieteProvider alimentent ce contexte
 * avec leurs données/actions propres.
 *
 * Champs exposés :
 *   companies, departments,
 *   projects, tasks, decisions, meetings, users,
 *   auditLogs, stats,
 *   createProject, updateProject, toggleMilestone,
 *   createMeeting, updateMeeting,
 *   createTask, updateTask,
 *   addAuditLog
 */
import { createContext, useContext } from 'react';

export const WorkspaceContext = createContext(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be inside a WorkspaceProvider (SuperAdmin or AdminSociete)');
  return ctx;
}
