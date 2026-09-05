import { useState } from 'react';
import { Smartphone, Monitor, LogOut, Search, Shield, Wifi, WifiOff } from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConfirmModal } from './Companies';

function DeviceIcon({ type }) {
  return type === 'mobile'
    ? <Smartphone size={16} />
    : <Monitor size={16} />;
}

function SessionRow({ session, user, onRevoke }) {
  const [confirm, setConfirm] = useState(false);
  const device = user?.devices?.find(d => d.id === session.deviceId);

  return (
    <>
      <tr className={`sa-table-row ${!session.active ? 'sa-row--inactive' : ''}`}>
        <td>
          <div className="sa-user-cell">
            <div className="sa-user-avatar-wrap">
              <img src={user?.avatar} alt={user?.name} className="sa-avatar-sm" />
              {user?.online && <span className="sa-online-dot" />}
            </div>
            <div>
              <div className="sa-user-name">{user?.name || '—'}</div>
              <div className="sa-user-email">{user?.email || '—'}</div>
            </div>
          </div>
        </td>
        <td>
          <div className="sa-device-cell">
            <div className="sa-device-icon">
              <DeviceIcon type={device?.type || 'web'} />
            </div>
            <div>
              <div className="sa-device-label">{device?.label || 'Appareil inconnu'}</div>
              <div className="sa-device-os">{device?.os || '—'}</div>
            </div>
          </div>
        </td>
        <td className="sa-table-sub">{session.ip}</td>
        <td className="sa-table-sub">{session.location}</td>
        <td className="sa-table-sub">
          {format(new Date(session.startedAt), 'd MMM HH:mm', { locale: fr })}
        </td>
        <td className="sa-table-sub">
          {format(new Date(session.lastActivity), 'd MMM HH:mm', { locale: fr })}
        </td>
        <td>
          {session.active ? (
            <span className="sa-badge sa-badge--green">
              <Wifi size={11} /> Active
            </span>
          ) : (
            <span className="sa-badge sa-badge--gray">
              <WifiOff size={11} /> Fermée
            </span>
          )}
        </td>
        <td>
          {session.active && (
            <button
              className="sa-btn sa-btn--danger sa-btn--sm"
              onClick={() => setConfirm(true)}
              title="Révoquer cette session"
            >
              <LogOut size={13} /> Révoquer
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
  const [search, setSearch]     = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(null);

  const activeSessions = sessions.filter(s => {
    const user = users.find(u => u.id === s.userId);
    const q = search.toLowerCase();
    const matchSearch =
      (user?.name || '').toLowerCase().includes(q) ||
      s.ip.includes(q) ||
      (s.location || '').toLowerCase().includes(q);
    const matchFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && s.active) ||
      (filterActive === 'inactive' && !s.active);
    return matchSearch && matchFilter;
  });

  // Utilisateurs avec sessions actives groupés
  const usersWithActiveSessions = users.filter(u => u.sessions?.length > 0);

  return (
    <div className="sa-page">

      {/* Résumé */}
      <div className="sa-kpi-grid sa-kpi-grid--sm" style={{ marginBottom: '1.5rem' }}>
        <div className="sa-kpi-card" style={{ '--kpi-color': '#059669' }}>
          <div className="sa-kpi-icon"><Wifi size={20} /></div>
          <div className="sa-kpi-body">
            <span className="sa-kpi-value">{sessions.filter(s => s.active).length}</span>
            <span className="sa-kpi-label">Sessions actives</span>
          </div>
        </div>
        <div className="sa-kpi-card" style={{ '--kpi-color': '#2563eb' }}>
          <div className="sa-kpi-icon"><Smartphone size={20} /></div>
          <div className="sa-kpi-body">
            <span className="sa-kpi-value">{users.reduce((sum, u) => sum + (u.devices?.length || 0), 0)}</span>
            <span className="sa-kpi-label">Appareils enregistrés</span>
          </div>
        </div>
        <div className="sa-kpi-card" style={{ '--kpi-color': '#dc2626' }}>
          <div className="sa-kpi-icon"><Shield size={20} /></div>
          <div className="sa-kpi-body">
            <span className="sa-kpi-value">{usersWithActiveSessions.length}</span>
            <span className="sa-kpi-label">Utilisateurs connectés</span>
          </div>
        </div>
      </div>

      {/* Actions globales */}
      {usersWithActiveSessions.length > 0 && (
        <section className="sa-section sa-card" style={{ marginBottom: '1.5rem' }}>
          <div className="sa-card-header">
            <h3 className="sa-card-title"><Shield size={15} />Déconnexion par utilisateur</h3>
          </div>
          <div className="sa-bulk-sessions">
            {usersWithActiveSessions.map(u => (
              <div key={u.id} className="sa-bulk-session-row">
                <div className="sa-user-cell">
                  <div className="sa-user-avatar-wrap">
                    <img src={u.avatar} alt={u.name} className="sa-avatar-sm" />
                    {u.online && <span className="sa-online-dot" />}
                  </div>
                  <div>
                    <div className="sa-user-name">{u.name}</div>
                    <div className="sa-user-email">{u.sessions.length} session{u.sessions.length > 1 ? 's' : ''} active{u.sessions.length > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <button
                  className="sa-btn sa-btn--danger sa-btn--sm"
                  onClick={() => setConfirmRevokeAll(u)}
                >
                  <LogOut size={13} /> Tout déconnecter
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tableau des sessions */}
      <div className="sa-toolbar">
        <div className="sa-search-wrap">
          <Search size={15} className="sa-search-icon" />
          <input
            className="sa-search-input"
            placeholder="Utilisateur, IP, localisation…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="sa-filter-tabs">
          <button className={`sa-filter-tab ${filterActive === 'all' ? 'active' : ''}`} onClick={() => setFilterActive('all')}>Toutes</button>
          <button className={`sa-filter-tab ${filterActive === 'active' ? 'active' : ''}`} onClick={() => setFilterActive('active')}>Actives</button>
          <button className={`sa-filter-tab ${filterActive === 'inactive' ? 'active' : ''}`} onClick={() => setFilterActive('inactive')}>Fermées</button>
        </div>
      </div>

      <div className="sa-table-wrap">
        <table className="sa-table">
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
            {activeSessions.length === 0 && (
              <tr><td colSpan={8} className="sa-table-empty">Aucune session trouvée.</td></tr>
            )}
            {activeSessions.map(s => (
              <SessionRow
                key={s.id}
                session={s}
                user={users.find(u => u.id === s.userId)}
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
