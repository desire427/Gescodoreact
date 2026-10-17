import { useState } from 'react';
import {
  Search, Plus, Filter, X, Check, UserCheck, UserX, UserMinus,
  LogOut, Eye, ChevronDown, AlertTriangle, ArrowRightLeft,
  Smartphone, Monitor, CheckCircle, XCircle, ClipboardList, Trash2,
} from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmModal } from './Companies';

const ROLES = [
  { id: 'superAdmin',   label: 'Super Administrateur',  color: '#7c3aed' },
  { id: 'adminSociete', label: 'Administrateur Société', color: '#2563eb' },
  { id: 'manager',      label: 'Directeur / Manager',   color: '#059669' },
  { id: 'rh',           label: 'Ressources Humaines',   color: '#d97706' },
  { id: 'chefProjet',   label: 'Chef de Projet',        color: '#0891b2' },
  { id: 'auditeur',     label: 'Auditeur',              color: '#7c3aed' },
  { id: 'employe',      label: 'Employé',               color: '#475569' },
];

const STATUS_INFO = {
  active:    { label: 'Actif',    cls: 'gc-badge--success'  },
  invited:   { label: 'Invité',   cls: 'gc-badge--info'     },
  suspended: { label: 'Suspendu', cls: 'gc-badge--danger'   },
  away:      { label: 'Absent',   cls: 'gc-badge--warning'  },
  exited:    { label: 'Sorti',    cls: 'gc-badge--dark'     },
  archived:  { label: 'Archivé',  cls: 'gc-badge--muted'    },
};

function getRoleInfo(roleId) {
  return ROLES.find(r => r.id === roleId) || { label: roleId, color: '#64748b' };
}
function getCompanyName(companies, id) { return companies.find(c => c.id === id)?.name || '—'; }
function getDeptName(departments, id)  { return departments.find(d => d.id === id)?.name || '—'; }

