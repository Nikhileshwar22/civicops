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
  address?: string;
  createdAt: string;
}

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>('/complaints?limit=100&sortOrder=desc')
      .then((data) => setComplaints(data.data || data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const assigned = complaints.filter((c) => c.status === 'ASSIGNED');
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS');
  const completed = complaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status));
  const active = [...assigned, ...inProgress];

  const getPriorityDot = (p: string) => {
    const m: Record<string, string> = { LOW: 'bg-green-500', MEDIUM: 'bg-blue-500', HIGH: 'bg-amber-500', CRITICAL: 'bg-red-500' };
    return m[p] || 'bg-gray-500';
  };
  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { ASSIGNED: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-amber-100 text-amber-700' };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.firstName}!</h1>
          <p className="text-sm text-gray-400 mt-0.5">Here are the issues assigned to you</p>
        </div>
        <Link href="/worker/complaints" className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6d28d9] shadow-md shadow-purple-200">
          View All Tasks →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">New Assigned</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{assigned.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{inProgress.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-500 mt-1">{completed.length}</p>
        </div>
      </div>

      {/* Active tasks */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Tasks Requiring Action</h2>
          <Link href="/worker/complaints" className="text-xs text-[#7c3aed] font-medium hover:underline">Manage →</Link>
        </div>
        {active.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No active tasks. Great job! ✅</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {active.slice(0, 6).map((c) => (
              <Link key={c.id} href="/worker/complaints" className="flex items-center gap-4 p-4 hover:bg-gray-50">
                <span className={`w-3 h-3 rounded-full ${getPriorityDot(c.priority)}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.complaintNumber} • {c.category.replace('_', ' ')} • {c.address || 'No location'}</p>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
