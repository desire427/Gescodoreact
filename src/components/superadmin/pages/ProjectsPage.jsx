import { useState } from 'react';
import SuperAdminSidebarProfile from '../../common/SuperAdminSidebarProfile';
import SuperAdminHeaderActions from '../../common/SuperAdminHeaderActions';
import { useSuperAdmin } from '../../../context/SuperAdminContext';
import Pagination, { usePagination } from '../../common/Pagination';

export const title = "GESCODO — Projets";
export const bodyClass = "bg-paper text-ink font-sans h-screen w-screen overflow-hidden flex";
const pageStyles = "\n  * { -webkit-font-smoothing: antialiased; }\n  ::-webkit-scrollbar { width: 4px; height: 4px; }\n  ::-webkit-scrollbar-thumb { background: #FFFFFF; border-radius: 10px; }\n  ::-webkit-scrollbar-track { background: transparent; }\n  body { overflow: hidden; }\n\n  .tick { animation: tick 1.6s ease-in-out infinite; }\n  @keyframes tick { 0%,100% { opacity: 1; } 50% { opacity: .35; } }\n\n  .num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; letter-spacing: -.04em; }\n\n  .noise {\n    background-image: radial-gradient(circle at 1px 1px, rgba(22,51,70,.035) 1px, transparent 0);\n    background-size: 20px 20px;\n  }\n\n  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SIDEBAR \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n  #sidebar {\n    width: 72px;\n    transition: width .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded { width: 248px; }\n\n  @media (max-width: 1023px) {\n    #sidebar {\n      position: fixed;\n      top: 0;\n      left: 0;\n      height: 100vh;\n      transform: translateX(-100%);\n      width: 248px;\n    }\n    #sidebar.mobile-open {\n      transform: translateX(0);\n      box-shadow: 4px 0 30px rgba(22,51,70,.3);\n    }\n    #sidebar.mobile-open .nav-label,\n    #sidebar.mobile-open .brand-text,\n    #sidebar.mobile-open .user-info,\n    #sidebar.mobile-open .group-label,\n    #sidebar.mobile-open .nav-tail {\n      opacity: 1;\n      width: auto;\n      height: auto;\n    }\n    #toggleBtn {\n      display: none !important;\n      visibility: hidden !important;\n      opacity: 0 !important;\n      pointer-events: none !important;\n    }\n  }\n\n  #overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(22,51,70,.5);\n    backdrop-filter: blur(2px);\n    z-index: 30;\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity .3s ease;\n  }\n  #overlay.show { opacity: 1; pointer-events: auto; }\n  @media (min-width: 1024px) { #overlay { display: none; } }\n\n  .nav-item {\n    display: flex;\n    align-items: center;\n    height: 44px;\n    width: 100%;\n    color: rgba(255,255,255,.55);\n    transition: color .15s ease, background-color .15s ease;\n    position: relative;\n  }\n  .nav-item:hover { color: #FFFFFF; background: rgba(255,255,255,.06); }\n  .nav-item.active { background: #DBC88D; color: #163346; }\n  .nav-item.active:hover { background: #DBC88D; color: #163346; }\n\n  .nav-icon {\n    width: 72px;\n    min-width: 72px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n  }\n  @media (max-width: 1023px) {\n    .nav-icon { width: 56px; min-width: 56px; }\n  }\n\n  .nav-label {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    font-size: 13px;\n    font-weight: 600;\n    padding-right: 16px;\n  }\n  #sidebar.expanded .nav-label { opacity: 1; width: auto; }\n\n  .nav-tail {\n    margin-left: auto;\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    padding-right: 16px;\n    flex-shrink: 0;\n  }\n  #sidebar.expanded .nav-tail { opacity: 1; width: auto; }\n\n  .brand-text, .user-info {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded .brand-text,\n  #sidebar.expanded .user-info { opacity: 1; width: auto; }\n\n  .group-label {\n    opacity: 0;\n    height: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, height .3s ease;\n  }\n  #sidebar.expanded .group-label { opacity: 1; height: 22px; }\n\n  #toggleBtn {\n    position: absolute;\n    top: 22px;\n    right: -14px;\n    width: 28px;\n    height: 28px;\n    border-radius: 50%;\n    background: #DBC88D;\n    color: #163346;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    box-shadow: 0 2px 10px rgba(22,51,70,.25);\n    cursor: pointer;\n    z-index: 50;\n    border: 3px solid #FFFFFF;\n    transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;\n  }\n  #toggleBtn:hover { transform: scale(1.12); box-shadow: 0 4px 14px rgba(22,51,70,.35); }\n\n  #toggleIcon { transition: transform .3s cubic-bezier(.22,1,.36,1); }\n  #sidebar.expanded #toggleIcon { transform: rotate(180deg); }\n\n  /* Card projet */\n  .project-card {\n    transition: border-color .2s ease, transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease;\n  }\n  .project-card:hover {\n    border-color: #163346;\n    transform: translateY(-3px);\n    box-shadow: 0 12px 28px rgba(22,51,70,.08);\n  }\n\n  /* Barre de progression */\n  .bar-fill { transition: width 1s cubic-bezier(.22,1,.36,1); }\n\n  .badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; letter-spacing: .02em; }\n\n  .line-clamp-2 {\n    display: -webkit-box;\n    -webkit-line-clamp: 2;\n    -webkit-box-orient: vertical;\n    overflow: hidden;\n  }\n\n  /* Anim bar at load */\n  @keyframes growBarH { from { width: 0 !important; } }\n  .bar-anim { animation: growBarH 1.2s cubic-bezier(.22,1,.36,1) forwards; }\n";

