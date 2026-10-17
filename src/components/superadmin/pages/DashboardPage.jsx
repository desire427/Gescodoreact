import { useSuperAdmin } from '../../../context/SuperAdminContext';
import SuperAdminSidebarProfile from '../../common/SuperAdminSidebarProfile';
import SuperAdminHeaderActions from '../../common/SuperAdminHeaderActions';
export const title = "GESCODO — Console Plateforme";
export const bodyClass = "bg-paper text-ink font-sans h-screen w-screen overflow-hidden flex";
const pageStyles = "\n  * { -webkit-font-smoothing: antialiased; }\n  ::-webkit-scrollbar { width: 4px; height: 4px; }\n  ::-webkit-scrollbar-thumb { background: #FFFFFF; border-radius: 10px; }\n  ::-webkit-scrollbar-track { background: transparent; }\n  body { overflow: hidden; }\n\n  .tick { animation: tick 1.6s ease-in-out infinite; }\n  @keyframes tick { 0%,100% { opacity: 1; } 50% { opacity: .35; } }\n\n  .card { transition: border-color .2s ease, transform .25s cubic-bezier(.22,1,.36,1); }\n  .card:hover { border-color: #163346; transform: translateY(-2px); }\n\n  .row { transition: background .15s ease; }\n  .row:hover { background: #FFFFFF; }\n\n  .num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; letter-spacing: -.04em; }\n  .bar-anim { transition: width .8s cubic-bezier(.22,1,.36,1); }\n\n  .noise {\n    background-image: radial-gradient(circle at 1px 1px, rgba(22,51,70,.035) 1px, transparent 0);\n    background-size: 20px 20px;\n  }\n\n  /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 SIDEBAR \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */\n  #sidebar {\n    width: 72px;\n    transition: width .3s cubic-bezier(.22,1,.36,1), transform .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded {\n    width: 248px;\n  }\n\n  /* Mobile : sidebar en overlay */\n  @media (max-width: 1023px) {\n    #sidebar {\n      position: fixed;\n      top: 0;\n      left: 0;\n      height: 100vh;\n      transform: translateX(-100%);\n      width: 248px;\n    }\n    #sidebar.mobile-open {\n      transform: translateX(0);\n      box-shadow: 4px 0 30px rgba(22,51,70,.3);\n    }\n    #sidebar.mobile-open .nav-label,\n    #sidebar.mobile-open .brand-text,\n    #sidebar.mobile-open .user-info,\n    #sidebar.mobile-open .group-label,\n    #sidebar.mobile-open .nav-tail {\n      opacity: 1;\n      width: auto;\n      height: auto;\n    }\n    /* Masquer compl\u00e8tement le bouton flottant sur mobile */\n    #toggleBtn {\n      display: none !important;\n      visibility: hidden !important;\n      opacity: 0 !important;\n      pointer-events: none !important;\n    }\n  }\n\n  /* Overlay sombre derri\u00e8re la sidebar sur mobile */\n  #overlay {\n    position: fixed;\n    inset: 0;\n    background: rgba(22,51,70,.5);\n    backdrop-filter: blur(2px);\n    z-index: 30;\n    opacity: 0;\n    pointer-events: none;\n    transition: opacity .3s ease;\n  }\n  #overlay.show {\n    opacity: 1;\n    pointer-events: auto;\n  }\n  @media (min-width: 1024px) {\n    #overlay { display: none; }\n  }\n\n  .nav-item {\n    display: flex;\n    align-items: center;\n    height: 44px;\n    width: 100%;\n    color: rgba(255,255,255,.55);\n    transition: color .15s ease, background-color .15s ease;\n    position: relative;\n  }\n  .nav-item:hover {\n    color: #FFFFFF;\n    background: rgba(255,255,255,.06);\n  }\n  .nav-item.active {\n    background: #DBC88D;\n    color: #163346;\n  }\n  .nav-item.active:hover {\n    background: #DBC88D;\n    color: #163346;\n  }\n\n  .nav-icon {\n    width: 72px;\n    min-width: 72px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    flex-shrink: 0;\n  }\n  @media (max-width: 1023px) {\n    .nav-icon { width: 56px; min-width: 56px; }\n  }\n\n  .nav-label {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    font-size: 13px;\n    font-weight: 600;\n    padding-right: 16px;\n  }\n  #sidebar.expanded .nav-label {\n    opacity: 1;\n    width: auto;\n  }\n\n  .nav-tail {\n    margin-left: auto;\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n    padding-right: 16px;\n    flex-shrink: 0;\n  }\n  #sidebar.expanded .nav-tail {\n    opacity: 1;\n    width: auto;\n  }\n\n  .brand-text {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded .brand-text {\n    opacity: 1;\n    width: auto;\n  }\n\n  .user-info {\n    opacity: 0;\n    width: 0;\n    overflow: hidden;\n    white-space: nowrap;\n    transition: opacity .2s ease .05s, width .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded .user-info {\n    opacity: 1;\n    width: auto;\n  }\n\n  .group-label {\n    opacity: 0;\n    height: 0;\n    overflow: hidden;\n    transition: opacity .2s ease .05s, height .3s ease;\n  }\n  #sidebar.expanded .group-label {\n    opacity: 1;\n    height: 22px;\n  }\n\n  /* Bouton toggle flottant (desktop uniquement) */\n  #toggleBtn {\n    position: absolute;\n    top: 22px;\n    right: -14px;\n    width: 28px;\n    height: 28px;\n    border-radius: 50%;\n    background: #DBC88D;\n    color: #163346;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    box-shadow: 0 2px 10px rgba(22,51,70,.25);\n    cursor: pointer;\n    z-index: 50;\n    border: 3px solid #FFFFFF;\n    transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;\n  }\n  #toggleBtn:hover {\n    transform: scale(1.12);\n    box-shadow: 0 4px 14px rgba(22,51,70,.35);\n  }\n  #toggleIcon {\n    transition: transform .3s cubic-bezier(.22,1,.36,1);\n  }\n  #sidebar.expanded #toggleIcon {\n    transform: rotate(180deg);\n  }\n\n  /* Animations */\n  @keyframes drawLine {\n    from { stroke-dashoffset: 1200; }\n    to { stroke-dashoffset: 0; }\n  }\n  .line-draw {\n    stroke-dasharray: 1200;\n    stroke-dashoffset: 1200;\n    animation: drawLine 1.8s cubic-bezier(.22,1,.36,1) forwards;\n  }\n  .donut-anim {\n    stroke-dasharray: 440;\n    stroke-dashoffset: 440;\n    animation: donutFill 1.6s cubic-bezier(.22,1,.36,1) forwards;\n  }\n  @keyframes donutFill {\n    to { stroke-dashoffset: var(--target, 100); }\n  }\n  @keyframes growBarH {\n    from { transform: scaleX(0); }\n    to { transform: scaleX(1); }\n  }\n  .barh-grow {\n    transform-origin: left;\n    animation: growBarH 1s cubic-bezier(.22,1,.36,1) forwards;\n  }\n\n  @media (max-width: 640px) {\n    .num-resp { font-size: 26px !important; }\n  }\n";

