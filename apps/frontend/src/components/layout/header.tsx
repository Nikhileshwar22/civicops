'use client';

import { useAuth } from '@/hooks/use-auth';
import { NotificationBell } from './notification-bell';

export function Header() {
  const { user } = useAuth();

  const roleLabel = user?.roles?.[0]?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) || '';

  return (
    <header className="flex items-center h-20 px-8 bg-white border-b border-gray-100">
      {/* Centered Search Bar */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-xl">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-[#7c3aed]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search complaints, departments, reports..."
            className="w-full pl-12 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 shadow-sm"
          />
        </div>
      </div>

      {/* Right side: bell, mail, profile */}
      <div className="flex items-center gap-5 ml-6">
        {/* Notification bell */}
        <NotificationBell />

        {/* Mail / messages icon */}
        <button className="relative p-1 text-gray-500 hover:text-[#7c3aed] transition-colors" aria-label="Messages">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Profile */}
        {user && (
          <div className="flex items-center gap-2.5 cursor-pointer pl-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center ring-2 ring-purple-100 overflow-hidden">
              <span className="text-sm font-bold text-white">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="text-[11px] text-gray-400">{roleLabel}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
