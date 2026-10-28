import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, ShieldAlert, RefreshCw, Layers, Compass, Copy, Check } from 'lucide-react';

interface InteractiveMapProps {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  addressNotes?: string;
  sourceText?: string;
  isEmergency?: boolean;
  onRefreshLocation?: () => void;
  isRefreshing?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude,
  longitude,
  accuracy = 12,
  addressNotes = 'GPS Live Fix',
  sourceText,
  isEmergency = false,
  onRefreshLocation,
  isRefreshing = false
}) => {
  const [mapView, setMapView] = useState<'street' | 'radar'>('street');
  const [zoomDelta, setZoomDelta] = useState<number>(0.004); // Default street zoom bounding box delta
  const [copiedCoords, setCopiedCoords] = useState(false);

  if (!latitude || !longitude) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 flex flex-col items-center justify-center min-h-[260px]">
        <MapPin className="w-10 h-10 text-cyan-500 mb-2 animate-bounce" />
        <p className="text-sm font-semibold text-slate-200">Acquiring Real-Time GPS Satellite Fix...</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Please allow browser location permissions when prompted to lock onto your exact live coordinates.
        </p>
        {onRefreshLocation && (
          <button
            onClick={onRefreshLocation}
            disabled={isRefreshing}
            className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Locating...' : 'Retry GPS Fix'}</span>
          </button>
        )}
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  // Bounding box for OpenStreetMap embedded live view
  const bbox = `${longitude - zoomDelta},${latitude - zoomDelta},${longitude + zoomDelta},${latitude + zoomDelta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all shadow-xl ${
      isEmergency ? 'bg-red-950/20 border-red-700/80' : 'bg-slate-900/90 border-slate-800'
    }`}>
      {/* Top Map Action Toolbar */}
      <div className="p-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 z-20 relative">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isEmergency ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'}`}>
            {isEmergency ? <ShieldAlert className="w-4 h-4 animate-pulse" /> : <Navigation className="w-4 h-4 animate-spin-slow" />}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
              {sourceText || (isEmergency ? 'EMERGENCY GPS FIX' : 'REAL-TIME GPS ENGINE')}
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {latitude.toFixed(5)}°, {longitude.toFixed(5)}°
            </span>
          </div>
        </div>

        {/* View Switcher & Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setMapView('street')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                mapView === 'street' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Street Map
            </button>
            <button
              onClick={() => setMapView('radar')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                mapView === 'radar' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Radar View
            </button>
          </div>

          {mapView === 'street' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs font-mono">
              <button
                onClick={() => setZoomDelta(prev => Math.max(0.001, prev / 1.6))}
                title="Zoom In"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 font-bold"
              >
                +
              </button>
              <button
                onClick={() => setZoomDelta(prev => Math.min(0.05, prev * 1.6))}
                title="Zoom Out"
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 font-bold"
              >
                -
              </button>
            </div>
          )}

          {onRefreshLocation && (
            <button
              onClick={onRefreshLocation}
              disabled={isRefreshing}
              title="Locate Me / Re-acquire GPS"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Locating...' : 'Locate Me'}</span>
            </button>
          )}

          <button
            onClick={copyCoordinates}
            title="Copy Coordinates"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
          >
            {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Map View Area */}
      <div className="relative h-64 sm:h-72 w-full bg-[#080D1A] overflow-hidden">
        {mapView === 'street' ? (
          /* Real OpenStreetMap Live Street Tiles with exact pin */
          <div className="relative w-full h-full">
            <iframe
              title="Live Real-Time GPS Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={osmEmbedUrl}
              className="w-full h-full filter saturate-[0.85] contrast-[1.1] opacity-90"
              loading="lazy"
            />
            {/* Live Crosshair Center Pin Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className={`w-10 h-10 rounded-full animate-ping opacity-75 ${isEmergency ? 'bg-red-500/50' : 'bg-cyan-500/40'}`}></div>
                <div className={`w-6 h-6 rounded-full shadow-2xl flex items-center justify-center border-2 border-white ${
                  isEmergency ? 'bg-red-600 text-white' : 'bg-cyan-500 text-slate-950'
                }`}>
                  <MapPin className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Tactical Dark Radar Mode */
          <div className="relative h-full w-full flex items-center justify-center bg-[#070B14]">
            <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            <div className="absolute w-56 h-56 rounded-full border border-cyan-500/10"></div>
            <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20"></div>
            <div className="absolute w-20 h-20 rounded-full border border-cyan-500/30"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <div className={`absolute w-14 h-14 rounded-full animate-ping ${isEmergency ? 'bg-red-500/40' : 'bg-cyan-500/30'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xl ${
                  isEmergency ? 'bg-red-600 text-white' : 'bg-cyan-500 text-slate-950'
                }`}>
                  {isEmergency ? <ShieldAlert className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
                </div>
              </div>

              <div className="mt-3 px-3 py-1 rounded-full bg-slate-950/95 border border-slate-700 text-xs font-mono text-cyan-300 shadow-xl">
                {latitude.toFixed(6)}°, {longitude.toFixed(6)}°
              </div>
            </div>
          </div>
        )}

        {/* Live Accuracy Badge */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 backdrop-blur-md shadow-lg pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Accuracy: ±{accuracy || 12}m</span>
        </div>
      </div>

      {/* Footer Address & Directions Action */}
      <div className="p-4 bg-slate-950/95 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Detected Street Location:</span>
          </p>
          <p className="text-xs sm:text-sm font-bold text-white truncate mt-0.5" title={addressNotes}>
            {addressNotes}
          </p>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
            isEmergency
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/50'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/50'
          }`}
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
