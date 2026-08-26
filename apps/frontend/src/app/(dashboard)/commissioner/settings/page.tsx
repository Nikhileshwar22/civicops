'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function CommissionerSettingsPage() {
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    apiGet('/tenants/current').then(setTenant).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Tenant Information</h2>
        {tenant && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{tenant.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Slug</span><span className="font-medium">{tenant.slug}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-green-600">{tenant.isActive ? 'Active' : 'Inactive'}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
