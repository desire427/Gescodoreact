import { useEffect, useState, useRef } from 'react';
import {
  X, ChevronRight, Bell, Lock, MessageCircle, HelpCircle, LogOut,
  Moon, Sun, Smartphone, Globe, Database, Heart, Key, Archive,
  Star, Camera, Check, Info, ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

/* ─── Composant ligne paramètre ─────────────────────────────── */
function SettingsRow({ icon: Icon, label, description, value, onClick, danger, toggle, toggled, onToggle }) {
  return (
    <button className={`settings-row ${danger ? 'danger' : ''}`} onClick={onToggle || onClick}>
      {Icon && <div className={`settings-row-icon ${danger ? 'danger' : ''}`}><Icon size={18} /></div>}
      <div className="settings-row-body">
        <span className="settings-row-label">{label}</span>
        {description && <span className="settings-row-desc">{description}</span>}
      </div>
      {value && <span className="settings-row-value">{value}</span>}
      {toggle ? (
        <div className={`toggle ${toggled ? 'on' : 'off'}`}><div className="toggle-thumb" /></div>
      ) : (
        !danger && <ChevronRight size={16} className="settings-chevron" />
      )}
    </button>
  );
}

/* ─── Header sous-page ──────────────────────────────────────── */
function SubPageHeader({ title, onBack, rightAction }) {
  return (
    <div className="panel-header">
      <button className="icon-btn" onClick={onBack}><X size={20} /></button>
      <span className="panel-title">{title}</span>
      {rightAction}
    </div>
  );
}

/* ─── Page : Modifier le profil ─────────────────────────────── */
function EditProfile({ onBack }) {
  const { currentUser, updateProfile } = useApp();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [about, setAbout] = useState(currentUser.about);
  const [preview, setPreview] = useState(currentUser.avatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Veuillez choisir un fichier image.');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 10 Mo.');
      e.target.value = '';
      return;
    }
    setError('');
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(String(ev.target.result));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Le nom et l’adresse e-mail sont obligatoires.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const profile = await updateProfile({
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        about: about.trim(), avatarFile,
      });
      if (profile?.avatar) setPreview(profile.avatar);
      setAvatarFile(null);
      setSaved(true);
      setTimeout(() => { setSaved(false); onBack(); }, 700);
    } catch (saveError) {
      setSaved(false);
      const detail = saveError.response?.data;
      setError(typeof detail === 'string' ? detail : detail?.email || detail?.phone || detail?.detail || 'La mise à jour du profil a échoué.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-sub-page">
      <SubPageHeader
        title="Modifier le profil"
        onBack={onBack}
        rightAction={
          <button className="icon-btn" onClick={handleSave} title="Enregistrer" disabled={saving}>
            <Check size={20} style={{ color: saved ? 'var(--wa-green)' : 'var(--text-secondary)' }} />
          </button>
        }
      />

      {/* Avatar cliquable */}
      <div className="edit-profile-avatar" onClick={() => fileRef.current?.click()}>
        <img src={preview || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || currentUser.email)}`} alt="Photo" className="avatar avatar-xl" />
        <div className="avatar-photo-overlay">
          <Camera size={28} />
          <span>Modifier</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>

      <div className="edit-field">
        <label>Votre nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          autoFocus
          placeholder="Entrez votre nom"
        />
        <span className="field-count">{name.length}/200</span>
      </div>

      <div className="edit-field">
        <label>Adresse e-mail professionnelle</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required />
      </div>

      <div className="edit-field">
        <label>Infos</label>
        <input
          type="text"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={200}
          placeholder="Dites quelque chose sur vous"
        />
        <span className="field-count">{about.length}/200</span>
      </div>

      <div className="edit-field">
        <label>Téléphone</label>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} />
      </div>

      <div style={{ padding: '16px 20px' }}>
        {error && <p role="alert" style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</p>}
        <button className="btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}

/* ─── Page : Notifications ──────────────────────────────────── */
function NotificationsPage({ onBack }) {
  const { appSettings, updateAppSettings } = useApp();
  const [permissionError, setPermissionError] = useState('');
  const s = appSettings.notifications;
  const toggle = async (key) => {
    const enabling = !s[key];
    setPermissionError('');
    if (enabling && key.endsWith('_notif')) {
      if (!('Notification' in window)) {
        setPermissionError("Ce navigateur ne prend pas en charge les notifications système.");
        return;
      }
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
      if (permission !== 'granted') {
        setPermissionError("Autorisez les notifications dans votre navigateur pour les recevoir lorsque l'application est en arrière-plan.");
        return;
      }
    }
    updateAppSettings('notifications', { [key]: enabling });
  };

  return (
    <div className="settings-panel">
      <SubPageHeader title="Notifications" onBack={onBack} />
      <div className="settings-sections">
        {permissionError && <p role="alert" style={{ padding: '0 20px', color: '#b91c1c' }}>{permissionError}</p>}
        <div className="settings-section-title">Messages</div>
        <SettingsRow label="Notifications de messages" toggle toggled={s.msg_notif} onToggle={() => toggle('msg_notif')} />
        <SettingsRow label="Son" description="Son de notification" toggle toggled={s.msg_sound} onToggle={() => toggle('msg_sound')} />
        <SettingsRow label="Vibration" toggle toggled={s.msg_vibrate} onToggle={() => toggle('msg_vibrate')} />
        <SettingsRow label="Aperçu des messages" description="Afficher le contenu dans la notification" toggle toggled={s.msg_preview} onToggle={() => toggle('msg_preview')} />
        <div className="settings-section-title">Groupes</div>
        <SettingsRow label="Notifications de groupes" toggle toggled={s.group_notif} onToggle={() => toggle('group_notif')} />
        <SettingsRow label="Son" toggle toggled={s.group_sound} onToggle={() => toggle('group_sound')} />
        <SettingsRow label="Vibration" toggle toggled={s.group_vibrate} onToggle={() => toggle('group_vibrate')} />
        <div className="settings-section-title">Appels</div>
        <SettingsRow label="Notifications d'appels" toggle toggled={s.call_notif} onToggle={() => toggle('call_notif')} />
        <SettingsRow label="Sonnerie" toggle toggled={s.call_ringtone} onToggle={() => toggle('call_ringtone')} />
        <SettingsRow label="Vibration lors des appels" toggle toggled={s.call_vibrate} onToggle={() => toggle('call_vibrate')} />
      </div>
    </div>
  );
}

/* ─── Sélecteur visibilité ──────────────────────────────────── */
const VIS_OPTS = ['Tout le monde', 'Mes contacts', 'Personne'];

function VisibilitySelect({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="settings-row" style={{ position: 'relative' }}>
      <div className="settings-row-body"><span className="settings-row-label">{label}</span></div>
      <button className="visibility-select-btn" onClick={() => setOpen(!open)}>
        <span>{value}</span><ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown-menu" style={{ right: 0, top: '100%', minWidth: 210, zIndex: 200 }}>
            {VIS_OPTS.map((opt) => (
              <button key={opt} className="dropdown-item" onClick={() => { onChange(opt); setOpen(false); }}>
                <span>{opt}</span>
                {value === opt && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--wa-green)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page : Confidentialité ────────────────────────────────── */
function PrivacyPage({ onBack }) {
  const { appSettings, updateAppSettings, blockedContacts, contacts } = useApp();
  const s = appSettings.privacy;
  const set = (key) => (val) => updateAppSettings('privacy', { [key]: val });
  const toggle = (key) => updateAppSettings('privacy', { [key]: !s[key] });

  return (
    <div className="settings-panel">
      <SubPageHeader title="Confidentialité" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Qui peut voir mes informations</div>
        <VisibilitySelect label="Dernière connexion et en ligne" value={VIS_OPTS.includes(s.lastSeen) ? s.lastSeen : 'Mes contacts'} onChange={set('lastSeen')} />
        <VisibilitySelect label="Photo de profil" value={VIS_OPTS.includes(s.profilePhoto) ? s.profilePhoto : 'Mes contacts'} onChange={set('profilePhoto')} />
        <VisibilitySelect label="Infos" value={VIS_OPTS.includes(s.about) ? s.about : 'Mes contacts'} onChange={set('about')} />
        <VisibilitySelect label="Ajout aux groupes" value={VIS_OPTS.includes(s.groups) ? s.groups : 'Mes contacts'} onChange={set('groups')} />
        <VisibilitySelect label="Statuts" value={VIS_OPTS.includes(s.status) ? s.status : 'Mes contacts'} onChange={set('status')} />
        <div className="settings-section-title">Messages</div>
        <SettingsRow label="Confirmation de lecture" description="Si désactivées, vous ne verrez pas non plus celles des autres" toggle toggled={s.readReceipts} onToggle={() => toggle('readReceipts')} />
        <SettingsRow label="Statut en ligne" description="Choisir qui peut voir quand vous êtes en ligne" toggle toggled={s.onlineStatus} onToggle={() => toggle('onlineStatus')} />
        <div className="settings-section-title">Contacts bloqués</div>
        <SettingsRow
          label="Contacts bloqués"
          description={blockedContacts.length
            ? blockedContacts.map(id => contacts.find(contact => String(contact.id) === String(id))?.name || `Utilisateur ${id}`).join(', ')
            : 'Aucun contact bloqué'}
        />
      </div>
    </div>
  );
}

/* ─── Page : Sécurité ───────────────────────────────────────── */
function SecurityPage({ onBack }) {
  const { goToLogin } = useAuth();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const { data } = await authApi.changePassword(form);
      setSuccess(data.detail);
      setTimeout(() => goToLogin(), 1200);
    } catch (requestError) {
      const details = requestError.response?.data;
      setError(typeof details === 'string'
        ? details
        : details?.current_password || details?.new_password || details?.confirm_password || details?.detail || 'Le changement de mot de passe a échoué.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-panel">
      <SubPageHeader title="Sécurité" onBack={onBack} />
      <form className="settings-sections" onSubmit={changePassword}>
        <div className="settings-section-title">Modifier le mot de passe du compte KAB</div>
        <p style={{ padding: '0 20px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>
          Le changement s’applique à toute la plateforme et déconnectera vos sessions actives.
        </p>
        {[
          ['current_password', 'Mot de passe actuel'],
          ['new_password', 'Nouveau mot de passe'],
          ['confirm_password', 'Confirmer le nouveau mot de passe'],
        ].map(([key, label]) => (
          <div className="edit-field" key={key}>
            <label htmlFor={`security-${key}`}>{label}</label>
            <input
              id={`security-${key}`}
              type="password"
              autoComplete={key === 'current_password' ? 'current-password' : 'new-password'}
              minLength={key === 'current_password' ? undefined : 8}
              required
              value={form[key]}
              onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}
            />
          </div>
        ))}
        {error && <p role="alert" style={{ padding: '0 20px', color: '#b91c1c' }}>{error}</p>}
        {success && <p role="status" style={{ padding: '0 20px', color: '#15803d' }}>{success}</p>}
        <div style={{ padding: 20 }}>
          <button className="btn-primary" type="submit" style={{ width: '100%' }} disabled={saving}>
            {saving ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Page : Discussions ────────────────────────────────────── */
function ChatSettingsPage({ onBack }) {
  const { darkMode, setDarkMode, appSettings, updateAppSettings } = useApp();
  const s = appSettings.chat;
  const toggle = (key) => updateAppSettings('chat', { [key]: !s[key] });
  const SIZES = ['Petit', 'Moyen', 'Grand'];

  return (
    <div className="settings-panel">
      <SubPageHeader title="Discussions" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Affichage</div>
        <div className="settings-row">
          <div className="settings-row-body"><span className="settings-row-label">Taille de la police</span></div>
          <div className="font-size-selector">
            {SIZES.map((sz) => (
              <button key={sz} className={`font-size-btn ${s.fontSize === sz ? 'active' : ''}`} onClick={() => updateAppSettings('chat', { fontSize: sz })}>{sz}</button>
            ))}
          </div>
        </div>
        <SettingsRow label="Thème" description={darkMode ? 'Sombre' : 'Clair'} icon={darkMode ? Moon : Sun} toggle toggled={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        <div className="settings-section-title">Saisie</div>
        <SettingsRow label="Touche Entrée pour envoyer" description={s.enterToSend ? 'Entrée envoie · Maj + Entrée ajoute une ligne' : 'Entrée ajoute une ligne · envoi avec le bouton'} toggle toggled={s.enterToSend} onToggle={() => toggle('enterToSend')} />
        <div className="settings-section-title">Médias</div>
        <SettingsRow label="Chargement automatique des images" description="Afficher les images reçues sans action manuelle" toggle toggled={s.mediaAutoDownload} onToggle={() => toggle('mediaAutoDownload')} />
      </div>
    </div>
  );
}

/* ─── Page : Langue ─────────────────────────────────────────── */
function LanguagePage({ onBack }) {
  const { appSettings, updateAppSettings } = useApp();
  return (
    <div className="settings-panel">
      <SubPageHeader title="Langue" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Langue de l’interface</div>
        <button className="settings-row" onClick={() => updateAppSettings('language', 'Français')}>
          <div className="settings-row-body"><span className="settings-row-label">Français</span></div>
          {appSettings.language === 'Français' && <Check size={18} style={{ color: 'var(--wa-green)', flexShrink: 0 }} />}
        </button>
        <p style={{ padding: '0 20px', color: 'var(--text-secondary)', fontSize: 13 }}>
          L’interface est actuellement disponible en français.
        </p>
      </div>
    </div>
  );
}

/* ─── Page : Appareils connectés ────────────────────────────── */
function DevicesPage({ onBack }) {
  const [linked, setLinked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    authApi.sessions().then(({ data }) => {
      if (active) setLinked(data);
    }).catch(requestError => {
      if (active) setError(requestError.response?.data?.detail || 'Impossible de charger vos sessions.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const revoke = async id => {
    setError('');
    try {
      await authApi.revokeSession(id);
      setLinked(previous => previous.map(session =>
        session.id === id ? { ...session, is_active: false } : session
      ));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'La révocation de cette session a échoué.');
    }
  };

  return (
    <div className="settings-panel">
      <SubPageHeader title="Appareils connectés" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Sessions de votre compte</div>
        {error && <p role="alert" style={{ padding: '0 20px', color: '#b91c1c' }}>{error}</p>}
        {loading ? <p style={{ padding: 20, color: 'var(--text-secondary)' }}>Chargement des sessions…</p> : linked.length === 0 ? (
          <div className="settings-empty-box">
            <Smartphone size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Aucune session enregistrée.
            </p>
          </div>
        ) : linked.map(session => (
          <div key={session.id} className="settings-row">
            <div className="settings-row-body">
              <span className="settings-row-label">
                {session.device_label || 'Navigateur'}{session.is_current ? ' · Session actuelle' : ''}
              </span>
              <span className="settings-row-desc">
                {session.is_active ? 'Active' : 'Révoquée'} · {new Date(session.created_at).toLocaleString()}
                {session.ip_address ? ` · ${session.ip_address}` : ''}
              </span>
            </div>
            {session.is_active && !session.is_current && (
              <button type="button" className="icon-btn" onClick={() => revoke(session.id)} title="Révoquer cette session">
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page : Stockage ───────────────────────────────────────── */
function StoragePage({ onBack }) {
  const { appSettings, updateAppSettings } = useApp();
  const s = appSettings.chat;
  const toggle = key => updateAppSettings('chat', { [key]: !s[key] });
  return (
    <div className="settings-panel">
      <SubPageHeader title="Stockage et données" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Gestion du stockage</div>
        <div className="settings-empty-box">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Les médias restent stockés sur la plateforme. Utilisez les options ci-dessous pour gérer leur téléchargement automatique.
          </p>
        </div>
        <div className="settings-section-title">Téléchargement automatique</div>
        <SettingsRow label="Sur Wi-Fi" description="Charger automatiquement les images" toggle toggled={s.wifiAutoDownload ?? true} onToggle={() => toggle('wifiAutoDownload')} />
        <SettingsRow label="Données mobiles" description="Charger automatiquement les images" toggle toggled={s.mobileAutoDownload ?? false} onToggle={() => toggle('mobileAutoDownload')} />
        <div className="settings-section-title">Réseau</div>
        <SettingsRow label="Réduire la consommation" description="Désactiver le chargement automatique des images" toggle toggled={s.reduceDataUsage ?? false} onToggle={() => toggle('reduceDataUsage')} />
      </div>
    </div>
  );
}

/* ─── Page : Messages importants ────────────────────────────── */
function StarredMessagesPage({ onBack }) {
  const { starredMessages, messages, getConversation, getContact, openConversation, setShowSettings } = useApp();
  const all = starredMessages.map(({ convId, msgId, message }) => {
    const msg = (messages[String(convId)] || []).find((m) => m.id === msgId) || message;
    const conv = getConversation(convId);
    const contact = conv ? getContact(conv.contactId) : null;
    return msg ? { msg, contact, convId } : null;
  }).filter(Boolean);

  return (
    <div className="settings-panel">
      <SubPageHeader title="Messages importants" onBack={onBack} />
      <div className="settings-sections">
        {all.length === 0 ? (
          <div className="settings-empty-box">
            <Star size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Aucun message important.<br />Maintenez appuyé sur un message pour l'étoiler.
            </p>
          </div>
        ) : all.map(({ msg, contact, convId }) => (
          <button
            key={msg.id}
            className="settings-row"
            style={{ alignItems: 'flex-start', gap: 12 }}
            onClick={() => { openConversation(convId); setShowSettings(false); }}
          >
            <img src={contact?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${contact?.name}`} className="avatar avatar-sm" alt="" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="settings-row-body">
              <span className="settings-row-label">{contact?.name || 'Inconnu'}</span>
              <span className="settings-row-desc">{msg.text}</span>
            </div>
            <Star size={14} style={{ color: 'var(--wa-green)', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Page : Inviter des amis ───────────────────────────────── */
function InvitePage({ onBack }) {
  const text = `Accédez à la plateforme KAB : ${window.location.origin}`;
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const share = async () => {
    setError('');
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Plateforme KAB', text });
      } catch (shareError) {
        if (shareError.name !== 'AbortError') setError('Le partage a échoué.');
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      } catch {
        setError('Impossible de copier le lien depuis ce navigateur.');
      }
    }
  };
  return (
    <div className="settings-panel">
      <SubPageHeader title="Inviter des amis" onBack={onBack} />
      <div className="settings-sections">
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <Heart size={48} style={{ color: 'var(--wa-green)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            Partagez l’adresse de la plateforme KAB avec vos collaborateurs.
          </p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={share}>
            {copied ? 'Adresse copiée' : 'Partager l’adresse de la plateforme'}
          </button>
          {error && <p role="alert" style={{ color: '#b91c1c', marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Page : Aide ───────────────────────────────────────────── */
function HelpPage({ onBack }) {
  const { currentUser } = useApp();
  return (
    <div className="settings-panel">
      <SubPageHeader title="Aide" onBack={onBack} />
      <div className="settings-sections">
        <SettingsRow icon={HelpCircle} label="Aide" description="Pour toute assistance, contactez l’administrateur de votre société." />
        <SettingsRow icon={Info} label="Compte connecté" description={currentUser.email} />
        <div className="settings-footer">
          <p>KAB Platform</p>
          <p style={{ marginTop: 8, fontSize: 11, opacity: 0.5 }}>Connecté en tant que {currentUser.name}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────── */
export default function Settings() {
  const { setShowSettings, darkMode, setDarkMode, currentUser, appSettings, setShowArchivedChats, setActiveTab, setShowStarredMessages } = useApp();
  const { goToLogin } = useAuth();
  const [activePage, setActivePage] = useState('main');
  const go = (page) => () => setActivePage(page);

  if (activePage === 'profile')       return <EditProfile         onBack={go('main')} />;
  if (activePage === 'notifications') return <NotificationsPage   onBack={go('main')} />;
  if (activePage === 'privacy')       return <PrivacyPage         onBack={go('main')} />;
  if (activePage === 'security')      return <SecurityPage        onBack={go('main')} />;
  if (activePage === 'chat')          return <ChatSettingsPage    onBack={go('main')} />;
  if (activePage === 'language')      return <LanguagePage        onBack={go('main')} />;
  if (activePage === 'devices')       return <DevicesPage         onBack={go('main')} />;
  if (activePage === 'storage')       return <StoragePage         onBack={go('main')} />;
  if (activePage === 'starred')       return <StarredMessagesPage onBack={go('main')} />;
  if (activePage === 'invite')        return <InvitePage          onBack={go('main')} />;
  if (activePage === 'help')          return <HelpPage            onBack={go('main')} />;

  return (
    <div className="settings-panel">
      <div className="panel-header">
        <button className="icon-btn" onClick={() => setShowSettings(false)}><X size={20} /></button>
        <span className="panel-title">Paramètres</span>
      </div>
      <div className="settings-sections">
        {/* Profil */}
        <button className="settings-profile" onClick={go('profile')}>
          <div className="settings-profile-avatar">
            <img src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name || currentUser.email)}`} alt="Moi" className="avatar avatar-lg" />
            <div className="avatar-edit-overlay"><Camera size={16} /></div>
          </div>
          <div className="settings-profile-info">
            <span className="settings-profile-name">{currentUser.name}</span>
            <span className="settings-profile-status">{currentUser.about}</span>
          </div>
          <ChevronRight size={16} className="settings-chevron" />
        </button>

        <div className="settings-section">
          <SettingsRow icon={Bell}          label="Notifications"      description="Sons, vibrations et alertes"              onClick={go('notifications')} />
          <SettingsRow icon={Lock}          label="Confidentialité"    description="Visibilité du profil, des statuts et des groupes" onClick={go('privacy')} />
          <SettingsRow icon={Key}           label="Sécurité"           description="Modifier le mot de passe du compte"             onClick={go('security')} />
          <SettingsRow icon={MessageCircle} label="Discussions"        description="Thème, fond d'écran, taille de police"     onClick={go('chat')} />
        </div>

        <div className="settings-section">
          <SettingsRow
            icon={darkMode ? Sun : Moon}
            label={darkMode ? 'Mode clair' : 'Mode sombre'}
            description={darkMode ? 'Passer au thème clair' : 'Passer au thème sombre'}
            toggle toggled={darkMode} onToggle={() => setDarkMode(!darkMode)}
          />
          <SettingsRow icon={Smartphone} label="Appareils connectés" description="Voir et gérer les sessions actives" onClick={go('devices')} />
          <SettingsRow icon={Database}   label="Stockage et données" description="Espace réseau, téléchargement auto" onClick={go('storage')} />
          <SettingsRow icon={Globe}      label="Langue"              value={appSettings.language}                     onClick={go('language')} />
        </div>

        <div className="settings-section">
          <SettingsRow icon={Star}        label="Messages importants"   description="Messages étoilés"  onClick={() => { setShowSettings(false); setShowStarredMessages(true); }} />
          <SettingsRow
            icon={Archive}
            label="Discussions archivées"
            description="Voir les discussions archivées"
            onClick={() => { setShowArchivedChats(true); setActiveTab('chats'); setShowSettings(false); }}
          />
          <SettingsRow icon={HelpCircle}  label="Aide"                  description="FAQ, contact, confidentialité" onClick={go('help')} />
          <SettingsRow icon={Heart}       label="Inviter des collaborateurs" onClick={go('invite')} />
        </div>

        <div className="settings-section">
          <SettingsRow icon={LogOut} label="Déconnexion" danger onClick={goToLogin} />
        </div>

        <div className="settings-footer">
          <p>KAB Platform</p>
        </div>
      </div>
    </div>
  );
}
