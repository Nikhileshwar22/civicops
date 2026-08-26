'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function AdminGeographyPage() {
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/geography/hierarchy').then(setHierarchy).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Geographic Hierarchy</h1>
      <div className="space-y-4">
        {hierarchy.map((zone: any) => (
          <div key={zone.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
              {zone.name} <span className="text-xs text-gray-400 font-normal">({zone.code})</span>
            </h3>
            {zone.circles?.length > 0 && (
              <div className="mt-3 ml-5 space-y-2">
                {zone.circles.map((circle: any) => (
                  <div key={circle.id}>
                    <p className="text-sm text-gray-700 font-medium">{circle.name} <span className="text-xs text-gray-400">({circle.code})</span></p>
                    {circle.wards?.length > 0 && (
                      <div className="ml-4 mt-1 flex flex-wrap gap-2">
                        {circle.wards.map((ward: any) => (
                          <span key={ward.id} className="text-xs bg-purple-50 text-[#7c3aed] px-2 py-0.5 rounded-full">
                            Ward {ward.number}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
