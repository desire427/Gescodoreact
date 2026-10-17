/**
 * src/services/api.js
 * Client Axios centralisé pour l'API Gescodo (Django REST Framework + JWT)
 *
 * Fonctionnalités :
 *  - Préfixe /api/v1/ automatique
 *  - Injection du token JWT dans chaque requête
 *  - Refresh automatique du token à l'expiration (401)
 *  - File d'attente des requêtes en attente du refresh
 *  - Stockage du token dans localStorage (clés: gescodo_access / gescodo_refresh)
 */

import axios from 'axios';

// ─── Configuration de base ────────────────────────────────────────────────────

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

const api = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Helpers tokens ───────────────────────────────────────────────────────────

export const TokenStorage = {
  getAccess:     () => localStorage.getItem('gescodo_access'),
  getRefresh:    () => localStorage.getItem('gescodo_refresh'),
  setAccess:     (t) => localStorage.setItem('gescodo_access', t),
  setRefresh:    (t) => localStorage.setItem('gescodo_refresh', t),
  setTokens:     (access, refresh) => {
    localStorage.setItem('gescodo_access',  access);
    localStorage.setItem('gescodo_refresh', refresh);
  },
  clear:         () => {
    localStorage.removeItem('gescodo_access');
    localStorage.removeItem('gescodo_refresh');
  },
};

// ─── Intercepteur requête — injection du Bearer token ─────────────────────────

