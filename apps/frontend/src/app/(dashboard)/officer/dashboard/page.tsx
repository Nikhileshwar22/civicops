'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { apiGet } from '@/lib/api-client';

interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  slaBreached: boolean;
  citizen: { firstName: string; lastName: string };
}

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, complaintsData] = await Promise.all([
          apiGet('/reports/dashboard'),
          apiGet('/complaints?limit=10&sortOrder=desc'),
        ]);
        setStats(statsData);
        setComplaints(complaintsData.data || complaintsData || []);
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { RECEIVED: 'bg-gray-100 text-gray-700', ASSIGNED: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', RESOLVED: 'bg-green-100 text-green-700' };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Officer Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage complaints in your jurisdiction, {user?.firstName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Pending Assignment</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{stats?.pending || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{stats?.active || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{stats?.completed || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">SLA Breached</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{stats?.slaBreached || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Complaints</h2>
          <Link href="/officer/complaints" className="text-xs text-[#7c3aed] font-medium hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-400 text-xs border-b border-gray-50">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Citizen</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{c.complaintNumber}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{c.title}</td>
                  <td className="px-5 py-3 text-gray-600">{c.citizen?.firstName} {c.citizen?.lastName}</td>
                  <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3 text-gray-600">{c.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
