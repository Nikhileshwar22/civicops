'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/complaints?limit=20&sortOrder=desc').then((data) => setComplaints(data.data || data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { RECEIVED: 'bg-gray-100 text-gray-700', ASSIGNED: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', RESOLVED: 'bg-green-100 text-green-700' };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">All Complaints</h1>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 text-xs text-left">
            <tr><th className="px-5 py-3">ID</th><th className="px-5 py-3">Title</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Priority</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {complaints.map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs text-gray-500">{c.complaintNumber}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{c.title}</td>
                <td className="px-5 py-3 text-gray-600">{c.category?.replace('_',' ')}</td>
                <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status?.replace('_',' ')}</span></td>
                <td className="px-5 py-3 text-gray-600">{c.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
