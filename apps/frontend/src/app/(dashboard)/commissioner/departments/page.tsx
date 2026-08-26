'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

interface Department {
  id: string;
  name: string;
  code: string;
  complaintCount?: number;
}

interface Zone {
  id: string;
  name: string;
}

interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  status: string;
  priority: string;
  address?: string;
  createdAt: string;
  zone?: { id: string; name: string };
  assignedWorker?: { firstName: string; lastName: string };
}

export default function CommissionerDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [zoneFilter, setZoneFilter] = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  useEffect(() => {
    Promise.all([apiGet<Department[]>('/departments'), apiGet<Zone[]>('/geography/zones')])
      .then(([depts, zns]) => {
        setDepartments(depts);
        setZones(zns);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // When a department is selected (or zone filter changes), fetch its complaints
  useEffect(() => {
    if (!selectedDept) return;

    const params = new URLSearchParams({ departmentId: selectedDept.id, limit: '100' });
    if (zoneFilter) params.set('zoneId', zoneFilter);

    setLoadingComplaints(true);
    apiGet<any>(`/complaints?${params.toString()}`)
      .then((data) => setComplaints(data.data || data || []))
      .catch(console.error)
      .finally(() => setLoadingComplaints(false));
  }, [selectedDept, zoneFilter]);

  const present = complaints.length;
  const pending = complaints.filter((c) => ['RECEIVED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(c.status)).length;
  const resolved = complaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = {
      RECEIVED: 'bg-gray-100 text-gray-700', UNDER_REVIEW: 'bg-blue-100 text-blue-700',
      ASSIGNED: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-green-100 text-green-700', CLOSED: 'bg-gray-200 text-gray-600', REOPENED: 'bg-red-100 text-red-700',
    };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Department detail view
  if (selectedDept) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedDept(null); setZoneFilter(''); }} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{selectedDept.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Complaints for this department, zone-wise</p>
          </div>
          {/* Zone-wise review dropdown */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (<option key={z.id} value={z.id}>{z.name}</option>))}
          </select>
        </div>

        {/* Present / Pending / Resolved stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-sm text-gray-500">Present</p>
            <p className="text-3xl font-bold text-[#7c3aed] mt-1">{present}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-amber-500 mt-1">{pending}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-3xl font-bold text-green-500 mt-1">{resolved}</p>
          </div>
        </div>

        {/* Complaints list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Complaints {zoneFilter && `— ${zones.find((z) => z.id === zoneFilter)?.name}`}
            </h2>
          </div>
          {loadingComplaints ? (
            <div className="p-12 flex items-center justify-center"><div className="w-6 h-6 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No complaints for this department{zoneFilter ? ' in this zone' : ''}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs text-left">
                <tr>
                  <th className="px-5 py-3 font-medium">Complaint</th>
                  <th className="px-5 py-3 font-medium">Zone</th>
                  <th className="px-5 py-3 font-medium">Worker</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{c.title}</div>
                      <div className="text-[11px] text-gray-400">{c.complaintNumber}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.zone?.name || '-'}</td>
                    <td className="px-5 py-3 text-gray-600">{c.assignedWorker ? `${c.assignedWorker.firstName} ${c.assignedWorker.lastName}` : <span className="text-gray-300">Unassigned</span>}</td>
                    <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // Department grid view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Departments</h1>
        <p className="text-sm text-gray-400 mt-0.5">Click a department to review its complaints zone-wise</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDept(d)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-purple-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{d.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Code: {d.code}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <span className="text-lg">🏢</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Complaints</span>
              <span className="text-xl font-bold text-[#7c3aed]">{d.complaintCount || 0}</span>
            </div>
            <p className="text-[11px] text-[#7c3aed] mt-3 font-medium">Click to review →</p>
          </button>
        ))}
      </div>
    </div>
  );
}
