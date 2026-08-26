'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function CommissionerReportsPage() {
  const [sla, setSla] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGet('/reports/sla'), apiGet('/reports/by-zone')]).then(([s, z]) => {
      setSla(s); setZones(z);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">SLA Compliance</p>
          <p className="text-3xl font-bold text-green-500 mt-1">{sla?.complianceRate || 0}%</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">On Time</p>
          <p className="text-3xl font-bold text-[#7c3aed] mt-1">{sla?.onTime || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">Breached</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{sla?.breached || 0}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">By Zone</h2>
        {zones.length > 0 ? (
          <div className="space-y-2">
            {zones.map((z: any) => (
              <div key={z.zoneId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{z.zoneName}</span>
                <span className="text-sm font-bold text-[#7c3aed]">{z.count}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-4">No zone data available</p>}
      </div>
    </div>
  );
}
