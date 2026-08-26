'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function AdminTenantsPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/tenants/current').then(setTenant).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Tenants</h1>
      {tenant && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{tenant.slug} • {tenant.domain || 'No domain'}</p>
            </div>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
