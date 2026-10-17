import { useState } from 'react';
import { Smartphone, Monitor, LogOut, Search, Shield, Wifi, WifiOff } from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmModal } from './Companies';

function DeviceIcon({ type }) {
  return type === 'mobile' ? <Smartphone size={15} /> : <Monitor size={15} />;
}

function SessionRow({ session, user, onRevoke }) {
  const [confirm, setConfirm] = useState(false);
  const deviceId = session.deviceId ?? session.device;
  const device   = user?.devices?.find(d => d.id === deviceId);
  const isActive = session.active ?? session.is_active ?? false;

  return (
    <>
      <tr className={`gc-table-row ${!isActive ? 'gc-table-row--dimmed' : ''}`}>
        <td>
          <div className="gc-user-cell">
            <div className="gc-user-avatar-wrap">
              <img src={user?.avatar} alt={user?.name} className="gc-user-avatar" />
              {user?.online && <span className="gc-online-dot" />}
            </div>
            <div>
              <div className="gc-user-name">{user?.name || '—'}</div>
              <div className="gc-user-email">{user?.email || '—'}</div>
            </div>
          </div>
        </td>
        <td>
          <div className="gc-device-cell">
            <div className="gc-device-icon-sm"><DeviceIcon type={device?.type || 'web'} /></div>
            <div>
              <div className="gc-user-name">{device?.label || 'Appareil inconnu'}</div>
              <div className="gc-table-sub">{device?.os || '—'}</div>
            </div>
          </div>
        </td>
        <td className="gc-table-sub">{session.ip || session.ip_address || '—'}</td>
        <td className="gc-table-sub">{session.location || '—'}</td>
        <td className="gc-table-sub">
          {session.startedAt || session.created_at
            ? format(new Date(session.startedAt ?? session.created_at), 'd MMM HH:mm', { locale: fr })
            : '—'}
        </td>
        <td className="gc-table-sub">
          {session.lastActivity || session.startedAt || session.created_at
            ? format(new Date(session.lastActivity ?? session.startedAt ?? session.created_at), 'd MMM HH:mm', { locale: fr })
            : '—'}
        </td>
        <td>
          {isActive
            ? <span className="gc-badge gc-badge--success"><Wifi size={10} /> Active</span>
            : <span className="gc-badge gc-badge--muted"><WifiOff size={10} /> Fermée</span>
          }
        </td>
        <td>
          {isActive && (
            <button className="gc-btn gc-btn--danger" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setConfirm(true)}>
              <LogOut size={12} /> Révoquer
            </button>
          )}
        </td>
      </tr>
      {confirm && (
        <ConfirmModal
          message={`Révoquer la session de ${user?.name} sur "${device?.label || 'cet appareil'}" ?`}
          confirmLabel="Révoquer"
          onClose={() => setConfirm(false)}
          onConfirm={() => { onRevoke(session.id); setConfirm(false); }}
        />
      )}
    </>
  );
}

