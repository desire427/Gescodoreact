import { useState, useRef } from 'react';
import {
  X, ChevronRight, Bell, Lock, MessageCircle, HelpCircle, LogOut,
  Moon, Sun, Smartphone, Globe, Database, Heart, Key, Archive,
  Star, Camera, Check, Shield, HardDrive, Info, ChevronDown, Image, Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
  const [about, setAbout] = useState(currentUser.about);
  const [preview, setPreview] = useState(currentUser.avatar);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    updateProfile({ name: name.trim(), about: about.trim(), avatar: preview });
    setSaved(true);
    setTimeout(() => { setSaved(false); onBack(); }, 700);
  };

  return (
    <div className="settings-sub-page">
      <SubPageHeader
        title="Modifier le profil"
        onBack={onBack}
        rightAction={
          <button className="icon-btn" onClick={handleSave} title="Enregistrer">
            <Check size={20} style={{ color: saved ? 'var(--wa-green)' : 'var(--text-secondary)' }} />
          </button>
        }
      />

      {/* Avatar cliquable */}
      <div className="edit-profile-avatar" onClick={() => fileRef.current?.click()}>
        <img src={preview} alt="Photo" className="avatar avatar-xl" />
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
          maxLength={25}
          autoFocus
          placeholder="Entrez votre nom"
        />
        <span className="field-count">{name.length}/25</span>
      </div>

      <div className="edit-field">
        <label>Infos</label>
        <input
          type="text"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={139}
          placeholder="Dites quelque chose sur vous"
        />
        <span className="field-count">{about.length}/139</span>
      </div>

      <div className="edit-field">
        <label>Téléphone</label>
        <input type="tel" value={currentUser.phone} readOnly style={{ opacity: 0.55, cursor: 'not-allowed' }} />
      </div>

      <div style={{ padding: '16px 20px' }}>
        <button className="btn-primary" style={{ width: '100%' }} onClick={handleSave}>
          Enregistrer les modifications
        </button>
      </div>
    </div>
  );
}

/* ─── Page : Notifications ──────────────────────────────────── */
function NotificationsPage({ onBack }) {
  const { appSettings, updateAppSettings } = useApp();
  const s = appSettings.notifications;
  const toggle = (key) => updateAppSettings('notifications', { [key]: !s[key] });

  return (
    <div className="settings-panel">
      <SubPageHeader title="Notifications" onBack={onBack} />
      <div className="settings-sections">
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
const VIS_OPTS = ['Tout le monde', 'Mes contacts', 'Mes contacts sauf...', 'Personne'];

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
  const { appSettings, updateAppSettings } = useApp();
  const s = appSettings.privacy;
  const set = (key) => (val) => updateAppSettings('privacy', { [key]: val });
  const toggle = (key) => updateAppSettings('privacy', { [key]: !s[key] });

  return (
    <div className="settings-panel">
      <SubPageHeader title="Confidentialité" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Qui peut voir mes informations</div>
        <VisibilitySelect label="Dernière connexion et en ligne" value={s.lastSeen} onChange={set('lastSeen')} />
        <VisibilitySelect label="Photo de profil" value={s.profilePhoto} onChange={set('profilePhoto')} />
        <VisibilitySelect label="Infos" value={s.about} onChange={set('about')} />
        <VisibilitySelect label="Groupes" value={s.groups} onChange={set('groups')} />
        <VisibilitySelect label="Statuts" value={s.status} onChange={set('status')} />
        <div className="settings-section-title">Messages</div>
        <SettingsRow label="Confirmation de lecture" description="Si désactivées, vous ne verrez pas non plus celles des autres" toggle toggled={s.readReceipts} onToggle={() => toggle('readReceipts')} />
        <SettingsRow label="Statut en ligne" description="Choisir qui peut voir quand vous êtes en ligne" toggle toggled={s.onlineStatus} onToggle={() => toggle('onlineStatus')} />
        <div className="settings-section-title">Contacts bloqués</div>
        <SettingsRow label="Contacts bloqués" description="0 contact bloqué" onClick={() => {}} />
      </div>
    </div>
  );
}

/* ─── Page : Sécurité ───────────────────────────────────────── */
function SecurityPage({ onBack }) {
  const [twoStep, setTwoStep] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);

  const handleTwoStep = () => {
    if (!twoStep) { setShowPinForm(true); }
    else { setTwoStep(false); setPin(''); }
  };

  const handlePinSave = () => {
    if (pin.length === 6) { setTwoStep(true); setShowPinForm(false); }
    else alert('Le code PIN doit contenir 6 chiffres.');
  };

  return (
    <div className="settings-panel">
      <SubPageHeader title="Sécurité" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Vérification en deux étapes</div>
        <SettingsRow
          label="Vérification en deux étapes"
          description={twoStep ? 'Activée — Code PIN configuré' : 'Désactivée'}
          toggle toggled={twoStep} onToggle={handleTwoStep}
        />
        {showPinForm && (
          <div className="pin-form">
            <p>Créer un code PIN à 6 chiffres</p>
            <input
              type="number"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 6))}
              placeholder="••••••"
              className="pin-input"
              autoFocus
            />
            <div className="pin-actions">
              <button className="btn-secondary" onClick={() => { setShowPinForm(false); setPin(''); }}>Annuler</button>
              <button className="btn-primary" onClick={handlePinSave}>Confirmer</button>
            </div>
          </div>
        )}
        {twoStep && (
          <SettingsRow label="Modifier le code PIN" description="Changer votre code à 6 chiffres" onClick={() => { setShowPinForm(true); setPin(''); }} />
        )}
        <div className="settings-section-title">Notifications de sécurité</div>
        <SettingsRow label="Afficher les notifications de sécurité" description="Vous avertit si votre code de sécurité change" toggle toggled={true} onToggle={() => {}} />
      </div>
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
        <SettingsRow label="Touche Entrée pour envoyer" description="La touche Entrée envoie le message" toggle toggled={s.enterToSend} onToggle={() => toggle('enterToSend')} />
        <div className="settings-section-title">Médias</div>
        <SettingsRow label="Téléchargement automatique" description="Télécharger les médias automatiquement" toggle toggled={s.mediaAutoDownload} onToggle={() => toggle('mediaAutoDownload')} />
      </div>
    </div>
  );
}

