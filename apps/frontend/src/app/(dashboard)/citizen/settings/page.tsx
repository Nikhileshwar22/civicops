'use client';

import { useAuth } from '@/hooks/use-auth';

export default function CitizenSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold mb-4">My Profile</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{user?.firstName} {user?.lastName}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium">Citizen</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Tenant</span><span className="font-medium">{user?.tenantName}</span></div>
        </div>
      </div>
    </div>
  );
}
