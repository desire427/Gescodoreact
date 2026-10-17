import { useState } from 'react';
import SuperAdminSidebarProfile from '../../common/SuperAdminSidebarProfile';
import SuperAdminHeaderActions from '../../common/SuperAdminHeaderActions';
import { useSuperAdmin } from '../../../context/SuperAdminContext';
import { useAuth } from '../../../context/AuthContext';
import Pagination, { usePagination } from '../../common/Pagination';

export const title = "GESCODO — Utilisateurs";
export const bodyClass = "bg-paper text-ink font-sans h-screen w-screen overflow-hidden flex";
const pageStyles = "\n  * { -webkit-font-smoothing: antialiased; }\n  ::-webkit-scrollbar { width: 4px; height: 4px; }\n  ::-webkit-scrollbar-thumb { background: #FFFFFF; border-radius: 10px; }\n  ::-webkit-scrollbar-track { background: transparent; }\n  body { overflow: hidden; }\n\n  .tick { animation: tick 1.6s ease-in-out infinite; }\n  @keyframes tick { 0%,100% { opacity: 1; } 50% { opacity: .35; } }\n\n  .card { transition: border-color .2s ease, transform .25s cubic-bezier(.22,1,.36,1); }\n  .card:hover { border-color: #163346; transform: translateY(-2px); }\n\n  .num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; letter-spacing: -.04em; }\n\n  .noise {\n    background-image: radial-gradient(circle at 1px 1px, rgba(22,51,70,.035) 1px, transparent 0);\n    background-size: 20px 20px;\n  }\n\n  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SIDEBAR \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n  #sidebar {\n    width: 72px;\n    transition: width .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded { width: 248px; }\n\n  @media (max-width: 1023px) {\n    #sidebar {\n      position: fixed;\n      top: 0;\n      left: 0;\n      height: 100vh;\n      transform: translateX(-100%);\n      width: 248px;\n    }\n    #sidebar.mobile-open {\n      transform: translateX(0);\n      box-shadow: 4px 0 30px rgba(22,51,70,.3);\n    }\n    #sidebar.mobile-open .nav-label,\n    #sidebar.mobile-open .brand-text,\n    #sidebar.mobile-open .user-info,\n    #sidebar.mobile-open .group-label,\n    #sidebar.mobile-open .nav-tail {\n      opacity: 1;\n      width: auto;\n      height: auto;\n    }\n    #toggleBtn {\n      display: none !important;\n      visibility: hidden !important;\n      opacity: 0 !important;\n      pointer-events: none !important;\n    }\n  }\n\n  #overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(22,51,70,.5);\n    backdrop-filter: blur(2px);\n    z-index: 30;\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity .3s ease;\n  }\n  #overlay.show { opacity: 1; pointer-events: auto; }\n  @media (min-width: 1024px) { #overlay { display: none; } }\n\n  .nav-item {\n    display: flex;\n    align-items: center;\n    height: 44px;\n    width: 100%;\n    color: rgba(255,255,255,.55);\n    transition: color .15s ease, background-color .15s ease;\n    position: relative;\n  }\n  .nav-item:hover { color: #FFFFFF; background: rgba(255,255,255,.06); }\n  .nav-item.active { background: #DBC88D; color: #163346; }\n  .nav-item.active:hover { background: #DBC88D; color: #163346; }\n\n  .nav-icon {\n    width: 72px;\n    min-width: 72px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n  }\n  @media (max-width: 1023px) {\n    .nav-icon { width: 56px; min-width: 56px; }\n  }\n\n  .nav-label {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    font-size: 13px;\n    font-weight: 600;\n    padding-right: 16px;\n  }\n  #sidebar.expanded .nav-label { opacity: 1; width: auto; }\n\n  .nav-tail {\n    margin-left: auto;\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    padding-right: 16px;\n    flex-shrink: 0;\n  }\n  #sidebar.expanded .nav-tail { opacity: 1; width: auto; }\n\n  .brand-text, .user-info {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded .brand-text,\n  #sidebar.expanded .user-info { opacity: 1; width: auto; }\n\n  .group-label {\n    opacity: 0;\n    height: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, height .3s ease;\n  }\n  #sidebar.expanded .group-label { opacity: 1; height: 22px; }\n\n  #toggleBtn {\n    position: absolute;\n    top: 22px;\n    right: -14px;\n    width: 28px;\n    height: 28px;\n    border-radius: 50%;\n    background: #DBC88D;\n    color: #163346;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    box-shadow: 0 2px 10px rgba(22,51,70,.25);\n    cursor: pointer;\n    z-index: 50;\n    border: 3px solid #FFFFFF;\n    transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;\n  }\n  #toggleBtn:hover { transform: scale(1.12); box-shadow: 0 4px 14px rgba(22,51,70,.35); }\n\n  #toggleIcon { transition: transform .3s cubic-bezier(.22,1,.36,1); }\n  #sidebar.expanded #toggleIcon { transform: rotate(180deg); }\n\n  /* Table row hover */\n  .user-row { transition: background .15s ease; }\n  .user-row:hover { background: #FFFFFF; }\n\n  /* Avatar status dot */\n  .status-dot {\n    position: absolute;\n    bottom: -1px;\n    right: -1px;\n    width: 11px;\n    height: 11px;\n    border-radius: 50%;\n    border: 2px solid #FFFFFF;\n  }\n\n  /* Badges */\n  .badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; letter-spacing: .02em; }\n";

