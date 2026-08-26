'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiGet } from '@/lib/api-client';

interface DashboardStats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  slaBreached: number;
  byStatus: Record<string, number>;
}

interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  department?: { name: string };
}

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, complaintsData] = await Promise.all([
          apiGet<DashboardStats>('/reports/dashboard'),
          apiGet<any>('/complaints?limit=5&sortOrder=desc'),
        ]);
        setStats(statsData);
        setComplaints(complaintsData.data || complaintsData || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      RECEIVED: 'bg-gray-100 text-gray-700',
      UNDER_REVIEW: 'bg-blue-50 text-blue-700',
      ASSIGNED: 'bg-purple-50 text-purple-700',
      IN_PROGRESS: 'bg-amber-50 text-amber-700',
      RESOLVED: 'bg-green-50 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-500',
      REOPENED: 'bg-red-50 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      LOW: 'bg-green-50 text-green-700',
      MEDIUM: 'bg-blue-50 text-blue-700',
      HIGH: 'bg-amber-50 text-amber-700',
      CRITICAL: 'bg-red-50 text-red-700',
    };
    return styles[priority] || 'bg-gray-100 text-gray-700';
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Good morning, {user?.firstName}!
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Track your civic complaints and report new issues</p>
        </div>
        <Link
          href="/citizen/complaints/new"
          className="flex items-center gap-2 bg-[#7c3aed] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#6d28d9] transition-colors shadow-md shadow-purple-200"
        >
          + New Complaint
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">Total Complaints</p>
          <p className="text-3xl font-bold text-[#7c3aed] mt-1">{stats?.total || 0}</p>
          <p className="text-xs text-gray-400 mt-1">All time</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-3xl font-bold text-green-500 mt-1">{stats?.completed || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Closed & Resolved</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{stats?.active || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Assigned & Working</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{stats?.pending || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting review</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Complaints */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Complaints</h2>
            <Link href="/citizen/complaints" className="text-xs text-[#7c3aed] font-medium hover:underline">
              View all →
            </Link>
          </div>
          {complaints.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {complaints.map((complaint) => (
                <Link
                  key={complaint.id}
                  href={`/citizen/complaints/${complaint.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{complaint.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityBadge(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{complaint.complaintNumber}</span>
                        <span>•</span>
                        <span>{complaint.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>{timeAgo(complaint.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${getStatusBadge(complaint.status)}`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <p className="text-sm">No complaints yet. Report your first civic issue!</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-3">
            <Link href="/citizen/complaints/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-100 transition-colors">
              <span className="text-xl">➕</span>
              <div>
                <p className="text-sm font-medium text-gray-900">New Complaint</p>
                <p className="text-[11px] text-gray-400">Report a civic issue</p>
              </div>
            </Link>
            <Link href="/citizen/complaints" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-100 transition-colors">
              <span className="text-xl">📄</span>
              <div>
                <p className="text-sm font-medium text-gray-900">All Complaints</p>
                <p className="text-[11px] text-gray-400">View & track status</p>
              </div>
            </Link>
            <Link href="/citizen/assistant" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-100 transition-colors">
              <span className="text-xl">🤖</span>
              <div>
                <p className="text-sm font-medium text-gray-900">AI Assistant</p>
                <p className="text-[11px] text-gray-400">Get help & answers</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
