'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function OfficerAssignmentsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/complaints?status=ASSIGNED&limit=20').then((data) => setComplaints(data.data || data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Assignments</h1>
      <p className="text-sm text-gray-400">{complaints.length} assigned complaints</p>
      <div className="space-y-3">
        {complaints.map((c: any) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{c.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.complaintNumber} • {c.category?.replace('_', ' ')}</p>
            </div>
            <span className="text-xs bg-purple-50 text-[#7c3aed] px-2.5 py-1 rounded-full font-medium">Assigned</span>
          </div>
        ))}
        {complaints.length === 0 && <div className="bg-white rounded-xl border p-12 text-center text-gray-400 text-sm">No assigned complaints</div>}
      </div>
    </div>
  );
}