import { useWorkspace } from '../../../context/WorkspaceContext';
import { useAuth } from '../../../context/AuthContext';

export default function DashboardPage() {
  const { stats = {}, companies = [], users = [], projects = [], tasks = [], meetings = [], alerts = [] } = useWorkspace();
  const { resolveAlert, platformSettings } = useSuperAdmin();
  const { currentUser } = useAuth();
  const roleLabels = Object.fromEntries((stats.roleChoices || []).map(({ value, label }) => [value, label]));
  const roleCounts = stats.activeRoleCounts || users.filter(user => user.status === 'active').reduce((counts, user) => ({ ...counts, [user.role]: (counts[user.role] || 0) + 1 }), {});
  const roleColors = ['#163346', '#C9A84C', '#2E8B72', '#7957A8', '#D8753B', '#3986B7', '#C64F69'];
  const roleEntries = Object.entries(roleLabels).map(([role, label], index) => ({
    role,
    label,
    count: Math.max(0, Number(roleCounts[role]) || 0),
    color: roleColors[index % roleColors.length],
  }));
  const activeRoleTotal = roleEntries.reduce((total, entry) => total + entry.count, 0);
  let rolePieOffset = 0;
  const rolePieGradient = activeRoleTotal
    ? `conic-gradient(${roleEntries.filter(entry => entry.count > 0).map(entry => {
      const start = rolePieOffset;
      rolePieOffset += entry.count / activeRoleTotal * 100;
      return `${entry.color} ${start}% ${rolePieOffset}%`;
    }).join(', ')})`
    : '#E8EDF0';
  const sessionsByDay = stats.sessionsLast7Days || [];
  const auditByDay = stats.auditLast7Days || [];
  const chartPoints = values => { const max = Math.max(1, ...values.map(item => item.count)); return values.map((item, index) => ({ ...item, x: values.length > 1 ? index * 700 / (values.length - 1) : 350, y: 200 - item.count / max * 160 })); };
  const sessionPoints = chartPoints(sessionsByDay);
  const auditPoints = chartPoints(auditByDay);
  const pointsPath = points => points.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ');
  const totalSessions7d = sessionsByDay.reduce((total, day) => total + day.count, 0);

  const now = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date());
  const statsGeneratedAt = stats.generatedAt
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(stats.generatedAt))
    : '—';
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
      {"\n  "}
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
        <button className="nav-item active" title="Tableau de bord" data-page="dashboard">
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
        </button>
        {"\n\n    "}
        <button className="nav-item" title="Sociétés" data-page="companies">
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
        </button>
        {"\n\n    "}
        <button className="nav-item" title="Utilisateurs" data-page="users">
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
            {Object.values(roleCounts).reduce((sum, count) => sum + count, 0)}
          </span>
          {"\n    "}
        </button>
        {"\n\n    "}
        <button className="nav-item" title="Projets" data-page="projects">
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
        </button>
        {"\n\n    "}
        <button className="nav-item" title="Réunions" data-page="meetings">
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
        </button>
        {"\n\n    "}
        <div className="h-px bg-white/[.08] mx-4 my-2 flex-shrink-0"></div>
        {"\n    "}
        <span className="group-label text-[9px] font-bold text-white/30 uppercase tracking-[.16em] px-5 pt-1 pb-1">
          {"Sécurité"}
        </span>
        {"\n\n    "}
        <button className="nav-item" title="Rôles & Accès" data-page="roles">
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
        </button>
        {"\n\n    "}
        <button className="nav-item" title="Journal d'audit" data-page="audit">
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
        </button>
        {"\n\n    "}
        <button className="nav-item" title="Sessions & Appareils" data-page="sessions">
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
        </button>
        {"\n\n    "}
        <button className="nav-item" title="Paramètres" data-page="settings">
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
        </button>
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
        {"\n    "}
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
        {"\n    "}
        <div className="flex flex-col leading-none min-w-0 flex-shrink-0">
          {"\n      "}
          <span className="hidden sm:block text-[10px] font-bold text-slate uppercase tracking-[.16em]">
            {"Console plateforme"}
          </span>
          {"\n      "}
          <h1 className="text-[15px] sm:text-[17px] font-black tracking-tight sm:mt-1 leading-none truncate">
            {"Tableau de bord"}
          </h1>
          {"\n    "}
        </div>
        {"\n\n    "}
        {"\n    "}
        <div className="hidden md:flex flex-1 max-w-[420px] mx-auto items-center gap-2 h-10 px-3.5 bg-bone border border-fog rounded-xl focus-within:border-ink transition-colors">
          {"\n      "}
          <svg className="w-4 h-4 text-slate flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            {"\n        "}
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
            {"\n      "}
          </svg>
          {"\n      "}
          <input type="text" placeholder="Rechercher une société, un utilisateur…" className="flex-1 bg-transparent text-[13px] placeholder:text-slate outline-none min-w-0" />
          {"\n    "}
        </div>
        {"\n\n    "}
        {"\n    "}
        <div className="flex-1 md:flex-none"></div>
        {"\n\n    "}
        {"\n    "}
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
                {`Bonjour, ${currentUser?.name || 'Super Admin'}`}
              </h2>
              {"\n          "}
              <p className="text-[12px] sm:text-[13px] text-slate font-medium">
                {"Voici l'état de la plateforme au "}
                <span className="text-ink font-semibold">
                  {now}
                </span>
                {"."}
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
              <button className="h-9 px-3 text-[12px] font-bold bg-ink text-white rounded-lg hover:bg-graphite transition-colors whitespace-nowrap">
                {"+ Nouvelle"}
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
                    <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-4h6v4"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="num text-[10px] font-bold text-ink bg-bone px-2 py-1 rounded">
                  {"API"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none num-resp">
                  {stats.totalCompanies ?? companies.length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Sociétés"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {`${stats.activeCompanies ?? companies.filter(company => company.status === 'active').length} actives · ${stats.suspendedCompanies ?? companies.filter(company => company.status === 'suspended').length} suspendues`}
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
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="num text-[10px] font-bold text-ink bg-bone px-2 py-1 rounded">
                  {"API"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none num-resp">
                  {stats.totalUsers ?? users.length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Utilisateurs"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {`${stats.activeUsers ?? users.filter(user => user.status === 'active').length} actifs · ${stats.invitedUsers ?? users.filter(user => user.status === 'invited').length} invités`}
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
                  {" LIVE\n            "}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none num-resp">
                  {stats.onlineUsers ?? users.filter(user => user.online).length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"En ligne"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {`${stats.activeSessions ?? 0} sessions actives`}
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
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  {"\n            "}
                </div>
                {"\n            "}
                <span className="num text-[10px] font-bold text-ink bg-lime px-2 py-1 rounded">
                  {"URGENT"}
                </span>
                {"\n          "}
              </div>
              {"\n          "}
              <div className="flex flex-col gap-0.5">
                {"\n            "}
                <span className="num text-[26px] sm:text-[34px] font-extrabold text-ink leading-none num-resp">
                  {stats.unresolvedAlerts ?? alerts.filter(alert => !alert.resolved).length}
                </span>
                {"\n            "}
                <span className="text-[11px] sm:text-[12px] font-bold text-ink mt-1">
                  {"Alertes actives"}
                </span>
                {"\n            "}
                <span className="hidden sm:block text-[11px] text-slate">
                  {`${stats.resolvedAlerts ?? alerts.filter(alert => alert.resolved).length} résolues · ${stats.unresolvedAlerts ?? alerts.filter(alert => !alert.resolved).length} en attente`}
                </span>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5">
            {"\n\n        "}
            <div className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
              {"\n          "}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {"\n            "}
                <div className="flex flex-col gap-1">
                  {"\n              "}
                  <h3 className="text-[14px] sm:text-[15px] font-black tracking-tight">
                    {"Activité de la plateforme"}
                  </h3>
                  {"\n              "}
                  <p className="text-[11px] text-slate font-medium">
                    {"Connexions et actions · 7 derniers jours"}
                  </p>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex items-center gap-3 text-[11px] font-semibold">
                  {"\n              "}
                  <span className="flex items-center gap-1.5 text-graphite">
                    {"\n                "}
                    <span className="w-2.5 h-2.5 rounded-full bg-ink"></span>
                    {" Connexions\n              "}
                  </span>
                  {"\n              "}
                  <span className="flex items-center gap-1.5 text-graphite">
                    {"\n                "}
                    <span className="w-2.5 h-2.5 rounded-full bg-lime"></span>
                    {" Actions\n              "}
                  </span>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="flex items-end gap-4 sm:gap-6">
                {"\n            "}
                <div className="flex flex-col">
                  {"\n              "}
                  <span className="num text-[20px] sm:text-[24px] font-extrabold text-ink leading-none">
                    {totalSessions7d.toLocaleString('fr-FR')}
                  </span>
                  {"\n              "}
                  <span className="text-[10px] sm:text-[11px] text-slate font-semibold mt-1">
                    {"Connexions"}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex flex-col">
                  {"\n              "}
                  <span className="num text-[20px] sm:text-[24px] font-extrabold text-ink leading-none">
                    {auditByDay.reduce((total, day) => total + day.count, 0).toLocaleString('fr-FR')}
                  </span>
                  {"\n              "}
                  <span className="text-[10px] sm:text-[11px] text-slate font-semibold mt-1">
                    {"Actions enregistrées · 7 jours"}
                  </span>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="relative w-full h-[180px] sm:h-[220px]">
                {"\n            "}
                <svg viewBox="0 0 700 220" className="w-full h-full" preserveaspectratio="none">
                  {"\n              "}
                  <g stroke="#FFFFFF" stroke-width="1">
                    {"\n                "}
                    <line x1="0" y1="40" x2="700" y2="40"></line>
                    {"\n                "}
                    <line x1="0" y1="90" x2="700" y2="90"></line>
                    {"\n                "}
                    <line x1="0" y1="140" x2="700" y2="140"></line>
                    {"\n                "}
                    <line x1="0" y1="190" x2="700" y2="190"></line>
                    {"\n              "}
                  </g>
                  {"\n\n              "}
                  <defs>
                    {"\n                "}
                    <lineargradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      {"\n                  "}
                      <stop offset="0%" stop-color="#163346" stop-opacity="0.10"></stop>
                      {"\n                  "}
                      <stop offset="100%" stop-color="#163346" stop-opacity="0"></stop>
                      {"\n                "}
                    </lineargradient>
                    {"\n              "}
                  </defs>
                  {"\n              "}
                  <path d={`${pointsPath(sessionPoints)} L700 220 L0 220 Z`} fill="url(#areaFill)"></path>
                  {"\n\n              "}
                  <path className="line-draw" d={pointsPath(sessionPoints)} fill="none" stroke="#163346" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"></path>
                  {"\n\n              "}
                  <path className="line-draw" style={{ animationDelay: '.3s' }} d={pointsPath(auditPoints)} fill="none" stroke="#DBC88D" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"></path>
                  {"\n\n              "}
                  <g fill="#163346">{sessionPoints.map(point => <circle key={point.date} cx={point.x} cy={point.y} r="3.5" />)}</g>
                  {"\n\n              "}
                  <g fill="#DBC88D" stroke="#163346" strokeWidth="1.5">{auditPoints.map(point => <circle key={point.date} cx={point.x} cy={point.y} r="3.5" />)}</g>
                  {"\n            "}
                </svg>
                {"\n\n            "}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between translate-y-5">
                  {sessionsByDay.map(day => <span key={day.date} className="num text-[9px] sm:text-[10px] font-bold text-slate">{new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${day.date}T12:00:00Z`)).slice(0, 3).toUpperCase()}</span>)}
                </div>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
              {"\n          "}
              <div className="flex items-start justify-between">
                {"\n            "}
                <div className="flex flex-col gap-1">
                  {"\n              "}
                  <h3 className="text-[14px] sm:text-[15px] font-black tracking-tight">
                    {"Répartition des rôles"}
                  </h3>
                  {"\n              "}
                  <p className="text-[11px] text-slate font-medium">
                    {`${stats.activeUsers ?? users.filter(user => user.status === 'active').length} utilisateurs actifs`}
                  </p>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="flex items-center justify-center py-2">
                {"\n            "}
                <div className="relative w-[150px] h-[150px] sm:w-[180px] sm:h-[180px]">
                  {"\n              "}
                  <div role="img" aria-label={`Répartition circulaire de ${activeRoleTotal} utilisateurs actifs par rôle`} className="w-full h-full rounded-full border border-fog shadow-inner" style={{ background: rolePieGradient }}></div>
                  {"\n              "}
                  <div className="absolute inset-[27%] rounded-full bg-white shadow-[0_1px_8px_rgba(22,51,70,.12)] border border-fog" aria-hidden="true"></div>
                  <div className="absolute inset-[27%] flex flex-col items-center justify-center text-center">
                    {"\n                "}
                    <span className="num text-[26px] sm:text-[32px] font-black text-ink leading-none">
                      {activeRoleTotal}
                    </span>
                    {"\n                "}
                    <span className="text-[10px] font-bold text-slate uppercase tracking-[.12em] mt-1">
                      {"Total"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {roleEntries.map(entry => <div key={entry.role} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }}></span><span className="text-[11px] text-graphite font-semibold truncate">{entry.label}</span><span className="num text-[11px] font-bold text-ink ml-auto">{entry.count}</span></div>)}
              </div>
            </div>
            {"\n\n      "}
          </section>
          {"\n\n      "}
          {"\n      "}
          <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
            {"\n\n        "}
            <div className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-5 sm:gap-6">
              {"\n          "}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {"\n            "}
                <div className="flex flex-col gap-1">
                  {"\n              "}
                  <h3 className="text-[14px] sm:text-[15px] font-black tracking-tight">
                    {"Performance des sociétés"}
                  </h3>
                  {"\n              "}
                  <p className="text-[11px] text-slate font-medium">
                    {"Taux de complétion des tâches"}
                  </p>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex items-center gap-1 bg-bone rounded-lg p-0.5">
                  {"\n              "}
                  <button className="h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-bold text-ink bg-white rounded-md shadow-sm">
                    {"Tâches"}
                  </button>
                  {"\n              "}
                  <button className="h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-semibold text-slate hover:text-ink rounded-md">
                    {"Décisions"}
                  </button>
                  {"\n              "}
                  <button className="hidden xs:block h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-semibold text-slate hover:text-ink rounded-md">
                    {"Retards"}
                  </button>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-fog">
                {"\n            "}
                <div className="flex flex-col gap-1">
                  {"\n              "}
                  <span className="num text-[18px] sm:text-[22px] font-extrabold text-ink leading-none">
                    {tasks.length ? `${Math.round(tasks.filter(task => ['done', 'validated'].includes(task.status)).length / tasks.length * 100)}%` : '0%'}
                  </span>
                  {"\n              "}
                  <span className="text-[10px] sm:text-[11px] text-slate font-semibold">
                    {"Moyenne"}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex flex-col gap-1">
                  {"\n              "}
                  <span className="num text-[18px] sm:text-[22px] font-extrabold text-ink leading-none">
                    {stats.lateTasks ?? tasks.filter(task => task.isLate).length}
                  </span>
                  {"\n              "}
                  <span className="text-[10px] sm:text-[11px] text-slate font-semibold">
                    {"Tâches en retard"}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="flex flex-col gap-1">
                  {"\n              "}
                  <span className="num text-[18px] sm:text-[22px] font-extrabold text-ink leading-none">
                    {`${companies.filter(company => company.status !== 'active').length}/${companies.length}`} 
                  </span>
                  {"\n              "}
                  <span className="text-[10px] sm:text-[11px] text-slate font-semibold">
                    {"Sociétés non actives"}
                  </span>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="flex flex-col gap-4 sm:gap-5">
                {companies.slice(0, 4).map((company, index) => {
                  const companyProjects = projects.filter(project => String(project.companyId) === String(company.id));
                  const progress = companyProjects.length ? Math.round(companyProjects.reduce((total, project) => total + (Number(project.progress) || 0), 0) / companyProjects.length) : 0;
                  const colors = ['bg-ink', 'bg-graphite', 'bg-lime', 'bg-bone'];
                  return <div key={company.id} className="flex flex-col gap-2"><div className="flex items-center justify-between gap-2 flex-wrap"><div className="flex items-center gap-2 sm:gap-2.5 min-w-0"><span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg ${colors[index]} flex items-center justify-center text-[10px] font-black text-lime flex-shrink-0`}>{(company.name || '?')[0].toUpperCase()}</span><span className="text-[12px] sm:text-[13px] font-bold text-ink truncate">{company.name}</span><span className="hidden sm:inline-block text-[10px] font-bold text-slate bg-bone px-1.5 py-0.5 rounded">{company.status || '—'}</span></div><div className="flex items-center gap-2 flex-shrink-0"><span className="num hidden sm:inline text-[11px] font-bold text-slate">{companyProjects.length} projets</span><span className="num text-[12px] sm:text-[13px] font-black text-ink">{progress}%</span></div></div><div className="h-2 bg-bone rounded-full overflow-hidden"><div className="barh-grow h-full rounded-full bg-ink" style={{ width: `${progress}%` }}></div></div></div>;
                })}
                {!companies.length && <p className="text-xs text-slate">Aucune société enregistrée.</p>}
              </div>
              {"\n\n          "}
              <div className="pt-4 border-t border-fog flex items-center justify-between">
                {"\n            "}
                <span className="text-[10px] sm:text-[11px] text-slate font-medium">
                  {`Données calculées le ${statsGeneratedAt}`}
                </span>
                {"\n            "}
                <button className="text-[10px] sm:text-[11px] font-bold text-ink hover:underline transition-all">
                  {"Rapport complet →"}
                </button>
                {"\n          "}
              </div>
              {"\n        "}
            </div>
            {"\n\n        "}
            <div className="bg-white border border-fog rounded-2xl p-4 sm:p-6 flex flex-col gap-5">
              {"\n          "}
              <div className="flex items-center justify-between">
                {"\n            "}
                <div className="flex items-center gap-2.5">
                  {"\n              "}
                  <span className="w-2 h-2 rounded-full bg-ink"></span>
                  {"\n              "}
                  <h3 className="text-[14px] sm:text-[15px] font-black tracking-tight">
                    {"Alertes en cours"}
                  </h3>
                  {"\n            "}
                </div>
                {"\n            "}
                <button className="text-[11px] font-bold text-slate hover:text-ink transition-colors">
                  {"Tout lire"}
                </button>
                {"\n          "}
              </div>
              {"\n\n          "}
              <div className="flex flex-col divide-y divide-fog">
                {alerts.filter(alert => !alert.resolved).slice(0, 5).map(alert => {
                  const severity = { critical: 'CRIT', high: 'ÉLEVÉ', medium: 'MOYEN', low: 'FAIBLE' }[alert.severity] || 'INFO';
                  const date = alert.createdAt ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(alert.createdAt)).toUpperCase() : '—';
                  return <div key={alert.id} className="flex items-start gap-3 sm:gap-4 py-3.5 first:pt-0 row -mx-2 px-2 rounded-lg"><span className="num text-[10px] font-bold text-ink flex-shrink-0 mt-1 w-10 sm:w-11">{severity}</span><div className="flex-1 flex flex-col gap-1 min-w-0"><span className="text-[12px] sm:text-[13px] font-bold text-ink">{alert.title || 'Alerte'}</span><span className="text-[11px] sm:text-[11.5px] text-slate leading-relaxed">{alert.message || '—'}</span><span className="num text-[10px] text-mist font-semibold">{date}</span></div><button onClick={() => resolveAlert(alert.id)} className="hidden sm:inline-block h-7 px-2.5 text-[11px] font-bold text-graphite border border-fog rounded-md hover:border-ink hover:bg-bone transition-all flex-shrink-0">Résoudre</button></div>;
                })}
                {!alerts.some(alert => !alert.resolved) && <p className="py-4 text-xs text-slate">Aucune alerte active.</p>}
              </div>
              {"\n\n          "}
              <div className="mt-auto pt-5 border-t border-fog flex flex-col gap-3">
                {"\n            "}
                <div className="flex items-center justify-between">
                  {"\n              "}
                  <span className="text-[11px] font-bold text-slate uppercase tracking-[.10em]">
                    {"Système"}
                  </span>
                  {"\n              "}
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-ink">
                    {"\n                "}
                    <span className="w-1.5 h-1.5 rounded-full bg-lime tick"></span>
                    {" API CONNECTÉE\n              "}
                  </span>
                  {"\n            "}
                </div>
                {"\n            "}
                <div className="grid grid-cols-2 gap-3">
                  {"\n              "}
                  <div className="flex flex-col gap-0.5">
                    {"\n                "}
                    <span className="num text-[15px] font-black text-ink">
                      {platformSettings.platformVersion || '—'}
                    </span>
                    {"\n                "}
                    <span className="text-[10px] text-slate font-semibold">
                      {"Version"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n              "}
                  <div className="flex flex-col gap-0.5">
                    {"\n                "}
                    <span className="num text-[15px] font-black text-ink">
                      {stats.activeDevices ?? 0}
                    </span>
                    {"\n                "}
                    <span className="text-[10px] text-slate font-semibold">
                      {"Appareils actifs"}
                    </span>
                    {"\n              "}
                  </div>
                  {"\n            "}
                </div>
                {"\n          "}
              </div>
              {"\n\n        "}
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
