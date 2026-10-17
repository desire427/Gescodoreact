import { useEffect, useState } from 'react';
import SuperAdminSidebarProfile from '../../common/SuperAdminSidebarProfile';
import SuperAdminHeaderActions from '../../common/SuperAdminHeaderActions';
import { useSuperAdmin } from '../../../context/SuperAdminContext';

const MATRIX_ROWS = [
  { key: 'read_conversations', action: 'Lire ses conversations' },
  { key: 'create_meeting', action: 'Créer une réunion' },
  { key: 'create_decision', action: 'Créer une décision' },
  { key: 'disable_account', action: 'Désactiver un compte' },
  { key: 'audit_global', action: "Voir journal d'audit (global)" },
  { key: 'manage_companies', action: 'Gérer les sociétés' },
  { key: 'manage_global_roles', action: 'Gérer les rôles globaux' },
  { key: 'platform_settings', action: 'Accéder aux paramètres plateforme' },
];
const MATRIX_ROLES = [
  { key: 'employe', label: 'Employé' },
  { key: 'manager', label: 'Manager' },
  { key: 'adminSociete', label: 'Admin Sté' },
  { key: 'superAdmin', label: 'Super Admin' },
];
const DEFAULT_MATRIX = {
  read_conversations: { employe: true, manager: true, adminSociete: false, superAdmin: false },
  create_meeting: { employe: false, manager: true, adminSociete: true, superAdmin: true },
  create_decision: { employe: false, manager: true, adminSociete: true, superAdmin: true },
  disable_account: { employe: false, manager: false, adminSociete: true, superAdmin: true },
  audit_global: { employe: false, manager: false, adminSociete: false, superAdmin: true },
  manage_companies: { employe: false, manager: false, adminSociete: false, superAdmin: true },
  manage_global_roles: { employe: false, manager: false, adminSociete: false, superAdmin: true },
  platform_settings: { employe: false, manager: false, adminSociete: false, superAdmin: true },
};

