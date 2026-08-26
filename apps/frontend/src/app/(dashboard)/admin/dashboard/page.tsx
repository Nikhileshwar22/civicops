'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [tenantStats, setTenantStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashStats, tStats] = await Promise.all([
          apiGet('/reports/dashboard'),
          apiGet('/tenants/current/stats'),
        ]);
        setStats(dashStats);
        setTenantStats(tStats);
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-400 mt-0.5">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-[#7c3aed] mt-1">{tenantStats?.users || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total Complaints</p>
          <p className="text-2xl font-bold text-blue-500 mt-1">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Departments</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{tenantStats?.departments || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Zones</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{tenantStats?.zones || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-100">
              <span className="text-lg">👤</span><div><p className="text-sm font-medium">Manage Users</p><p className="text-[11px] text-gray-400">Create, edit, deactivate users</p></div>
            </Link>
            <Link href="/admin/geography" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-100">
              <span className="text-lg">🗺️</span><div><p className="text-sm font-medium">Geography</p><p className="text-[11px] text-gray-400">Zones, Circles, Wards</p></div>
            </Link>
            <Link href="/admin/roles" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-100">
              <span className="text-lg">🔐</span><div><p className="text-sm font-medium">Roles & Permissions</p><p className="text-[11px] text-gray-400">Manage access control</p></div>
            </Link>
            <Link href="/admin/audit" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-100">
              <span className="text-lg">📋</span><div><p className="text-sm font-medium">Audit Logs</p><p className="text-[11px] text-gray-400">Track all actions</p></div>
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700">Database</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700">Redis Cache</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700">API Server</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Running</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700">Background Workers</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
