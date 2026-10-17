import { Bell, ChevronDown, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSuperAdmin } from '../../context/SuperAdminContext';

export default function SuperAdminHeaderActions() {
  const { currentUser, openMessaging } = useAuth();
  const { users = [], sessions = [] } = useSuperAdmin();
  const initials = (currentUser?.name || 'SA')
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const onlineCount = users.filter(user => user.online || user.isOnline).length;
  const activeSessionCount = sessions.filter(session => session.active).length;

  return (
    <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
      <div className="hidden xl:flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-lg bg-bone px-2.5 py-1.5 text-[11px] font-semibold text-graphite">
          <span className="tick h-1.5 w-1.5 rounded-full bg-lime" />
          {onlineCount} en ligne
        </span>
        <span className="flex items-center gap-1.5 rounded-lg bg-bone px-2.5 py-1.5 text-[11px] font-semibold text-graphite">
          <span className="h-1.5 w-1.5 rounded-full bg-ink" />
          {activeSessionCount} sessions
        </span>
        <span className="h-6 w-px bg-fog" />
      </div>
      <button type="button" aria-label="Notifications" title="Notifications" className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-bone hover:text-ink">
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-lime" />
      </button>
      <button type="button" aria-label="Ouvrir la messagerie" title="Messagerie" onClick={openMessaging} className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-bone hover:text-ink sm:flex">
        <MessageSquare className="h-4 w-4" />
      </button>
      <button type="button" aria-label={`Profil de ${currentUser?.name || 'superadministrateur'}`} className="flex h-9 flex-shrink-0 items-center gap-2 rounded-lg border border-transparent pl-1 pr-1 transition-colors hover:border-fog hover:bg-bone sm:pr-2.5">
        {currentUser?.avatar
          ? <img src={currentUser.avatar} alt={initials} className="h-7 w-7 rounded-full object-cover ring-2 ring-lime/30" />
          : <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime text-[10px] font-black text-ink ring-2 ring-lime/30">{initials}</span>}
        <span className="hidden max-w-36 truncate text-[12px] font-bold text-ink md:block">{currentUser?.name || 'Super Admin'}</span>
        <ChevronDown className="hidden h-3 w-3 text-slate md:block" />
      </button>
    </div>
  );
}
