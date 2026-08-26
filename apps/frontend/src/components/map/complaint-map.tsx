'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiGet } from '@/lib/api-client';

// Fix default marker icons (they break in bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  zone?: { name: string };
}

// Hyderabad center coordinates
const HYDERABAD_CENTER: [number, number] = [17.385, 78.4867];

const priorityColor: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  CRITICAL: '#ef4444',
};

export default function ComplaintMap() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<any>('/complaints?limit=100')
      .then((data) => setComplaints(data.data || data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const withCoords = complaints.filter((c) => c.latitude && c.longitude);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/60">
          <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <MapContainer
        center={HYDERABAD_CENTER}
        zoom={12}
        scrollWheelZoom
        style={{ height: '600px', width: '100%', borderRadius: '0.75rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((c) => (
          <CircleMarker
            key={c.id}
            center={[c.latitude!, c.longitude!]}
            radius={9}
            pathOptions={{
              color: priorityColor[c.priority] || '#6b7280',
              fillColor: priorityColor[c.priority] || '#6b7280',
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{c.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.complaintNumber}</p>
                <div className="mt-2 space-y-0.5 text-xs">
                  <p><span className="text-gray-400">Category:</span> {c.category?.replace('_', ' ')}</p>
                  <p><span className="text-gray-400">Priority:</span> {c.priority}</p>
                  <p><span className="text-gray-400">Status:</span> {c.status?.replace('_', ' ')}</p>
                  {c.zone && <p><span className="text-gray-400">Zone:</span> {c.zone.name}</p>}
                  {c.address && <p><span className="text-gray-400">Location:</span> {c.address}</p>}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend + count */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-700 mb-2">Priority</p>
        <div className="space-y-1">
          {Object.entries(priorityColor).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 pt-2 border-t text-gray-500">{withCoords.length} located complaints</p>
      </div>
    </div>
  );
}
