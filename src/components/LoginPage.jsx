import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { users, roles } from '../data/mockData';
import { Shield, Eye, EyeOff, LogIn, Building2 } from 'lucide-react';

// Mots de passe simulés pour la démo (ne jamais faire ça en prod)
const DEMO_PASSWORDS = {
  'u_superadmin':   'superadmin123',
  'u_admin_soc1':   'admin123',
  'u_admin_soc2':   'admin123',
  'u_admin_soc3':   'admin123',
  'u_dg_soc1':      'dg123',
  'u_mgr_fin':      'manager123',
  'u_mgr_ops':      'manager123',
  'u_rh_soc1':      'rh123',
  'u_emp_001':      'employe123',
  'u_emp_002':      'employe123',
  'u_emp_003':      'employe123',
  'u_emp_004':      'employe123',
  'u_audit':        'audit123',
};

function getRoleColor(roleId) {
  return roles.find(r => r.id === roleId)?.color || '#64748b';
}
function getRoleLabel(roleId) {
  return roles.find(r => r.id === roleId)?.label || roleId;
}

export default function LoginPage() {
  const { login } = useAuth();

  // Sélection du compte démo
  const [selectedUserId, setSelectedUserId] = useState('u_superadmin');
  const [password, setPassword]             = useState('');
  const [showPwd, setShowPwd]               = useState(false);
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);

  const selectableUsers = users.filter(u =>
    u.status !== 'exited' && u.status !== 'archived'
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600)); // Simule un appel réseau

    const expected = DEMO_PASSWORDS[selectedUserId];
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      setLoading(false);
      return;
    }
    if (password !== expected) {
      setError('Mot de passe incorrect.');
      setLoading(false);
      return;
    }

    const ok = login(selectedUserId);
    if (!ok) {
      setError('Compte suspendu ou inaccessible.');
    }
    setLoading(false);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />

      <div className="login-card">
        {/* Logo / Titre */}
        <div className="login-header">
          <div className="login-logo">
            <Building2 size={32} />
          </div>
          <h1 className="login-title">KAB Platform</h1>
          <p className="login-subtitle">Plateforme professionnelle de communication et de pilotage</p>
        </div>

        {/* Formulaire */}
        <form className="login-form" onSubmit={handleLogin}>

          {/* Sélecteur de compte démo */}
          <div className="login-field">
            <label className="login-label">Compte de démonstration</label>
            <div className="login-account-selector">
              {selectableUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  className={`login-account-item ${selectedUserId === u.id ? 'selected' : ''}`}
                  onClick={() => { setSelectedUserId(u.id); setPassword(''); setError(''); }}
                >
                  <img src={u.avatar} alt={u.name} className="login-account-avatar" />
                  <div className="login-account-info">
                    <span className="login-account-name">{u.name}</span>
                    <span
                      className="login-account-role"
                      style={{ color: getRoleColor(u.role) }}
                    >
                      {getRoleLabel(u.role)}
                    </span>
                  </div>
                  {selectedUserId === u.id && (
                    <div className="login-account-check">✓</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Identifiant affiché (readonly) */}
          {selectedUser && (
            <div className="login-field">
              <label className="login-label">Identifiant</label>
              <input
                type="text"
                className="login-input"
                value={selectedUser.email}
                readOnly
                style={{ opacity: 0.6, cursor: 'default' }}
              />
            </div>
          )}

          {/* Mot de passe */}
          <div className="login-field">
            <label className="login-label">Mot de passe</label>
            <div className="login-input-wrap">
              <input
                type={showPwd ? 'text' : 'password'}
                className="login-input"
                placeholder="Mot de passe"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Indice mot de passe démo */}
            {selectedUser && (
              <span className="login-hint">
                Démo : <code>{DEMO_PASSWORDS[selectedUser.id]}</code>
              </span>
            )}
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <>
                <LogIn size={18} />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Note sécurité */}
        <div className="login-footer">
          <Shield size={13} />
          <span>Accès réservé aux collaborateurs autorisés</span>
        </div>
      </div>
    </div>
  );
}
