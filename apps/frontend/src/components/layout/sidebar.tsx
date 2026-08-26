'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { hasAnyRole } from '@/lib/auth';
import { GhmcLogo } from '@/components/brand/ghmc-logo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
const ComplaintIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
);
const MapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
);
const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const ReportIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);
const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);
const AiIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);


const citizenNav: NavItem[] = [
  { name: 'Dashboard', href: '/citizen/dashboard', icon: <DashboardIcon /> },
  { name: 'My Complaints', href: '/citizen/complaints', icon: <ComplaintIcon /> },
  { name: 'AI Assistant', href: '/citizen/assistant', icon: <AiIcon /> },
  { name: 'Settings', href: '/citizen/settings', icon: <SettingsIcon /> },
];

const officerNav: NavItem[] = [
  { name: 'Dashboard', href: '/officer/dashboard', icon: <DashboardIcon /> },
  { name: 'Complaints', href: '/officer/complaints', icon: <ComplaintIcon /> },
  { name: 'Map View', href: '/officer/map', icon: <MapIcon /> },
  { name: 'Settings', href: '/officer/settings', icon: <SettingsIcon /> },
];

const workerNav: NavItem[] = [
  { name: 'Dashboard', href: '/worker/dashboard', icon: <DashboardIcon /> },
  { name: 'My Tasks', href: '/worker/complaints', icon: <ComplaintIcon /> },
  { name: 'Map', href: '/worker/map', icon: <MapIcon /> },
];

const commissionerNav: NavItem[] = [
  { name: 'Dashboard', href: '/commissioner/dashboard', icon: <DashboardIcon /> },
  { name: 'Project status', href: '/commissioner/complaints', icon: <ComplaintIcon /> },
  { name: 'Departments', href: '/commissioner/departments', icon: <ReportIcon /> },
  { name: 'Map', href: '/commissioner/map', icon: <MapIcon /> },
  { name: 'Settings', href: '/commissioner/settings', icon: <SettingsIcon /> },
];

const adminNav: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: <DashboardIcon /> },
  { name: 'Users', href: '/admin/users', icon: <UsersIcon /> },
  { name: 'Complaints', href: '/admin/complaints', icon: <ComplaintIcon /> },
  { name: 'Geography', href: '/admin/geography', icon: <MapIcon /> },
  { name: 'Roles', href: '/admin/roles', icon: <UsersIcon /> },
  { name: 'Audit Logs', href: '/admin/audit', icon: <ReportIcon /> },
  { name: 'Settings', href: '/admin/settings', icon: <SettingsIcon /> },
];

function getNavigationForUser(roles: string[]): NavItem[] {
  if (hasAnyRole({ roles } as any, ['SUPER_ADMIN'])) return adminNav;
  if (hasAnyRole({ roles } as any, ['COMMISSIONER', 'ADDITIONAL_COMMISSIONER', 'ZONAL_COMMISSIONER', 'DEPUTY_COMMISSIONER'])) return commissionerNav;
  if (hasAnyRole({ roles } as any, ['WARD_OFFICER', 'ASSISTANT_MUNICIPAL_COMMISSIONER'])) return officerNav;
  if (hasAnyRole({ roles } as any, ['FIELD_SUPERVISOR', 'FIELD_WORKER'])) return workerNav;
  return citizenNav;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navigation = getNavigationForUser(user.roles);

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-20 px-4">
        <GhmcLogo className="h-10 w-auto" />
        <div>
          <span className="text-base font-bold text-gray-900 leading-none">CivicOps</span>
          <span className="block text-[11px] text-gray-400 mt-0.5">Portal</span>
        </div>
      </div>

      {/* Menu label */}
      <div className="px-6 pt-4 pb-2">
        <span className="text-xs font-medium text-gray-400">Menu</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150',
                isActive
                  ? 'bg-[#7c3aed] text-white shadow-lg shadow-purple-200'
                  : 'text-gray-500 hover:bg-purple-50 hover:text-[#7c3aed]',
              )}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-150"
        >
          <LogoutIcon />
          <span>Log out</span>
        </button>
      </nav>

      {/* Bottom illustration card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-[#7c3aed] to-purple-500 rounded-2xl p-5 text-center relative overflow-hidden h-40 flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/50 rounded-full" />
          </div>
          <div className="relative z-10">
            <div className="text-4xl mb-2">🏛️</div>
            <p className="text-sm text-white font-semibold">CivicOps</p>
            <p className="text-[10px] text-purple-100 mt-0.5">Making cities better</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
