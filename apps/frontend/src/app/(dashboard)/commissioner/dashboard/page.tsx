'use client';

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

interface DeptPerformance {
  name: string;
  total: number;
  resolved: number;
  pending: number;
  resolutionRate: number;
}

interface CategoryData {
  category: string;
  count: number;
}

export default function CommissionerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<DeptPerformance[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, deptData, catData] = await Promise.all([
          apiGet<DashboardStats>('/reports/dashboard'),
          apiGet<DeptPerformance[]>('/reports/departments'),
          apiGet<CategoryData[]>('/reports/by-category'),
        ]);
        setStats(statsData);
        setDepartments(deptData);
        setCategories(catData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const total = stats?.total || 1;
  const resolvedPct = stats ? Math.round((stats.completed / Math.max(total, 1)) * 100) : 0;
  const maxDept = Math.max(...departments.map((d) => d.total), 1);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Good morning, {user?.firstName}!</h1>
          <p className="text-sm text-gray-400 mt-0.5">Organization-wide civic operations overview</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Complaints</p>
              <p className="text-2xl font-bold text-[#7c3aed] mt-1">{stats?.total || 0}</p>
            </div>
            <span className="text-2xl">📋</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">{stats?.pending || 0}</p>
            </div>
            <span className="text-2xl">⏳</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-green-500 mt-1">{stats?.completed || 0}</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">SLA Breached</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{stats?.slaBreached || 0}</p>
            </div>
            <span className="text-2xl">🚨</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Complaint Status Overview</h2>
          <div className="flex items-center gap-8">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#22c55e" strokeWidth="10"
                  strokeDasharray={`${(stats?.completed || 0) / Math.max(total, 1) * 238.76} 238.76`} strokeLinecap="round" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#3b82f6" strokeWidth="10"
                  strokeDasharray={`${(stats?.active || 0) / Math.max(total, 1) * 238.76} 238.76`}
                  strokeDashoffset={`-${(stats?.completed || 0) / Math.max(total, 1) * 238.76}`} strokeLinecap="round" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="10"
                  strokeDasharray={`${(stats?.pending || 0) / Math.max(total, 1) * 238.76} 238.76`}
                  strokeDashoffset={`-${((stats?.completed || 0) + (stats?.active || 0)) / Math.max(total, 1) * 238.76}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900">{resolvedPct}%</span>
                  <span className="block text-[10px] text-gray-400">Resolved</span>
                </div>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-600">Resolved</span><span className="ml-auto font-medium">{stats?.completed || 0}</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-gray-600">Active</span><span className="ml-auto font-medium">{stats?.active || 0}</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /><span className="text-gray-600">Pending</span><span className="ml-auto font-medium">{stats?.pending || 0}</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="text-gray-600">SLA Breach</span><span className="ml-auto font-medium">{stats?.slaBreached || 0}</span></div>
            </div>
          </div>
        </div>

        {/* Department Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Department Performance</h2>
          <div className="space-y-3">
            {departments.map((dept) => (
              <div key={dept.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-32 truncate">{dept.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full rounded-full bg-[#7c3aed]" style={{ width: `${(dept.total / maxDept) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{dept.total}</span>
              </div>
            ))}
            {departments.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No department data</p>}
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Complaints by Category</h2>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <div key={cat.category} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-[#7c3aed]">{cat.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cat.category.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
