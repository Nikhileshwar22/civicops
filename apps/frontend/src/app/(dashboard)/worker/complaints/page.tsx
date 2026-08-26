'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth';

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
  resolution?: string;
  resolutionEvidence?: string[];
}

interface UploadedProof {
  objectKey: string;
  fileName: string;
  url: string;
  preview?: string;
}

export default function WorkerComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  // Resolve modal
  const [resolveTarget, setResolveTarget] = useState<Complaint | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [proofFiles, setProofFiles] = useState<UploadedProof[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchComplaints = () => {
    setLoading(true);
    apiGet<any>('/complaints?limit=100&sortOrder=desc')
      .then((data) => setComplaints(data.data || data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchComplaints(); }, []);

  const activeComplaints = complaints.filter((c) => ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(c.status));
  const completedComplaints = complaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status));
  const shown = tab === 'active' ? activeComplaints : completedComplaints;

  const startWork = async (c: Complaint) => {
    try {
      await apiPatch(`/complaints/${c.id}/status`, { status: 'IN_PROGRESS' });
      fetchComplaints();
    } catch (err) { console.error(err); }
  };

  const openResolve = (c: Complaint) => {
    setResolveTarget(c);
    setResolutionText('');
    setProofFiles([]);
    setModalError(null);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (proofFiles.length + files.length > 5) {
      setModalError('Maximum 5 proof images');
      return;
    }
    setUploading(true);
    setModalError(null);
    try {
      const token = getAccessToken();
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append('files', files[i]);

      const res = await fetch('/api/v1/attachments/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload failed');
      }
      const uploaded = await res.json();
      const results: UploadedProof[] = (uploaded.data || uploaded).map((f: any) => ({
        objectKey: f.objectKey, fileName: f.fileName, url: f.url, preview: f.url,
      }));

      // local previews
      const startIdx = proofFiles.length;
      Array.from(files).forEach((file, i) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setProofFiles((prev) => prev.map((p, j) => j === startIdx + i ? { ...p, preview: ev.target?.result as string } : p));
          };
          reader.readAsDataURL(file);
        }
      });

      setProofFiles((prev) => [...prev, ...results]);
    } catch (err: any) {
      setModalError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submitResolution = async () => {
    if (!resolveTarget) return;
    if (resolutionText.trim().length < 10) {
      setModalError('Resolution must be at least 10 characters');
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      await apiPost(`/complaints/${resolveTarget.id}/resolve`, {
        resolution: resolutionText,
        resolutionEvidence: proofFiles.map((p) => p.url),
      });
      setResolveTarget(null);
      fetchComplaints();
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit resolution');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (p: string) => {
    const m: Record<string, string> = { LOW: 'border-green-400', MEDIUM: 'border-blue-400', HIGH: 'border-amber-400', CRITICAL: 'border-red-400' };
    return m[p] || 'border-gray-300';
  };
  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { ASSIGNED: 'bg-purple-100 text-purple-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', RESOLVED: 'bg-green-100 text-green-700', CLOSED: 'bg-gray-200 text-gray-600', REOPENED: 'bg-red-100 text-red-700' };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-400 mt-0.5">Issues assigned to you — resolve them with photo proof</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('active')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'active' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Active ({activeComplaints.length})
        </button>
        <button onClick={() => setTab('completed')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'completed' ? 'bg-[#7c3aed] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          Completed ({completedComplaints.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" /></div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center text-gray-400"><div className="text-4xl mb-3">✅</div><p className="text-sm">No {tab} tasks</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((c) => (
            <div key={c.id} className={`bg-white rounded-xl border-t-4 ${getPriorityColor(c.priority)} border shadow-sm p-5 flex flex-col`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status.replace('_', ' ')}</span>
                <span className="text-[10px] text-gray-400">{c.complaintNumber}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">{c.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
              <div className="mt-3 space-y-1 text-xs text-gray-500 flex-1">
                <div>👤 {c.citizen?.firstName} {c.citizen?.lastName}</div>
                <div>📍 {c.address || c.ward?.name || 'No location'}</div>
                <div>🏢 {c.department?.name || '—'}</div>
              </div>

              {/* Resolution proof (completed) */}
              {c.status === 'RESOLVED' && c.resolutionEvidence && c.resolutionEvidence.length > 0 && (
                <div className="mt-3 flex gap-1.5">
                  {c.resolutionEvidence.slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt="proof" className="w-10 h-10 rounded object-cover border" />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {c.status === 'ASSIGNED' && (
                  <button onClick={() => startWork(c)} className="flex-1 py-2 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600">Start Work</button>
                )}
                {(c.status === 'IN_PROGRESS' || c.status === 'REOPENED') && (
                  <button onClick={() => openResolve(c)} className="flex-1 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Resolve with Proof</button>
                )}
                {(c.status === 'RESOLVED' || c.status === 'CLOSED') && (
                  <span className="flex-1 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg text-center">✓ Completed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {resolveTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setResolveTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">Resolve Complaint</h2>
            <p className="text-sm text-gray-500 mt-0.5">{resolveTarget.title}</p>
            <p className="text-xs text-gray-400">{resolveTarget.complaintNumber}</p>

            {modalError && <div className="mt-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">{modalError}</div>}

            {/* Resolution notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Resolution Details *</label>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={4}
                placeholder="Describe what was done to resolve this issue..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
            </div>

            {/* Proof images */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Proof Images (resolution evidence)</label>
              {proofFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {proofFiles.map((f, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                      {f.preview ? <img src={f.preview} alt={f.fileName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">File</div>}
                      <button onClick={() => setProofFiles((prev) => prev.filter((_, i) => i !== idx))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">×</button>
                    </div>
                  ))}
                </div>
              )}
              {proofFiles.length < 5 && (
                <label className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center hover:border-green-400 cursor-pointer block">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleProofUpload} className="hidden" disabled={uploading} />
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /><span className="text-sm text-green-600">Uploading...</span></div>
                  ) : (
                    <><p className="text-sm text-gray-500">📷 Click to add proof photos</p><p className="text-xs text-gray-400 mt-0.5">JPG, PNG — before/after resolution</p></>
                  )}
                </label>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={submitResolution} disabled={submitting} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Mark as Resolved'}
              </button>
              <button onClick={() => setResolveTarget(null)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
