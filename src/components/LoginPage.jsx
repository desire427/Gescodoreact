import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck, Check } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();

  const [email,    setEmail]    = useState('superadmin@gescodo.ci');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError("L'adresse email est requise."); return; }
    if (!password)     { setError('Le mot de passe est requis.'); return; }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 401) {
        setError(detail || 'Email ou mot de passe incorrect.');
      } else if (err?.response?.status === 403) {
        setError(detail || 'Compte suspendu ou inaccessible.');
      } else if (!navigator.onLine) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        setError(detail || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-intro" aria-label="Présentation de GESCODO">
        <div className="login-intro-top">
          <div className="login-brand">
            <span className="login-brand-mark">G</span>
            <span>GESCODO</span>
          </div>
          <span className="login-intro-label">Plateforme de pilotage</span>
        </div>
        <div className="login-intro-copy">
          <p className="login-kicker">Un espace de travail maîtrisé</p>
          <h1>De la décision<br />à l’exécution.</h1>
          <p>
            Centralisez les réunions, décisions, tâches et suivis dans un environnement conçu pour les organisations exigeantes.
          </p>
        </div>
        <div className="login-principles">
          <span><Check size={15} /> Décisions traçables</span>
          <span><Check size={15} /> Responsabilités claires</span>
          <span><Check size={15} /> Suivi des échéances</span>
        </div>
        <p className="login-intro-footer">Communication interne · Réunions · Pilotage opérationnel</p>
      </section>

      <section className="login-access">
        <div className="login-access-panel">
          <div className="login-access-heading">
            <span className="login-access-security"><ShieldCheck size={16} /> Accès sécurisé</span>
            <h2>Bienvenue</h2>
            <p>Connectez-vous à votre espace professionnel.</p>
          </div>
          <form className="login-form" onSubmit={handleLogin} noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="email">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="votre@email.ci"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="login-field">
            <label className="login-label" htmlFor="password">
              Mot de passe
            </label>
            <div className="login-input-wrap">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <>
                Accéder à mon espace
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
        <div className="login-footer">
          <ShieldCheck size={14} />
          <span>Réservé aux collaborateurs autorisés</span>
        </div>
        </div>
        <p className="login-access-note">GESCODO · Accès professionnel</p>
      </section>
    </div>
  );
}