export default function ProjectsPage() {
  const { projects = [], companies = [], users = [], sessions = [] } = useSuperAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const filteredProjects = projects.filter(project => {
    const search = searchTerm.trim().toLocaleLowerCase('fr');
    const matchesSearch = !search || [project.name, project.ref, project.description]
      .some(value => String(value || '').toLocaleLowerCase('fr').includes(search));
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const pagination = usePagination(filteredProjects);
  const companyById = new Map(companies.map(company => [String(company.id), company]));
  const userById = new Map(users.map(user => [String(user.id), user]));
  const statusLabels = { draft: 'BROUILLON', in_progress: 'EN COURS', on_hold: 'EN PAUSE', completed: 'TERMINÉ', cancelled: 'ANNULÉ' };
  const formatDate = value => value ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(value)).toUpperCase() : '—';
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
        <a data-page="projects" className="nav-item active" title="Projets">
          {"\n      "}
          <span className="nav-icon">
            {"\n        "}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
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
          <span className="nav-tail num text-[10px] font-bold text-ink bg-paper/20 px-1.5 py-0.5 rounded">
            {projects.length}
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
              {projects.length}
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
            {"Projets"}
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
          <input type="text" placeholder="Nom, référence…" className="flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
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
                {"Projets"}
              </h2>
              {"\n          "}
              <p className="text-[12px] sm:text-[13px] text-slate font-medium">
                <span className="text-ink font-semibold">
                  {"14 projets"}
                </span>
                {" · 11 en cours · 2 terminés · 1 en pause"}
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
                {"\n            Nouveau projet\n          "}
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
                    <path d="M3 3h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6zM3 15h6v6H3z"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="num text-[10px] font-bold text-ink bg-bone px-2 py-1 rounded">
                  {"TOTAL"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {projects.length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Projets"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {"Tous les projets enregistrés"}
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
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="flex items-center gap-1 text-[10px] font-bold text-ink bg-bone px-2 py-1 rounded">
                  {"\n              "}
                  <span className="w-1.5 h-1.5 rounded-full bg-ink tick"></span>
                  {" EN COURS\n            "}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {projects.filter(project => project.status === 'in_progress').length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"En cours"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {"Projets actifs"}
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
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="num text-[10px] font-bold text-slate bg-bone px-2 py-1 rounded">
                  {"PAUSE"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {projects.filter(project => project.status === 'on_hold').length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"En pause"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {"Temporairement"}
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
                <span className="num text-[10px] font-bold text-ink bg-lime px-2 py-1 rounded">
                  {"LIVRÉS"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none">
                  {projects.filter(project => project.status === 'completed').length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Terminés"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {"Projets terminés"}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {"\n        "}
            <div className="flex-1 flex items-center gap-2 h-10 px-3.5 bg-white border border-fog rounded-xl focus-within:border-ink transition-colors">
              {"\n          "}
              <svg className="w-4 h-4 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                {"\n            "}
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-3.5-3.5"></path>
                {"\n          "}
              </svg>
              {"\n          "}
              <input type="text" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Rechercher un projet…" className="flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
              {"\n        "}
            </div>
            {"\n        "}
            <div className="flex items-center gap-1 bg-white border border-fog rounded-xl p-1 overflow-x-auto">
              {"\n          "}
              <button type="button" onClick={() => setStatusFilter('all')} className={`h-8 px-3 text-[11px] font-bold rounded-lg whitespace-nowrap ${statusFilter === 'all' ? 'bg-ink text-white' : 'text-slate hover:text-ink hover:bg-bone'}`}>
                {"Tous"}
              </button>
              {"\n          "}
              <button type="button" onClick={() => setStatusFilter('in_progress')} className={`h-8 px-3 text-[11px] rounded-lg whitespace-nowrap ${statusFilter === 'in_progress' ? 'bg-ink text-white font-bold' : 'font-semibold text-slate hover:text-ink hover:bg-bone'}`}>
                {"En cours"}
              </button>
              {"\n          "}
              <button type="button" onClick={() => setStatusFilter('completed')} className={`h-8 px-3 text-[11px] rounded-lg whitespace-nowrap ${statusFilter === 'completed' ? 'bg-ink text-white font-bold' : 'font-semibold text-slate hover:text-ink hover:bg-bone'}`}>
                {"Terminés"}
              </button>
              {"\n          "}
              <button type="button" onClick={() => setStatusFilter('on_hold')} className={`h-8 px-3 text-[11px] rounded-lg whitespace-nowrap ${statusFilter === 'on_hold' ? 'bg-ink text-white font-bold' : 'font-semibold text-slate hover:text-ink hover:bg-bone'}`}>
                {"En pause"}
              </button>
              {"\n        "}
            </div>
            {"\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pagination.pageItems.map(project => {
              const company = companyById.get(String(project.companyId));
              const responsable = userById.get(String(project.responsableId));
              const progress = Math.max(0, Math.min(100, Number(project.progress) || 0));
              return <div key={project.id} className="project-card bg-white border border-fog rounded-2xl p-5 flex flex-col gap-4 cursor-pointer">
                <div className="flex items-start gap-3"><div className="w-11 h-11 bg-ink rounded-xl flex items-center justify-center text-lime flex-shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M3 3h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6zM3 15h6v6H3z"></path></svg></div><div className="flex-1 min-w-0"><span className="num block text-[10px] text-slate font-semibold tracking-[.06em] mb-1">{project.ref || `#${project.id}`}</span><span className="block text-[14px] font-black text-ink tracking-tight truncate">{project.name || '—'}</span></div><span className="badge bg-lime text-ink flex-shrink-0">{statusLabels[project.status] || project.status || '—'}</span></div>
                <p className="text-[12px] text-slate leading-relaxed line-clamp-2">{project.description || 'Aucune description.'}</p>
                <div className="flex flex-col gap-2"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-slate uppercase tracking-[.08em">Avancement</span><span className="num text-[13px] font-black text-ink">{progress}%</span></div><div className="h-1.5 bg-bone rounded-full overflow-hidden"><div className="bar-fill bar-anim h-full bg-ink rounded-full" style={{ width: `${progress}%` }}></div></div></div>
                <div className="flex flex-wrap gap-1.5">{(project.milestones || []).slice(0, 3).map(milestone => <span key={milestone.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${milestone.done ? 'bg-lime/40 border-lime text-ink' : 'bg-bone border-fog text-slate'}`}>{milestone.done ? '✓' : '○'} {milestone.label}</span>)}{!project.milestones?.length && <span className="text-[10px] text-slate">Aucun jalon défini</span>}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-3 border-t border-fog"><span className="text-[11px] text-slate font-medium">{company?.name || 'Société non renseignée'}</span><span className="text-[11px] text-slate font-medium">Responsable : {responsable?.name || '—'}</span><span className="text-[11px] text-slate font-medium">{project.taskCount ?? 0} tâches</span><span className="num text-[11px]">{formatDate(project.endDate)}</span></div>
              </div>;
            })}
            {!filteredProjects.length && <p className="col-span-full rounded-2xl border border-fog bg-white p-8 text-center text-sm text-slate">{projects.length ? 'Aucun projet ne correspond aux filtres.' : 'Aucun projet enregistré dans les données reçues de l’API.'}</p>}
          </section>
          {"\n\n      "}
          {"\n      "}
          <Pagination pagination={pagination} label="projets" />
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
