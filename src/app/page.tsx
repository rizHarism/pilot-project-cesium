"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { CctvConfig, ElectricityPointConfig } from '@/config/models';
import ElectricityPanel from '@/components/ElectricityPanel';

const CesiumScene = dynamic(() => import('@/components/CesiumScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-screen bg-slate-950 text-white">
      <div className="text-center">
        <div className="text-4xl mb-4">🌍</div>
        <p className="text-sky-400 font-semibold text-lg">Loading 3D Engine...</p>
        <p className="text-white/60 text-xs mt-1">Digital Twin Kawasan Darungan</p>
      </div>
    </div>
  )
});

export default function Home() {
  const [showOrthophoto, setShowOrthophoto] = useState(true);
  const [showDTM, setShowDTM] = useState(true);
  const [showModels, setShowModels] = useState(true);
  const [orthophotoOpacity, setOrthophotoOpacity] = useState(1);
  const [waterLevel, setWaterLevel] = useState(159.9);
  const [cameraResetTrigger, setCameraResetTrigger] = useState(0);
  const [cctvModal, setCctvModal] = useState<{ open: boolean; cctv: CctvConfig | null }>({ open: false, cctv: null });
  const [elecPanel, setElecPanel] = useState<ElectricityPointConfig | null>(null);

  // Mobile: controls drawer open/close
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── SHARED LAYER CONTROLS CONTENT ─────────────────────────
  // Extracted so it's reusable in both the PC panel and mobile drawer
  const LayerControlsContent = () => (
    <div className="flex flex-col gap-5">
      {/* Toggles */}
      <div className="flex flex-col gap-2.5">
        {[
          { label: 'Orthophoto', checked: showOrthophoto, onChange: setShowOrthophoto, active: true },
          { label: 'DTM (Ground Terrain)', checked: showDTM, onChange: setShowDTM, active: true },
          { label: '3D Objects (GLB)', checked: showModels, onChange: setShowModels, active: true },
          { label: 'LiDAR Point Cloud', checked: false, onChange: () => { }, active: false, pending: true },
        ].map((item) => (
          <label key={item.label} className={`flex items-center gap-2.5 text-xs group ${item.active ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
            <div className={`relative w-4 h-4 rounded flex-shrink-0 border transition-all ${item.checked && item.active ? 'bg-sky-500 border-sky-500' : 'border-slate-600 bg-slate-800'}`}>
              {item.checked && item.active && (
                <svg className="absolute inset-0 m-auto w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <input type="checkbox" className="opacity-0 absolute inset-0 cursor-pointer"
                checked={item.checked} onChange={(e) => item.active && item.onChange(e.target.checked as any)}
                disabled={!item.active} />
            </div>
            <span className={item.active ? 'text-white/90 group-hover:text-white transition' : 'text-white/40'}>
              {item.label}
              {item.pending && <span className="ml-1.5 text-[9px] text-white/40 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 uppercase tracking-wider">Soon</span>}
            </span>
          </label>
        ))}
      </div>

      {/* Orthophoto Opacity */}
      <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-xs">Orthophoto Opacity</span>
          <span className="text-sky-400 text-xs font-bold tabular-nums">{Math.round(orthophotoOpacity * 100)}%</span>
        </div>
        <input type="range" min="0" max="1" step="0.05" value={orthophotoOpacity}
          onChange={(e) => setOrthophotoOpacity(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-400" />
      </div>

      {/* Flood */}
      <div className="flex flex-col gap-2 border-t border-slate-800 pt-4">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-blue-400 text-sm">🌊</span>
          <span className="text-blue-400 font-semibold text-xs tracking-wide uppercase">Flood Simulation</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/70 text-xs">Water Level</span>
          <span className="text-blue-400 text-xs font-bold tabular-nums">{(waterLevel - 159.9).toFixed(2)} m</span>
        </div>
        <input type="range" min="159.9" max="165" step="0.01" value={waterLevel}
          onChange={(e) => setWaterLevel(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-400" />
        <div className="flex justify-between text-[10px] text-white/40 mt-0.5">
          <span>0 m (dry)</span>
          <span>5 m (flood)</span>
        </div>
      </div>

      {/* Reset Camera */}
      <div className="border-t border-slate-800 pt-4">
        <button
          onClick={() => { setCameraResetTrigger(prev => prev + 1); setDrawerOpen(false); }}
          className="w-full bg-sky-600/20 hover:bg-sky-600/40 border border-sky-600/40 hover:border-sky-500/60 text-sky-300 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2"
        >
          <span>⌖</span> Reset Camera
        </button>
      </div>
    </div>
  );

  return (
    <main className="relative w-full h-screen overflow-hidden text-sm font-sans">

      {/* 3D MAP */}
      <CesiumScene
        terrainUrl={process.env.NEXT_PUBLIC_TERRAIN_URL ?? 'http://localhost:8080/data/terrain/darungan/'}
        imageryUrl={process.env.NEXT_PUBLIC_IMAGERY_URL ?? 'http://localhost:8080/data/imagery5/{z}/{x}/{y}.png'}
        showOrthophoto={showOrthophoto}
        orthophotoOpacity={orthophotoOpacity}
        showDTM={showDTM}
        showModels={showModels}
        waterLevel={waterLevel}
        cameraResetTrigger={cameraResetTrigger}
        onCctvClick={(cctv) => setCctvModal({ open: true, cctv })}
        onElectricityClick={(elec) => setElecPanel(elec)}
      />

      {/* ═══════════════════════════════════════════════════ */}
      {/*  DESKTOP / TABLET LAYOUT  (md: 768px+)             */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* ── HEADER (desktop) */}
      <div className="hidden md:block absolute top-4 left-4 w-72 lg:w-80 z-10 pointer-events-auto">
        <div className="bg-slate-950/90 backdrop-blur-xl rounded-xl border border-slate-700/60 shadow-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-transparent" />
          <div className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-base">🌏</div>
              <div>
                <h1 className="font-bold text-base leading-tight bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  Digital Twin Darungan
                </h1>
                <p className="text-white/50 text-[10px] tracking-wide uppercase">Visualisasi 3D Kawasan · Next.js</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LAYER CONTROLS (desktop) */}
      <div className="hidden md:block absolute left-4 z-10 w-72 lg:w-80 pointer-events-auto" style={{ top: '5.5rem' }}>
        <div className="bg-slate-950/90 backdrop-blur-xl rounded-xl border border-slate-700/60 shadow-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-transparent" />
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sky-400 font-semibold text-xs tracking-wider uppercase flex items-center gap-2">
              <span>⬡</span> Layer Controls
            </h3>
          </div>
          <div className="p-4">
            <LayerControlsContent />
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TIPS (desktop only — hidden on mobile/tablet, too small) */}
      <div className="hidden lg:block absolute bottom-10 left-4 z-10 pointer-events-auto">
        <div className="bg-slate-950/80 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-xl overflow-hidden">
          <div className="px-3 py-2.5">
            <p className="text-sky-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>💡</span> Navigation
            </p>
            <ul className="text-[10px] text-white/70 space-y-0.5">
              <li className="flex gap-2"><span className="text-white/40 w-24 flex-shrink-0">Left drag</span><span>Pan view</span></li>
              <li className="flex gap-2"><span className="text-white/40 w-24 flex-shrink-0">Right drag</span><span>Zoom in/out</span></li>
              <li className="flex gap-2"><span className="text-white/40 w-24 flex-shrink-0">Middle drag</span><span>Rotate view</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  MOBILE LAYOUT  (< 768px)                          */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* ── MOBILE HEADER BAR */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-20 pointer-events-auto">
        <div className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🌏</span>
            <h1 className="font-bold text-sm bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Digital Twin Darungan
            </h1>
          </div>
          {/* Hamburger / Close button */}
          <button
            onClick={() => setDrawerOpen(prev => !prev)}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white/70 hover:text-white transition"
          >
            {drawerOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* ── MOBILE BOTTOM DRAWER (slides up when open) */}
      <div
        className={`md:hidden absolute left-0 right-0 bottom-0 z-30 pointer-events-auto transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle */}
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/60 rounded-t-2xl shadow-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-transparent" />
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-600" />
          </div>
          {/* Section header */}
          <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sky-400 font-semibold text-xs tracking-wider uppercase flex items-center gap-2">
              <span>⬡</span> Layer Controls
            </h3>
            <button onClick={() => setDrawerOpen(false)} className="text-white/50 hover:text-white text-xs transition">Close</button>
          </div>
          {/* Scrollable controls */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            <LayerControlsContent />
          </div>
        </div>
      </div>

      {/* Backdrop overlay when drawer open on mobile */}
      {drawerOpen && (
        <div
          className="md:hidden absolute inset-0 z-20 bg-black/40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/*  CCTV MODAL (all screens)                          */}
      {/* ═══════════════════════════════════════════════════ */}
      {cctvModal.open && cctvModal.cctv && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-3"
          onClick={() => setCctvModal({ open: false, cctv: null })}
        >
          <div
            className="relative bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-transparent" />
            <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-sm">📷</div>
                <div>
                  <p className="text-white font-semibold text-sm">{cctvModal.cctv.label}</p>
                  <p className="text-white/60 text-xs flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE (Simulation)
                  </p>
                </div>
              </div>
              <button onClick={() => setCctvModal({ open: false, cctv: null })}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white/60 hover:text-white flex items-center justify-center text-sm transition">✕</button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe className="w-full h-full"
                src={`https://www.youtube.com/embed/${cctvModal.cctv.youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1`}
                title="CCTV Simulation" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen />
            </div>
            <div className="px-4 md:px-5 py-3 border-t border-slate-800 flex justify-between items-center">
              <p className="text-white/50 text-xs font-mono hidden sm:block">
                📍 {cctvModal.cctv.latitude.toFixed(5)}, {cctvModal.cctv.longitude.toFixed(5)}
              </p>
              <button onClick={() => setCctvModal({ open: false, cctv: null })}
                className="ml-auto bg-red-600/15 hover:bg-red-600/30 border border-red-600/30 text-red-300 text-xs px-3 py-1.5 rounded-lg transition">
                Close Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/*  ELECTRICITY PANEL (responsive width)              */}
      {/* ═══════════════════════════════════════════════════ */}
      {elecPanel && (
        <ElectricityPanel data={elecPanel} onClose={() => setElecPanel(null)} />
      )}

    </main>
  );
}