export default function SessionsDevices() {
  const { sessions, users, revokeSession, revokeAllUserSessions } = useSuperAdmin();
  const [search,         setSearch]       = useState('');
  const [filterActive,   setFilterActive] = useState('all');
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(null);

  const filtered = sessions.filter(s => {
    const user    = users.find(u => u.id === (s.userId ?? s.user));
    const q       = search.toLowerCase();
    const isActive = s.active ?? s.is_active ?? false;
    return (
      ((user?.name || '').toLowerCase().includes(q) ||
       (s.ip || s.ip_address || '').includes(q) ||
       (s.location || '').toLowerCase().includes(q)) &&
      (filterActive === 'all' ||
       (filterActive === 'active'   &&  isActive) ||
       (filterActive === 'inactive' && !isActive))
    );
  });

  const activeSessions        = sessions.filter(s => s.active ?? s.is_active ?? false);
  const totalDevices          = users.reduce((sum, u) => sum + (u.devices?.length || 0), 0);
  const usersWithActiveSessions = users.filter(u =>
    sessions.some(s => (s.userId ?? s.user) === u.id && (s.active ?? s.is_active ?? false))
  );

  const FILTERS = [
    { id: 'all', label: 'Toutes' }, { id: 'active', label: 'Actives' }, { id: 'inactive', label: 'Fermées' },
  ];

  return (
    <div className="gc-page">
      {/* KPIs */}
      <div className="gc-kpi-grid">
        <div className="gc-kpi-card" style={{ '--kpi-accent': '#059669' }}>
          <div className="gc-kpi-icon"><Wifi size={19} /></div>
          <div className="gc-kpi-body">
            <span className="gc-kpi-value">{activeSessions.length}</span>
            <span className="gc-kpi-label">Sessions actives</span>
          </div>
        </div>
        <div className="gc-kpi-card" style={{ '--kpi-accent': '#2563eb' }}>
          <div className="gc-kpi-icon"><Smartphone size={19} /></div>
          <div className="gc-kpi-body">
            <span className="gc-kpi-value">{totalDevices}</span>
            <span className="gc-kpi-label">Appareils enregistrés</span>
          </div>
        </div>
        <div className="gc-kpi-card" style={{ '--kpi-accent': '#dc2626' }}>
          <div className="gc-kpi-icon"><Shield size={19} /></div>
          <div className="gc-kpi-body">
            <span className="gc-kpi-value">{usersWithActiveSessions.length}</span>
            <span className="gc-kpi-label">Utilisateurs connectés</span>
          </div>
        </div>
      </div>

      {/* Déconnexion par utilisateur */}
      {usersWithActiveSessions.length > 0 && (
        <section className="gc-section gc-card">
          <div className="gc-card-header">
            <h3 className="gc-card-title"><Shield size={15} />Déconnexion par utilisateur</h3>
          </div>
          <div className="gc-bulk-sessions">
            {usersWithActiveSessions.map(u => {
              const count = sessions.filter(s => (s.userId ?? s.user) === u.id && (s.active ?? s.is_active ?? false)).length;
              return (
                <div key={u.id} className="gc-bulk-row">
                  <div className="gc-user-cell">
                    <div className="gc-user-avatar-wrap">
                      <img src={u.avatar} alt={u.name} className="gc-user-avatar" />
                      {u.online && <span className="gc-online-dot" />}
                    </div>
                    <div>
                      <div className="gc-user-name">{u.name}</div>
                      <div className="gc-table-sub">{count} session{count > 1 ? 's' : ''} active{count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <button className="gc-btn gc-btn--danger" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setConfirmRevokeAll(u)}>
                    <LogOut size={12} /> Tout déconnecter
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Toolbar */}
      <div className="gc-toolbar">
        <div className="gc-search-wrap">
          <Search size={14} className="gc-search-icon" />
          <input className="gc-search-input" placeholder="Utilisateur, IP, localisation…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="gc-filter-pills">
          {FILTERS.map(f => (
            <button key={f.id} className={`gc-filter-pill ${filterActive === f.id ? 'gc-filter-pill--active' : ''}`} onClick={() => setFilterActive(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gc-table-wrap">
        <table className="gc-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Appareil</th>
              <th>Adresse IP</th>
              <th>Localisation</th>
              <th>Ouverture</th>
              <th>Dernière activité</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="gc-table-empty">Aucune session trouvée.</td></tr>}
            {filtered.map(s => (
              <SessionRow
                key={s.id}
                session={s}
                user={users.find(u => u.id === (s.userId ?? s.user))}
                onRevoke={revokeSession}
              />
            ))}
          </tbody>
        </table>
      </div>

      {confirmRevokeAll && (
        <ConfirmModal
          message={`Déconnecter ${confirmRevokeAll.name} de tous ses appareils ? Toutes ses sessions actives seront révoquées immédiatement.`}
          confirmLabel="Déconnecter partout"
          onClose={() => setConfirmRevokeAll(null)}
          onConfirm={() => { revokeAllUserSessions(confirmRevokeAll.id); setConfirmRevokeAll(null); }}
        />
      )}
    </div>
  );
}
