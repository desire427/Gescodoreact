import { useState } from 'react';
import {
  Search, Plus, Filter, X, Check, UserCheck, UserX, UserMinus,
  LogOut, Eye, ChevronDown, AlertTriangle, ArrowRightLeft,
  Smartphone, Monitor, CheckCircle, XCircle, ClipboardList,
} from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { companies, departments, roles } from '../../data/mockData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmModal } from './Companies';

const STATUS_INFO = {
  active:    { label: 'Actif',    class: 'sa-badge--green'  },
  invited:   { label: 'Invité',   class: 'sa-badge--blue'   },
  suspended: { label: 'Suspendu', class: 'sa-badge--red'    },
  away:      { label: 'Absent',   class: 'sa-badge--orange' },
  exited:    { label: 'Sorti',    class: 'sa-badge--dark'   },
  archived:  { label: 'Archivé',  class: 'sa-badge--gray'   },
};

function getRoleInfo(roleId) {
  return roles.find(r => r.id === roleId) || { label: roleId, color: '#64748b' };
}
function getCompanyName(id) { return companies.find(c => c.id === id)?.name || '—'; }
function getDeptName(id)    { return departments.find(d => d.id === id)?.name || '—'; }

/* ── Modal création/édition ── */
function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    matricule: user?.matricule || '', role: user?.role || 'employe',
    companyId: user?.companyId || '', departmentId: user?.departmentId || '',
    about: user?.about || '',
  });
  const depts = departments.filter(d => d.companyId === form.companyId);
  const handleSubmit = (e) => { e.preventDefault(); if (!form.name.trim() || !form.email.trim()) return; onSave(form); };
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--lg" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>{user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit}>
          <div className="sa-form-row">
            <div className="sa-form-field"><label>Nom complet *</label><input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required /></div>
            <div className="sa-form-field sa-form-field--sm"><label>Matricule</label><input value={form.matricule} onChange={e => setForm(p=>({...p,matricule:e.target.value}))} /></div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} required /></div>
            <div className="sa-form-field"><label>Téléphone</label><input type="tel" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} /></div>
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Rôle</label>
              <select value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                {roles.filter(r => r.id !== 'superAdmin').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <div className="sa-form-field">
              <label>Société</label>
              <select value={form.companyId} onChange={e => setForm(p=>({...p,companyId:e.target.value,departmentId:''}))}>
                <option value="">— Groupe —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {form.companyId && (
            <div className="sa-form-field">
              <label>Direction / Service</label>
              <select value={form.departmentId} onChange={e => setForm(p=>({...p,departmentId:e.target.value}))}>
                <option value="">— Aucun —</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <div className="sa-form-field"><label>À propos</label><input value={form.about} onChange={e => setForm(p=>({...p,about:e.target.value}))} maxLength={80} /></div>
          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sa-btn sa-btn--primary"><Check size={15} /> {user ? 'Enregistrer' : 'Inviter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Panneau détail utilisateur ── */
function UserDetail({ user, onClose }) {
  const { changeUserStatus, changeUserRole, revokeAllUserSessions, toggleDeviceApproval, getOpenTasksForUser, transferAllTasksFromUser, users } = useSuperAdmin();
  const [confirmAction, setConfirmAction] = useState(null);
  const [activeTab, setActiveTab]         = useState('info');
  const [transferTo, setTransferTo]       = useState('');
  const [transferred, setTransferred]     = useState(null);
  const roleInfo  = getRoleInfo(user.role);
  const openTasks = getOpenTasksForUser(user.id);
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
    { id: 'departure', label: 'Départ / Sortie', alert: user.status !== 'exited' && openTasks.length > 0 },
  ];

  return (
    <div className="sa-detail-overlay" onClick={onClose}>
      <div className="sa-detail-panel" onClick={e => e.stopPropagation()}>
        <div className="sa-detail-header">
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
          <h3>Détail utilisateur</h3>
        </div>

        {/* Profil résumé */}
        <div className="sa-detail-profile-bar">
          <img src={user.avatar} alt={user.name} className="sa-avatar-lg" />
          <div className="sa-detail-profile-info">
            <h4>{user.name}</h4>
            <span className="sa-detail-matricule">{user.matricule || '—'}</span>
            <span className="sa-detail-role-badge" style={{ background: roleInfo.color + '22', color: roleInfo.color }}>{roleInfo.label}</span>
          </div>
          <span className={`sa-badge ${STATUS_INFO[user.status]?.class}`}>{STATUS_INFO[user.status]?.label}</span>
        </div>

        {/* Onglets */}
        <div className="sa-detail-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`sa-detail-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}{t.alert && <span className="sa-detail-tab-dot" />}
            </button>
          ))}
        </div>

        <div className="sa-detail-body">
          {/* ── Info ── */}
          {activeTab === 'info' && (
            <>
              <div className="sa-detail-section">
                <div className="sa-detail-row"><span className="sa-detail-key">Email</span><span>{user.email}</span></div>
                <div className="sa-detail-row"><span className="sa-detail-key">Téléphone</span><span>{user.phone || '—'}</span></div>
                <div className="sa-detail-row"><span className="sa-detail-key">Société</span><span>{getCompanyName(user.companyId)}</span></div>
                <div className="sa-detail-row"><span className="sa-detail-key">Direction/Service</span><span>{getDeptName(user.departmentId)}</span></div>
                <div className="sa-detail-row"><span className="sa-detail-key">En ligne</span><span className={`sa-badge ${user.online ? 'sa-badge--green' : 'sa-badge--gray'}`}>{user.online ? 'Oui' : 'Non'}</span></div>
                <div className="sa-detail-row"><span className="sa-detail-key">Créé le</span><span>{format(new Date(user.createdAt), 'd MMM yyyy', { locale: fr })}</span></div>
                <div className="sa-detail-row"><span className="sa-detail-key">Dernière connexion</span><span>{user.lastLogin ? format(new Date(user.lastLogin), 'd MMM HH:mm', { locale: fr }) : '—'}</span></div>
                <div className="sa-detail-row"><span className="sa-detail-key">Sessions actives</span><span>{user.sessions?.length || 0}</span></div>
                <div className="sa-detail-row"><span className="sa-detail-key">2FA</span><span className={`sa-badge ${user.twoFactorEnabled ? 'sa-badge--green' : 'sa-badge--gray'}`}>{user.twoFactorEnabled ? 'Activé' : 'Désactivé'}</span></div>
              </div>
              <div className="sa-detail-section">
                <span className="sa-detail-section-title">Changer le rôle</span>
                <div className="sa-role-select-list">
                  {roles.filter(r => r.id !== 'superAdmin').map(r => (
                    <button key={r.id} className={`sa-role-select-item ${user.role === r.id ? 'active' : ''}`} style={{ '--role-color': r.color }} onClick={() => changeUserRole(user.id, r.id)}>
                      <span className="sa-role-dot" style={{ background: r.color }} />{r.label}{user.role === r.id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sa-detail-section">
                <span className="sa-detail-section-title">Actions</span>
                <div className="sa-detail-actions">
                  {user.status === 'active' && <button className="sa-btn sa-btn--danger" onClick={() => setConfirmAction({ type: 'suspend' })}><UserX size={14} /> Suspendre</button>}
                  {user.status === 'suspended' && <button className="sa-btn sa-btn--primary" onClick={() => changeUserStatus(user.id, 'active')}><UserCheck size={14} /> Réactiver</button>}
                  {['active','suspended'].includes(user.status) && <button className="sa-btn sa-btn--danger" onClick={() => setConfirmAction({ type: 'exit' })}><UserMinus size={14} /> Marquer Sorti</button>}
                  {user.status === 'exited' && <button className="sa-btn sa-btn--ghost" onClick={() => changeUserStatus(user.id, 'archived')}>Archiver</button>}
                  {(user.sessions?.length > 0) && <button className="sa-btn sa-btn--danger" onClick={() => setConfirmAction({ type: 'revoke' })}><LogOut size={14} /> Déconnecter partout</button>}
                </div>
              </div>
            </>
          )}

          {/* ── Appareils ── */}
          {activeTab === 'devices' && (
            <div className="sa-detail-section">
              {(!user.devices || user.devices.length === 0)
                ? <p className="sa-empty">Aucun appareil enregistré.</p>
                : user.devices.map(device => (
                  <div key={device.id} className="sa-device-detail-row">
                    <div className="sa-device-icon">{device.type === 'mobile' ? <Smartphone size={16}/> : <Monitor size={16}/>}</div>
                    <div className="sa-device-detail-info">
                      <span className="sa-device-label">{device.label}</span>
                      <span className="sa-device-os">{device.os}</span>
                      <span className="sa-device-date">Dernière activité : {format(new Date(device.lastActive), 'd MMM HH:mm', { locale: fr })}</span>
                    </div>
                    <div className="sa-device-actions">
                      {device.active && <span className="sa-badge sa-badge--green" style={{ fontSize: 10 }}>Active</span>}
                      <button className={`sa-device-approve-btn ${device.approved === false ? 'revoked' : 'approved'}`} onClick={() => toggleDeviceApproval(user.id, device.id, device.approved === false)}>
                        {device.approved !== false ? <><CheckCircle size={13}/> Approuvé</> : <><XCircle size={13}/> Révoqué</>}
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── Départ / Sortie ── */}
          {activeTab === 'departure' && (
            <>
              <div className="sa-detail-section">
                <span className="sa-detail-section-title"><ClipboardList size={13}/> Tâches ouvertes ({openTasks.length})</span>
                {openTasks.length === 0
                  ? <p className="sa-empty" style={{ padding:'8px 0' }}>Aucune tâche ouverte.</p>
                  : <div className="sa-open-tasks-list">
                      {openTasks.map(t => (
                        <div key={t.id} className="sa-open-task-row">
                          <div className="sa-open-task-info">
                            <span className="sa-open-task-title">{t.title}</span>
                            <span className="sa-open-task-meta">{t.priority} · {t.dueDate ? format(new Date(t.dueDate),'d MMM yyyy',{locale:fr}) : '—'}</span>
                          </div>
                          <span className={`sa-badge ${t.status === 'late' ? 'sa-badge--red' : 'sa-badge--orange'}`}>{t.status}</span>
                        </div>
                      ))}
                    </div>
                }
              </div>
              {openTasks.length > 0 && (
                <div className="sa-detail-section">
                  <span className="sa-detail-section-title"><ArrowRightLeft size={13}/> Transfert en masse</span>
                  {transferred !== null && (
                    <div className="sa-transfer-success"><CheckCircle size={14}/> {transferred} tâche(s) transférée(s).</div>
                  )}
                  <div className="sa-transfer-row">
                    <select className="sa-transfer-select" value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                      <option value="">— Sélectionner un remplaçant —</option>
                      {colleagues.map(u => <option key={u.id} value={u.id}>{u.name} ({getRoleInfo(u.role).label})</option>)}
                    </select>
                    <button className="sa-btn sa-btn--primary sa-btn--sm" disabled={!transferTo} onClick={handleBulkTransfer}>
                      <ArrowRightLeft size={13}/> Transférer {openTasks.length} tâche(s)
                    </button>
                  </div>
                  <p className="sa-transfer-note">L'ancien responsable est conservé dans l'historique de chaque tâche.</p>
                </div>
              )}
              {user.status !== 'exited'
                ? (
                  <div className="sa-detail-section">
                    <span className="sa-detail-section-title"><AlertTriangle size={13}/> Procédure de sortie</span>
                    <p className="sa-departure-note">Bloque immédiatement l'accès sur tous les appareils, révoque toutes les sessions et préserve les données professionnelles.</p>
                    <button className="sa-btn sa-btn--danger" onClick={() => setConfirmAction({ type: 'exit' })}>
                      <UserMinus size={14}/> Confirmer la sortie de {user.name}
                    </button>
                  </div>
                ) : (
                  <div className="sa-detail-section">
                    <div className="sa-departed-info">
                      <CheckCircle size={16} style={{ color:'#4ade80' }}/>
                      <span>Sorti le {user.exitedAt ? format(new Date(user.exitedAt),'d MMM yyyy',{locale:fr}) : '—'}. Accès bloqué.</span>
                    </div>
                  </div>
                )
              }
            </>
          )}
        </div>

        {confirmAction?.type === 'suspend' && <ConfirmModal message={`Suspendre ${user.name} ?`} confirmLabel="Suspendre" onClose={() => setConfirmAction(null)} onConfirm={() => { changeUserStatus(user.id,'suspended','Décision super admin.'); setConfirmAction(null); }} />}
        {confirmAction?.type === 'exit'    && <ConfirmModal message={`Marquer ${user.name} comme "Sorti" ? Accès définitivement bloqué.`} confirmLabel="Confirmer la sortie" onClose={() => setConfirmAction(null)} onConfirm={() => { changeUserStatus(user.id,'exited','Départ définitif.'); setConfirmAction(null); }} />}
        {confirmAction?.type === 'revoke'  && <ConfirmModal message={`Déconnecter ${user.name} de tous ses appareils ?`} confirmLabel="Déconnecter" onClose={() => setConfirmAction(null)} onConfirm={() => { revokeAllUserSessions(user.id); setConfirmAction(null); }} />}
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function UsersManagement() {
  const { users, createUser } = useSuperAdmin();
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterComp]  = useState('all');
  const [showFilters, setShowFilters]   = useState(false);
  const [modal, setModal]               = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.matricule||'').toLowerCase().includes(q);
    return matchSearch
      && (filterRole    === 'all' || u.role      === filterRole)
      && (filterStatus  === 'all' || u.status    === filterStatus)
      && (filterCompany === 'all' || u.companyId === filterCompany);
  });

  return (
    <div className="sa-page">
      <div className="sa-toolbar">
        <div className="sa-search-wrap">
          <Search size={15} className="sa-search-icon"/>
          <input className="sa-search-input" placeholder="Nom, email, matricule…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <button className={`sa-btn sa-btn--ghost ${showFilters ? 'active':''}`} onClick={() => setShowFilters(v=>!v)}>
          <Filter size={14}/> Filtres <ChevronDown size={12}/>
        </button>
        <button className="sa-btn sa-btn--primary" onClick={() => setModal({ type:'create' })}>
          <Plus size={15}/> Inviter un utilisateur
        </button>
      </div>

      {showFilters && (
        <div className="sa-filters-bar">
          <div className="sa-filter-group">
            <label>Rôle</label>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="all">Tous</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="sa-filter-group">
            <label>Statut</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tous</option>
              {Object.entries(STATUS_INFO).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="sa-filter-group">
            <label>Société</label>
            <select value={filterCompany} onChange={e => setFilterComp(e.target.value)}>
              <option value="all">Toutes</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="sa-btn sa-btn--ghost sa-btn--sm" onClick={() => { setFilterRole('all'); setFilterStatus('all'); setFilterComp('all'); }}>
            <X size={13}/> Réinitialiser
          </button>
        </div>
      )}

      <div className="sa-results-count">{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</div>

      <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Utilisateur</th><th>Rôle</th><th>Société</th><th>Statut</th><th>Dernière connexion</th><th>Sessions</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="sa-table-empty">Aucun utilisateur trouvé.</td></tr>}
            {filtered.map(u => {
              const ri = getRoleInfo(u.role);
              const si = STATUS_INFO[u.status] || { label: u.status, class:'sa-badge--gray' };
              return (
                <tr key={u.id} className="sa-table-row" onClick={() => setSelectedUser(u)}>
                  <td>
                    <div className="sa-user-cell">
                      <div className="sa-user-avatar-wrap">
                        <img src={u.avatar} alt={u.name} className="sa-avatar-sm"/>
                        {u.online && <span className="sa-online-dot"/>}
                      </div>
                      <div><div className="sa-user-name">{u.name}</div><div className="sa-user-email">{u.email}</div></div>
                    </div>
                  </td>
                  <td><span className="sa-role-pill" style={{ background: ri.color+'22', color: ri.color }}>{ri.label}</span></td>
                  <td className="sa-table-sub">{getCompanyName(u.companyId)}</td>
                  <td><span className={`sa-badge ${si.class}`}>{si.label}</span></td>
                  <td className="sa-table-sub">{u.lastLogin ? format(new Date(u.lastLogin),'d MMM HH:mm',{locale:fr}) : '—'}</td>
                  <td className="sa-table-sub">{u.sessions?.length || 0}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="sa-icon-btn" onClick={() => setSelectedUser(u)}><Eye size={15}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal?.type === 'create' && (
        <UserModal user={null} onClose={() => setModal(null)} onSave={(form) => { createUser(form); setModal(null); }}/>
      )}
      {selectedUser && (
        <UserDetail user={users.find(u => u.id === selectedUser.id) || selectedUser} onClose={() => setSelectedUser(null)}/>
      )}
    </div>
  );
}
