import { Component, useEffect, useLayoutEffect, useRef, useState } from 'react';
import DashboardPage, { title as dashboardTitle } from './pages/DashboardPage';
import CompaniesPage, { title as companiesTitle } from './pages/CompaniesPage';
import UsersPage, { title as usersTitle } from './pages/UsersPage';
import ProjectsPage, { title as projectsTitle } from './pages/ProjectsPage';
import MeetingsPage, { title as meetingsTitle } from './pages/MeetingsPage';
import RolesPage, { title as rolesTitle } from './pages/RolesPage';
import AuditPage, { title as auditTitle } from './pages/AuditPage';
import SessionsPage, { title as sessionsTitle } from './pages/SessionsPage';
import SettingsPage, { title as settingsTitle } from './pages/SettingsPage';
import { useAuth } from '../../context/AuthContext';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AdminSocieteProvider } from '../../context/AdminSocieteContext';
import AdminSocieteLayout from '../adminsociete/AdminSocieteLayout';

const PAGES = {
  dashboard: { Component: DashboardPage, title: dashboardTitle },
  companies: { Component: CompaniesPage, title: companiesTitle },
  users: { Component: UsersPage, title: usersTitle },
  projects: { Component: ProjectsPage, title: projectsTitle },
  meetings: { Component: MeetingsPage, title: meetingsTitle },
  roles: { Component: RolesPage, title: rolesTitle },
  audit: { Component: AuditPage, title: auditTitle },
  sessions: { Component: SessionsPage, title: sessionsTitle },
  settings: { Component: SettingsPage, title: settingsTitle },
};

class AdminPageErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(`Erreur d’affichage de la page ${this.props.pageTitle}:`, error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex-1 overflow-auto bg-paper p-8 text-ink">
        <section role="alert" className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6">
          <h2 className="text-lg font-bold">Impossible d’afficher cette page</h2>
          <p className="mt-2 text-sm text-slate">{this.props.pageTitle}</p>
          <p className="mt-3 break-words font-mono text-xs text-red-700">{this.state.error.message}</p>
        </section>
      </main>
    );
  }
}

function loadTailwindAssets() {
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap';
  if (![...document.head.querySelectorAll('link')].some(link => link.href === fontLink.href)) document.head.appendChild(fontLink);

  const setup = () => {
    if (!document.getElementById('gc-tailwind-config')) {
      const config = document.createElement('script');
      config.id = 'gc-tailwind-config';
      config.textContent = `tailwind.config = { theme: { extend: { colors: { ink: '#163346', paper: '#FFFFFF', bone: 'rgba(22,51,70,.04)', fog: 'rgba(22,51,70,.12)', mist: 'rgba(22,51,70,.35)', slate: 'rgba(22,51,70,.68)', graphite: '#0A0201', lime: '#DBC88D' }, fontFamily: { sans: ['Inter','sans-serif'], mono: ['JetBrains Mono','monospace'] }, screens: { xs: '400px' } } } };`;
      document.head.appendChild(config);
    }
  };
  return new Promise(resolve => {
    const existing = document.getElementById('gc-tailwind-cdn');
    if (existing?.dataset.loaded === 'true') { setup(); resolve(); return; }
    const cdn = existing || document.createElement('script');
    if (!existing) { cdn.id = 'gc-tailwind-cdn'; cdn.src = 'https://cdn.tailwindcss.com'; }
    const ready = () => { cdn.dataset.loaded = 'true'; setup(); resolve(); };
    cdn.addEventListener('load', ready, { once: true });
    cdn.addEventListener('error', ready, { once: true });
    if (!existing) document.head.appendChild(cdn);
  });
}

