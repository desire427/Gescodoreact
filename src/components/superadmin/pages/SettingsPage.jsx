import { useState, useRef } from 'react';
import SuperAdminSidebarProfile from '../../common/SuperAdminSidebarProfile';
import SuperAdminHeaderActions from '../../common/SuperAdminHeaderActions';
import { useAuth } from '../../../context/AuthContext';
import { messagingApi } from '../../../services/api';

export const title = "GESCODO — Paramètres";
export const bodyClass = "bg-paper text-ink font-sans h-screen w-screen overflow-hidden flex";
const pageStyles = "\n  * { -webkit-font-smoothing: antialiased; }\n  ::-webkit-scrollbar { width: 4px; height: 4px; }\n  ::-webkit-scrollbar-thumb { background: #FFFFFF; border-radius: 10px; }\n  ::-webkit-scrollbar-track { background: transparent; }\n  body { overflow: hidden; }\n\n  .tick { animation: tick 1.6s ease-in-out infinite; }\n  @keyframes tick { 0%,100% { opacity: 1; } 50% { opacity: .35; } }\n\n  .num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; letter-spacing: -.04em; }\n\n  .noise {\n    background-image: radial-gradient(circle at 1px 1px, rgba(22,51,70,.035) 1px, transparent 0);\n    background-size: 20px 20px;\n  }\n\n  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SIDEBAR \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n  #sidebar {\n    width: 72px;\n    transition: width .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded { width: 248px; }\n\n  @media (max-width: 1023px) {\n    #sidebar {\n      position: fixed;\n      top: 0;\n      left: 0;\n      height: 100vh;\n      transform: translateX(-100%);\n      width: 248px;\n    }\n    #sidebar.mobile-open {\n      transform: translateX(0);\n      box-shadow: 4px 0 30px rgba(22,51,70,.3);\n    }\n    #sidebar.mobile-open .nav-label,\n    #sidebar.mobile-open .brand-text,\n    #sidebar.mobile-open .user-info,\n    #sidebar.mobile-open .group-label,\n    #sidebar.mobile-open .nav-tail {\n      opacity: 1;\n      width: auto;\n      height: auto;\n    }\n    #toggleBtn {\n      display: none !important;\n      visibility: hidden !important;\n      opacity: 0 !important;\n      pointer-events: none !important;\n    }\n  }\n\n  #overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(22,51,70,.5);\n    backdrop-filter: blur(2px);\n    z-index: 30;\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity .3s ease;\n  }\n  #overlay.show { opacity: 1; pointer-events: auto; }\n  @media (min-width: 1024px) { #overlay { display: none; } }\n\n  .nav-item {\n    display: flex;\n    align-items: center;\n    height: 44px;\n    width: 100%;\n    color: rgba(255,255,255,.55);\n    transition: color .15s ease, background-color .15s ease;\n    position: relative;\n  }\n  .nav-item:hover { color: #FFFFFF; background: rgba(255,255,255,.06); }\n  .nav-item.active { background: #DBC88D; color: #163346; }\n  .nav-item.active:hover { background: #DBC88D; color: #163346; }\n\n  .nav-icon {\n    width: 72px;\n    min-width: 72px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n  }\n  @media (max-width: 1023px) {\n    .nav-icon { width: 56px; min-width: 56px; }\n  }\n\n  .nav-label {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    font-size: 13px;\n    font-weight: 600;\n    padding-right: 16px;\n  }\n  #sidebar.expanded .nav-label { opacity: 1; width: auto; }\n\n  .nav-tail {\n    margin-left: auto;\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    padding-right: 16px;\n    flex-shrink: 0;\n  }\n  #sidebar.expanded .nav-tail { opacity: 1; width: auto; }\n\n  .brand-text, .user-info {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded .brand-text,\n  #sidebar.expanded .user-info { opacity: 1; width: auto; }\n\n  .group-label {\n    opacity: 0;\n    height: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, height .3s ease;\n  }\n  #sidebar.expanded .group-label { opacity: 1; height: 22px; }\n\n  #toggleBtn {\n    position: absolute;\n    top: 22px;\n    right: -14px;\n    width: 28px;\n    height: 28px;\n    border-radius: 50%;\n    background: #DBC88D;\n    color: #163346;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    box-shadow: 0 2px 10px rgba(22,51,70,.25);\n    cursor: pointer;\n    z-index: 50;\n    border: 3px solid #FFFFFF;\n    transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;\n  }\n  #toggleBtn:hover { transform: scale(1.12); box-shadow: 0 4px 14px rgba(22,51,70,.35); }\n\n  #toggleIcon { transition: transform .3s cubic-bezier(.22,1,.36,1); }\n  #sidebar.expanded #toggleIcon { transform: rotate(180deg); }\n\n  /* Setting rows */\n  .setting-row {\n    transition: background .15s ease;\n    padding-left: 8px;\n    padding-right: 8px;\n    margin-left: -8px;\n    margin-right: -8px;\n    border-radius: 8px;\n  }\n  .setting-row:hover { background: #FFFFFF; }\n\n  /* Toggle personnalis\u00e9 */\n  .toggle {\n    width: 44px;\n    height: 24px;\n    border-radius: 12px;\n    background: rgba(22, 51, 70, 0.08);\n    border: 1px solid #0A0201;\n    box-sizing: border-box;\n    position: relative;\n    flex-shrink: 0;\n    transition: background .25s cubic-bezier(.22,1,.36,1);\n    cursor: pointer;\n  }\n  .toggle::after {\n    content: '';\n    position: absolute;\n    top: 2px;\n    left: 2px;\n    width: 18px;\n    height: 18px;\n    background: #FFFFFF;\n    border-radius: 50%;\n    box-shadow: 0 1px 4px rgba(22,51,70,.2);\n    transition: transform .25s cubic-bezier(.22,1,.36,1);\n  }\n  .toggle.on {\n    background: #163346;\n    border-color: #163346;\n  }\n  .toggle.on::after {\n    transform: translateX(20px);\n  }\n\n  /* Inputs */\n  .setting-input {\n    height: 36px;\n    padding: 0 12px;\n    background: #FFFFFF;\n    border: 1px solid #0A0201;\n    border-radius: 8px;\n    font-size: 12.5px;\n    color: #163346;\n    font-weight: 500;\n    transition: border-color .15s ease;\n    outline: none;\n  }\n  .setting-input:focus { border-color: #163346; }\n  .setting-input.num { text-align: center; font-family: 'JetBrains Mono', monospace; font-weight: 700; }\n\n  /* Timeline chips */\n  .timeline-chip {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    gap: 2px;\n    padding: 8px 12px;\n    border-radius: 8px;\n    font-size: 12px;\n    font-weight: 800;\n    font-family: 'JetBrains Mono', monospace;\n    letter-spacing: -.02em;\n  }\n  .timeline-chip small {\n    font-family: 'Inter', sans-serif;\n    font-size: 9px;\n    font-weight: 700;\n    text-transform: uppercase;\n    letter-spacing: .04em;\n    opacity: .75;\n  }\n";