function PermissionMatrix() {
  const { platformSettings, updatePlatformSettings } = useSuperAdmin();
  const [matrix, setMatrix] = useState(platformSettings.rolePermissions || DEFAULT_MATRIX);
  const [status, setStatus] = useState('Droits chargés depuis la base de données.');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMatrix(Object.keys(platformSettings.rolePermissions || {}).length
      ? platformSettings.rolePermissions
      : DEFAULT_MATRIX);
  }, [platformSettings.rolePermissions]);

  const changePermission = async (action, role, checked) => {
    const previous = matrix;
    const next = { ...matrix, [action]: { ...matrix[action], [role]: checked } };
    setMatrix(next);
    setSaving(true);
    setStatus('Enregistrement des droits…');
    try {
      await updatePlatformSettings({ rolePermissions: next });
      setStatus('Droits enregistrés dans la base de données.');
    } catch {
      setMatrix(previous);
      setStatus('Échec de l’enregistrement. Les droits précédents ont été restaurés.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <tbody>
        {MATRIX_ROWS.map(row => (
          <tr className="matrix-row border-b border-fog" key={row.key}>
            <td className="py-3.5 px-4 text-[13px] text-ink font-medium">{row.action}</td>
            {MATRIX_ROLES.map(role => (
              <td className="py-3.5 px-4 text-center" key={role.key}>
                <label className="inline-flex items-center justify-center w-8 h-8 cursor-pointer" title={`${row.action} — ${role.label}`}>
                  <input
                    type="checkbox"
                    className="permission-checkbox"
                    aria-label={`${row.action} — ${role.label}`}
                    checked={Boolean(matrix[row.key]?.[role.key])}
                    disabled={saving}
                    onChange={event => changePermission(row.key, role.key, event.target.checked)}
                  />
                </label>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><td colSpan="5" className="px-4 py-3 text-[11px] text-slate" aria-live="polite">{status}</td></tr>
      </tfoot>
    </>
  );
}

export const title = "GESCODO — Rôles & Accès";
export const bodyClass = "bg-paper text-ink font-sans h-screen w-screen overflow-hidden flex";
const pageStyles = "\n  * { -webkit-font-smoothing: antialiased; }\n  ::-webkit-scrollbar { width: 4px; height: 4px; }\n  ::-webkit-scrollbar-thumb { background: #FFFFFF; border-radius: 10px; }\n  ::-webkit-scrollbar-track { background: transparent; }\n  body { overflow: hidden; }\n\n  .tick { animation: tick 1.6s ease-in-out infinite; }\n  @keyframes tick { 0%,100% { opacity: 1; } 50% { opacity: .35; } }\n\n  .num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; letter-spacing: -.04em; }\n\n  .noise {\n    background-image: radial-gradient(circle at 1px 1px, rgba(22,51,70,.035) 1px, transparent 0);\n    background-size: 20px 20px;\n  }\n\n  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SIDEBAR \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n  #sidebar {\n    width: 72px;\n    transition: width .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded { width: 248px; }\n\n  @media (max-width: 1023px) {\n    #sidebar {\n      position: fixed;\n      top: 0;\n      left: 0;\n      height: 100vh;\n      transform: translateX(-100%);\n      width: 248px;\n    }\n    #sidebar.mobile-open {\n      transform: translateX(0);\n      box-shadow: 4px 0 30px rgba(22,51,70,.3);\n    }\n    #sidebar.mobile-open .nav-label,\n    #sidebar.mobile-open .brand-text,\n    #sidebar.mobile-open .user-info,\n    #sidebar.mobile-open .group-label,\n    #sidebar.mobile-open .nav-tail {\n      opacity: 1;\n      width: auto;\n      height: auto;\n    }\n    #toggleBtn {\n      display: none !important;\n      visibility: hidden !important;\n      opacity: 0 !important;\n      pointer-events: none !important;\n    }\n  }\n\n  #overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(22,51,70,.5);\n    backdrop-filter: blur(2px);\n    z-index: 30;\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity .3s ease;\n  }\n  #overlay.show { opacity: 1; pointer-events: auto; }\n  @media (min-width: 1024px) { #overlay { display: none; } }\n\n  .nav-item {\n    display: flex;\n    align-items: center;\n    height: 44px;\n    width: 100%;\n    color: rgba(255,255,255,.55);\n    transition: color .15s ease, background-color .15s ease;\n    position: relative;\n  }\n  .nav-item:hover { color: #FFFFFF; background: rgba(255,255,255,.06); }\n  .nav-item.active { background: #DBC88D; color: #163346; }\n  .nav-item.active:hover { background: #DBC88D; color: #163346; }\n\n  .nav-icon {\n    width: 72px;\n    min-width: 72px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n  }\n  @media (max-width: 1023px) {\n    .nav-icon { width: 56px; min-width: 56px; }\n  }\n\n  .nav-label {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    font-size: 13px;\n    font-weight: 600;\n    padding-right: 16px;\n  }\n  #sidebar.expanded .nav-label { opacity: 1; width: auto; }\n\n  .nav-tail {\n    margin-left: auto;\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    padding-right: 16px;\n    flex-shrink: 0;\n  }\n  #sidebar.expanded .nav-tail { opacity: 1; width: auto; }\n\n  .brand-text, .user-info {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded .brand-text,\n  #sidebar.expanded .user-info { opacity: 1; width: auto; }\n\n  .group-label {\n    opacity: 0;\n    height: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, height .3s ease;\n  }\n  #sidebar.expanded .group-label { opacity: 1; height: 22px; }\n\n  #toggleBtn {\n    position: absolute;\n    top: 22px;\n    right: -14px;\n    width: 28px;\n    height: 28px;\n    border-radius: 50%;\n    background: #DBC88D;\n    color: #163346;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    box-shadow: 0 2px 10px rgba(22,51,70,.25);\n    cursor: pointer;\n    z-index: 50;\n    border: 3px solid #FFFFFF;\n    transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;\n  }\n  #toggleBtn:hover { transform: scale(1.12); box-shadow: 0 4px 14px rgba(22,51,70,.35); }\n\n  #toggleIcon { transition: transform .3s cubic-bezier(.22,1,.36,1); }\n  #sidebar.expanded #toggleIcon { transform: rotate(180deg); }\n\n  /* Card r\u00f4le */\n  .role-card {\n    transition: border-color .2s ease, transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease;\n  }\n  .role-card:hover {\n    border-color: #163346;\n    transform: translateY(-3px);\n    box-shadow: 0 12px 28px rgba(22,51,70,.08);\n  }\n\n  /* Bordure compl\u00e8te selon l'accent du r\u00f4le */\n  .role-card.accent-violet  { border: 1px solid #163346; }\n  .role-card.accent-blue    { border: 1px solid #0A0201; }\n  .role-card.accent-green   { border: 1px solid #DBC88D; }\n  .role-card.accent-amber   { border: 1px solid #0A0201; }\n  .role-card.accent-cyan    { border: 1px solid #163346; }\n  .role-card.accent-slate   { border: 1px solid #0A0201; }\n\n  .permission-checkbox {\n    width: 20px;\n    height: 20px;\n    accent-color: #163346;\n    cursor: pointer;\n  }\n  .permission-checkbox:focus-visible { outline: 2px solid #DBC88D; outline-offset: 2px; }\n\n  .badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; letter-spacing: .02em; }\n\n  /* Matrice */\n  .matrix-row { transition: background .15s ease; }\n  .matrix-row:hover { background: #FFFFFF; }\n";

export default function RolesPage() {
  const { users = [], stats = {} } = useSuperAdmin();
  const roleCounts = stats.roleCounts || users.reduce((counts, user) => ({ ...counts, [user.role]: (counts[user.role] || 0) + 1 }), {});
  const roleTotal = Object.values(roleCounts).reduce((total, count) => total + count, 0);
  const roleDefinitions = stats.roleChoices || [];
  const roleCount = roleDefinitions.length;
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
            {roleTotal}
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
        <a data-page="roles" className="nav-item active" title="Rôles & Accès">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
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
          {"\n      "}
          <span className="nav-tail num text-[10px] font-bold text-ink bg-paper/20 px-1.5 py-0.5 rounded">
            {roleCount}
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
        <a data-page="settings" className="nav-item" title="Paramètres">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
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
      <SuperAdminSidebarProfile />
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
            {"Rôles & Accès"}
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
          <input type="text" placeholder="Rechercher un rôle, une permission…" className="flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
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
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1500px] mx-auto flex flex-col gap-6 sm:gap-8">
          {"\n\n      "}
          {"\n      "}
          <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
            {"\n        "}
            <div className="flex flex-col gap-1">
              {"\n          "}
              <h2 className="text-[20px] sm:text-[26px] font-black tracking-tight leading-tight sm:leading-none">
                {"Rôles & Accès"}
              </h2>
              {"\n          "}
              <p className="text-[12px] sm:text-[13px] text-slate font-medium">
                <span className="text-ink font-semibold">
                  {`${roleCount} rôles définis`}
                </span>
                {` · ${roleTotal} utilisateurs répartis · RBAC + périmètre`}
              </p>
              {"\n        "}
            </div>
            {"\n        "}
            <div className="flex items-center gap-2 flex-shrink-0">
              {"\n          "}
              <button className="h-9 px-3 text-[12px] font-semibold text-graphite border border-fog rounded-lg hover:border-ink hover:bg-bone transition-all">
                {"Journal d'audit"}
              </button>
              {"\n          "}
              <button className="h-9 px-3 text-[12px] font-bold bg-ink text-white rounded-lg hover:bg-graphite transition-colors flex items-center gap-1.5 whitespace-nowrap">
                {"\n            "}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {"\n            Nouveau rôle\n          "}
              </button>
              {"\n        "}
            </div>
            {"\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {"\n\n        "}
            <div className="card flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-fog rounded-2xl">
              {"\n          "}
              <div className="flex items-center justify-between">
                {"\n            "}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-ink">
                  {"\n              "}
                  <svg className="w-4 h-4 text-lime" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {roleCount}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Rôles définis"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="card flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-fog rounded-2xl">
              {"\n          "}
              <div className="flex items-center justify-between">
                {"\n            "}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-ink">
                  {"\n              "}
                  <svg className="w-4 h-4 text-lime" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {roleTotal}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Utilisateurs"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="card flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-fog rounded-2xl">
              {"\n          "}
              <div className="flex items-center justify-between">
                {"\n            "}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-ink">
                  {"\n              "}
                  <svg className="w-4 h-4 text-lime" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {stats.permissionsCount ?? '—'}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Permissions système"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="card flex flex-col gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-fog rounded-2xl">
              {"\n          "}
              <div className="flex items-center justify-between">
                {"\n            "}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-ink">
                  {"\n              "}
                  <svg className="w-4 h-4 text-lime" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {stats.activeUsers ?? users.filter(user => user.status === 'active').length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Utilisateurs actifs"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="flex flex-col gap-1">
            {"\n        "}
            <span className="text-[11px] font-bold text-slate uppercase tracking-[.12em]">
              {"Rôles définis"}
            </span>
            {"\n        "}
            <span className="text-[12px] text-slate font-medium">
              {"Cliquez sur un rôle pour voir ses permissions détaillées"}
            </span>
            {"\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {"\n\n        "}
            {"\n        "}
            <div className="role-card accent-violet bg-white border border-fog rounded-2xl p-5 flex flex-col gap-4 cursor-pointer">
              {"\n          "}
              <div className="flex items-start gap-3">
                {"\n            "}
                <div className="w-11 h-11 bg-ink rounded-xl flex items-center justify-center text-lime flex-shrink-0">
                  {"\n              "}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex-1 min-w-0">
                  {"\n              "}
                  <span className="block text-[14px] font-black text-ink tracking-tight truncate">
                    {"Super Administrateur"}
                  </span>
                  {"\n              "}
                  <div className="flex items-center gap-1.5 mt-1">
                    {"\n                "}
                    <svg className="w-3 h-3 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    {"\n                "}
                    <span className="num text-[11px] font-bold text-slate">
                      {roleCounts.superAdmin || 0}
                    </span>
                    {"\n                "}
                    <span className="text-[11px] text-slate font-medium">
                      {"utilisateurs"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="badge bg-ink text-lime">
                  {"TOTAL"}
                </span>
                {"\n          "}
              </div>
              {"\n\n          "}
              <p className="text-[12px] text-slate leading-relaxed">
                {"Accès total à la plateforme. Gestion des sociétés, rôles, sécurité, audit et restauration."}
              </p>
              {"\n        "}
            </div>
            {"\n\n        "}
            {"\n        "}
            <div className="role-card accent-violet bg-white border border-fog rounded-2xl p-5 flex flex-col gap-4 cursor-pointer">
              {"\n          "}
              <div className="flex items-start gap-3">
                {"\n            "}
                <div className="w-11 h-11 bg-ink rounded-xl flex items-center justify-center text-lime flex-shrink-0">
                  {"\n              "}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex-1 min-w-0">
                  {"\n              "}
                  <span className="block text-[14px] font-black text-ink tracking-tight truncate">
                    {"Administrateur Société"}
                  </span>
                  {"\n              "}
                  <div className="flex items-center gap-1.5 mt-1">
                    {"\n                "}
                    <svg className="w-3 h-3 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    {"\n                "}
                    <span className="num text-[11px] font-bold text-slate">
                      {roleCounts.adminSociete || 0}
                    </span>
                    {"\n                "}
                    <span className="text-[11px] text-slate font-medium">
                      {"utilisateurs"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="badge bg-ink text-lime">
                  {"SOCIÉTÉ"}
                </span>
                {"\n          "}
              </div>
              {"\n\n          "}
              <p className="text-[12px] text-slate leading-relaxed">
                {"Administrateur de sa société : gestion des utilisateurs, groupes, services, décisions, rapports."}
              </p>
              {"\n        "}
            </div>
            {"\n\n        "}
            {"\n        "}
            <div className="role-card accent-violet bg-white border border-fog rounded-2xl p-5 flex flex-col gap-4 cursor-pointer">
              {"\n          "}
              <div className="flex items-start gap-3">
                {"\n            "}
                <div className="w-11 h-11 bg-ink rounded-xl flex items-center justify-center text-lime flex-shrink-0">
                  {"\n              "}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex-1 min-w-0">
                  {"\n              "}
                  <span className="block text-[14px] font-black text-ink tracking-tight truncate">
                    {"Directeur / Manager"}
                  </span>
                  {"\n              "}
                  <div className="flex items-center gap-1.5 mt-1">
                    {"\n                "}
                    <svg className="w-3 h-3 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    {"\n                "}
                    <span className="num text-[11px] font-bold text-slate">
                      {roleCounts.manager || 0}
                    </span>
                    {"\n                "}
                    <span className="text-[11px] text-slate font-medium">
                      {"utilisateurs"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="badge bg-ink text-lime">
                  {"ÉQUIPE"}
                </span>
                {"\n          "}
              </div>
              {"\n\n          "}
              <p className="text-[12px] text-slate leading-relaxed">
                {"Gestion de son équipe, réunions, décisions, tâches et validations de son périmètre."}
              </p>
              {"\n        "}
            </div>
            {"\n\n        "}
            {"\n        "}
            <div className="role-card accent-violet bg-white border border-fog rounded-2xl p-5 flex flex-col gap-4 cursor-pointer">
              {"\n          "}
              <div className="flex items-start gap-3">
                {"\n            "}
                <div className="w-11 h-11 bg-ink rounded-xl flex items-center justify-center text-lime flex-shrink-0">
                  {"\n              "}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex-1 min-w-0">
                  {"\n              "}
                  <span className="block text-[14px] font-black text-ink tracking-tight truncate">
                    {"Ressources Humaines"}
                  </span>
                  {"\n              "}
                  <div className="flex items-center gap-1.5 mt-1">
                    {"\n                "}
                    <svg className="w-3 h-3 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    {"\n                "}
                    <span className="num text-[11px] font-bold text-slate">
                      {roleCounts.rh || 0}
                    </span>
                    {"\n                "}
                    <span className="text-[11px] text-slate font-medium">
                      {"utilisateurs"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="badge bg-ink text-lime">
                  {"RH"}
                </span>
                {"\n          "}
              </div>
              {"\n\n          "}
              <p className="text-[12px] text-slate leading-relaxed">
                {"Gestion des profils collaborateurs, congés et données RH."}
              </p>
              {"\n        "}
            </div>
            {"\n\n        "}
            {"\n        "}
            <div className="role-card accent-violet bg-white border border-fog rounded-2xl p-5 flex flex-col gap-4 cursor-pointer">
              {"\n          "}
              <div className="flex items-start gap-3">
                {"\n            "}
                <div className="w-11 h-11 bg-ink rounded-xl flex items-center justify-center text-lime flex-shrink-0">
                  {"\n              "}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex-1 min-w-0">
                  {"\n              "}
                  <span className="block text-[14px] font-black text-ink tracking-tight truncate">
                    {"Chef de Projet"}
                  </span>
                  {"\n              "}
                  <div className="flex items-center gap-1.5 mt-1">
                    {"\n                "}
                    <svg className="w-3 h-3 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    {"\n                "}
                    <span className="num text-[11px] font-bold text-slate">
                      {roleCounts.chefProjet || 0}
                    </span>
                    {"\n                "}
                    <span className="text-[11px] text-slate font-medium">
                      {"utilisateurs"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="badge bg-ink text-lime">
                  {"PROJET"}
                </span>
                {"\n          "}
              </div>
              {"\n\n          "}
              <p className="text-[12px] text-slate leading-relaxed">
                {"Création et pilotage de projets, attribution de tâches, suivi d'avancement."}
              </p>
              {"\n        "}
            </div>
            {"\n\n        "}
            {"\n        "}
            <div className="role-card accent-violet bg-white border border-fog rounded-2xl p-5 flex flex-col gap-4 cursor-pointer">
              {"\n          "}
              <div className="flex items-start gap-3">
                {"\n            "}
                <div className="w-11 h-11 bg-ink rounded-xl flex items-center justify-center text-lime flex-shrink-0">
                  {"\n              "}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex-1 min-w-0">
                  {"\n              "}
                  <span className="block text-[14px] font-black text-ink tracking-tight truncate">
                    {"Employé"}
                  </span>
                  {"\n              "}
                  <div className="flex items-center gap-1.5 mt-1">
                    {"\n                "}
                    <svg className="w-3 h-3 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                    </svg>
                    {"\n                "}
                    <span className="num text-[11px] font-bold text-slate">
                      {roleCounts.employe || 0}
                    </span>
                    {"\n                "}
                    <span className="text-[11px] text-slate font-medium">
                      {"utilisateurs"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="badge bg-ink text-lime">
                  {"BASE"}
                </span>
                {"\n          "}
              </div>
              {"\n\n          "}
              <p className="text-[12px] text-slate leading-relaxed">
                {"Accès à ses propres tâches, conversations et informations."}
              </p>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
            {"\n\n        "}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              {"\n          "}
              <div className="flex items-center gap-2.5">
                {"\n            "}
                <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime flex-shrink-0">
                  {"\n              "}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex flex-col">
                  {"\n              "}
                  <h3 className="text-[15px] font-black tracking-tight">
                    {"Matrice d'autorisation"}
                  </h3>
                  {"\n              "}
                  <p className="text-[11px] text-slate font-medium mt-0.5">
                    {"Vue simplifiée des droits par rôle principal"}
                  </p>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="overflow-x-auto rounded-xl border border-fog">
              {"\n          "}
              <table className="w-full border-collapse min-w-[720px]">
                {"\n            "}
                <thead>
                  {"\n              "}
                  <tr className="border-b border-fog bg-bone/60">
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap" style={{"minWidth":"240px"}}>
                      {"Action"}
                    </th>
                    {"\n                "}
                    <th className="text-center py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Employé"}
                    </th>
                    {"\n                "}
                    <th className="text-center py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Manager"}
                    </th>
                    {"\n                "}
                    <th className="text-center py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Admin Sté"}
                    </th>
                    {"\n                "}
                    <th className="text-center py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Super Admin"}
                    </th>
                    {"\n              "}
                  </tr>
                  {"\n            "}
                </thead>
                {"\n            "}
                <PermissionMatrix />
                {"\n          "}
              </table>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex items-start gap-3 p-3 bg-bone border border-fog rounded-lg">
              {"\n          "}
              <svg className="w-4 h-4 text-slate flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {"\n          "}
              <p className="text-[11.5px] text-graphite leading-relaxed">
                {"La matrice combine "}
                <span className="font-bold">
                  {"RBAC"}
                </span>
                {" (droits par rôle) et "}
                <span className="font-bold">
                  {"contrôle par périmètre"}
                </span>
                {" (société, direction, service, projet). Un rôle seul ne suffit pas : l'accès dépend également du périmètre organisationnel de l'utilisateur."}
              </p>
              {"\n        "}
            </div>
            {"\n\n      "}
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