export default function TailwindAdminDashboard() {
  const rootRef = useRef(null);
  const { openMessaging, goToLogin, currentUser } = useAuth();
  const superAdmin = useSuperAdmin();
  const workspace = useWorkspace();
  const { platformSettings, updatePlatformSettings } = superAdmin;
  const [activePage, setActivePage] = useState('dashboard');
  const [viewedCompany, setViewedCompany] = useState(null);
  const [actionDialog, setActionDialog] = useState(null);
  const [expanded, setExpanded] = useState(() => {
    try { return window.localStorage.getItem('gescodo-sidebar-expanded') === 'true'; }
    catch { return false; }
  });
  const expandedRef = useRef(expanded);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tailwindReady, setTailwindReady] = useState(false);
  const page = PAGES[activePage] || PAGES.dashboard;
  const ActivePage = page.Component;

  useEffect(() => {
    let mounted = true;
    loadTailwindAssets().then(() => {
      if (mounted) setTailwindReady(true);
    });
    document.title = page.title || 'GESCODO — Console Plateforme';
    document.body.style.overflow = 'hidden';
    return () => { mounted = false; };
  }, [page.title]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const sidebar = root.querySelector('#sidebar');
    const overlay = root.querySelector('#overlay');
    const userInfo = sidebar?.querySelector('.user-info');
    const accountFooter = userInfo?.parentElement?.parentElement;
    let logoutButton = null;
    if (accountFooter && !accountFooter.querySelector('#logoutBtn')) {
      logoutButton = document.createElement('button');
      logoutButton.id = 'logoutBtn';
      logoutButton.type = 'button';
      logoutButton.title = 'Déconnexion';
      logoutButton.className = 'nav-item';
      logoutButton.innerHTML = '<span class="nav-icon"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></span><span class="nav-label">Déconnexion</span>';
      accountFooter.appendChild(logoutButton);
    }
    expandedRef.current = expanded;
    sidebar?.classList.toggle('expanded', expandedRef.current);
    sidebar?.classList.toggle('mobile-open', mobileOpen);
    overlay?.classList.toggle('show', mobileOpen);

    const handleClick = event => {
      const target = event.target instanceof Element ? event.target : event.target.parentElement;
      if (!target) return;

      if (target.closest('#toggleBtn')) {
        event.preventDefault();
        setExpanded(previous => {
          const next = !previous;
          expandedRef.current = next;
          try { window.localStorage.setItem('gescodo-sidebar-expanded', String(next)); } catch { /* stockage indisponible */ }
          return next;
        });
        return;
      }
      if (target.closest('#menuBtn')) {
        event.preventDefault();
        setMobileOpen(true);
        return;
      }
      if (target.closest('#closeSidebarBtn, #overlay')) {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (target.closest('#logoutBtn')) {
        event.preventDefault();
        goToLogin();
        return;
      }

      const pageLink = target.closest('#sidebar [data-page]');
      if (pageLink) {
        event.preventDefault();
        const keepExpanded = expandedRef.current;
        try { window.localStorage.setItem('gescodo-sidebar-expanded', String(keepExpanded)); } catch { /* stockage indisponible */ }
        setActivePage(pageLink.dataset.page);
        requestAnimationFrame(() => {
          const nextSidebar = root.querySelector('#sidebar');
          nextSidebar?.classList.toggle('expanded', keepExpanded);
        });
        return;
      }

      const userRow = target.closest('.user-row');
      if (userRow) {
        event.preventDefault();
        const user = superAdmin.users?.find(item => String(item.id) === String(userRow.dataset.userId));
        if (!user) return;
        setActionDialog(target.closest('[data-user-action="edit"]')
          ? { type: 'user', mode: 'edit', item: user }
          : { type: 'details', entity: 'user', item: user });
        return;
      }

      const companyEditButton = target.closest('[data-company-action="edit"]');
      if (companyEditButton) {
        event.preventDefault();
        const companyCard = companyEditButton.closest('.company-card');
        const company = superAdmin.companies?.find(item => String(item.id) === String(companyCard?.dataset.companyId));
        if (company) setActionDialog({ type: 'company', mode: 'edit', item: company });
        return;
      }

      const button = target.closest('button');
      const entityCard = target.closest('.company-card, .project-card, .meeting-card, .user-row');
      if (entityCard) {
        if (entityCard.classList.contains('company-card')) {
          const company = superAdmin.companies?.find(item => String(item.id) === String(entityCard.dataset.companyId));
          if (company) {
            setActionDialog(null);
            setViewedCompany(company);
          }
          return;
        }
        const entity = entityCard.classList.contains('company-card') ? 'company'
          : entityCard.classList.contains('project-card') ? 'project'
            : entityCard.classList.contains('meeting-card') ? 'meeting' : 'user';
        event.preventDefault();
        setActionDialog({ type: 'edit-select', entity });
        return;
      }
      if (button) {
        const label = button.textContent.trim().toLowerCase();
        const isCreate = /nouveau|nouvelle|créer|creer|ajouter|inviter|invitation/.test(label);
        const createTypes = {
          dashboard: label.includes('nouvelle') ? 'quick-create' : null,
          companies: ['société', 'societe'].some(word => label.includes(word)) ? 'company' : null,
          users: label.includes('utilisateur') ? 'user' : null,
          projects: label.includes('projet') ? 'project' : null,
          meetings: label.includes('réunion') || label.includes('reunion') ? 'meeting' : null,
        };
        const type = isCreate ? createTypes[activePage] : null;
        if (type) {
          event.preventDefault();
          setActionDialog({ type });
          return;
        }
        if (button.closest('.role-card')) {
          event.preventDefault();
          setActionDialog({ type: 'info', title: button.closest('.role-card').querySelector('span')?.textContent || 'Rôle et accès' });
          return;
        }
        if (button.closest('.audit-row')) {
          event.preventDefault();
          const row = button.closest('.audit-row');
          setActionDialog({ type: 'info', title: row.querySelector('span')?.textContent || row.textContent.trim().slice(0, 90) });
          return;
        }
      }

      const messagingButton = target.closest('#sidebar button.nav-item');
      if (messagingButton?.textContent?.toLowerCase().includes('discussions')) {
        event.preventDefault();
        openMessaging();
      }
    };

    const navCounts = {
      companies: superAdmin.companies?.length || 0,
      users: superAdmin.users?.length || 0,
      projects: superAdmin.projects?.length || 0,
      meetings: superAdmin.meetings?.length || 0,
      audit: superAdmin.auditLogs?.length || 0,
      sessions: superAdmin.sessions?.length || 0,
      roles: superAdmin.stats?.roleChoices?.length || 0,
    };
    Object.entries(navCounts).forEach(([key, count]) => {
      const tail = root.querySelector(`#sidebar [data-page="${key}"] .nav-tail`);
      if (tail) tail.textContent = String(count);
    });

    root.addEventListener('click', handleClick);
    return () => {
      root.removeEventListener('click', handleClick);
      logoutButton?.remove();
    };
  }, [activePage, expanded, mobileOpen, openMessaging, goToLogin, tailwindReady, superAdmin.companies, superAdmin.users, superAdmin.projects, superAdmin.meetings, superAdmin.auditLogs, superAdmin.sessions, superAdmin.stats]);

  useEffect(() => {
    if (activePage !== 'settings' || !tailwindReady) return undefined;

    const root = rootRef.current;
    const thresholdLists = {
      responsable: root?.querySelector('#responsableThresholdList'),
      manager: root?.querySelector('#managerThresholdList'),
      directeur: root?.querySelector('#directorThresholdList'),
    };
    const addThresholdButtons = {
      responsable: root?.querySelector('#addResponsableThreshold'),
      manager: root?.querySelector('#addManagerThreshold'),
      directeur: root?.querySelector('#addDirectorThreshold'),
    };
    const enabledToggle = root?.querySelector('#escalationsEnabled');
    const preview = root?.querySelector('#reminderPreview');
    const status = root?.querySelector('#escalationSaveStatus');
    const saveButton = root?.querySelector('#saveEscalationSettings');
    const platformStatus = root?.querySelector('#platformSettingsSaveStatus');
    const platformSaveButton = root?.querySelector('#savePlatformSettings');
    const platformInputs = {
      sessionTimeout: root?.querySelector('#sessionTimeout'),
      maxDevicesPerUser: root?.querySelector('#maxDevicesPerUser'),
      passwordMinLength: root?.querySelector('#passwordMinLength'),
      fileMaxSizeMb: root?.querySelector('#fileMaxSizeMb'),
      allowedFileTypes: root?.querySelector('#allowedFileTypes'),
      backupRetentionDays: root?.querySelector('#backupRetentionDays'),
      platformVersion: root?.querySelector('#platformVersion'),
    };
    const platformToggles = {
      twoFactorRequired: root?.querySelector('#twoFactorRequired'),
      autoLockSuspectedAccounts: root?.querySelector('#autoLockSuspectedAccounts'),
      maintenanceMode: root?.querySelector('#maintenanceMode'),
    };
    if (Object.values(thresholdLists).some(list => !list) || Object.values(addThresholdButtons).some(button => !button) || !enabledToggle || !preview || !status || !saveButton || !platformSaveButton) {
      return undefined;
    }

    const saved = platformSettings.escaladeSettings || {
      enabled: true,
      responsable: [-3, -1, 0, 1],
      manager: [3],
      directeur: [5],
    };
    const thresholdLabels = { responsable: 'responsable', manager: 'manager', directeur: 'directeur' };
    const renderThresholdList = (key, values) => {
      const list = thresholdLists[key];
      list.replaceChildren();
      (Array.isArray(values) && values.length ? values : [key === 'responsable' ? 0 : key === 'manager' ? 3 : 5]).forEach(day => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2';
        row.dataset.thresholdRow = 'true';
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '1';
        input.value = String(day);
        input.setAttribute('aria-label', `Jour de relance ${thresholdLabels[key]}`);
        input.dataset.thresholdDay = 'true';
        input.className = 'setting-input num w-full';
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.dataset.removeThreshold = 'true';
        remove.setAttribute('aria-label', `Supprimer ce jour ${thresholdLabels[key]}`);
        remove.title = 'Supprimer ce jour';
        remove.className = 'w-9 h-9 flex-shrink-0 rounded-lg border border-fog text-slate hover:text-red-600 hover:border-red-200';
        remove.textContent = '×';
        row.append(input, remove);
        list.append(row);
      });
    };
    Object.keys(thresholdLists).forEach(key => renderThresholdList(key, saved[key]));
    enabledToggle.classList.toggle('on', saved.enabled !== false);
    enabledToggle.setAttribute('aria-checked', String(saved.enabled !== false));
    status.textContent = 'Seuils chargés depuis la base de données.';

    Object.entries(platformInputs).forEach(([key, input]) => {
      if (input) {
        const value = platformSettings[key];
        input.value = Array.isArray(value) ? value.join(', ') : (value ?? '');
      }
    });
    Object.entries(platformToggles).forEach(([key, toggle]) => {
      if (toggle) {
        const checked = Boolean(platformSettings[key]);
        toggle.classList.toggle('on', checked);
        toggle.setAttribute('aria-checked', String(checked));
      }
    });
    if (platformStatus) platformStatus.textContent = 'Paramètres chargés depuis la base de données.';

    const fields = Object.values(thresholdLists);
    const parseDays = list => {
      const inputs = [...list.querySelectorAll('[data-threshold-day]')];
      if (!inputs.length || inputs.some(input => input.value.trim() === '' || !Number.isInteger(Number(input.value)))) return null;
      return inputs.map(input => Number(input.value));
    };
    const renderPreview = () => {
      preview.replaceChildren();
      const groups = [
        { key: 'responsable', label: 'Responsable', className: 'timeline-chip bg-ink text-lime' },
        { key: 'manager', label: 'Manager', className: 'timeline-chip bg-graphite text-white' },
        { key: 'directeur', label: 'Directeur', className: 'timeline-chip bg-lime text-ink' },
      ];
      let valid = true;
      groups.forEach(group => {
        const days = parseDays(thresholdLists[group.key]);
        if (!days) { valid = false; return; }
        days.forEach(day => {
          const chip = document.createElement('div');
          chip.className = group.className;
          const date = document.createElement('span');
          date.textContent = day === 0 ? 'J+0' : day > 0 ? `J+${day}` : `J${day}`;
          const recipient = document.createElement('small');
          recipient.textContent = group.label;
          chip.append(date, recipient);
          preview.append(chip);
        });
      });
      preview.style.opacity = enabledToggle.getAttribute('aria-checked') === 'true' ? '1' : '0.45';
      if (!valid) status.textContent = 'Renseignez un jour entier dans chaque ligne.';
    };

    const markDirty = () => {
      status.dataset.saved = 'false';
      status.textContent = 'Modifications non enregistrées.';
      renderPreview();
    };
    const thresholdHandlers = Object.entries(thresholdLists).map(([key, list]) => {
      const handleInput = () => markDirty();
      const handleClick = event => {
        if (!event.target.closest('[data-remove-threshold]')) return;
        if (list.querySelectorAll('[data-threshold-day]').length <= 1) {
          status.textContent = 'Chaque niveau doit conserver au moins un jour.';
          return;
        }
        event.target.closest('[data-threshold-row]')?.remove();
        markDirty();
      };
      const handleAdd = () => {
        const current = [...list.querySelectorAll('[data-threshold-day]')].map(input => input.value);
        const base = key === 'responsable' ? 0 : key === 'manager' ? 3 : 5;
        const numbers = current.map(Number).filter(Number.isInteger);
        const next = numbers.length ? Math.max(...numbers) + 1 : base;
        renderThresholdList(key, [...current, next]);
        markDirty();
      };
      list.addEventListener('input', handleInput);
      list.addEventListener('click', handleClick);
      addThresholdButtons[key].addEventListener('click', handleAdd);
      return { list, key, handleInput, handleClick, handleAdd };
    });
    const onToggle = () => {
      const isEnabled = enabledToggle.getAttribute('aria-checked') !== 'true';
      enabledToggle.classList.toggle('on', isEnabled);
      enabledToggle.setAttribute('aria-checked', String(isEnabled));
      markDirty();
    };
    const onKeyDown = event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle();
      }
    };
    const onSave = async () => {
      const [responsable, manager, directeur] = fields.map(parseDays);
      if (!responsable || !manager || !directeur || manager.some(day => day < 0) || directeur.some(day => day < 0)) {
        status.dataset.saved = 'false';
        status.textContent = 'Saisissez des jours entiers. Les escalades manager et directeur doivent être à J ou après.';
        return;
      }

      saveButton.disabled = true;
      status.textContent = 'Enregistrement dans la base de données…';
      try {
        await updatePlatformSettings({
          escaladeSettings: {
            ...saved,
            enabled: enabledToggle.getAttribute('aria-checked') === 'true',
            responsable,
            manager,
            directeur,
          },
        });
        status.dataset.saved = 'true';
        status.textContent = 'Seuils enregistrés dans la base de données.';
      } catch {
        status.dataset.saved = 'false';
        status.textContent = 'Échec de l’enregistrement. Vérifiez la connexion puis réessayez.';
      } finally {
        saveButton.disabled = false;
      }
    };

    const toggleHandlers = Object.values(platformToggles).filter(Boolean).map(toggle => {
      const handleToggle = () => {
        const checked = toggle.getAttribute('aria-checked') !== 'true';
        toggle.classList.toggle('on', checked);
        toggle.setAttribute('aria-checked', String(checked));
        if (platformStatus) platformStatus.textContent = 'Modifications non enregistrées.';
      };
      const handleKeyDown = event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleToggle();
        }
      };
      toggle.addEventListener('click', handleToggle);
      toggle.addEventListener('keydown', handleKeyDown);
      return { toggle, handleToggle, handleKeyDown };
    });

    const onSaveAll = async () => {
      const numericKeys = ['sessionTimeout', 'maxDevicesPerUser', 'passwordMinLength', 'fileMaxSizeMb', 'backupRetentionDays'];
      const numericValues = Object.fromEntries(numericKeys.map(key => [key, Number(platformInputs[key]?.value)]));
      if (numericKeys.some(key => !Number.isFinite(numericValues[key]) || numericValues[key] < 0)) {
        if (platformStatus) platformStatus.textContent = 'Vérifiez les valeurs numériques avant l’enregistrement.';
        return;
      }

      const [responsable, manager, directeur] = fields.map(parseDays);
      if (!responsable || !manager || !directeur || manager.some(day => day < 0) || directeur.some(day => day < 0)) {
        if (platformStatus) platformStatus.textContent = 'Vérifiez les seuils de rappel avant l’enregistrement.';
        return;
      }

      platformSaveButton.disabled = true;
      if (platformStatus) platformStatus.textContent = 'Enregistrement dans la base de données…';
      try {
        await updatePlatformSettings({
          ...numericValues,
          twoFactorRequired: platformToggles.twoFactorRequired?.getAttribute('aria-checked') === 'true',
          autoLockSuspectedAccounts: platformToggles.autoLockSuspectedAccounts?.getAttribute('aria-checked') === 'true',
          maintenanceMode: platformToggles.maintenanceMode?.getAttribute('aria-checked') === 'true',
          allowedFileTypes: (platformInputs.allowedFileTypes?.value || '').split(',').map(value => value.trim()).filter(Boolean),
          platformVersion: platformInputs.platformVersion?.value.trim() || '',
          escaladeSettings: {
            ...saved,
            enabled: enabledToggle.getAttribute('aria-checked') === 'true',
            responsable,
            manager,
            directeur,
          },
        });
        if (platformStatus) platformStatus.textContent = 'Paramètres enregistrés dans la base de données.';
        status.dataset.saved = 'true';
        status.textContent = 'Seuils enregistrés dans la base de données.';
      } catch {
        if (platformStatus) platformStatus.textContent = 'Échec de l’enregistrement. Vérifiez la connexion puis réessayez.';
      } finally {
        platformSaveButton.disabled = false;
      }
    };

    enabledToggle.addEventListener('click', onToggle);
    enabledToggle.addEventListener('keydown', onKeyDown);
    saveButton.addEventListener('click', onSave);
    platformSaveButton?.addEventListener('click', onSaveAll);
    renderPreview();

    return () => {
      thresholdHandlers.forEach(({ list, key, handleInput, handleClick, handleAdd }) => {
        list.removeEventListener('input', handleInput);
        list.removeEventListener('click', handleClick);
        addThresholdButtons[key].removeEventListener('click', handleAdd);
      });
      enabledToggle.removeEventListener('click', onToggle);
      enabledToggle.removeEventListener('keydown', onKeyDown);
      saveButton.removeEventListener('click', onSave);
      platformSaveButton?.removeEventListener('click', onSaveAll);
      toggleHandlers.forEach(({ toggle, handleToggle, handleKeyDown }) => {
        toggle.removeEventListener('click', handleToggle);
        toggle.removeEventListener('keydown', handleKeyDown);
      });
    };
  }, [activePage, platformSettings, tailwindReady, updatePlatformSettings]);

  return (
    <div
      ref={rootRef}
      style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}
    >
      {viewedCompany ? (
        <AdminSocieteProvider companyId={viewedCompany.id} currentUserId={currentUser?.id}>
          <AdminSocieteLayout superAdminPreview onExitPreview={() => setViewedCompany(null)} />
        </AdminSocieteProvider>
      ) : tailwindReady && (
        <div
          style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}
        >
          <AdminPageErrorBoundary key={activePage} pageTitle={page.title}>
            <ActivePage />
          </AdminPageErrorBoundary>
        </div>
      )}
      {!viewedCompany && actionDialog && (
        <TailwindActionDialog
          dialog={actionDialog}
          data={{ ...superAdmin, ...workspace, currentUser }}
          onClose={() => setActionDialog(null)}
          onChoose={nextDialog => setActionDialog(nextDialog)}
        />
      )}
    </div>
  );
}

