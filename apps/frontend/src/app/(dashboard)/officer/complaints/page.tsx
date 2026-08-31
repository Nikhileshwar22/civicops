'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';

interface Attachment { id: string; fileName: string; objectKey: string; url: string; mimeType: string; }

interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  address?: string;
  createdAt: string;
  zone?: { name: string };
  ward?: { name: string; number: number };
  department?: { name: string };
  citizen?: { firstName: string; lastName: string };
  assignedWorker?: { firstName: string; lastName: string };
  attachments?: Attachment[];
  resolutionEvidence?: string[];
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  ward?: { name: string; number: number };
}

export default function OfficerComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [statusFilter, setStatusFilter] = useState('');
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const fetchComplaints = () => {
    const params = new URLSearchParams({ limit: '50', sortOrder: 'desc' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    setLoading(true);
    apiGet<any>(`/complaints?${params.toString()}`)
      .then((data) => setComplaints(data.data || data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, [statusFilter]);

  useEffect(() => {
    apiGet<Worker[]>('/users/assignable-workers').then(setWorkers).catch(console.error);
  }, []);

  const openAssign = (complaint: Complaint) => {
    setAssignTarget(complaint);
    setSelectedWorker('');
    setAssignNotes('');
    setAssignError(null);
  };

  const handleAssign = async () => {
    if (!assignTarget || !selectedWorker) {
      setAssignError('Please select a worker');
      return;
    }
    setAssigning(true);
    setAssignError(null);
    try {
      await apiPost(`/complaints/${assignTarget.id}/assign`, {
        workerId: selectedWorker,
        notes: assignNotes || undefined,
      });
      setAssignTarget(null);
      fetchComplaints();
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (complaint: Complaint, status: string) => {
    try {
      await apiPatch(`/complaints/${complaint.id}/status`, { status });
      fetchComplaints();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = {
      RECEIVED: 'bg-gray-100 text-gray-700', UNDER_REVIEW: 'bg-blue-100 text-blue-700',
      ASSIGNED: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-green-100 text-green-700', CLOSED: 'bg-gray-200 text-gray-600', REOPENED: 'bg-red-100 text-red-700',
    };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (p: string) => {
    const m: Record<string, string> = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-blue-100 text-blue-700', HIGH: 'bg-amber-100 text-amber-700', CRITICAL: 'bg-red-100 text-red-700' };
    return m[p] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Complaints</h1>
          <p className="text-sm text-gray-400 mt-0.5">Assign complaints to field workers and track progress</p>
        </div>
        <div className="flex items-center gap-3">
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
          </select>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('card')} className={`px-3 py-2 text-xs ${viewMode === 'card' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600'}`}>Card</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs ${viewMode === 'list' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600'}`}>List</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center text-gray-400"><div className="text-4xl mb-3">📋</div><p className="text-sm">No complaints found</p></div>
      ) : viewMode === 'card' ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map((c) => {
            const images = (c.attachments || []).filter((a) => a.mimeType?.startsWith('image/'));
            const proofImages = c.resolutionEvidence || [];
            return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
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
              <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span>
                <span className="text-[10px] text-gray-400">{c.complaintNumber}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{c.title}</h3>
              <div className="mt-3 space-y-1 text-xs text-gray-500 flex-1">
                <div>👤 {c.citizen?.firstName} {c.citizen?.lastName}</div>
                <div>🏢 {c.department?.name || 'Unassigned dept'}</div>
                <div>📍 {c.address || c.ward?.name || 'No location'}</div>
                <div>👷 {c.assignedWorker ? `${c.assignedWorker.firstName} ${c.assignedWorker.lastName}` : 'No worker assigned'}</div>
              </div>
              <div className="mt-3 pt-2 border-t flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                  {images.length > 0 && <span>📷 {images.length}</span>}
                  <span>{formatDate(c.createdAt)}</span>
                </div>
              </div>
              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openAssign(c)}
                  className="flex-1 py-2 text-xs font-medium text-white bg-[#7c3aed] rounded-lg hover:bg-[#6d28d9] transition-colors"
                >
                  {c.assignedWorker ? 'Reassign' : 'Assign Worker'}
                </button>
                {c.status === 'ASSIGNED' && (
                  <button onClick={() => handleStatusUpdate(c, 'IN_PROGRESS')} className="px-3 py-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100">Start</button>
                )}
                {c.status === 'IN_PROGRESS' && (
                  <button onClick={() => handleStatusUpdate(c, 'RESOLVED')} className="px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100">Resolve</button>
                )}
              </div>
            </div>
            </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Complaint</th>
                <th className="px-5 py-3 font-medium">Citizen</th>
                <th className="px-5 py-3 font-medium">Worker</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{c.title}</div>
                    <div className="text-[11px] text-gray-400">{c.complaintNumber} • {c.category.replace('_', ' ')}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.citizen?.firstName} {c.citizen?.lastName}</td>
                  <td className="px-5 py-3 text-gray-600">{c.assignedWorker ? `${c.assignedWorker.firstName} ${c.assignedWorker.lastName}` : <span className="text-gray-300">Unassigned</span>}</td>
                  <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3 text-gray-600">{c.priority}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => openAssign(c)} className="text-xs font-medium text-[#7c3aed] hover:underline">
                      {c.assignedWorker ? 'Reassign' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setAssignTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">Assign Worker</h2>
            <p className="text-sm text-gray-500 mt-1">{assignTarget.title}</p>
            <p className="text-xs text-gray-400">{assignTarget.complaintNumber}</p>

            {assignError && <div className="mt-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">{assignError}</div>}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Field Worker</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="">Choose a worker...</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.firstName} {w.lastName} — {w.role}{w.ward ? ` (${w.ward.name})` : ''}
                  </option>
                ))}
              </select>
              {workers.length === 0 && <p className="text-xs text-amber-500 mt-1">No field workers available</p>}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
              <textarea
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                rows={2}
                placeholder="Instructions for the worker..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="flex-1 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-50"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
              <button onClick={() => setAssignTarget(null)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
