'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/audit?limit=30').then((data) => setLogs(data.data || data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 text-xs text-left">
            <tr><th className="px-5 py-3">Action</th><th className="px-5 py-3">User</th><th className="px-5 py-3">Resource</th><th className="px-5 py-3">Time</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-5 py-3"><span className="text-xs bg-purple-50 text-[#7c3aed] px-2 py-0.5 rounded font-medium">{log.action}</span></td>
                <td className="px-5 py-3 text-gray-600">{log.user?.firstName} {log.user?.lastName}</td>
                <td className="px-5 py-3 text-gray-500">{log.resourceType}</td>
                <td className="px-5 py-3 text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400">No audit logs yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
