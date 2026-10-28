import React from 'react';
import { Shield, Cpu, Radio, Lock, Zap, CheckCircle2, Award, Terminal, Heart, Users } from 'lucide-react';

export const AboutTeamPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* 1. TEAM HEADER WITH ORIGINAL UNTOUCHED LOGO.JPEG */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-950 border border-indigo-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
          {/* ORIGINAL LOGO.JPEG DISPLAY (STRICT UNALTERED ASPECT RATIO) */}
          <div className="p-3 bg-slate-950/90 border border-indigo-500/40 rounded-2xl shadow-xl flex items-center justify-center shrink-0">
            <img
              src="/logo.jpeg"
              alt="GARUDA TANDAV CYBER RAKSHA - GTCR TECH NEXUS Logo"
              className="h-20 sm:h-24 w-auto object-contain rounded-xl"
            />
          </div>

          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-xs font-mono text-cyan-300">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>CODE STORM Mini Hackathon — Innovation Ignite Symposium 2026</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              GARUDA TANDAV CYBER RAKSHA
            </h1>
            <p className="text-sm font-semibold text-cyan-400">
              Technology & Innovation Wing: <span className="text-indigo-300 font-extrabold">GTCR TECH NEXUS</span>
            </p>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Pioneering smart wearable public-safety technology and real-time telemetry alert networks to protect women and vulnerable individuals across communities.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ABOUT SAFELYNK PRODUCT VISION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Product Vision</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            SAFELYNK is a wearable-assisted personal safety system combining physical ESP32 microcontrollers, predictive pulse and motion analytics, and real-time trusted contact dispatch.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Embedded IoT Hardware</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Integrates MPU6050 6-axis accelerometer, MAX30102 PPG heart rate module, and a physical 2.5-second long-press panic button wired directly to an ESP32 board.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-950 border border-violet-800 text-violet-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Supabase RLS & Cloud</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Database security powered by Row Level Security (RLS) policies, PostgreSQL trigger functions, and Supabase Edge Functions for authenticated emergency alert dispatch.
          </p>
        </div>
      </div>

      {/* 3. HARDWARE & ARCHITECTURE SPECIFICATIONS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span>System Architecture & Verification Checklist</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3 text-xs text-slate-300">
            <h4 className="text-sm font-semibold text-white">Hardware & Ingestion Stack</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ESP32 Wi-Fi & USB-C Development Board</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MPU6050 Accelerometer (G-force fall vectors)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MAX30102 PPG Heart Rate Pulse Oximeter Module</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>2.5s Tactile Button Long-Press Interrupt Debounce</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <h4 className="text-sm font-semibold text-white">Database & Security Stack</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Supabase PostgreSQL Schema & RLS Policies</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Supabase Edge Functions (<code className="text-indigo-300 font-mono">send-sos-alert</code> & <code className="text-indigo-300 font-mono">ingest-device-data</code>)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Bearer Token Device Authentication (<code className="text-indigo-300 font-mono">tok_esp32_safelynk_prod_8842</code>)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>GPS Coordinates Radar & Google Maps Directions Integration</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. FOOTER CREDITS WITH TEAM LOGO */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="GTCR Logo" className="h-10 w-auto object-contain" />
          <div>
            <p className="text-xs font-bold text-white">GARUDA TANDAV CYBER RAKSHA</p>
            <p className="text-[10px] text-slate-400">GTCR TECH NEXUS · CODE STORM 2026</p>
          </div>
        </div>
        <span className="text-xs font-mono text-cyan-400">SAFELYNK Prototype v1.0.4</span>
      </div>
    </div>
  );
};
