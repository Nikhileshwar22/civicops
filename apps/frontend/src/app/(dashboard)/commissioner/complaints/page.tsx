'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api-client';

interface Attachment { id: string; fileName: string; url: string; mimeType: string; }

interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  address?: string;
  createdAt: string;
  zone?: { id: string; name: string };
  circle?: { id: string; name: string };
  ward?: { id: string; name: string; number: number };
  department?: { name: string };
  assignedWorker?: { firstName: string; lastName: string };
  assignedOfficer?: { firstName: string; lastName: string };
  attachments?: Attachment[];
  resolutionEvidence?: string[];
}

interface Zone {
  id: string;
  name: string;
  code: string;
}

export default function CommissionerProjectStatusPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  useEffect(() => {
    apiGet<Zone[]>('/geography/zones').then(setZones).catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '50', sortOrder: 'desc' });
    if (zoneFilter) params.set('zoneId', zoneFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    setLoading(true);
    apiGet<any>(`/complaints?${params.toString()}`)
      .then((data) => setComplaints(data.data || data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [zoneFilter, statusFilter, search]);

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = {
      RECEIVED: 'bg-gray-100 text-gray-700',
      UNDER_REVIEW: 'bg-blue-100 text-blue-700',
      ASSIGNED: 'bg-purple-100 text-purple-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-200 text-gray-600',
      REOPENED: 'bg-red-100 text-red-700',
    };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (p: string) => {
    const m: Record<string, string> = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-blue-100 text-blue-700', HIGH: 'bg-amber-100 text-amber-700', CRITICAL: 'bg-red-100 text-red-700' };
    return m[p] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Project Status</h1>
          <p className="text-sm text-gray-400 mt-0.5">Review complaints zone-wise with assigned workers</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Zone dropdown - key requirement */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="">All Status</option>
            <option value="RECEIVED">Received</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('card')} className={`px-3 py-2 text-xs ${viewMode === 'card' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600'}`}>Card</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs ${viewMode === 'list' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600'}`}>List</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm">No complaints found for the selected filters</p>
        </div>
      ) : viewMode === 'card' ? (
        /* CARD VIEW - shows zone, area, assigned worker */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map((c) => {
            const images = (c.attachments || []).filter((a) => a.mimeType?.startsWith('image/'));
            const proofImages = c.resolutionEvidence || [];
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Complaint photos */}
              {images.length > 0 && (
                <div className="flex gap-0.5 h-28">
                  {images.slice(0, 3).map((img, i) => (
                    <img key={i} src={img.url} alt={img.fileName} className={`object-cover ${images.length === 1 ? 'w-full' : images.length === 2 ? 'w-1/2' : 'w-1/3'}`} />
                  ))}
                </div>
              )}
              {/* Resolution proof */}
              {proofImages.length > 0 && (
                <div className="flex gap-0.5 h-20">
                  {proofImages.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt="proof" className={`object-cover ${proofImages.length === 1 ? 'w-full' : proofImages.length === 2 ? 'w-1/2' : 'w-1/3'}`} />
                  ))}
                </div>
              )}
              <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span>
                <span className="text-[10px] text-gray-400">{c.complaintNumber}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{c.title}</h3>

              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">🗺️ Zone:</span>
                  <span className="font-medium">{c.zone?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">📍 Area:</span>
                  <span className="font-medium truncate">{c.address || c.ward?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">🏢 Dept:</span>
                  <span className="font-medium">{c.department?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">👷 Worker:</span>
                  <span className="font-medium">
                    {c.assignedWorker ? `${c.assignedWorker.firstName} ${c.assignedWorker.lastName}` : 'Not assigned'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-[11px]">
                <span className={`px-2 py-0.5 rounded-full font-medium ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                <div className="flex items-center gap-2 text-gray-400">
                  {images.length > 0 && <span>📷 {images.length}</span>}
                  <span>{formatDate(c.createdAt)}</span>
                </div>
              </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW - shows zone, area, worker in a table */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Complaint</th>
                <th className="px-5 py-3 font-medium">Zone</th>
                <th className="px-5 py-3 font-medium">Area</th>
                <th className="px-5 py-3 font-medium">Worker</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
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
                  <td className="px-5 py-3 text-gray-600 max-w-[180px] truncate">{c.address || c.ward?.name || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{c.assignedWorker ? `${c.assignedWorker.firstName} ${c.assignedWorker.lastName}` : <span className="text-gray-300">Unassigned</span>}</td>
                  <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3 text-gray-600">{c.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
