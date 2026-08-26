'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { apiPost } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth';

const CATEGORIES = [
  { value: 'GARBAGE', label: 'Garbage / Waste' },
  { value: 'ROAD_DAMAGE', label: 'Road Damage' },
  { value: 'POTHOLES', label: 'Potholes' },
  { value: 'DRAINAGE', label: 'Drainage / Sewage' },
  { value: 'WATER_LEAKAGE', label: 'Water Leakage' },
  { value: 'STREET_LIGHTS', label: 'Street Lights' },
  { value: 'ILLEGAL_DUMPING', label: 'Illegal Dumping' },
  { value: 'PUBLIC_SANITATION', label: 'Public Sanitation' },
  { value: 'PARKS', label: 'Parks & Gardens' },
  { value: 'OTHER', label: 'Other' },
];

interface UploadedFile {
  objectKey: string;
  fileName: string;
  url: string;
  preview?: string;
}

export default function NewComplaintPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    address: '',
    latitude: '',
    longitude: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedFiles.length + files.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const token = getAccessToken();
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

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
      const results: UploadedFile[] = (uploaded.data || uploaded).map((f: any) => ({
        objectKey: f.objectKey,
        fileName: f.fileName,
        url: f.url,
        preview: f.url,
      }));

      // Generate local previews
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const reader = new FileReader();
          const idx = i;
          reader.onload = (e) => {
            setUploadedFiles((prev) =>
              prev.map((f, j) => j === uploadedFiles.length + idx ? { ...f, preview: e.target?.result as string } : f)
            );
          };
          reader.readAsDataURL(files[i]);
        }
      }

      setUploadedFiles((prev) => [...prev, ...results]);
    } catch (err: any) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const body: any = {
        title: form.title,
        description: form.description,
        category: form.category,
      };
      if (form.address) body.address = form.address;
      if (form.latitude) body.latitude = parseFloat(form.latitude);
      if (form.longitude) body.longitude = parseFloat(form.longitude);

      const complaint = await apiPost('/complaints', body);

      // If we have uploaded files, link them to the complaint
      if (uploadedFiles.length > 0 && complaint.id) {
        for (const file of uploadedFiles) {
          try {
            await apiPost('/attachments/confirm-upload', {
              complaintId: complaint.id,
              objectKey: file.objectKey,
              fileName: file.fileName,
              mimeType: 'image/jpeg',
              fileSize: 0,
            });
          } catch {
            // Non-critical, continue
          }
        }
      }

      setSuccess(true);
      setTimeout(() => router.push('/citizen/complaints'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          }));
        },
        () => setError('Unable to get location. Please enter manually.'),
      );
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Complaint Submitted!</h2>
          <p className="text-gray-500">Your complaint has been received and will be reviewed shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">New Complaint</h1>
        <p className="text-sm text-gray-500 mt-1">Report a civic issue in your area</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7c3aed]"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            minLength={5}
            maxLength={200}
            placeholder="Brief description of the issue"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7c3aed]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            minLength={20}
            maxLength={5000}
            rows={5}
            placeholder="Provide detailed information about the issue. Include landmarks, severity, and how long it has been an issue."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7c3aed] resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.length}/5000 characters</p>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Address / Location</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            maxLength={500}
            placeholder="Street, Ward, Area, Landmark"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7c3aed]"
          />
        </div>

        {/* GPS */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">GPS Coordinates</label>
            <button type="button" onClick={getMyLocation} className="text-xs text-[#7c3aed] font-medium hover:underline">
              📍 Use my location
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7c3aed]" />
            <input type="text" name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#7c3aed]" />
          </div>
        </div>

        {/* File Upload - WORKING */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Photos (optional, max 5)</label>
          
          {/* Preview uploaded files */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  {file.preview ? (
                    <img src={file.preview} alt={file.fileName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">PDF</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                    <p className="text-[8px] text-white truncate">{file.fileName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {uploadedFiles.length < 5 && (
            <label className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#7c3aed]/50 transition-colors cursor-pointer block">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-[#7c3aed]">Uploading...</span>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Click to select photos or drag & drop</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, PDF — max 10MB each</p>
                </>
              )}
            </label>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-purple-200"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
