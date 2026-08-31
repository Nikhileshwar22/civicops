'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api-client';

interface Attachment {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
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
  assignedOfficer?: { firstName: string; lastName: string };
  ward?: { name: string; number: number };
  attachments?: Attachment[];
  resolutionEvidence?: string[];
}

export default function CitizenComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState<any>(null);
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const fetchComplaints = async (status?: string, q?: string) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: '20' });
      if (status) p.set('status', status);
      if (q) p.set('search', q);
      const data = await apiGet<any>(`/complaints?${p.toString()}`);
      setComplaints(data.data || data || []);
      setMeta(data.meta || null);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(statusFilter || undefined, search || undefined);
  }, [statusFilter, search]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RECEIVED: 'bg-gray-100 text-gray-700', UNDER_REVIEW: 'bg-blue-100 text-blue-700',
      ASSIGNED: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-green-100 text-green-700', CLOSED: 'bg-gray-200 text-gray-600', REOPENED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-amber-100 text-amber-700', CRITICAL: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = { LOW: 'bg-green-500', MEDIUM: 'bg-blue-500', HIGH: 'bg-amber-500', CRITICAL: 'bg-red-500' };
    return colors[priority] || 'bg-gray-500';
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {search ? `Results for "${search}" — ` : ''}{meta?.total || complaints.length} complaints
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200">
            <option value="">All Status</option>
            <option value="RECEIVED">Received</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-xs ${viewMode === 'grid' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600'}`}>Grid</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs ${viewMode === 'list' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600'}`}>List</button>
          </div>
          <Link href="/citizen/complaints/new" className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6d28d9] shadow-md shadow-purple-200">
            + New Complaint
          </Link>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900">{search ? `No results for "${search}"` : 'No complaints found'}</h3>
          <p className="text-sm text-gray-400 mt-1">Report your first civic issue to get started</p>
          <Link href="/citizen/complaints/new" className="inline-block mt-4 bg-[#7c3aed] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#6d28d9]">Create Complaint</Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {complaints.map((c) => {
            const images = (c.attachments || []).filter((a) => a.mimeType?.startsWith('image/'));
            const proofImages = c.resolutionEvidence || [];
            return (
              <Link key={c.id} href={`/citizen/complaints/${c.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                {/* Complaint image strip */}
                {images.length > 0 && (
                  <div className="flex gap-0.5 h-28 overflow-hidden">
                    {images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img.url} alt={img.fileName} className={`object-cover ${images.length === 1 ? 'w-full' : images.length === 2 ? 'w-1/2' : 'w-1/3'}`} />
                    ))}
                  </div>
                )}
                {/* Resolution proof strip (if resolved) */}
                {proofImages.length > 0 && (
                  <div className="flex gap-0.5 h-20 overflow-hidden">
                    {proofImages.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt="resolution proof" className={`object-cover ${proofImages.length === 1 ? 'w-full' : proofImages.length === 2 ? 'w-1/2' : 'w-1/3'}`} />
                    ))}
                    {proofImages.length > 0 && (
                      <div className="absolute top-1 right-1 bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded-full">Resolved</div>
                    )}
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${getPriorityDot(c.priority)}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{c.title}</h3>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between"><span>ID</span><span className="font-medium text-gray-700">{c.complaintNumber}</span></div>
                    <div className="flex justify-between"><span>Category</span><span className="font-medium text-gray-700">{c.category.replace('_', ' ')}</span></div>
                    {c.department && <div className="flex justify-between"><span>Dept</span><span className="font-medium text-gray-700">{c.department.name}</span></div>}
                    <div className="flex justify-between"><span>Filed</span><span className="font-medium text-gray-700">{formatDate(c.createdAt)}</span></div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                    {images.length > 0 && <span className="text-[10px] text-gray-400">📷 {images.length} photo{images.length > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Complaint</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Photos</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {complaints.map((c) => {
                const images = (c.attachments || []).filter((a) => a.mimeType?.startsWith('image/'));
                return (
                  <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/citizen/complaints/${c.id}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {images[0] && <img src={images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                        <div><div className="font-medium text-gray-900">{c.title}</div><div className="text-[11px] text-gray-400">{c.complaintNumber}</div></div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.category.replace('_', ' ')}</td>
                    <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span></td>
                    <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityColor(c.priority)}`}>{c.priority}</span></td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{images.length > 0 ? `📷 ${images.length}` : '—'}</td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


export default function CitizenComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState<any>(null);

  const fetchComplaints = async (status?: string) => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}&limit=20` : '?limit=20';
      const data = await apiGet<any>(`/complaints${params}`);
      setComplaints(data.data || data || []);
      setMeta(data.meta || null);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(statusFilter || undefined);
  }, [statusFilter]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      RECEIVED: 'bg-gray-100 text-gray-700',
      UNDER_REVIEW: 'bg-blue-100 text-blue-700',
      ASSIGNED: 'bg-purple-100 text-purple-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-200 text-gray-600',
      REOPENED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-amber-100 text-amber-700',
      CRITICAL: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-500',
      MEDIUM: 'bg-blue-500',
      HIGH: 'bg-amber-500',
      CRITICAL: 'bg-red-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-sm text-gray-400 mt-0.5">{meta?.total || complaints.length} complaints</p>
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
            <option value="CLOSED">Closed</option>
          </select>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-xs ${viewMode === 'grid' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600'}`}>Grid</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs ${viewMode === 'list' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600'}`}>List</button>
          </div>
          <Link href="/citizen/complaints/new" className="bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6d28d9] shadow-md shadow-purple-200">
            + New Complaint
          </Link>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900">No complaints found</h3>
          <p className="text-sm text-gray-400 mt-1">Report your first civic issue to get started</p>
          <Link href="/citizen/complaints/new" className="inline-block mt-4 bg-[#7c3aed] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#6d28d9]">
            Create Complaint
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {complaints.map((c) => (
            <Link key={c.id} href={`/citizen/complaints/${c.id}`} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${getPriorityDot(c.priority)}`} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{c.title}</h3>
              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                <div className="flex justify-between"><span>ID</span><span className="font-medium text-gray-700">{c.complaintNumber}</span></div>
                <div className="flex justify-between"><span>Category</span><span className="font-medium text-gray-700">{c.category.replace('_', ' ')}</span></div>
                {c.department && <div className="flex justify-between"><span>Dept</span><span className="font-medium text-gray-700">{c.department.name}</span></div>}
                <div className="flex justify-between"><span>Filed</span><span className="font-medium text-gray-700">{formatDate(c.createdAt)}</span></div>
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getPriorityColor(c.priority)}`}>{c.priority}</span>
              </div>
              {c.assignedOfficer && (
                <div className="mt-3 pt-3 border-t flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-[#7c3aed]">{c.assignedOfficer.firstName[0]}{c.assignedOfficer.lastName[0]}</span>
                  </div>
                  <span className="text-xs text-gray-600">{c.assignedOfficer.firstName} {c.assignedOfficer.lastName}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 text-xs text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Complaint</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/citizen/complaints/${c.id}`}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">{c.title}</div>
                    <div className="text-[11px] text-gray-400">{c.complaintNumber}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c.category.replace('_', ' ')}</td>
                  <td className="px-5 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span></td>
                  <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 text-xs`}><span className={`w-2 h-2 rounded-full ${getPriorityDot(c.priority)}`} />{c.priority}</span></td>
                  <td className="px-5 py-3 text-gray-400">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
