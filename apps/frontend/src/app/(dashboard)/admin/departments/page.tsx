'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/departments').then(setDepartments).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Departments</h1>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-400 text-xs text-left">
            <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Complaints</th><th className="px-5 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {departments.map((d: any) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{d.name}</td>
                <td className="px-5 py-3 text-gray-500">{d.code}</td>
                <td className="px-5 py-3 text-[#7c3aed] font-medium">{d.complaintCount || 0}</td>
                <td className="px-5 py-3"><span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
