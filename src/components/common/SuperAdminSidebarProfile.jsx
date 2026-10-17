import { useAuth } from '../../context/AuthContext';

export default function SuperAdminSidebarProfile() {
  const { currentUser } = useAuth();
  const initials = (currentUser?.name || 'SA')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = {
    superAdmin: 'Super Administrateur',
    adminSociete: 'Administrateur Société',
    manager: 'Manager',
    employe: 'Employé',
  }[currentUser?.role] || currentUser?.role || 'Administrateur';

  return (
    <div className="border-t border-white/[.08] flex-shrink-0">
      <div className="h-[60px] flex items-center overflow-hidden">
        <div className="nav-icon h-full">
          <div className="relative">
            {currentUser?.avatar
              ? <img src={currentUser.avatar} alt={initials} className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10" />
              : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-[10px] font-black text-ink ring-2 ring-white/10">{initials}</span>}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink bg-lime" />
          </div>
        </div>
        <div className="user-info flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[12px] font-bold text-white">{currentUser?.name || 'Admin'}</span>
          <span className="truncate text-[10px] font-semibold text-white/40">{roleLabel}</span>
        </div>
      </div>
    </div>
  );
}