/* ── User Modal ── */
function UserModal({ user, onClose, onSave, companies, departments }) {
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    matricule: user?.matricule || '', role: user?.role || 'employe',
    companyId: user?.companyId || '', departmentId: user?.departmentId || '',
    about: user?.about || '', password: '',
  });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);
  const depts = departments.filter(d => d.companyId === Number(form.companyId));
  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true); setError('');
    try {
      await onSave(form);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail || 'Création impossible.'));
    } finally { setSaving(false); }
  };

  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal gc-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="gc-modal-header">
          <h3>{user ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</h3>
          <button className="gc-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="gc-modal-body">
            <div className="gc-form-row">
              <div className="gc-form-field"><label>Nom complet *</label><input value={form.name} onChange={e => f('name', e.target.value)} required /></div>
              <div className="gc-form-field gc-form-field--sm"><label>Matricule</label><input value={form.matricule} onChange={e => f('matricule', e.target.value)} /></div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field"><label>Email *</label><input type="email" value={form.email} onChange={e => f('email', e.target.value)} required /></div>
              <div className="gc-form-field"><label>Téléphone</label><input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} /></div>
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Rôle</label>
                <select value={form.role} onChange={e => f('role', e.target.value)}>
                  {ROLES.filter(r => r.id !== 'superAdmin').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              <div className="gc-form-field">
                <label>Société</label>
                <select value={form.companyId} onChange={e => f('companyId', e.target.value)}>
                  <option value="">— Groupe —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {form.companyId && (
              <div className="gc-form-field">
                <label>Direction / Service</label>
                <select value={form.departmentId} onChange={e => f('departmentId', e.target.value)}>
                  <option value="">— Aucun —</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            {!user && (
              <div className="gc-form-field">
                <label>Mot de passe initial *</label>
                <input type="password" value={form.password} onChange={e => f('password', e.target.value)} minLength={8} autoComplete="new-password" required />
              </div>
            )}
            <div className="gc-form-field">
              <label>À propos</label>
              <input value={form.about} onChange={e => f('about', e.target.value)} maxLength={80} />
            </div>
            {error && <p role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>{error}</p>}
          </div>
          <div className="gc-modal-footer">
            <button type="button" className="gc-btn gc-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="gc-btn gc-btn--primary" disabled={saving}>
              <Check size={14} /> {saving ? 'En cours…' : user ? 'Enregistrer' : 'Inviter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── User Detail Panel ── */
function UserDetail({ user, onClose, companies, departments }) {
  const {
    changeUserStatus, changeUserRole, deleteUser,
    revokeAllUserSessions, toggleDeviceApproval,
    getOpenTasksForUser, transferAllTasksFromUser, users,
  } = useSuperAdmin();

  const [confirmAction, setConfirmAction] = useState(null);
  const [activeTab, setActiveTab]         = useState('info');
  const [transferTo, setTransferTo]       = useState('');
  const [transferred, setTransferred]     = useState(null);
  const [actionError, setActionError]     = useState('');

  const roleInfo   = getRoleInfo(user.role);
  const openTasks  = getOpenTasksForUser(user.id);
  const colleagues = users.filter(u => u.id !== user.id && u.companyId === user.companyId && u.status === 'active');

  const handleBulkTransfer = () => {
    if (!transferTo) return;
    const count = transferAllTasksFromUser(user.id, transferTo);
    setTransferred(count);
    setTransferTo('');
  };

  const TABS = [
    { id: 'info',      label: 'Informations' },
    { id: 'devices',   label: `Appareils (${user.devices?.length || 0})` },
    { id: 'departure', label: 'Sortie', alert: user.status !== 'exited' && openTasks.length > 0 },
  ];

  const si = STATUS_INFO[user.status] || { label: user.status, cls: 'gc-badge--muted' };

  return (
    <div className="gc-detail-overlay" onClick={onClose}>
      <div className="gc-detail-panel" onClick={e => e.stopPropagation()}>

        <div className="gc-detail-header">
          <button className="gc-icon-btn" onClick={onClose}><X size={18} /></button>
          <h3>Détail utilisateur</h3>
        </div>

        <div className="gc-detail-profile">
          <img src={user.avatar} alt={user.name} className="gc-detail-avatar" />
          <div className="gc-detail-profile-info">
            <h4>{user.name}</h4>
            <span className="gc-detail-matricule">{user.matricule || '—'}</span>
            <span className="gc-detail-role" style={{ background: roleInfo.color + '22', color: roleInfo.color }}>
              {roleInfo.label}
            </span>
          </div>
          <span className={`gc-badge ${si.cls}`}>{si.label}</span>
        </div>

        <div className="gc-detail-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`gc-detail-tab ${activeTab === t.id ? 'gc-detail-tab--active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
              {t.alert && <span className="gc-detail-tab-dot" />}
            </button>
          ))}
        </div>

        <div className="gc-detail-body">
          {activeTab === 'info' && (
            <>
              <div className="gc-detail-section">
                {[
                  ['Email', user.email],
                  ['Téléphone', user.phone || '—'],
                  ['Société', getCompanyName(companies, user.companyId)],
                  ['Direction/Service', getDeptName(departments, user.departmentId)],
                  ['Créé le', format(new Date(user.createdAt), 'd MMM yyyy', { locale: fr })],
                  ['Dernière connexion', user.lastLogin ? format(new Date(user.lastLogin), 'd MMM HH:mm', { locale: fr }) : '—'],
                  ['Sessions actives', user.sessions?.length || 0],
                ].map(([k, v]) => (
                  <div key={k} className="gc-detail-row">
                    <span className="gc-detail-key">{k}</span>
                    <span className="gc-detail-val">{v}</span>
                  </div>
                ))}
                <div className="gc-detail-row">
                  <span className="gc-detail-key">En ligne</span>
                  <span className={`gc-badge ${user.online ? 'gc-badge--success' : 'gc-badge--muted'}`}>{user.online ? 'Oui' : 'Non'}</span>
                </div>
                <div className="gc-detail-row">
                  <span className="gc-detail-key">2FA</span>
                  <span className={`gc-badge ${user.twoFactorEnabled ? 'gc-badge--success' : 'gc-badge--muted'}`}>{user.twoFactorEnabled ? 'Activé' : 'Désactivé'}</span>
                </div>
              </div>

              <div className="gc-detail-section">
                <span className="gc-detail-section-title">Changer le rôle</span>
                <div className="gc-role-select-list">
                  {ROLES.filter(r => r.id !== 'superAdmin').map(r => (
                    <button key={r.id} className={`gc-role-select-item ${user.role === r.id ? 'gc-role-select-item--active' : ''}`}
                      style={{ '--rc': r.color }} onClick={() => changeUserRole(user.id, r.id)}>
                      <span className="gc-role-dot" style={{ background: r.color }} />{r.label}
                      {user.role === r.id && <Check size={12} style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gc-detail-section">
                <span className="gc-detail-section-title">Actions</span>
                <div className="gc-detail-actions">
                  {user.status === 'active'    && <button className="gc-btn gc-btn--danger" onClick={() => setConfirmAction({ type: 'suspend' })}><UserX size={13} /> Suspendre</button>}
                  {user.status === 'suspended' && <button className="gc-btn gc-btn--primary" onClick={() => changeUserStatus(user.id, 'active')}><UserCheck size={13} /> Réactiver</button>}
                  {user.status === 'exited'    && <button className="gc-btn gc-btn--primary" onClick={() => changeUserStatus(user.id, 'active', 'Accès débloqué par le super administrateur.')}><UserCheck size={13} /> Débloquer l’accès</button>}
                  {['active','suspended'].includes(user.status) && <button className="gc-btn gc-btn--danger" onClick={() => setConfirmAction({ type: 'exit' })}><UserMinus size={13} /> Marquer Sorti</button>}
                  {user.status === 'exited' && <button className="gc-btn gc-btn--ghost" onClick={() => changeUserStatus(user.id, 'archived')}>Archiver</button>}
                  {(user.sessions?.length > 0) && <button className="gc-btn gc-btn--danger" onClick={() => setConfirmAction({ type: 'revoke' })}><LogOut size={13} /> Déconnecter partout</button>}
                  {user.role !== 'superAdmin' && <button className="gc-btn gc-btn--danger" onClick={() => { setActionError(''); setConfirmAction({ type: 'delete' }); }}><Trash2 size={13} /> Supprimer</button>}
                </div>
                {actionError && <p role="alert" style={{ color: '#b91c1c', fontSize: 12 }}>{actionError}</p>}
              </div>
            </>
          )}

          {activeTab === 'devices' && (
            <div className="gc-detail-section">
              {(!user.devices || user.devices.length === 0)
                ? <p className="gc-empty">Aucun appareil enregistré.</p>
                : user.devices.map(device => (
                  <div key={device.id} className="gc-device-row">
                    <div className="gc-device-icon">
                      {device.type === 'mobile' ? <Smartphone size={15} /> : <Monitor size={15} />}
                    </div>
                    <div className="gc-device-info">
                      <span className="gc-device-label">{device.label}</span>
                      <span className="gc-device-os">{device.os}</span>
                      <span className="gc-device-date">Dernière activité : {format(new Date(device.lastActive), 'd MMM HH:mm', { locale: fr })}</span>
                    </div>
                    <div className="gc-device-actions">
                      {device.active && <span className="gc-badge gc-badge--success" style={{ fontSize: 10 }}>Active</span>}
                      <button
                        className={`gc-device-approve-btn ${device.approved === false ? 'revoked' : 'approved'}`}
                        onClick={() => toggleDeviceApproval(user.id, device.id, device.approved === false)}
                      >
                        {device.approved !== false ? <><CheckCircle size={12} /> Approuvé</> : <><XCircle size={12} /> Révoqué</>}
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === 'departure' && (
            <>
              <div className="gc-detail-section">
                <span className="gc-detail-section-title"><ClipboardList size={13} /> Tâches ouvertes ({openTasks.length})</span>
                {openTasks.length === 0
                  ? <p className="gc-empty">Aucune tâche ouverte.</p>
                  : openTasks.map(t => (
                    <div key={t.id} className="gc-open-task-row">
                      <div>
                        <span className="gc-open-task-title">{t.title}</span>
                        <span className="gc-open-task-meta">{t.priority} · {t.dueDate ? format(new Date(t.dueDate), 'd MMM yyyy', { locale: fr }) : '—'}</span>
                      </div>
                      <span className={`gc-badge ${t.status === 'late' ? 'gc-badge--danger' : 'gc-badge--warning'}`}>{t.status}</span>
                    </div>
                  ))
                }
              </div>

              {openTasks.length > 0 && (
                <div className="gc-detail-section">
                  <span className="gc-detail-section-title"><ArrowRightLeft size={13} /> Transfert en masse</span>
                  {transferred !== null && (
                    <div className="gc-transfer-success"><CheckCircle size={13} /> {transferred} tâche(s) transférée(s).</div>
                  )}
                  <div className="gc-transfer-row">
                    <select className="gc-transfer-select" value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                      <option value="">— Sélectionner un remplaçant —</option>
                      {colleagues.map(u => <option key={u.id} value={u.id}>{u.name} ({getRoleInfo(u.role).label})</option>)}
                    </select>
                    <button className="gc-btn gc-btn--primary" style={{ fontSize: 12 }} disabled={!transferTo} onClick={handleBulkTransfer}>
                      <ArrowRightLeft size={12} /> Transférer {openTasks.length} tâche(s)
                    </button>
                  </div>
                </div>
              )}

              {user.status !== 'exited' ? (
                <div className="gc-detail-section">
                  <span className="gc-detail-section-title"><AlertTriangle size={13} /> Procédure de sortie</span>
                  <p style={{ fontSize: 13, color: 'var(--gc-muted)', lineHeight: 1.6, marginBottom: 12 }}>
                    Bloque l'accès sur tous les appareils, révoque toutes les sessions et préserve les données. Le compte pourra être débloqué plus tard.
                  </p>
                  <button className="gc-btn gc-btn--danger" onClick={() => setConfirmAction({ type: 'exit' })}>
                    <UserMinus size={13} /> Confirmer la sortie de {user.name}
                  </button>
                </div>
              ) : (
                <div className="gc-detail-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gc-muted)' }}>
                    <CheckCircle size={15} style={{ color: '#4ade80' }} />
                    Sorti le {user.exitedAt ? format(new Date(user.exitedAt), 'd MMM yyyy', { locale: fr }) : '—'}. Accès bloqué.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {confirmAction?.type === 'suspend' && <ConfirmModal message={`Suspendre ${user.name} ?`} confirmLabel="Suspendre" onClose={() => setConfirmAction(null)} onConfirm={() => { changeUserStatus(user.id, 'suspended', 'Décision super admin.'); setConfirmAction(null); }} />}
        {confirmAction?.type === 'exit'    && <ConfirmModal message={`Révoquer l’accès de ${user.name} ? Vous pourrez débloquer le compte plus tard.`} confirmLabel="Révoquer l’accès" onClose={() => setConfirmAction(null)} onConfirm={() => { changeUserStatus(user.id, 'exited', 'Accès révoqué par le super administrateur.'); setConfirmAction(null); }} />}
        {confirmAction?.type === 'revoke'  && <ConfirmModal message={`Déconnecter ${user.name} de tous ses appareils ?`} confirmLabel="Déconnecter" onClose={() => setConfirmAction(null)} onConfirm={() => { revokeAllUserSessions(user.id); setConfirmAction(null); }} />}
        {confirmAction?.type === 'delete'  && <ConfirmModal message={`Supprimer le compte de ${user.name} ? L'accès sera immédiatement révoqué.`} confirmLabel="Supprimer le compte" onClose={() => setConfirmAction(null)} onConfirm={async () => {
          try { await deleteUser(user.id); setConfirmAction(null); onClose(); }
          catch (err) { setActionError(err.response?.data?.detail || 'La suppression a échoué.'); setConfirmAction(null); }
        }} />}
      </div>
    </div>
  );
}

/* ── Main ── */
export default function UsersManagement() {
  const { users, createUser, companies, departments } = useSuperAdmin();
  const [notice, setNotice]             = useState('');
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterComp]  = useState('all');
  const [showFilters, setShowFilters]   = useState(false);
  const [modal, setModal]               = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.matricule||'').toLowerCase().includes(q)) &&
      (filterRole    === 'all' || u.role      === filterRole) &&
      (filterStatus  === 'all' || u.status    === filterStatus) &&
      (filterCompany === 'all' || u.companyId === filterCompany)
    );
  });

  return (
    <div className="gc-page">
      <div className="gc-toolbar">
        <div className="gc-search-wrap">
          <Search size={14} className="gc-search-icon" />
          <input className="gc-search-input" placeholder="Nom, email, matricule…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {notice && <p role="status" style={{ color: '#166534', fontSize: 12 }}>{notice}</p>}
        <button className={`gc-btn gc-btn--ghost ${showFilters ? 'gc-btn--active' : ''}`} onClick={() => setShowFilters(v => !v)}>
          <Filter size={13} /> Filtres <ChevronDown size={11} />
        </button>
        <button className="gc-btn gc-btn--primary" onClick={() => setModal({ type: 'create' })}>
          <Plus size={14} /> Inviter un utilisateur
        </button>
      </div>

      {showFilters && (
        <div className="gc-filters-bar">
          <div className="gc-filter-group">
            <label>Rôle</label>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="all">Tous</option>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="gc-filter-group">
            <label>Statut</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tous</option>
              {Object.entries(STATUS_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="gc-filter-group">
            <label>Société</label>
            <select value={filterCompany} onChange={e => setFilterComp(e.target.value)}>
              <option value="all">Toutes</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="gc-btn gc-btn--ghost" style={{ fontSize: 12 }} onClick={() => { setFilterRole('all'); setFilterStatus('all'); setFilterComp('all'); }}>
            <X size={12} /> Réinitialiser
          </button>
        </div>
      )}

      <p className="gc-count">{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</p>

      <div className="gc-table-wrap">
        <table className="gc-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Société</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th>Sessions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="gc-table-empty">Aucun utilisateur trouvé.</td></tr>
            )}
            {filtered.map(u => {
              const ri = getRoleInfo(u.role);
              const si = STATUS_INFO[u.status] || { label: u.status, cls: 'gc-badge--muted' };
              return (
                <tr key={u.id} className="gc-table-row" onClick={() => setSelectedUser(u)}>
                  <td>
                    <div className="gc-user-cell">
                      <div className="gc-user-avatar-wrap">
                        <img src={u.avatar} alt={u.name} className="gc-user-avatar" />
                        {u.online && <span className="gc-online-dot" />}
                      </div>
                      <div>
                        <div className="gc-user-name">{u.name}</div>
                        <div className="gc-user-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="gc-role-pill" style={{ background: ri.color + '20', color: ri.color }}>{ri.label}</span>
                  </td>
                  <td className="gc-table-sub">{companies.find(c => c.id === u.companyId)?.name || '—'}</td>
                  <td><span className={`gc-badge ${si.cls}`}>{si.label}</span></td>
                  <td className="gc-table-sub">{u.lastLogin ? format(new Date(u.lastLogin), 'd MMM HH:mm', { locale: fr }) : '—'}</td>
                  <td className="gc-table-sub">{u.sessions?.length || 0}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="gc-icon-btn" onClick={() => setSelectedUser(u)}><Eye size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal?.type === 'create' && (
        <UserModal user={null} companies={companies} departments={departments} onClose={() => setModal(null)}
          onSave={async (form) => {
            await createUser({
              name: form.name, email: form.email, phone: form.phone,
              matricule: form.matricule, role: form.role,
              company: form.companyId || null, department: form.departmentId || null,
              about: form.about, password: form.password,
            });
            setNotice(`Invitation envoyée à ${form.email}. Le compte est actif.`);
            setModal(null);
          }}
        />
      )}
      {selectedUser && (
        <UserDetail
          user={users.find(u => u.id === selectedUser.id) || selectedUser}
          companies={companies} departments={departments}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
