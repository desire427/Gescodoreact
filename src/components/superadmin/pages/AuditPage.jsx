import { useState } from 'react';
import SuperAdminSidebarProfile from '../../common/SuperAdminSidebarProfile';
import SuperAdminHeaderActions from '../../common/SuperAdminHeaderActions';
import { useSuperAdmin } from '../../../context/SuperAdminContext';
import Pagination, { usePagination } from '../../common/Pagination';

const SETTING_LABELS = {
  session_timeout: 'Durée maximale d’une session',
  max_devices_per_user: 'Nombre maximal d’appareils par utilisateur',
  password_min_length: 'Longueur minimale du mot de passe',
  file_max_size_mb: 'Taille maximale des fichiers (Mo)',
  backup_retention_days: 'Durée de conservation des sauvegardes (jours)',
  two_factor_required: 'Authentification à deux facteurs obligatoire',
  auto_lock_suspected_accounts: 'Verrouillage automatique des comptes suspects',
  maintenance_mode: 'Mode maintenance',
  allowed_file_types: 'Types de fichiers autorisés',
  platform_version: 'Version de la plateforme',
  escalade_settings: 'Règles d’escalade des alertes',
};

function readableSettingLabel(key) {
  return SETTING_LABELS[key] || key.replaceAll('_', ' ').replace(/^./, letter => letter.toLocaleUpperCase('fr'));
}