api.interceptors.request.use(
  (config) => {
    // Axios hérite du Content-Type application/json configuré plus haut.
    // Pour un FormData, il faut laisser le navigateur ajouter multipart/form-data
    // avec sa boundary, sinon Django ne détecte pas les champs fichier.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      config.headers?.delete?.('Content-Type');
      config.headers?.delete?.('content-type');
    }
    const token = TokenStorage.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Intercepteur réponse — refresh automatique sur 401 ───────────────────────

let isRefreshing  = false;
let failedQueue   = [];          // file d'attente pendant le refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else       resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ne pas boucler sur le refresh lui-même
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh/') &&
      !originalRequest.url.includes('/auth/login/')
    ) {
      if (isRefreshing) {
        // Mettre en file d'attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenStorage.getRefresh();
      if (!refreshToken) {
        isRefreshing = false;
        TokenStorage.clear();
        window.dispatchEvent(new Event('gescodo:logout'));
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}${API_PREFIX}/auth/refresh/`,
          { refresh: refreshToken },
        );
        TokenStorage.setAccess(data.access);
        if (data.refresh) TokenStorage.setRefresh(data.refresh);

        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        TokenStorage.clear();
        window.dispatchEvent(new Event('gescodo:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;

// ═══════════════════════════════════════════════════════════════════════════════
//  Services par domaine
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login:   (email, password) =>
    api.post('/auth/login/', { email, password }),
  refresh: (refresh) =>
    api.post('/auth/refresh/', { refresh }),
  logout:  (refresh) =>
    api.post('/auth/logout/', { refresh }),
  me:      () =>
    api.get('/auth/me/'),
  changePassword: (data) =>
    api.post('/auth/change-password/', data),
  sessions: () =>
    api.get('/auth/sessions/'),
  revokeSession: (id) =>
    api.post(`/auth/sessions/${id}/revoke/`),
};

// ─── Messagerie temps réel ────────────────────────────────────────────────────

export const messagingApi = {
  contacts:        ()           => api.get('/messaging/contacts/'),
  conversations:   (params)     => api.get('/messaging/conversations/', { params }),
  createConversation: (data)    => api.post('/messaging/conversations/', data),
  updateConversation: (id, data) => api.patch(`/messaging/conversations/${id}/`, data),
  leaveConversation: (id)       => api.delete(`/messaging/conversations/${id}/`),
  messages:        (id)         => api.get(`/messaging/conversations/${id}/messages/`),
  sendMessage:     (id, data)   => api.post(`/messaging/conversations/${id}/messages/`, data),
  deleteMessage:   (id)         => api.delete(`/messaging/messages/${id}/`),
  messageAction:   (id, action, data = {}) => api.post(`/messaging/messages/${id}/${action}/`, data),
  searchMessages:  (params)    => api.get('/messaging/messages/search/', { params }),
  starredMessages: ()           => api.get('/messaging/messages/starred/'),
  reports:         (params)     => api.get('/messaging/reports/', { params }),
  addMember:       (id, userId) => api.post(`/messaging/conversations/${id}/members/`, { user_id: userId }),
  groupInvitations: () => api.get('/messaging/group-invitations/'),
  respondGroupInvitation: (id, decision) => api.post(`/messaging/group-invitations/${id}/respond/`, { decision }),
  updateMember:    (id, userId, role) => api.patch(`/messaging/conversations/${id}/members/${userId}/`, { role }),
  removeMember:    (id, userId) => api.delete(`/messaging/conversations/${id}/members/${userId}/`),
  statuses:        ()           => api.get('/messaging/statuses/'),
  createStatus:    (data)       => api.post('/messaging/statuses/', data),
  viewStatus:      (id)         => api.post(`/messaging/statuses/${id}/view/`),
  deleteStatus:    (id)         => api.delete(`/messaging/statuses/${id}/`),
  calls:           ()           => api.get('/messaging/calls/'),
  createCall:      (data)       => api.post('/messaging/calls/', data),
  updateCall:      (id, action) => api.post(`/messaging/calls/${id}/${action}/`),
  preferences:     ()           => api.get('/messaging/preferences/'),
  updatePreferences: (data)     => api.patch('/messaging/preferences/', data),
  updateProfile:   (data)       => api.patch('/messaging/profile/', data),
  blocked:         ()           => api.get('/messaging/blocked/'),
  toggleBlocked:   (id)         => api.post(`/messaging/blocked/${id}/`),
  websocketTicket: ()           => api.post('/messaging/ws-ticket/'),
};

// ─── Sociétés ─────────────────────────────────────────────────────────────────

export const companiesApi = {
  list:         (params) => api.get('/companies/', { params }),
  get:          (id)     => api.get(`/companies/${id}/`),
  create:       (data)   => api.post('/companies/', data),
  update:       (id, data) => api.patch(`/companies/${id}/`, data),
  delete:       (id)     => api.delete(`/companies/${id}/`),
  changeStatus: (id, status, reason = '') =>
    api.patch(`/companies/${id}/status/`, { status, reason }),
  departments:  (id)     => api.get(`/companies/${id}/departments/`),
  members:      (id)     => api.get(`/companies/${id}/members/`),
};

// ─── Directions / Services ────────────────────────────────────────────────────

export const departmentsApi = {
  list:   (params) => api.get('/departments/', { params }),
  get:    (id)     => api.get(`/departments/${id}/`),
  create: (data)   => api.post('/departments/', data),
  update: (id, data) => api.patch(`/departments/${id}/`, data),
  delete: (id)     => api.delete(`/departments/${id}/`),
};

// ─── Utilisateurs ─────────────────────────────────────────────────────────────

export const usersApi = {
  list:           (params) => api.get('/users/', { params }),
  get:            (id)     => api.get(`/users/${id}/`),
  create:         (data)   => api.post('/users/', data),
  update:         (id, data) => api.patch(`/users/${id}/`, data),
  delete:         (id)     => api.delete(`/users/${id}/`),
  changeStatus:   (id, status, reason = '') =>
    api.patch(`/users/${id}/change-status/`, { status, reason }),
  changeRole:     (id, role) =>
    api.patch(`/users/${id}/change-role/`, { role }),
  revokeSessions: (id) =>
    api.post(`/users/${id}/revoke-sessions/`),
  setPassword:    (id, newPassword) =>
    api.post(`/users/${id}/set-password/`, { new_password: newPassword }),
  transferTasks:  (id, toUserId) =>
    api.post(`/users/${id}/transfer-tasks/`, { new_responsable_id: toUserId }),
};

// ─── Appareils ────────────────────────────────────────────────────────────────

export const devicesApi = {
  list:           (params) => api.get('/devices/', { params }),
  toggleApproval: (id, approved) =>
    api.patch(`/devices/${id}/toggle-approval/`, { approved }),
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessionsApi = {
  list:   (params) => api.get('/sessions/', { params }),
  revoke: (id)     => api.post(`/sessions/${id}/revoke/`),
};

// ─── Projets ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  list:             (params)        => api.get('/projects/', { params }),
  get:              (id)            => api.get(`/projects/${id}/`),
  create:           (data)          => api.post('/projects/', data),
  update:           (id, data)      => api.patch(`/projects/${id}/`, data),
  delete:           (id)            => api.delete(`/projects/${id}/`),
  toggleMilestone:  (id, msId, done) =>
    api.patch(`/projects/${id}/milestones/${msId}/toggle/`, { done }),
  tasks:            (id)            => api.get(`/projects/${id}/tasks/`),
  decisions:        (id)            => api.get(`/projects/${id}/decisions/`),
};

// ─── Tâches ───────────────────────────────────────────────────────────────────

export const tasksApi = {
  list:     (params)      => api.get('/tasks/', { params }),
  get:      (id)          => api.get(`/tasks/${id}/`),
  create:   (data)        => api.post('/tasks/', data),
  update:   (id, data)    => api.patch(`/tasks/${id}/`, data),
  delete:   (id)          => api.delete(`/tasks/${id}/`),
  transfer: (id, newResp) =>
    api.post(`/tasks/${id}/transfer/`, { new_responsable_id: newResp }),
};

// ─── Réunions ─────────────────────────────────────────────────────────────────

export const meetingsApi = {
  list:             (params)       => api.get('/meetings/', { params }),
  get:              (id)           => api.get(`/meetings/${id}/`),
  create:           (data)         => api.post('/meetings/', data),
  update:           (id, data)     => api.patch(`/meetings/${id}/`, data),
  delete:           (id)           => api.delete(`/meetings/${id}/`),
  close:            (id)           => api.patch(`/meetings/${id}/close/`),
  advancePV:        (id, pvStatus) =>
    api.patch(`/meetings/${id}/pv-status/`, { pv_status: pvStatus }),
  updateAgendaPoint:(id, pointId, data) =>
    api.patch(`/meetings/${id}/agenda/${pointId}/`, data),
  createAgendaPoint: (id, data) =>
    api.post(`/meetings/${id}/agenda/`, data),
  setPresence:      (id, partId, presence) =>
    api.patch(`/meetings/${id}/presence/${partId}/`, { presence }),
  updateConductLog: (id, conductLog) =>
    api.patch(`/meetings/${id}/conduct-log/`, { conduct_log: conductLog }),
};

// ─── Décisions ────────────────────────────────────────────────────────────────

export const decisionsApi = {
  list:         (params)      => api.get('/decisions/', { params }),
  get:          (id)          => api.get(`/decisions/${id}/`),
  create:       (data)        => api.post('/decisions/', data),
  update:       (id, data)    => api.patch(`/decisions/${id}/`, data),
  delete:       (id)          => api.delete(`/decisions/${id}/`),
  changeStatus: (id, status)  =>
    api.patch(`/decisions/${id}/status/`, { status }),
};

// ─── Journal d'audit ─────────────────────────────────────────────────────────

export const auditApi = {
  list: (params) => api.get('/audit/', { params }),
  get:  (id)     => api.get(`/audit/${id}/`),
};

// ─── Alertes ─────────────────────────────────────────────────────────────────

export const alertsApi = {
  list:    (params) => api.get('/alerts/', { params }),
  create:  (data)   => api.post('/alerts/', data),
  resolve: (id)     => api.post(`/alerts/${id}/resolve/`),
};

// ─── Paramètres plateforme ────────────────────────────────────────────────────

export const settingsApi = {
  get:    ()     => api.get('/settings/'),
  update: (data) => api.patch('/settings/', data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats/'),
};