function TailwindActionDialog({ dialog, data, onClose, onChoose }) {
  const entity = dialog.entity || dialog.type;
  const item = dialog.item || {};
  const isCurrentUser = entity === 'user' && String(item.id) === String(data.currentUser?.id);
  const [values, setValues] = useState({
    name: item.name || '', code: item.code || '', sector: item.sector || '', country: item.country || '', city: item.city || '', address: item.address || '', phone: item.phone || '', email: item.email || '', matricule: item.matricule || '', about: item.about || '',
    title: item.title || item.name || '', description: item.description || '',
    companyId: String(dialog.mode === 'edit' ? (item.companyId || '') : (data.companies?.[0]?.id || '')),
    departmentId: String(item.departmentId || ''), projectId: String(item.projectId || ''),
    responsableId: String(item.responsableId || ''), validatorId: String(item.validatorId || ''),
    scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '',
    dueDate: item.dueDate ? String(item.dueDate).slice(0, 10) : '',
    startDate: item.startDate ? String(item.startDate).slice(0, 10) : '', endDate: item.endDate ? String(item.endDate).slice(0, 10) : '',
    location: item.location || '',
    type: item.type || 'direction',
    role: item.role || 'employe',
    status: item.status || 'draft',
    priority: item.priority || 'normal',
    duration: String(item.duration || '60'),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [userAction, setUserAction] = useState(null);
  const [userActionSaving, setUserActionSaving] = useState(false);
  const [transferTarget, setTransferTarget] = useState('');
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');
  const fields = {
    company: [
      ['name', 'Nom de la société', 'text', true], ['code', 'Code', 'text', true],
      ['sector', 'Secteur d’activité', 'text'], ['country', 'Pays', 'text'], ['city', 'Ville', 'text'],
      ['address', 'Adresse', 'text'], ['phone', 'Téléphone', 'tel'], ['email', 'Email', 'email'],
    ],
    user: [
      ['name', 'Nom complet', 'text', true], ['email', 'Email', 'email', !item.id],
      ...(!item.id ? [['password', 'Mot de passe initial', 'password', true]] : []), ['phone', 'Téléphone', 'tel'],
      ['role', 'Rôle', 'select', true, [['employe', 'Employé'], ['manager', 'Manager'], ['adminSociete', 'Administrateur société'], ['chefProjet', 'Chef de projet'], ['rh', 'Ressources humaines'], ['auditeur', 'Auditeur']]],
      ['companyId', 'Société', 'select', true, (data.companies || []).map(c => [String(c.id), c.name])],
      ['departmentId', 'Direction / service', 'select', false, (data.departments || []).filter(d => !values.companyId || String(d.companyId || d.company) === String(values.companyId)).map(d => [String(d.id), d.name])],
      ['about', 'À propos', 'text'],
    ],
    project: [
      ['name', 'Nom du projet', 'text', true], ['description', 'Description', 'textarea'],
      ['companyId', 'Société', 'select', true, (data.companies || []).map(c => [String(c.id), c.name])],
      ['departmentId', 'Direction / service', 'select', false, (data.departments || []).filter(d => !values.companyId || String(d.companyId || d.company) === String(values.companyId)).map(d => [String(d.id), d.name])],
      ['responsableId', 'Responsable', 'select', false, (data.users || []).map(u => [String(u.id), u.name])],
      ['sponsorId', 'Sponsor', 'select', false, (data.users || []).map(u => [String(u.id), u.name])],
      ['startDate', 'Date de début', 'date'], ['endDate', 'Date de fin prévue', 'date'],
    ],
    meeting: [
      ['title', 'Titre de la réunion', 'text', true],
      ['companyId', 'Société', 'select', true, (data.companies || []).map(c => [String(c.id), c.name])],
      ['type', 'Type', 'select', true, [['direction', 'Direction'], ['service', 'Service'], ['projet', 'Projet'], ['comite', 'Comité'], ['exceptional', 'Exceptionnelle']]],
      ['scheduledAt', 'Date et heure', 'datetime-local', true], ['duration', 'Durée (minutes)', 'number', true], ['location', 'Lieu ou lien', 'text'],
    ],
    task: [
      ['title', 'Titre de la tâche', 'text', true], ['description', 'Description', 'textarea'], ['companyId', 'Société', 'select', true, (data.companies || []).map(c => [String(c.id), c.name])],
      ['projectId', 'Projet', 'select', false, (data.projects || []).map(p => [String(p.id), p.name])],
      ['responsableId', 'Responsable', 'select', false, (data.users || []).map(u => [String(u.id), u.name])],
      ['dueDate', 'Échéance', 'date'], ['priority', 'Priorité', 'select', true, [['low', 'Basse'], ['normal', 'Normale'], ['high', 'Haute'], ['urgent', 'Urgente']]],
    ],
    decision: [
      ['title', 'Titre de la décision', 'text', true], ['companyId', 'Société', 'select', true, (data.companies || []).map(c => [String(c.id), c.name])],
      ['responsableId', 'Responsable', 'select', false, (data.users || []).map(u => [String(u.id), u.name])],
      ['meetingId', 'Réunion', 'select', false, (data.meetings || []).map(m => [String(m.id), m.title])],
      ['dueDate', 'Date limite', 'date'], ['description', 'Description', 'textarea'],
    ],
  }[entity] || [];
  const entityRows = {
    company: data.companies || [], user: data.users || [], project: data.projects || [],
    meeting: data.meetings || [], task: data.tasks || [], decision: data.decisions || [],
  }[entity] || [];
  const noun = { company: 'société', user: 'utilisateur', project: 'projet', meeting: 'réunion', task: 'tâche', decision: 'décision' }[entity];
  const title = dialog.type === 'details'
    ? `Fiche utilisateur — ${item.name || item.email || ''}`
    : noun ? `${dialog.mode === 'edit' || dialog.type === 'edit-select' ? 'Modifier' : 'Créer'} ${noun}` : dialog.title || 'Détails';
  const descriptions = {
    company: 'Renseignez les informations générales pour ajouter cette société à votre espace.',
    user: 'Ajoutez un membre et définissez son rôle ainsi que son rattachement.',
    project: 'Définissez le périmètre, les dates et les responsables du projet.',
    meeting: 'Planifiez une réunion et précisez son organisation.',
    task: 'Décrivez le travail à réaliser, son responsable et son échéance.',
    decision: 'Enregistrez la décision et les informations nécessaires à son suivi.',
  };
  const set = (key, value) => setValues(previous => ({ ...previous, [key]: value }));
  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const companyId = values.companyId ? Number(values.companyId) : null;
      if (entity === 'company') {
        const payload = { ...values };
        if (dialog.mode === 'edit') await data.updateCompany(item.id, payload);
        else await data.createCompany(payload);
      }
      if (entity === 'user') {
        const payload = dialog.mode === 'edit'
          ? { name: values.name, phone: values.phone, matricule: values.matricule, about: values.about, role: values.role, company: companyId, department: values.departmentId ? Number(values.departmentId) : null }
          : { name: values.name, email: values.email, password: values.password, phone: values.phone, matricule: values.matricule, about: values.about, role: values.role, company: companyId, department: values.departmentId ? Number(values.departmentId) : null };
        if (dialog.mode === 'edit') await data.updateUser(item.id, payload);
        else await data.createUser(payload);
      }
      if (entity === 'project') {
        if (dialog.mode === 'edit') await data.updateProject(item.id, { name: values.name, description: values.description, company: companyId, department: values.departmentId ? Number(values.departmentId) : null, responsable: values.responsableId ? Number(values.responsableId) : null, sponsor: values.sponsorId ? Number(values.sponsorId) : null, start_date: values.startDate || null, end_date: values.endDate || null });
        else await data.createProject({ ...values, companyId, departmentId: values.departmentId ? Number(values.departmentId) : null, responsableId: values.responsableId ? Number(values.responsableId) : null, sponsorId: values.sponsorId ? Number(values.sponsorId) : null, status: 'draft', tags: [], members: [], milestones: [] });
      }
      if (entity === 'meeting') {
        const scheduledAt = values.scheduledAt ? new Date(values.scheduledAt).toISOString() : item.scheduledAt;
        if (dialog.mode === 'edit') await data.updateMeeting(item.id, { title: values.title, type: values.type, companyId, scheduledAt, duration: Number(values.duration), location: values.location });
        else await data.createMeeting({ ...values, companyId, duration: Number(values.duration), scheduledAt, organizerId: null, agenda: [], participants: [] });
      }
      if (entity === 'task') {
        const payload = { title: values.title, description: values.description || '', company: companyId, project: values.projectId ? Number(values.projectId) : null, responsable: values.responsableId ? Number(values.responsableId) : null, due_date: values.dueDate || null, priority: values.priority, status: item.status || 'todo' };
        if (dialog.mode === 'edit') await data.updateTask(item.id, payload);
        else await data.createTask({ title: values.title, description: values.description || '', companyId, projectId: values.projectId ? Number(values.projectId) : null, responsableId: values.responsableId ? Number(values.responsableId) : null, dueDate: values.dueDate || null, priority: values.priority, status: 'todo' });
      }
      if (entity === 'decision') {
        const payload = { title: values.title, description: values.description || '', company: companyId, meeting: values.meetingId ? Number(values.meetingId) : null, responsable: values.responsableId ? Number(values.responsableId) : null, due_date: values.dueDate || null };
        if (dialog.mode === 'edit') await data.updateDecision(item.id, payload);
        else await data.createDecision({ ...values, companyId, meetingId: values.meetingId ? Number(values.meetingId) : null, responsableId: values.responsableId ? Number(values.responsableId) : null, dueDate: values.dueDate || null });
      }
      onClose();
    } catch (cause) {
      const detail = cause?.response?.data?.detail || cause?.message || 'Enregistrement impossible.';
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };
  const confirmUserAction = async () => {
    if (!userAction) return;
    setUserActionSaving(true);
    setError('');
    try {
      if (userAction === 'revoke') {
        await data.revokeAllUserSessions(item.id);
      } else {
        const statusByAction = { suspend: 'suspended', reactivate: 'active', exit: 'exited', archive: 'archived' };
        const reasonByAction = {
          suspend: 'Suspension décidée par le super administrateur.',
          reactivate: 'Réactivation décidée par le super administrateur.',
          exit: 'Départ révoqué par le super administrateur.',
          archive: 'Archivage décidé par le super administrateur.',
        };
        await data.changeUserStatus(item.id, statusByAction[userAction], reasonByAction[userAction]);
      }
      onClose();
    } catch (cause) {
      const detail = cause?.response?.data?.detail || cause?.message || 'Cette action a échoué.';
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
      setUserAction(null);
    } finally {
      setUserActionSaving(false);
    }
  };
  const userOpenTasks = entity === 'user' ? (data.getOpenTasksForUser?.(item.id) || []) : [];
  const transferCandidates = entity === 'user'
    ? (data.users || []).filter(user => String(user.id) !== String(item.id)
      && String(user.companyId || user.company || '') === String(item.companyId || item.company || '')
      && user.status === 'active')
    : [];
  const transferUserTasks = async () => {
    if (!transferTarget || !data.transferAllTasksFromUser) return;
    setTransferSaving(true);
    setTransferMessage('');
    setError('');
    try {
      const count = await data.transferAllTasksFromUser(item.id, Number(transferTarget));
      setTransferMessage(`${count} tâche${count > 1 ? 's' : ''} transférée${count > 1 ? 's' : ''}.`);
      setTransferTarget('');
    } catch (cause) {
      const detail = cause?.response?.data?.detail || cause?.message || 'Le transfert des tâches a échoué.';
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setTransferSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/65 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl border border-fog bg-white shadow-[0_28px_90px_rgba(10,25,35,.28)]">
        <header className="flex items-start justify-between gap-4 border-b border-fog bg-bone/60 px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-ink text-lg font-black text-lime">{dialog.type === 'details' ? '◉' : dialog.mode === 'edit' ? '✎' : '+'}</span>
            <div className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[.16em] text-slate">{dialog.type === 'details' ? 'Consultation du profil' : dialog.mode === 'edit' ? 'Mise à jour' : 'Nouvel enregistrement'}</span>
              <h2 className="mt-1 text-lg font-black capitalize tracking-tight text-ink sm:text-xl">{title}</h2>
              {descriptions[entity] && <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate">{descriptions[entity]}</p>}
            </div>
          </div>
          <button type="button" aria-label="Fermer" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-fog bg-white text-lg font-bold text-slate transition hover:border-ink hover:text-ink" onClick={onClose}>×</button>
        </header>
        {dialog.type === 'details' && entity === 'user' ? (
          <div className="max-h-[72vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center gap-4 border-b border-fog pb-5">
              <img src={item.avatar} alt="" className="h-16 w-16 rounded-full border border-fog object-cover" />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-ink">{item.name || '—'}</h3>
                <p className="truncate text-sm text-slate">{item.email || '—'}</p>
                <p className="mt-1 text-xs font-bold text-graphite">{item.role || '—'} · {item.status || '—'}</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                ['Téléphone', item.phone], ['Matricule', item.matricule],
                ['Société', item.companyName || data.companies?.find(company => String(company.id) === String(item.companyId))?.name],
                ['Direction / service', item.departmentName || data.departments?.find(department => String(department.id) === String(item.departmentId))?.name],
                ['Sessions actives', item.activeSessions ?? 0], ['Appareils enregistrés', item.devices?.length ?? 0],
                ['État de connexion', item.online ? 'En ligne' : 'Hors ligne'],
                ['Double authentification', item.twoFactorEnabled ? 'Activée' : 'Désactivée'],
                ['Dernière connexion', item.lastLogin ? new Date(item.lastLogin).toLocaleString('fr-FR') : 'Jamais'],
                ['Créé le', item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '—'],
                ['Sorti le', item.exitedAt ? new Date(item.exitedAt).toLocaleDateString('fr-FR') : '—'],
                ['À propos', item.about],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[10px] font-black uppercase tracking-[.12em] text-slate">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-semibold text-ink">{value || '—'}</dd>
                </div>
              ))}
            </dl>
            <section className="mt-6 rounded-2xl border border-fog bg-bone/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-ink">Tâches ouvertes</h3>
                  <p className="mt-1 text-xs text-slate">{userOpenTasks.length} tâche{userOpenTasks.length > 1 ? 's' : ''} encore à traiter, conservée{userOpenTasks.length > 1 ? 's' : ''} dans l’historique.</p>
                </div>
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-lime">{userOpenTasks.length}</span>
              </div>
              {userOpenTasks.length > 0 && <>
                <ul className="mt-3 max-h-32 space-y-1.5 overflow-y-auto">
                  {userOpenTasks.slice(0, 8).map(task => <li key={task.id} className="truncate rounded-lg bg-white px-3 py-2 text-xs font-semibold text-graphite">{task.title || task.name || `Tâche #${task.id}`}</li>)}
                  {userOpenTasks.length > 8 && <li className="px-3 py-1 text-[11px] font-semibold text-slate">et {userOpenTasks.length - 8} autre{userOpenTasks.length - 8 > 1 ? 's' : ''}…</li>}
                </ul>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <select aria-label="Choisir un remplaçant pour les tâches" value={transferTarget} onChange={event => setTransferTarget(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-black bg-white px-3 py-2.5 text-xs font-semibold text-ink">
                    <option value="">Choisir un remplaçant actif…</option>
                    {transferCandidates.map(user => <option key={user.id} value={user.id}>{user.name || user.email}</option>)}
                  </select>
                  <button type="button" disabled={!transferTarget || transferSaving} onClick={transferUserTasks} className="rounded-xl bg-ink px-4 py-2.5 text-xs font-extrabold text-lime transition hover:bg-graphite disabled:cursor-not-allowed disabled:opacity-50">{transferSaving ? 'Transfert…' : 'Transférer les tâches'}</button>
                </div>
                {transferCandidates.length === 0 && <p className="mt-2 text-[11px] text-slate">Aucun autre utilisateur actif de cette société n’est disponible comme remplaçant.</p>}
              </>}
              {transferMessage && <p role="status" className="mt-2 text-xs font-bold text-green-800">{transferMessage}</p>}
            </section>
            {userAction && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-900">
                  {userAction === 'suspend' && 'Suspendre ce compte ? La connexion sera bloquée et toutes les sessions seront révoquées.'}
                  {userAction === 'reactivate' && 'Débloquer ce compte ? L’utilisateur pourra de nouveau se connecter. Ses anciennes sessions resteront révoquées.'}
                  {userAction === 'exit' && 'Révoquer l’accès à ce compte ? La connexion sera bloquée et les sessions révoquées. Vous pourrez débloquer le compte plus tard. Les données seront conservées.'}
                  {userAction === 'archive' && 'Archiver ce compte ? L’historique professionnel sera conservé.'}
                  {userAction === 'revoke' && 'Déconnecter cet utilisateur de tous ses appareils ? Son compte restera actif.'}
                </p>
                {error && <p role="alert" className="mt-2 text-xs text-red-800">{error}</p>}
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" disabled={userActionSaving} onClick={() => setUserAction(null)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-graphite">Annuler</button>
                  <button type="button" disabled={userActionSaving} onClick={confirmUserAction} className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{userActionSaving ? 'Traitement…' : 'Confirmer'}</button>
                </div>
              </div>
            )}
            {error && !userAction && <p role="alert" className="mt-4 text-xs font-semibold text-red-700">{error}</p>}
            <footer className="mt-6 flex flex-wrap justify-end gap-2 border-t border-fog pt-4">
              {!isCurrentUser && ['active', 'away'].includes(item.status) && <button type="button" onClick={() => setUserAction('suspend')} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-extrabold text-red-700 transition hover:bg-red-50">Suspendre</button>}
              {!isCurrentUser && ['suspended', 'exited'].includes(item.status) && <button type="button" onClick={() => setUserAction('reactivate')} className="rounded-xl border border-fog px-4 py-2.5 text-xs font-extrabold text-ink transition hover:bg-bone">Débloquer l’accès</button>}
              {!isCurrentUser && !['exited', 'archived'].includes(item.status) && <button type="button" onClick={() => setUserAction('exit')} className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-extrabold text-red-700 transition hover:bg-red-50">Révoquer l’accès</button>}
              {!isCurrentUser && item.status === 'exited' && <button type="button" onClick={() => setUserAction('archive')} className="rounded-xl border border-fog px-4 py-2.5 text-xs font-extrabold text-graphite transition hover:bg-bone">Archiver</button>}
              {!isCurrentUser && (item.activeSessions ?? 0) > 0 && <button type="button" onClick={() => setUserAction('revoke')} className="rounded-xl border border-fog px-4 py-2.5 text-xs font-extrabold text-graphite transition hover:bg-bone">Révoquer les sessions</button>}
              <button type="button" onClick={() => onChoose({ type: 'user', mode: 'edit', item })} className="rounded-xl bg-ink px-5 py-2.5 text-xs font-extrabold text-lime transition hover:bg-graphite">Modifier</button>
            </footer>
          </div>
        ) : dialog.type === 'edit-select' ? (
          <div className="p-6">
            {entityRows.length ? <>
              <label className="flex flex-col gap-2 text-xs font-bold text-graphite">Choisir l’élément à modifier
                <select autoFocus value={selectedId} onChange={event => setSelectedId(event.target.value)} className="rounded-lg border border-black bg-white px-3 py-2.5 text-sm font-medium text-ink">
                  <option value="">Sélectionner…</option>{entityRows.map(row => <option key={row.id} value={row.id}>{row.name || row.title || row.ref || `#${row.id}`}</option>)}
                </select>
              </label>
              <footer className="mt-6 flex justify-end gap-2 border-t border-fog pt-4">
                <button type="button" onClick={onClose} className="rounded-lg border border-black px-4 py-2.5 text-xs font-bold text-graphite hover:bg-bone">Annuler</button>
                <button type="button" disabled={!selectedId} onClick={() => onChoose({ type: entity, mode: 'edit', item: entityRows.find(row => String(row.id) === selectedId) })} className="rounded-lg bg-ink px-4 py-2.5 text-xs font-bold text-white hover:bg-graphite disabled:opacity-50">Modifier</button>
              </footer>
            </> : <p className="text-sm text-slate">Aucun élément chargé depuis l’API à modifier.</p>}
          </div>
        ) : dialog.type === 'quick-create' ? (
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {[
              ['task', 'Nouvelle tâche'], ['project', 'Nouveau projet'],
              ['meeting', 'Nouvelle réunion'], ['decision', 'Nouvelle décision'],
            ].map(([type, label]) => (
              <button key={type} type="button" onClick={() => onChoose(type)} className="rounded-xl border border-fog p-4 text-left text-sm font-bold text-ink transition-colors hover:border-ink hover:bg-bone">{label}<span className="mt-1 block text-xs font-medium text-slate">Ouvrir le formulaire de création</span></button>
            ))}
          </div>
        ) : dialog.type === 'info' ? (
          <div className="p-6"><p className="text-sm font-semibold text-graphite">{dialog.title}</p><p className="mt-2 text-xs text-slate">Le détail de cet élément sera affiché ici.</p></div>
        ) : (
          <form onSubmit={submit} className="flex max-h-[calc(92vh-90px)] flex-col">
            <div className="overflow-y-auto px-6 py-6 sm:px-8">
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              {fields.map(([key, label, type, required, options]) => (
                <label key={key} className={`flex flex-col gap-2 text-[11px] font-extrabold uppercase tracking-wide text-graphite ${type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                  <span>{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</span>
                  {type === 'select' ? (
                    <select required={required} value={values[key] || ''} onChange={event => set(key, event.target.value)} className="min-h-11 rounded-xl border border-fog bg-white px-3.5 py-2.5 text-sm font-medium normal-case tracking-normal text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/5">
                      <option value="">Sélectionner…</option>{(options || []).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                    </select>
                  ) : type === 'textarea' ? (
                    <textarea value={values[key] || ''} onChange={event => set(key, event.target.value)} rows="3" className="min-h-24 rounded-xl border border-fog bg-white px-3.5 py-3 text-sm font-medium normal-case tracking-normal text-ink outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/5" />
                  ) : (
                    <input required={required} type={type} value={values[key] || ''} readOnly={dialog.mode === 'edit' && entity === 'user' && key === 'email'} onChange={event => set(key, event.target.value)} className="min-h-11 rounded-xl border border-fog bg-white px-3.5 py-2.5 text-sm font-medium normal-case tracking-normal text-ink outline-none transition placeholder:text-slate/60 focus:border-ink focus:ring-4 focus:ring-ink/5 read-only:bg-bone" />
                  )}
                </label>
              ))}
            </div>
            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </div>
            <footer className="flex justify-end gap-2 border-t border-fog bg-white px-6 py-4 sm:px-8">
              <button type="button" onClick={onClose} className="rounded-xl border border-fog px-4 py-2.5 text-xs font-extrabold text-graphite transition hover:bg-bone">Annuler</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-ink px-5 py-2.5 text-xs font-extrabold text-lime shadow-sm transition hover:bg-graphite disabled:cursor-wait disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