// ─── Composants dynamiques sidebar/topbar ─────────────────────────────────────

// ─── Section Mon compte ────────────────────────────────────────────────────────

function MonCompteSection() {
  const { currentUser, updateAuthenticatedUser } = useAuth();
  const fileRef = useRef(null);

  const initials = (currentUser?.name || 'SA')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [name, setName]                   = useState(currentUser?.name || '');
  const [email, setEmail]                 = useState(currentUser?.email || '');
  const [phone, setPhone]                 = useState(currentUser?.phone || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]          = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');

  const [saving, setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg]           = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setProfileMsg('Veuillez choisir un fichier image.'); return; }
    if (file.size > 10 * 1024 * 1024) { setProfileMsg('La photo ne doit pas dépasser 10 Mo.'); return; }
    setProfileMsg('');
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(String(ev.target.result));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { setProfileMsg('Le nom est obligatoire.'); return; }
    setSaving(true);
    setProfileMsg('');
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      if (avatarFile) formData.append('avatar', avatarFile);
      const { data } = await messagingApi.updateProfile(formData);
      updateAuthenticatedUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar || null,
      });
      setAvatarPreview(data.avatar || null);
      setAvatarFile(null);
      setProfileMsg('✓ Profil mis à jour avec succès.');
    } catch (err) {
      const d = err.response?.data;
      setProfileMsg(typeof d === 'string' ? d : d?.detail || d?.email || d?.name || 'Échec de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMsg('Tous les champs mot de passe sont obligatoires.'); return;
    }
    if (newPassword !== confirmPassword) { setPwMsg('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 8) { setPwMsg('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    setPwSaving(true);
    setPwMsg('');
    try {
      const { authApi } = await import('../../../services/api');
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwMsg('✓ Mot de passe modifié. Reconnectez-vous.');
    } catch (err) {
      const d = err.response?.data;
      setPwMsg(typeof d === 'string' ? d : d?.detail || d?.current_password || 'Échec du changement de mot de passe.');
    } finally {
      setPwSaving(false);
    }
  };

  const isSuccess = (msg) => msg.startsWith('✓');

  return (
    <section className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
      {/* En-tête */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-fog">
        <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>
        </div>
        <div className="flex flex-col">
          <h3 className="text-[15px] font-black tracking-tight">Mon compte administrateur</h3>
          <p className="text-[11px] text-slate font-medium mt-0.5">Photo, coordonnées et mot de passe</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-5 border-b border-fog">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-16 h-16 rounded-full bg-ink text-lime flex items-center justify-center text-xl font-black flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity relative"
          title="Changer la photo"
        >
          {avatarPreview
            ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            : <span>{initials}</span>
          }
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-[13px] font-bold text-ink">Photo de profil</span>
          <span className="text-[11px] text-slate">Tous formats image acceptés (max 10 Mo).</span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 px-3 py-2 bg-bone border border-fog rounded-lg text-[12px] font-bold text-ink cursor-pointer hover:bg-lime/30 transition-colors"
          >
            {avatarFile ? '✓ Photo sélectionnée' : 'Ajouter une photo'}
          </button>
        </div>
      </div>

      {/* Champs profil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-[12px] font-bold text-ink">
          Nom complet
          <input type="text" value={name} onChange={e => setName(e.target.value)} autoComplete="name" className="setting-input w-full" />
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-bold text-ink">
          Adresse e-mail
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="setting-input w-full" />
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-bold text-ink">
          Téléphone
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Votre numéro" autoComplete="tel" className="setting-input w-full" />
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-bold text-ink">
          Rôle
          <input type="text" value="Super Administrateur" readOnly className="setting-input w-full opacity-70" />
        </label>
      </div>

      {profileMsg && (
        <p className={`text-[12px] font-semibold ${isSuccess(profileMsg) ? 'text-green-700' : 'text-red-600'}`}>
          {profileMsg}
        </p>
      )}

      <button
        type="button"
        onClick={handleSaveProfile}
        disabled={saving}
        className="self-start px-4 py-2 bg-ink text-lime rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer le profil'}
      </button>

      {/* Changer le mot de passe */}
      <div className="pt-4 border-t border-fog flex flex-col gap-4">
        <div>
          <h4 className="text-[13px] font-black text-ink">Changer le mot de passe</h4>
          <p className="text-[11px] text-slate mt-1">Utilisez un mot de passe unique d'au moins 8 caractères.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5 text-[12px] font-bold text-ink">
            Mot de passe actuel
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" className="setting-input w-full" />
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-bold text-ink">
            Nouveau mot de passe
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" minLength="8" className="setting-input w-full" />
          </label>
          <label className="flex flex-col gap-1.5 text-[12px] font-bold text-ink">
            Confirmer le mot de passe
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength="8" className="setting-input w-full" />
          </label>
        </div>

        {pwMsg && (
          <p className={`text-[12px] font-semibold ${isSuccess(pwMsg) ? 'text-green-700' : 'text-red-600'}`}>
            {pwMsg}
          </p>
        )}

        <button
          type="button"
          onClick={handleSavePassword}
          disabled={pwSaving}
          className="self-start px-4 py-2 bg-ink text-lime rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pwSaving ? 'Modification…' : 'Changer le mot de passe'}
        </button>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <div className={bodyClass}>
      <style>{pageStyles}</style>
    {"\n\n"}
    {"\n"}
    <div id="overlay"></div>
    {"\n\n"}
    {"\n"}
    <aside id="sidebar" className="bg-ink flex flex-col flex-shrink-0 z-40 overflow-visible relative">
      {"\n\n  "}
      <button id="toggleBtn" title="Plier / Déplier la sidebar" className="hidden lg:flex">
        {"\n    "}
        <svg id="toggleIcon" className="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
          {"\n      "}
          <path d="M9 18l6-6-6-6"></path>
          {"\n    "}
        </svg>
        {"\n  "}
      </button>
      {"\n\n  "}
      <div className="h-[72px] flex items-center border-b border-white/[.08] flex-shrink-0 overflow-hidden">
        {"\n    "}
        <div className="nav-icon h-full">
          {"\n      "}
          <div className="w-9 h-9 bg-lime rounded-lg flex items-center justify-center">
            {"\n        "}
            <span className="text-ink font-black text-base leading-none">
              {"G"}
            </span>
            {"\n      "}
          </div>
          {"\n    "}
        </div>
        {"\n    "}
        <div className="brand-text flex flex-col leading-tight">
          {"\n      "}
          <span className="text-[14px] font-black text-white tracking-tight">
            {"GESCODO"}
          </span>
          {"\n      "}
          <span className="text-[9px] font-bold text-white/40 tracking-[.16em] uppercase">
            {"Plateforme"}
          </span>
          {"\n    "}
        </div>
        {"\n    "}
        <button id="closeSidebarBtn" className="lg:hidden ml-auto mr-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:bg-white/[.08] hover:text-white transition-colors">
          {"\n      "}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"></path>
          </svg>
          {"\n    "}
        </button>
        {"\n  "}
      </div>
      {"\n\n  "}
      <nav className="flex-1 flex flex-col py-3 overflow-y-auto overflow-x-hidden">
        {"\n\n    "}
        <a data-page="dashboard" className="nav-item" title="Tableau de bord">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              {"\n          "}
              <rect x="3" y="3" width="7" height="9" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="5" rx="1.5"></rect>
              {"\n          "}
              <rect x="14" y="12" width="7" height="9" rx="1.5"></rect>
              <rect x="3" y="16" width="7" height="5" rx="1.5"></rect>
              {"\n        "}
            </svg>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Tableau de bord"}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <a data-page="companies" className="nav-item" title="Sociétés">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              {"\n          "}
              <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-4h6v4"></path>
              {"\n        "}
            </svg>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Sociétés"}
          </span>
          {"\n      "}
          <span className="nav-tail num text-[10px] font-bold text-white/40">
            {"8"}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <a data-page="users" className="nav-item" title="Utilisateurs">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              {"\n          "}
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              {"\n          "}
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              {"\n        "}
            </svg>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Utilisateurs"}
          </span>
          {"\n      "}
          <span className="nav-tail num text-[10px] font-bold text-white/40">
            {"47"}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <a data-page="projects" className="nav-item" title="Projets">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              {"\n          "}
              <path d="M3 3h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6zM3 15h6v6H3z"></path>
              {"\n        "}
            </svg>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Projets"}
          </span>
          {"\n      "}
          <span className="nav-tail num text-[10px] font-bold text-white/40">
            {"14"}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <a data-page="meetings" className="nav-item" title="Réunions">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              {"\n          "}
              <rect x="3" y="4" width="18" height="18" rx="2"></rect>
              <path d="M16 2v4M8 2v4M3 10h18"></path>
              {"\n        "}
            </svg>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Réunions"}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <div className="h-px bg-white/[.08] mx-4 my-2 flex-shrink-0"></div>
        {"\n    "}
        <span className="group-label text-[9px] font-bold text-white/30 uppercase tracking-[.16em] px-5 pt-1 pb-1">
          {"Sécurité"}
        </span>
        {"\n\n    "}
        <a data-page="roles" className="nav-item" title="Rôles & Accès">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              {"\n          "}
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              {"\n        "}
            </svg>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Rôles & Accès"}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <a data-page="audit" className="nav-item" title="Journal d'audit">
          {"\n      "}
          <span className="nav-icon" style={{"position":"relative"}}>
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              {"\n          "}
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              {"\n        "}
            </svg>
            {"\n        "}
            <span className="absolute top-2.5 right-[22px] w-2 h-2 rounded-full bg-lime"></span>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Journal d'audit"}
          </span>
          {"\n      "}
          <span className="nav-tail">
            {"\n        "}
            <span className="num text-[10px] font-bold text-ink bg-lime px-1.5 py-0.5 rounded">
              {"2"}
            </span>
            {"\n      "}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <a data-page="sessions" className="nav-item" title="Sessions & Appareils">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              {"\n          "}
              <rect x="5" y="2" width="14" height="20" rx="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
              {"\n        "}
            </svg>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Sessions"}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <a data-page="settings" className="nav-item active" title="Paramètres">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              {"\n          "}
              <circle cx="12" cy="12" r="3"></circle>
              {"\n          "}
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              {"\n        "}
            </svg>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Paramètres"}
          </span>
          {"\n    "}
        </a>
        {"\n\n    "}
        <div className="mt-auto w-full pt-3">
          {"\n      "}
          <button className="nav-item" style={{"color":"#DBC88D"}} title="Discussions">
            {"\n        "}
            <span className="nav-icon">
              {"\n          "}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                {"\n            "}
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                {"\n          "}
              </svg>
              {"\n        "}
            </span>
            {"\n        "}
            <span className="nav-label" style={{"color":"#DBC88D"}}>
              {"Discussions"}
            </span>
            {"\n        "}
            <span className="nav-tail">
              {"\n          "}
              <span className="text-[9px] font-black text-lime border border-lime/40 px-1.5 py-0.5 rounded">
                {"OUVRIR"}
              </span>
              {"\n        "}
            </span>
            {"\n      "}
          </button>
          {"\n    "}
        </div>
        {"\n\n  "}
      </nav>
      {"\n\n  "}
      <div className="border-t border-white/[.08] flex-shrink-0">
        {"\n    "}
        <SuperAdminSidebarProfile />
        {"\n  "}
      </div>
      {"\n\n"}
    </aside>
    {"\n\n"}
    {"\n"}
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {"\n\n  "}
      {"\n  "}
      <header className="h-[72px] bg-paper border-b border-fog flex-shrink-0 flex items-center px-4 sm:px-6 lg:px-8 gap-3 sm:gap-4 lg:gap-6">
        {"\n\n    "}
        <button id="menuBtn" className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-ink hover:bg-bone transition-colors flex-shrink-0">
          {"\n      "}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
            {"\n        "}
            <path d="M3 6h18M3 12h18M3 18h18"></path>
            {"\n      "}
          </svg>
          {"\n    "}
        </button>
        {"\n\n    "}
        <div className="flex flex-col leading-none min-w-0 flex-shrink-0">
          {"\n      "}
          <span className="hidden sm:block text-[10px] font-bold text-slate uppercase tracking-[.16em]">
            {"Console plateforme"}
          </span>
          {"\n      "}
          <h1 className="text-[15px] sm:text-[17px] font-black tracking-tight sm:mt-1 leading-none truncate">
            {"Paramètres"}
          </h1>
          {"\n    "}
        </div>
        {"\n\n    "}
        <div className="hidden md:flex flex-1 max-w-[420px] mx-auto items-center gap-2 h-10 px-3.5 bg-bone border border-fog rounded-xl focus-within:border-ink transition-colors">
          {"\n      "}
          <svg className="w-4 h-4 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            {"\n        "}
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
            {"\n      "}
          </svg>
          {"\n      "}
          <input type="text" placeholder="Rechercher un paramètre…" className="flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
          {"\n    "}
        </div>
        {"\n\n    "}
        <div className="flex-1 md:flex-none"></div>
        {"\n\n    "}
        <SuperAdminHeaderActions />
        {"\n  "}
      </header>
      {"\n\n  "}
      {"\n  "}
      <main className="flex-1 overflow-y-auto bg-paper noise">
        {"\n    "}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[900px] mx-auto flex flex-col gap-6 sm:gap-8">
          {"\n\n      "}
          {"\n      "}
          <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
            {"\n        "}
            <div className="flex flex-col gap-1">
              {"\n          "}
              <h2 className="text-[20px] sm:text-[26px] font-black tracking-tight leading-tight sm:leading-none">
                {"Paramètres"}
              </h2>
              {"\n          "}
              <p className="text-[12px] sm:text-[13px] text-slate font-medium">
                {"Compte administrateur et configuration globale · "}
                <span className="text-ink font-semibold">
                  {"5 sections"}
                </span>
              </p>
              {"\n        "}
            </div>
            {"\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <MonCompteSection />
          {"\n\n      "}
          {"\n      "}
          <section className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
            {"\n\n        "}
            <div className="flex items-center gap-2.5 pb-4 border-b border-fog">
              {"\n          "}
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime flex-shrink-0">
                {"\n            "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col">
                {"\n            "}
                <h3 className="text-[15px] font-black tracking-tight">
                  {"Sécurité de la plateforme"}
                </h3>
                {"\n            "}
                <p className="text-[11px] text-slate font-medium mt-0.5">
                  {"Politique d'authentification et sessions"}
                </p>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex flex-col">
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Délai d'expiration de session"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Minutes d'inactivité avant déconnexion automatique."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {"\n              "}
                  <input id="sessionTimeout" type="number" value="60" className="setting-input num w-[70px]" />
                  {"\n              "}
                  <span className="text-[12px] text-slate font-semibold">
                    {"min"}
                  </span>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Maximum d'appareils par utilisateur"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"0 = illimité."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {"\n              "}
                  <input id="maxDevicesPerUser" type="number" value="3" className="setting-input num w-[70px]" />
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Longueur minimum du mot de passe"}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {"\n              "}
                  <input id="passwordMinLength" type="number" value="8" className="setting-input num w-[70px]" />
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex items-center justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Double authentification (2FA)"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Imposer à tous les utilisateurs."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div id="twoFactorRequired" className="toggle" role="checkbox" aria-checked="false" aria-label="Imposer la double authentification à tous les utilisateurs" tabIndex="0"></div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex items-center justify-between gap-3 py-3.5">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Blocage automatique des comptes suspects"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Bloquer après plusieurs tentatives échouées."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div id="autoLockSuspectedAccounts" className="toggle on" role="checkbox" aria-checked="true" aria-label="Bloquer automatiquement les comptes suspects" tabIndex="0"></div>
                {"\n          "}
              </div>
              {"\n\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
            {"\n\n        "}
            <div className="flex items-center gap-2.5 pb-4 border-b border-fog">
              {"\n          "}
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime flex-shrink-0">
                {"\n            "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col">
                {"\n            "}
                <h3 className="text-[15px] font-black tracking-tight">
                  {"Documents & Fichiers"}
                </h3>
                {"\n            "}
                <p className="text-[11px] text-slate font-medium mt-0.5">
                  {"Stockage et pièces jointes"}
                </p>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex flex-col">
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Taille maximale de fichier"}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {"\n              "}
                  <input id="fileMaxSizeMb" type="number" value="20" className="setting-input num w-[70px]" />
                  {"\n              "}
                  <span className="text-[12px] text-slate font-semibold">
                    {"Mo"}
                  </span>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Types de fichiers autorisés"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Séparés par des virgules."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <input id="allowedFileTypes" type="text" value="pdf, docx, xlsx, jpg, png" className="setting-input w-full sm:w-[260px] flex-shrink-0" />
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Rétention des sauvegardes"}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {"\n              "}
                  <input id="backupRetentionDays" type="number" value="90" className="setting-input num w-[70px]" />
                  {"\n              "}
                  <span className="text-[12px] text-slate font-semibold">
                    {"jours"}
                  </span>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
            {"\n\n        "}
            <div className="flex items-center gap-2.5 pb-4 border-b border-fog">
              {"\n          "}
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime flex-shrink-0">
                {"\n            "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col">
                {"\n            "}
                <h3 className="text-[15px] font-black tracking-tight">
                  {"Maintenance"}
                </h3>
                {"\n            "}
                <p className="text-[11px] text-slate font-medium mt-0.5">
                  {"Version et disponibilité"}
                </p>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex flex-col">
              {"\n\n          "}
              <div className="setting-row flex items-center justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Mode maintenance"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Bloque l'accès aux utilisateurs non-administrateurs."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div id="maintenanceMode" className="toggle" role="checkbox" aria-checked="false" aria-label="Activer le mode maintenance" tabIndex="0"></div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Version de la plateforme"}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <input id="platformVersion" type="text" value="2.4.1" className="setting-input num w-full sm:w-[110px] flex-shrink-0 text-center" />
                {"\n          "}
              </div>
              {"\n\n        "}
            </div>
            {"\n\n        "}
            <div className="flex items-center gap-2 pt-4 border-t border-fog">
              {"\n          "}
              <div className="flex items-center gap-1.5 text-[11.5px] text-slate font-medium">
                {"\n            "}
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {"\n            Dernière sauvegarde : "}
                <span className="num font-bold text-graphite">
                  {"16 OCT · 03:00"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
            {"\n\n        "}
            <div className="flex items-center gap-2.5 pb-4 border-b border-fog">
              {"\n          "}
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime flex-shrink-0">
                {"\n            "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col">
                {"\n            "}
                <h3 className="text-[15px] font-black tracking-tight">
                  {"Seuils de relance et escalade"}
                </h3>
                {"\n            "}
                <p className="text-[11px] text-slate font-medium mt-0.5">
                  {"Jours relatifs à l'échéance d'une tâche (négatifs = avant, positifs = après)"}
                </p>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex flex-col">
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Rappels au Responsable"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Ajoutez, modifiez ou retirez chaque jour de rappel séparément."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex flex-col gap-2 w-full sm:w-[230px] flex-shrink-0">
                  {"\n              "}
                  <div id="responsableThresholdList" className="flex flex-col gap-2" aria-label="Jours des rappels au responsable"></div>
                  {"\n              "}
                  <button id="addResponsableThreshold" type="button" className="self-start text-[11px] font-bold text-ink hover:underline">
                    {"+ Ajouter un jour"}
                  </button>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Escalade vers le Manager"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Chaque seuil peut être ajouté, modifié ou retiré séparément."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex flex-col gap-2 w-full sm:w-[230px] flex-shrink-0">
                  {"\n              "}
                  <div id="managerThresholdList" className="flex flex-col gap-2" aria-label="Jours d’escalade vers le manager"></div>
                  {"\n              "}
                  <button id="addManagerThreshold" type="button" className="self-start text-[11px] font-bold text-ink hover:underline">
                    {"+ Ajouter un jour"}
                  </button>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3.5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Escalade vers le Directeur"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Chaque seuil peut être ajouté, modifié ou retiré séparément."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex flex-col gap-2 w-full sm:w-[230px] flex-shrink-0">
                  {"\n              "}
                  <div id="directorThresholdList" className="flex flex-col gap-2" aria-label="Jours d’escalade vers le directeur"></div>
                  {"\n              "}
                  <button id="addDirectorThreshold" type="button" className="self-start text-[11px] font-bold text-ink hover:underline">
                    {"+ Ajouter un jour"}
                  </button>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="setting-row flex items-center justify-between gap-3 py-3.5">
                {"\n            "}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  {"\n              "}
                  <span className="text-[13px] font-bold text-ink">
                    {"Escalades activées"}
                  </span>
                  {"\n              "}
                  <span className="text-[11.5px] text-slate">
                    {"Désactiver pour suspendre toutes les relances automatiques."}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div id="escalationsEnabled" className="toggle on" role="checkbox" aria-checked="true" aria-label="Activer les rappels et escalades" tabIndex="0"></div>
                {"\n          "}
              </div>
              {"\n\n        "}
            </div>
            {"\n\n        "}
            {"\n        "}
            <div className="bg-bone border border-fog rounded-xl p-4">
              {"\n          "}
              <span className="block text-[10px] font-bold text-slate uppercase tracking-[.12em] mb-3">
                {"Aperçu des relances"}
              </span>
              {"\n          "}
              <div id="reminderPreview" className="flex flex-wrap gap-2 items-center" aria-live="polite"></div>
              {"\n          "}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {"\n            "}
                <button id="saveEscalationSettings" type="button" className="px-4 py-2.5 bg-ink text-white text-[12px] font-bold rounded-lg hover:bg-graphite transition-colors">
                  {"Enregistrer les seuils"}
                </button>
                {"\n            "}
                <span id="escalationSaveStatus" className="text-[11px] text-slate" aria-live="polite">
                  {"Chargement des seuils depuis la base de données…"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-t from-paper via-paper/95 to-transparent flex justify-end">
            {"\n        "}
            <span id="platformSettingsSaveStatus" className="text-[11px] text-slate" aria-live="polite">
              {"Chargement des paramètres depuis la base de données…"}
            </span>
            {"\n        "}
            <button id="savePlatformSettings" type="button" className="flex items-center gap-2 px-5 py-3 bg-ink text-white text-[13px] font-bold rounded-xl hover:bg-graphite transition-colors shadow-lg flex-shrink-0">
              {"\n          "}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              {"\n          Enregistrer les modifications\n        "}
            </button>
            {"\n      "}
          </section>
          {"\n\n      "}
          <footer className="flex items-center justify-between pt-2 pb-6 text-[11px] text-mist">
            {"\n        "}
            <span>
              {"© 2026 GESCODO · Console plateforme"}
            </span>
            {"\n        "}
            <span className="num">
              {"v2.4.1"}
            </span>
            {"\n      "}
          </footer>
          {"\n\n    "}
        </div>
        {"\n  "}
      </main>
      {"\n"}
    </div>
    {"\n\n"}
    {"\n\n"}
    </div>
  );
}
