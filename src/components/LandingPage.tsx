import React from 'react';
import {
  Shield,
  Activity,
  Radio,
  Cpu,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  MapPin,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onStartWearer: () => void;
  onStartParent: () => void;
  onStartAdmin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartWearer,
  onStartParent,
  onStartAdmin
}) => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col justify-between">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Glow Effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 right-10 w-72 h-72 bg-violet-600/15 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/50 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-xl">
            <img src="/logo.jpeg" alt="GTCR Logo" className="h-6 w-auto object-contain rounded" />
            <span>GARUDA TANDAV CYBER RAKSHA · GTCR TECH NEXUS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] text-balance">
            Your Safety. Connected.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
              Always.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            SAFELYNK unites physical ESP32 wearable hardware, predictive motion and pulse biometric sensors, instant GPS geolocation, and real-time trusted-contact alert networks into one unified protection system.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartWearer}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-950/60 transition-all flex items-center gap-2 group"
            >
              <span>Launch Wearer Safety Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onStartParent}
              className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm backdrop-blur-md transition-all flex items-center gap-2"
            >
              <span>Parent / Contact Dashboard</span>
            </button>
          </div>
        </div>

        {/* Hero Interactive Wearable & Device Diagram */}
        <div className="mt-16 relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Box 1: ESP32 Hardware Module Card */}
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ONLINE
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">ESP32 Hardware Band</h4>
                  <p className="text-xs text-slate-400 mt-1">MPU6050 Motion + MAX30102 PPG + Physical Long-Press SOS Button</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Device ID: ESP32-SL-8842</span>
                  <span className="text-indigo-400">Battery 88%</span>
                </div>
              </div>

              {/* Box 2: Visual Center Indicator */}
              <div className="flex flex-col items-center text-center p-4">
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-900/50 via-indigo-600/30 to-teal-500/20 border border-indigo-500/40 flex items-center justify-center shadow-2xl mb-3">
                  <div className="w-20 h-20 rounded-full bg-slate-950 border border-indigo-500/60 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Shield className="w-10 h-10 fill-indigo-500/20" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-slate-950"></div>
                </div>
                <span className="text-xs font-semibold text-slate-200">2.5s Hold SOS Trigger</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Encrypted HTTPS Gateway</span>
              </div>

              {/* Box 3: Parent & Emergency Cloud */}
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between h-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-violet-950/80 border border-violet-800 text-violet-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-indigo-300">REALTIME SYNC</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Trusted Network Dispatch</h4>
                  <p className="text-xs text-slate-400 mt-1">Email, Browser Push & Live Map GPS Coordinates Broadcast</p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Contacts: 2 Active</span>
                  <span className="text-emerald-400">Audited</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How SAFELYNK Protects</h2>
          <p className="text-sm text-slate-400 mt-2">End-to-end protective workflows combining smart automation and explicit human control.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-white">Continuous Monitoring</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                ESP32 samples motion acceleration and pulse metrics. Data is encrypted and validated before reaching the cloud.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-white">Predictive Safety Check</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sudden G-force spikes or elevated pulse triggers a 45s "Are You Safe?" countdown prompt on the wearer's phone.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-white">Physical & Web SOS</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Pressing the physical button for 2.5s or holding the web SOS button immediately triggers an un-cancelable alarm.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-white">Instant Contact Dispatch</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Trusted contacts receive email notifications, live GPS coordinates, and real-time location directions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HARDWARE & PRIVACY SPECS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/60">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Zap className="w-4 h-4" /> Hardware Specifications
              </div>
              <h3 className="text-xl font-extrabold text-white">Arduino IDE & ESP32 Integration</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Engineered for embedded microcontrollers. Firmware C++ source code is provided in the <code className="text-indigo-300 font-mono">/firmware</code> directory.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>MPU6050 Motion Sensor:</strong> Real-time 6-axis acceleration sampling for fall and drop detection.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>MAX30102 PPG Sensor:</strong> Optical pulse sensor with noise filtering.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Hardware Interrupt Panic Button:</strong> Non-blocking 2.5s long-press debounce for true standalone safety.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Firmware: v1.0.4-esp32</span>
              <button
                onClick={onStartAdmin}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>View Admin & Telemetry Stream</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Lock className="w-4 h-4" /> Privacy & Security Architecture
              </div>
              <h3 className="text-xl font-extrabold text-white">Row Level Security & Token Authorization</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Wearer safety data and location coordinates are protected by Supabase Row Level Security (RLS) policies.
              </p>

              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Explicit Contact Relationships:</strong> Only explicitly authorized trusted contacts can view wearer status.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>No Unencrypted Key Leakage:</strong> Service role keys are kept strictly on the backend.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Audited Emergency Logs:</strong> Provider responses and email timestamps are recorded for auditability.</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Location Access: Permission Based</span>
              <span className="text-xs font-mono text-emerald-400">RLS Enforced</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="GTCR Logo" className="h-8 w-auto object-contain rounded" />
            <div>
              <span className="font-bold text-white block">SAFELYNK · GTCR TECH NEXUS</span>
              <span className="text-[10px] text-slate-400">GARUDA TANDAV CYBER RAKSHA — CODE STORM 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onStartWearer} className="hover:text-white transition-colors">Wearer View</button>
            <button onClick={onStartParent} className="hover:text-white transition-colors">Parent View</button>
            <button onClick={onStartAdmin} className="hover:text-white transition-colors">Admin View</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