export default function UsersPage() {
  const { users = [], companies = [], sessions = [], auditLogs = [] } = useSuperAdmin();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const companyById = new Map(companies.map(company => [String(company.id), company]));
  const roleLabels = { superAdmin: 'Super Administrateur', adminSociete: 'Admin Société', manager: 'Manager', rh: 'RH', chefProjet: 'Chef de Projet', auditeur: 'Auditeur', employe: 'Employé' };
  const statusLabels = { active: 'ACTIF', invited: 'INVITÉ', suspended: 'SUSPENDU', away: 'ABSENT', exited: 'SORTI', archived: 'ARCHIVÉ' };
  const formatDate = value => {
    if (!value) return 'JAMAIS';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'JAMAIS' : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date).toUpperCase();
  };
  const search = searchTerm.trim().toLocaleLowerCase('fr');
  const manageableUsers = users.filter(user => String(user.id) !== String(currentUser?.id));
  const filteredUsers = manageableUsers.filter(user => {
    const userCompany = companyById.get(String(user.companyId));
    const matchesSearch = !search || [user.name, user.email, user.matricule, userCompany?.name]
      .some(value => String(value || '').toLocaleLowerCase('fr').includes(search));
    return matchesSearch
      && (!roleFilter || user.role === roleFilter)
      && (!statusFilter || user.status === statusFilter)
      && (!companyFilter || String(user.companyId) === companyFilter);
  });
  const pagination = usePagination(filteredUsers);
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
        <a data-page="users" className="nav-item active" title="Utilisateurs">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
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
          <span className="nav-tail num text-[10px] font-bold text-ink bg-paper/20 px-1.5 py-0.5 rounded">
            {users.length}
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
              {auditLogs.length}
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
            {"Utilisateurs"}
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
          <input type="text" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Nom, email, matricule…" className="flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
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
                {"Utilisateurs"}
              </h2>
              {"\n          "}
              <p className="text-[12px] sm:text-[13px] text-slate font-medium">
                <span className="text-ink font-semibold">
                  {`${users.length} utilisateurs`}
                </span>
                {` · ${users.filter(user => user.status === 'active').length} actifs · ${users.filter(user => user.status === 'invited').length} invités · ${users.filter(user => user.status === 'suspended').length} suspendus`}
              </p>
              {"\n        "}
            </div>
            {"\n        "}
            <div className="flex items-center gap-2 flex-shrink-0">
              {"\n          "}
              <button className="h-9 px-3 text-[12px] font-semibold text-graphite border border-fog rounded-lg hover:border-ink hover:bg-bone transition-all">
                {"Exporter"}
              </button>
              {"\n          "}
              <button className="h-9 px-3 text-[12px] font-bold bg-ink text-white rounded-lg hover:bg-graphite transition-colors flex items-center gap-1.5 whitespace-nowrap">
                {"\n            "}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {"\n            Inviter un utilisateur\n          "}
              </button>
              {"\n        "}
            </div>
            {"\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {"\n\n        "}
            <div className="flex items-center gap-3 p-3.5 bg-white border border-fog rounded-xl">
              {"\n          "}
              <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-lime">
                {"\n            "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col">
                {"\n            "}
                <span className="num text-[18px] font-extrabold text-ink leading-none">
                  {users.length}
                </span>
                {"\n            "}
                <span className="text-[10.5px] font-semibold text-slate mt-0.5">
                  {"Total"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex items-center gap-3 p-3.5 bg-white border border-fog rounded-xl">
              {"\n          "}
              <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center text-ink">
                {"\n            "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col">
                {"\n            "}
                <span className="num text-[18px] font-extrabold text-ink leading-none">
                  {users.filter(user => user.status === 'active').length}
                </span>
                {"\n            "}
                <span className="text-[10.5px] font-semibold text-slate mt-0.5">
                  {"Actifs"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex items-center gap-3 p-3.5 bg-white border border-fog rounded-xl">
              {"\n          "}
              <div className="w-8 h-8 rounded-lg bg-bone border border-fog flex items-center justify-center text-graphite">
                {"\n            "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col">
                {"\n            "}
                <span className="num text-[18px] font-extrabold text-ink leading-none">
                  {users.filter(user => user.status === 'invited').length}
                </span>
                {"\n            "}
                <span className="text-[10.5px] font-semibold text-slate mt-0.5">
                  {"Invités"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="flex items-center gap-3 p-3.5 bg-white border border-fog rounded-xl">
              {"\n          "}
              <div className="w-8 h-8 rounded-lg bg-graphite flex items-center justify-center text-white">
                {"\n            "}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col">
                {"\n            "}
                <span className="num text-[18px] font-extrabold text-ink leading-none">
                  {users.filter(user => user.status === 'suspended').length}
                </span>
                {"\n            "}
                <span className="text-[10.5px] font-semibold text-slate mt-0.5">
                  {"Suspendus"}
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
              <div className="flex-1 flex items-center gap-2 h-10 px-3.5 bg-white border border-fog rounded-xl focus-within:border-ink transition-colors">
                {"\n            "}
                <svg className="w-4 h-4 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  {"\n              "}
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="m20 20-3.5-3.5"></path>
                  {"\n            "}
                </svg>
                {"\n            "}
                <input type="text" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Rechercher par nom, email, matricule…" className="flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
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
                  {"Rôle"}
                </label>
                {"\n            "}
                <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="h-9 px-3 bg-paper border border-fog rounded-lg text-[12.5px] font-medium text-ink focus:outline-none focus:border-ink transition-colors">
                  {"\n              "}
                  <option value="">
                    {"Tous les rôles"}
                  </option>
                  {"\n              "}
                  <option value="adminSociete">
                    {"Administrateur Société"}
                  </option>
                  {"\n              "}
                  <option value="manager">
                    {"Manager"}
                  </option>
                  {"\n              "}
                  <option value="chefProjet">
                    {"Chef de Projet"}
                  </option>
                  {"\n              "}
                  <option value="rh">
                    {"RH"}
                  </option>
                  {"\n              "}
                  <option value="employe">
                    {"Employé"}
                  </option>
                  <option value="auditeur">Auditeur</option>
                  <option value="superAdmin">Super Administrateur</option>
                  {"\n            "}
                </select>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                {"\n            "}
                <label className="text-[10px] font-bold text-slate uppercase tracking-[.10em]">
                  {"Statut"}
                </label>
                {"\n            "}
                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-9 px-3 bg-paper border border-fog rounded-lg text-[12.5px] font-medium text-ink focus:outline-none focus:border-ink transition-colors">
                  {"\n              "}
                  <option value="">
                    {"Tous"}
                  </option>
                  {"\n              "}
                  <option value="active">
                    {"Actif"}
                  </option>
                  {"\n              "}
                  <option value="invited">
                    {"Invité"}
                  </option>
                  {"\n              "}
                  <option value="suspended">
                    {"Suspendu"}
                  </option>
                  {"\n              "}
                  <option value="exited">
                    {"Sorti"}
                  </option>
                  <option value="away">Absent</option>
                  <option value="archived">Archivé</option>
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
                <select value={companyFilter} onChange={event => setCompanyFilter(event.target.value)} className="h-9 px-3 bg-paper border border-fog rounded-lg text-[12.5px] font-medium text-ink focus:outline-none focus:border-ink transition-colors">
                  {"\n              "}
                  <option value="">Toutes</option>
                  {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
                  {"\n            "}
                </select>
                {"\n          "}
              </div>
              {"\n          "}
              <button type="button" onClick={() => { setSearchTerm(''); setRoleFilter(''); setStatusFilter(''); setCompanyFilter(''); }} className="h-9 px-3 flex items-center gap-1.5 bg-bone border border-fog text-[12px] font-semibold text-graphite rounded-lg hover:border-ink hover:text-ink transition-all ml-auto">
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
              <table className="w-full border-collapse min-w-[820px]">
                {"\n            "}
                <thead>
                  {"\n              "}
                  <tr className="border-b border-fog bg-paper/50">
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Utilisateur"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Rôle"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Société"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Statut"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Dernière connexion"}
                    </th>
                    {"\n                "}
                    <th className="text-left py-3.5 px-4 text-[10px] font-bold text-slate uppercase tracking-[.10em] whitespace-nowrap">
                      {"Sessions"}
                    </th>
                    {"\n                "}
                    <th className="w-12"></th>
                    {"\n              "}
                  </tr>
                  {"\n            "}
                </thead>
                {"\n            "}
                <tbody>
                  {pagination.pageItems.map(user => {
                    const initials = (user.name || user.email || '?').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
                    const company = companyById.get(String(user.companyId));
                    const active = user.status === 'active' || user.status === 'away';
                    return (
                      <tr key={user.id} data-user-id={user.id} className="user-row border-b border-fog cursor-pointer">
                        <td className="py-3.5 px-4"><div className="flex items-center gap-3"><div className="relative flex-shrink-0"><div className="w-9 h-9 rounded-full bg-ink flex items-center justify-center text-lime text-[12px] font-black">{initials}</div><span className={`status-dot ${active ? 'bg-lime' : 'bg-mist'}`}></span></div><div className="min-w-0"><div className="text-[13px] font-bold text-ink truncate">{user.name || '—'}</div><div className="text-[11px] text-slate truncate">{user.email || '—'}</div></div></div></td>
                        <td className="py-3.5 px-4"><span className="badge bg-lime/15 text-lime">{roleLabels[user.role] || user.role || '—'}</span></td>
                        <td className="py-3.5 px-4 text-[12.5px] text-slate font-medium">{company?.name || '—'}</td>
                        <td className="py-3.5 px-4"><span className={`badge ${active ? 'bg-lime text-ink' : 'bg-bone text-slate'}`}>{statusLabels[user.status] || user.status || '—'}</span></td>
                        <td className="py-3.5 px-4"><span className="num text-[12px] text-slate font-semibold">{formatDate(user.lastLogin)}</span></td>
                        <td className="py-3.5 px-4"><span className="num text-[13px] font-bold text-ink">{user.activeSessions ?? 0}</span></td>
                        <td className="py-3.5 px-4"><div className="flex items-center justify-end gap-1">
                          <button type="button" data-user-action="view" aria-label={`Voir ${user.name || user.email}`} title="Voir la fiche" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate hover:bg-bone hover:text-ink transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                          <button type="button" data-user-action="edit" aria-label={`Modifier ${user.name || user.email}`} title="Modifier" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate hover:bg-bone hover:text-ink transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg></button>
                        </div></td>
                      </tr>
                    );
                  })}
                  {!filteredUsers.length && <tr><td colSpan="7" className="p-8 text-center text-sm text-slate">{users.length ? 'Aucun utilisateur ne correspond aux filtres.' : 'Aucun utilisateur reçu de l’API.'}</td></tr>}
                </tbody>
                {"\n          "}
              </table>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <Pagination pagination={pagination} label="utilisateurs" />
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