function AuditDetails({ details }) {
  const value = String(details || '').trim();
  const changes = value.match(/^(?:Clés modifiées|Mise à jour)\s*:\s*\[([\s\S]*?)\]\.??$/i);
  const keys = changes?.[1].match(/["']([^"']+)["']/g)?.map(key => key.slice(1, -1)) || [];

  if (keys.length) {
    return (
      <div>
        <p className="text-[13px] text-graphite">Les éléments suivants ont été modifiés :</p>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {keys.map(key => <li key={key} className="flex items-start gap-2 rounded-lg bg-paper px-3 py-2 text-[12px] font-semibold text-ink"><span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lime" />{readableSettingLabel(key)}</li>)}
        </ul>
      </div>
    );
  }

  return <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-graphite">{value || 'Aucune information complémentaire enregistrée.'}</p>;
}

export const title = "GESCODO — Journal d'audit";
export const bodyClass = "bg-paper text-ink font-sans h-screen w-screen overflow-hidden flex";
const pageStyles = "\n  * { -webkit-font-smoothing: antialiased; }\n  ::-webkit-scrollbar { width: 4px; height: 4px; }\n  ::-webkit-scrollbar-thumb { background: #FFFFFF; border-radius: 10px; }\n  ::-webkit-scrollbar-track { background: transparent; }\n  body { overflow: hidden; }\n\n  .tick { animation: tick 1.6s ease-in-out infinite; }\n  @keyframes tick { 0%,100% { opacity: 1; } 50% { opacity: .35; } }\n\n  .num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; letter-spacing: -.04em; }\n\n  .noise {\n    background-image: radial-gradient(circle at 1px 1px, rgba(22,51,70,.035) 1px, transparent 0);\n    background-size: 20px 20px;\n  }\n\n  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SIDEBAR \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n  #sidebar {\n    width: 72px;\n    transition: width .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded { width: 248px; }\n\n  @media (max-width: 1023px) {\n    #sidebar {\n      position: fixed;\n      top: 0;\n      left: 0;\n      height: 100vh;\n      transform: translateX(-100%);\n      width: 248px;\n    }\n    #sidebar.mobile-open {\n      transform: translateX(0);\n      box-shadow: 4px 0 30px rgba(22,51,70,.3);\n    }\n    #sidebar.mobile-open .nav-label,\n    #sidebar.mobile-open .brand-text,\n    #sidebar.mobile-open .user-info,\n    #sidebar.mobile-open .group-label,\n    #sidebar.mobile-open .nav-tail {\n      opacity: 1;\n      width: auto;\n      height: auto;\n    }\n    #toggleBtn {\n      display: none !important;\n      visibility: hidden !important;\n      opacity: 0 !important;\n      pointer-events: none !important;\n    }\n  }\n\n  #overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(22,51,70,.5);\n    backdrop-filter: blur(2px);\n    z-index: 30;\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity .3s ease;\n  }\n  #overlay.show { opacity: 1; pointer-events: auto; }\n  @media (min-width: 1024px) { #overlay { display: none; } }\n\n  .nav-item {\n    display: flex;\n    align-items: center;\n    height: 44px;\n    width: 100%;\n    color: rgba(255,255,255,.55);\n    transition: color .15s ease, background-color .15s ease;\n    position: relative;\n  }\n  .nav-item:hover { color: #FFFFFF; background: rgba(255,255,255,.06); }\n  .nav-item.active { background: #DBC88D; color: #163346; }\n  .nav-item.active:hover { background: #DBC88D; color: #163346; }\n\n  .nav-icon {\n    width: 72px;\n    min-width: 72px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n  }\n  @media (max-width: 1023px) {\n    .nav-icon { width: 56px; min-width: 56px; }\n  }\n\n  .nav-label {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    font-size: 13px;\n    font-weight: 600;\n    padding-right: 16px;\n  }\n  #sidebar.expanded .nav-label { opacity: 1; width: auto; }\n\n  .nav-tail {\n    margin-left: auto;\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    padding-right: 16px;\n    flex-shrink: 0;\n  }\n  #sidebar.expanded .nav-tail { opacity: 1; width: auto; }\n\n  .brand-text, .user-info {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded .brand-text,\n  #sidebar.expanded .user-info { opacity: 1; width: auto; }\n\n  .group-label {\n    opacity: 0;\n    height: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, height .3s ease;\n  }\n  #sidebar.expanded .group-label { opacity: 1; height: 22px; }\n\n  #toggleBtn {\n    position: absolute;\n    top: 22px;\n    right: -14px;\n    width: 28px;\n    height: 28px;\n    border-radius: 50%;\n    background: #DBC88D;\n    color: #163346;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    box-shadow: 0 2px 10px rgba(22,51,70,.25);\n    cursor: pointer;\n    z-index: 50;\n    border: 3px solid #FFFFFF;\n    transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;\n  }\n  #toggleBtn:hover { transform: scale(1.12); box-shadow: 0 4px 14px rgba(22,51,70,.35); }\n\n  #toggleIcon { transition: transform .3s cubic-bezier(.22,1,.36,1); }\n  #sidebar.expanded #toggleIcon { transform: rotate(180deg); }\n\n  /* Table row hover */\n  .audit-row { transition: background .15s ease; }\n  .audit-row:hover { background: #FFFFFF; }\n\n  /* Badges */\n  .badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; letter-spacing: .02em; }\n\n  /* Detail expandable */\n  .detail-row { background: #FFFFFF; }\n";

export default function AuditPage() {
  const { auditLogs = [], companies = [] } = useSuperAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const severityLabels = { info: 'INFO', low: 'FAIBLE', medium: 'MOYEN', high: 'ÉLEVÉ', critical: 'CRITIQUE' };
  const search = searchTerm.trim().toLocaleLowerCase('fr');
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = !search || [log.actorName, log.action, log.resourceName, log.details, log.ip]
      .some(value => String(value || '').toLocaleLowerCase('fr').includes(search));
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });
  const pagination = usePagination(filteredAuditLogs);
  const formatDate = value => value ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';
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
        <a data-page="audit" className="nav-item active" title="Journal d'audit">
          {"\n      "}
          <span className="nav-icon" style={{"position":"relative"}}>
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              {"\n          "}
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              {"\n        "}
            </svg>
            {"\n        "}
            <span className="absolute top-2.5 right-[22px] w-2 h-2 rounded-full bg-ink"></span>
            {"\n      "}
          </span>
          {"\n      "}
          <span className="nav-label">
            {"Journal d'audit"}
          </span>
          {"\n      "}
          <span className="nav-tail">
            {"\n        "}
            <span className="num text-[10px] font-bold text-ink bg-paper/20 px-1.5 py-0.5 rounded">
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
            {"Journal d'audit"}
          </h1>
          {"\n    "}
        </div>
        {"\n\n    "}
        <div className="hidden md:flex flex-1 max-w-[420px] mx-auto items-center gap-2 h-10 px-3.5 bg-bone rounded-xl">
          {"\n      "}
          <svg className="w-4 h-4 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            {"\n        "}
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
            {"\n      "}
          </svg>
          {"\n      "}
          <input type="text" placeholder="Acteur, action, ressource…" className="audit-header-search flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
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
                {"Journal d'audit"}
              </h2>
              {"\n          "}
              <p className="text-[12px] sm:text-[13px] text-slate font-medium">
                <span className="text-ink font-semibold">
                  {"248 entrées"}
                </span>
                {" · 2 critiques · 8 élevées · traçabilité complète"}
              </p>
              {"\n        "}
            </div>
            {"\n        "}
            <div className="flex items-center gap-2 flex-shrink-0">
              {"\n          "}
              <button className="h-9 px-3 text-[12px] font-semibold text-graphite border border-fog rounded-lg hover:border-ink hover:bg-bone transition-all flex items-center gap-1.5">
                {"\n            "}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {"\n            Exporter CSV\n          "}
              </button>
              {"\n          "}
              <button className="h-9 px-3 text-[12px] font-bold bg-ink text-white rounded-lg hover:bg-graphite transition-colors flex items-center gap-1.5 whitespace-nowrap">
                {"\n            "}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                {"\n            Filtres avancés\n          "}
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
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {auditLogs.length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Entrées"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {"7 derniers jours"}
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
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="num text-[10px] font-bold text-ink bg-lime px-2 py-1 rounded">
                  {"CRITIQUE"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {"2"}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Critiques"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {"Action requise"}
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
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="num text-[10px] font-bold text-slate bg-bone px-2 py-1 rounded">
                  {"ÉLEVÉ"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {"8"}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Élevées"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {"À vérifier"}
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
                {"\n            "}
                <span className="num text-[10px] font-bold text-ink bg-bone px-2 py-1 rounded">
                  {"OK"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {"238"}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Normales"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {"Info / Moyen / Faible"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="flex flex-col gap-3">
            {"\n        "}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {"\n          "}
              <div className="flex-1 flex items-center gap-2 h-10 px-3.5 bg-white rounded-xl">
                {"\n            "}
                <svg className="w-4 h-4 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  {"\n              "}
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="m20 20-3.5-3.5"></path>
                  {"\n            "}
                </svg>
                {"\n            "}
                <input type="text" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Rechercher un acteur, une action…" className="flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex items-center gap-1 bg-white border border-fog rounded-xl p-1 overflow-x-auto">
                {"\n            "}
                <button type="button" onClick={() => setSeverityFilter('all')} className={`h-8 px-3 text-[11px] rounded-lg whitespace-nowrap ${severityFilter === 'all' ? 'font-bold bg-ink text-white' : 'font-semibold text-slate hover:text-ink hover:bg-bone'}`}>
                  {"Toutes"}
                </button>
                {"\n            "}
                <button type="button" onClick={() => setSeverityFilter('critical')} className={`h-8 px-3 text-[11px] rounded-lg whitespace-nowrap ${severityFilter === 'critical' ? 'font-bold bg-ink text-white' : 'font-semibold text-slate hover:text-ink hover:bg-bone'}`}>
                  {"Critiques"}
                </button>
                {"\n            "}
                <button type="button" onClick={() => setSeverityFilter('high')} className={`h-8 px-3 text-[11px] rounded-lg whitespace-nowrap ${severityFilter === 'high' ? 'font-bold bg-ink text-white' : 'font-semibold text-slate hover:text-ink hover:bg-bone'}`}>
                  {"Élevées"}
                </button>
                {"\n            "}
                <button type="button" onClick={() => setSeverityFilter('medium')} className={`h-8 px-3 text-[11px] rounded-lg whitespace-nowrap ${severityFilter === 'medium' ? 'font-bold bg-ink text-white' : 'font-semibold text-slate hover:text-ink hover:bg-bone'}`}>
                  {"Moyens"}
                </button>
                {"\n            "}
                <button type="button" onClick={() => setSeverityFilter('low')} className={`h-8 px-3 text-[11px] rounded-lg whitespace-nowrap ${severityFilter === 'low' ? 'font-bold bg-ink text-white' : 'font-semibold text-slate hover:text-ink hover:bg-bone'}`}>
                  {"Faibles"}
                </button>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex items-end gap-3 p-4 bg-white border border-fog rounded-xl flex-wrap">
              {"\n          "}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                {"\n            "}
                <label className="text-[10px] font-bold text-slate uppercase tracking-[.10em]">
                  {"Type d'action"}
                </label>
                {"\n            "}
                <select className="h-9 px-3 bg-paper border border-fog rounded-lg text-[12.5px] font-medium text-ink focus:outline-none focus:border-ink transition-colors">
                  {"\n              "}
                  <option>
                    {"Toutes les actions"}
                  </option>
                  {"\n              "}
                  <option>
                    {"Comptes utilisateurs"}
                  </option>
                  {"\n              "}
                  <option>
                    {"Sociétés"}
                  </option>
                  {"\n              "}
                  <option>
                    {"Sessions"}
                  </option>
                  {"\n              "}
                  <option>
                    {"Paramètres"}
                  </option>
                  {"\n              "}
                  <option>
                    {"Projets"}
                  </option>
                  {"\n              "}
                  <option>
                    {"Réunions"}
                  </option>
                  {"\n            "}
                </select>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                {"\n            "}
                <label className="text-[10px] font-bold text-slate uppercase tracking-[.10em]">
                  {"Société"}
                </label>
                {"\n            "}
                <select className="h-9 px-3 bg-paper border border-fog rounded-lg text-[12.5px] font-medium text-ink focus:outline-none focus:border-ink transition-colors">
                  {"\n              "}
                  <option value="">Toutes</option>
                  {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                  {"\n            "}
                </select>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                {"\n            "}
                <label className="text-[10px] font-bold text-slate uppercase tracking-[.10em]">
                  {"Période"}
                </label>
                {"\n            "}
                <select className="h-9 px-3 bg-paper border border-fog rounded-lg text-[12.5px] font-medium text-ink focus:outline-none focus:border-ink transition-colors">
                  {"\n              "}
                  <option>
                    {"7 derniers jours"}
                  </option>
                  {"\n              "}
                  <option>
                    {"30 derniers jours"}
                  </option>
                  {"\n              "}
                  <option>
                    {"3 derniers mois"}
                  </option>
                  {"\n            "}
                </select>
                {"\n          "}
              </div>
              {"\n          "}
              <button className="h-9 px-3 flex items-center gap-1.5 bg-bone border border-fog text-[12px] font-semibold text-graphite rounded-lg hover:border-ink hover:text-ink transition-all ml-auto">
                {"\n            "}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                {"\n            Réinitialiser\n          "}
              </button>
              {"\n        "}
            </div>
            {"\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="bg-white border border-fog rounded-2xl overflow-hidden">
            {"\n\n        "}
            <div className="overflow-x-auto">
              {"\n          "}
              <table className="w-full border-collapse min-w-[920px]">
                {"\n            "}
                <thead>
                  {"\n              "}
                  <tr className="border-b border-fog bg-paper/50">
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap" style={{"width":"110px"}}>
                      {"Sévérité"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Action"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Acteur"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Ressource"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Société"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Date / Heure"}
                    </th>
                    {"\n                "}
                    <th className="w-12"></th>
                    {"\n              "}
                  </tr>
                  {"\n            "}
                </thead>
                {"\n            "}
                <tbody>
                  {pagination.pageItems.map(log => {
                    const initials = (log.actorName || 'S').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
                    const severityClass = ['critical', 'high'].includes(log.severity) ? 'bg-ink text-lime' : log.severity === 'medium' ? 'bg-bone text-ink' : 'bg-paper text-slate border border-fog';
                    return <tr key={log.id} className="audit-row border-b border-fog cursor-pointer" tabIndex={0} role="button" aria-label={`Afficher les détails : ${log.label || log.action || 'activité'}`} onClick={() => setSelectedLog(log)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedLog(log); } }}>
                      <td className="py-3.5 px-4"><span className={`badge ${severityClass}`}>{severityLabels[log.severity] || log.severity || '—'}</span></td>
                      <td className="py-3.5 px-4"><div className="flex flex-col gap-0.5"><span className="text-[13px] font-bold text-ink">{log.label || log.action || '—'}</span><span className="num text-[10px] text-slate font-semibold">{log.action || '—'}</span></div></td>
                      <td className="py-3.5 px-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-lime text-[10px] font-black flex-shrink-0">{initials}</div><span className="text-[12.5px] text-graphite font-medium">{log.actorName || 'Système'}</span></div></td>
                      <td className="py-3.5 px-4"><div className="flex flex-col gap-0.5"><span className="num text-[10px] text-slate font-semibold">{log.resource || '—'}</span><span className="text-[12.5px] text-graphite font-medium">{log.resourceLabel || '—'}</span></div></td>
                      <td className="py-3.5 px-4 text-[12px] text-graphite">{log.companyName || '—'}</td>
                      <td className="py-3.5 px-4"><span className="num text-[11px] text-slate font-semibold">{formatDate(log.timestamp)}</span></td>
                      <td className="py-3.5 px-4 text-[11px] text-slate">{log.ip || '—'}</td>
                    </tr>;
                  })}
                  {!filteredAuditLogs.length && <tr><td colSpan="7" className="p-8 text-center text-sm text-slate">{auditLogs.length ? 'Aucune activité ne correspond aux filtres.' : 'Aucune activité reçue de l’API.'}</td></tr>}
                </tbody>
                {"\n          "}
              </table>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <Pagination pagination={pagination} label="entrées" />
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
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4" role="presentation" onClick={() => setSelectedLog(null)}>
          <section className="w-full max-w-xl rounded-2xl border border-fog bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-fog pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate">Détail de l’activité</p>
                <h2 id="audit-detail-title" className="mt-1 text-lg font-black text-ink">{selectedLog.label || selectedLog.action || 'Activité'}</h2>
                <p className="num mt-1 text-[11px] font-semibold text-slate">{selectedLog.action || '—'}</p>
              </div>
              <button type="button" className="rounded-lg px-3 py-1 text-xl text-slate hover:bg-paper hover:text-ink" onClick={() => setSelectedLog(null)} aria-label="Fermer les détails">×</button>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['Acteur', selectedLog.actorName || 'Système'],
                ['Niveau', severityLabels[selectedLog.severity] || selectedLog.severity || '—'],
                ['Ressource', [selectedLog.resource, selectedLog.resourceLabel].filter(Boolean).join(' · ') || '—'],
                ['Société', selectedLog.companyName || '—'],
                ['Date et heure', formatDate(selectedLog.timestamp)],
                ['Adresse IP', selectedLog.ip || '—'],
                ['Identifiant ressource', selectedLog.resourceId || '—'],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-paper p-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate">{label}</dt><dd className="mt-1 break-words text-[13px] font-semibold text-ink">{value}</dd></div>)}
            </dl>
            <div className="mt-3 rounded-xl border border-fog p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate">Informations complémentaires</h3>
              <AuditDetails details={selectedLog.details} />
            </div>
          </section>
        </div>
      )}
      {"\n"}
    </div>
    {"\n\n"}
    {"\n\n"}
    </div>
  );
}
