"use client";

import { useEffect, useRef, useState } from "react";
import { ElectricityPointConfig } from "@/config/models";

interface ElectricityPanelProps {
    data: ElectricityPointConfig;
    onClose: () => void;
}

export default function ElectricityPanel({ data, onClose }: ElectricityPanelProps) {
    const [liveKwh, setLiveKwh] = useState(data.powerKw);
    const [liveAmps, setLiveAmps] = useState(data.currentA);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Simulate live sensor fluctuation
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveKwh(data.powerKw + (Math.random() - 0.5) * 0.4);
            setLiveAmps(data.currentA + (Math.random() - 0.5) * 1.2);
        }, 1500);
        return () => clearInterval(interval);
    }, [data]);

    // Draw bar chart
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;
        const pad = { top: 20, bottom: 30, left: 35, right: 10 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const maxKwh = Math.max(...data.dailyUsage.map((d) => d.kwh)) * 1.2;
        const barW = chartW / data.dailyUsage.length - 3;

        // Grid lines
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH / 4) * i;
            ctx.strokeStyle = "rgba(148,163,184,0.08)"; // slate-400/8%
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
            ctx.fillStyle = "rgba(255, 255, 255, 0.87)";
            ctx.font = "10px sans-serif";
            ctx.fillText((maxKwh - (maxKwh / 4) * i).toFixed(1), 0, y + 3);
        }

        // Bars
        data.dailyUsage.forEach((entry, idx) => {
            const x = pad.left + idx * (chartW / data.dailyUsage.length) + 2;
            const barH = (entry.kwh / maxKwh) * chartH;
            const y = pad.top + chartH - barH;
            const isPeak = entry.kwh >= maxKwh * 0.75;

            const gradient = ctx.createLinearGradient(x, y, x, y + barH);
            if (isPeak) {
                // Amber for peak — matches electricity theme
                gradient.addColorStop(0, "rgba(251, 191, 36, 0.95)");
                gradient.addColorStop(1, "rgba(245, 158, 11, 0.4)");
            } else {
                // Sky-blue for normal — matches app controls
                gradient.addColorStop(0, "rgba(56, 189, 248, 0.85)");
                gradient.addColorStop(1, "rgba(14, 165, 233, 0.3)");
            }
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barW, barH, 2);
            ctx.fill();

            if (idx % 2 === 0) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.87)";
                ctx.font = "10px sans-serif";
                ctx.fillText(entry.hour, x - 2, H - 4);
            }
        });
    }, [data]);

    const statusStyles = {
        normal: { badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", dot: "bg-emerald-400", label: "✅ Normal" },
        warning: { badge: "text-amber-400 bg-amber-500/10 border-amber-500/25", dot: "bg-amber-400", label: "⚠️ Anomali Terdeteksi" },
        critical: { badge: "text-red-400 bg-red-500/10 border-red-500/25", dot: "bg-red-400", label: "🚨 Kritis!" },
    }[data.status];

    const totalKwh = data.dailyUsage.reduce((s, d) => s + d.kwh, 0).toFixed(1);
    const progressPct = Math.min((liveKwh / 10) * 100, 100);
    const progressColor = liveKwh > 7 ? '#ef4444' : liveKwh > 5 ? '#f59e0b' : '#34d399';

    return (
        <div
            className="absolute top-0 right-0 h-full z-40 pointer-events-auto"
            style={{ animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)" }}
        >
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0); opacity: 1; }
                }
                @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
            `}</style>

            <div className="w-full md:w-80 h-full bg-slate-950/95 border-l border-slate-700/60 backdrop-blur-xl flex flex-col shadow-2xl">

                {/* Amber accent bar */}
                <div className="h-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-transparent flex-shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-base">⚡</div>
                        <div>
                            <p className="text-white font-semibold text-sm leading-tight">Monitoring Listrik</p>
                            <p className="text-white/60 text-[10px]">{data.buildingName}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white/60 hover:text-white flex items-center justify-center text-sm transition">
                        ✕
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">

                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${statusStyles.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusStyles.dot} ${data.status !== 'normal' ? 'pulse-slow' : ''}`} />
                        <span>{statusStyles.label}</span>
                        {data.status === 'warning' && (
                            <span className="ml-auto text-amber-300/70 text-[9px] font-normal">Konsumsi melebihi rata-rata</span>
                        )}
                    </div>

                    {/* Sensor Cards: Tegangan / Arus / Daya */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-700/50">
                            <p className="text-[10px] text-white/70 mb-1">Tegangan</p>
                            <p className="text-sky-400 font-bold text-base">{data.voltageV}</p>
                            <p className="text-[9px] text-white/50 mt-0.5">Volt</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-700/50">
                            <p className="text-[10px] text-white/70 mb-1">Arus</p>
                            <p className="text-amber-400 font-bold text-base">{liveAmps.toFixed(1)}</p>
                            <p className="text-[9px] text-white/50 mt-0.5">Ampere</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-700/50">
                            <p className="text-[10px] text-white/70 mb-1">Daya</p>
                            <p className="text-amber-300 font-bold text-base">{liveKwh.toFixed(2)}</p>
                            <p className="text-[9px] text-white/50 mt-0.5">kW</p>
                        </div>
                    </div>

                    {/* Live Power Bar */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/70">Konsumsi Realtime</span>
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                <span className="pulse-slow w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                LIVE
                            </span>
                        </div>
                        <div className="flex items-end gap-1.5 mb-3">
                            <span className="text-3xl font-bold text-white tabular-nums">{liveKwh.toFixed(2)}</span>
                            <span className="text-white/60 text-sm mb-1">kW</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${progressPct}%`, background: progressColor }} />
                        </div>
                        <div className="flex justify-between mt-1.5">
                            <span className="text-[10px] text-white/40">0 kW</span>
                            <span className="text-[10px] text-white/40">Max 10 kW</span>
                        </div>
                    </div>

                    {/* Daily Usage Chart */}
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-white/90">Konsumsi Harian</p>
                            <div className="flex items-center gap-2.5 text-[9px] text-white/60">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-sm bg-sky-400 inline-block" />Normal
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />Peak
                                </span>
                            </div>
                        </div>
                        <canvas ref={canvasRef} width={280} height={130} className="w-full" />
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <p className="text-[10px] text-white/70 mb-1">Total Hari Ini</p>
                            <p className="text-white font-bold text-lg tabular-nums">
                                {totalKwh}<span className="text-[10px] text-white/60 font-normal ml-1">kWh</span>
                            </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                            <p className="text-[10px] text-white/70 mb-1">Est. Biaya</p>
                            <p className="text-amber-400 font-bold text-sm tabular-nums">
                                Rp {(parseFloat(totalKwh) * 1445).toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    {/* IoT Metadata */}
                    <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800/80 text-[10px] text-white/50 flex flex-col gap-1.5">
                        <div className="flex justify-between">
                            <span>Sensor ID</span>
                            <span className="text-white/80 font-mono">{data.id.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Protokol</span>
                            <span className="text-white/80">MQTT / Simulated</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Update Interval</span>
                            <span className="text-white/80">1.5 detik</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Koordinat</span>
                            <span className="text-white/80 font-mono">{data.latitude.toFixed(5)}, {data.longitude.toFixed(5)}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
