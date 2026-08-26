'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/rbac/roles').then(setRoles).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Roles & Permissions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r: any) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{r.displayName}</h3>
              <span className="text-xs bg-purple-50 text-[#7c3aed] px-2 py-0.5 rounded-full">Level {r.level}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{r.name} • {r.userCount || 0} users</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(r.permissions || []).slice(0, 5).map((p: any) => (
                <span key={p.id || p.name} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.name}</span>
              ))}
              {(r.permissions || []).length > 5 && <span className="text-[10px] text-gray-400">+{(r.permissions || []).length - 5} more</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
