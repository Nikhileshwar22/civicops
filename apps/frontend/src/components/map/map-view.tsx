'use client';

import dynamic from 'next/dynamic';

// Leaflet needs the browser window, so load the map client-side only
const ComplaintMap = dynamic(() => import('./complaint-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full rounded-xl bg-gray-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export function MapView({ title = 'Map View', subtitle = 'Complaint locations across the city' }: { title?: string; subtitle?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
        <ComplaintMap />
      </div>
    </div>
  );
}