/* ─── Page : Langue ─────────────────────────────────────────── */
function LanguagePage({ onBack }) {
  const { appSettings, updateAppSettings } = useApp();
  const LANGS = ['Français', 'English', 'Español', 'Português', 'العربية', 'Deutsch', 'Italiano'];
  return (
    <div className="settings-panel">
      <SubPageHeader title="Langue" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Choisir une langue</div>
        {LANGS.map((lang) => (
          <button key={lang} className="settings-row" onClick={() => updateAppSettings('language', lang)}>
            <div className="settings-row-body"><span className="settings-row-label">{lang}</span></div>
            {appSettings.language === lang && <Check size={18} style={{ color: 'var(--wa-green)', flexShrink: 0 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Page : Appareils connectés ────────────────────────────── */
function DevicesPage({ onBack }) {
  const [linked, setLinked] = useState([]);
  return (
    <div className="settings-panel">
      <SubPageHeader title="Appareils connectés" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Appareils liés</div>
        {linked.length === 0 ? (
          <div className="settings-empty-box">
            <Smartphone size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Aucun appareil lié.<br />Vous pouvez utiliser WhatsApp sur jusqu'à 4 appareils.
            </p>
          </div>
        ) : linked.map((d, i) => (
          <div key={i} className="settings-row">
            <div className="settings-row-body"><span className="settings-row-label">{d}</span></div>
            <button className="icon-btn" onClick={() => setLinked((p) => p.filter((_, j) => j !== i))}><X size={16} /></button>
          </div>
        ))}
        <div style={{ padding: '0 20px 16px' }}>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => alert('Scannez le QR code sur WhatsApp Web')}>
            Lier un appareil
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page : Stockage ───────────────────────────────────────── */
function StoragePage({ onBack }) {
  const { appSettings, updateAppSettings } = useApp();
  const s = appSettings;
  return (
    <div className="settings-panel">
      <SubPageHeader title="Stockage et données" onBack={onBack} />
      <div className="settings-sections">
        <div className="settings-section-title">Gestion du stockage</div>
        <div className="storage-bar-wrap">
          <div className="storage-bar"><div className="storage-bar-fill" style={{ width: '34%' }} /></div>
          <div className="storage-stats">
            <span className="storage-label">Utilisé : 1,2 Go</span>
            <span className="storage-value">3,4 Go disponible</span>
          </div>
        </div>
        <div className="settings-section-title">Téléchargement automatique</div>
        <SettingsRow label="Sur Wi-Fi" description="Photos, vidéos, documents" toggle toggled={true} onToggle={() => {}} />
        <SettingsRow label="Données mobiles" description="Photos uniquement" toggle toggled={false} onToggle={() => {}} />
        <div className="settings-section-title">Réseau</div>
        <SettingsRow label="Réduire la consommation" description="Appels et médias en basse qualité" toggle toggled={false} onToggle={() => {}} />
      </div>
    </div>
  );
}

/* ─── Page : Messages importants ────────────────────────────── */
function StarredMessagesPage({ onBack }) {
  const { starredMessages, messages, getConversation, getContact, openConversation, setShowSettings } = useApp();
  const all = starredMessages.map(({ convId, msgId }) => {
    const msg = (messages[convId] || []).find((m) => m.id === msgId);
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
  const text = `Rejoins-moi sur WhatsApp ! C'est une super application de messagerie. https://www.whatsapp.com/`;
  const share = () => {
    if (navigator.share) {
      navigator.share({ title: 'WhatsApp', text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Lien copié dans le presse-papiers !'));
    }
  };
  return (
    <div className="settings-panel">
      <SubPageHeader title="Inviter des amis" onBack={onBack} />
      <div className="settings-sections">
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <Heart size={48} style={{ color: 'var(--wa-green)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            Partagez WhatsApp avec vos proches et restez connectés où que vous soyez.
          </p>
          <button className="btn-primary" style={{ width: '100%' }} onClick={share}>
            Partager le lien
          </button>
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
        <SettingsRow icon={HelpCircle} label="FAQ" description="Questions fréquentes" onClick={() => window.open('https://faq.whatsapp.com/', '_blank')} />
        <SettingsRow icon={Info} label="Nous contacter" description="Signaler un problème" onClick={() => {}} />
        <SettingsRow icon={Shield} label="Politique de confidentialité" onClick={() => window.open('https://www.whatsapp.com/legal/privacy-policy', '_blank')} />
        <div className="settings-footer">
          <p>WhatsApp Clone v1.0</p>
          <p>Fait avec ❤️ en React</p>
          <p style={{ marginTop: 8, fontSize: 11, opacity: 0.5 }}>Connecté en tant que {currentUser.phone}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────── */
export default function Settings() {
  const { setShowSettings, darkMode, setDarkMode, currentUser, appSettings, setShowArchivedChats, setActiveTab } = useApp();
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
            <img src={currentUser.avatar} alt="Moi" className="avatar avatar-lg" />
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
          <SettingsRow icon={Lock}          label="Confidentialité"    description="Dernière connexion, qui peut vous appeler"  onClick={go('privacy')} />
          <SettingsRow icon={Key}           label="Sécurité"           description="Vérification en deux étapes"               onClick={go('security')} />
          <SettingsRow icon={MessageCircle} label="Discussions"        description="Thème, fond d'écran, taille de police"     onClick={go('chat')} />
        </div>

        <div className="settings-section">
          <SettingsRow
            icon={darkMode ? Sun : Moon}
            label={darkMode ? 'Mode clair' : 'Mode sombre'}
            description={darkMode ? 'Passer au thème clair' : 'Passer au thème sombre'}
            toggle toggled={darkMode} onToggle={() => setDarkMode(!darkMode)}
          />
          <SettingsRow icon={Smartphone} label="Appareils connectés" description="0 appareil connecté"               onClick={go('devices')} />
          <SettingsRow icon={Database}   label="Stockage et données" description="Espace réseau, téléchargement auto" onClick={go('storage')} />
          <SettingsRow icon={Globe}      label="Langue"              value={appSettings.language}                     onClick={go('language')} />
        </div>

        <div className="settings-section">
          <SettingsRow icon={Star}        label="Messages importants"   description="Messages étoilés"  onClick={go('starred')} />
          <SettingsRow
            icon={Archive}
            label="Discussions archivées"
            description="Voir les discussions archivées"
            onClick={() => { setShowArchivedChats(true); setActiveTab('chats'); setShowSettings(false); }}
          />
          <SettingsRow icon={HelpCircle}  label="Aide"                  description="FAQ, contact, confidentialité" onClick={go('help')} />
          <SettingsRow icon={Heart}       label="Inviter des amis"       onClick={go('invite')} />
        </div>

        <div className="settings-section">
          <SettingsRow icon={LogOut} label="Déconnexion" danger onClick={() => setShowSettings(false)} />
        </div>

        <div className="settings-footer">
          <p>WhatsApp Clone v1.0</p>
          <p>Fait avec ❤️ en React</p>
        </div>
      </div>
    </div>
  );
}
