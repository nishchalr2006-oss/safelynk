import React, { useState, useEffect } from 'react';
import { UserProfile, SOSEvent } from '../types/safelynk';
import { ShieldAlert, User, LogOut, Radio, Activity, Users, Settings, Award, Volume2, VolumeX, BellRing } from 'lucide-react';
import { audioService } from '../services/audioService';

interface NavigationProps {
  currentUser: UserProfile | null;
  activeSOS: SOSEvent | null;
  activeTab: 'home' | 'wearer' | 'trusted' | 'admin' | 'about';
  setActiveTab: (tab: 'home' | 'wearer' | 'trusted' | 'admin' | 'about') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenDocs?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  activeSOS,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  onOpenDocs
}) => {
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);

  useEffect(() => {
    // Keep siren playing state synced
    const interval = setInterval(() => {
      setIsSirenPlaying(audioService.getIsPlaying());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSiren = () => {
    const playing = audioService.toggleSiren();
    setIsSirenPlaying(playing);
  };

  return (
    <>
      {/* 0. TOP ANIMATED TICKER BANNER: YOUR SAFETY. CONNECTED. ALWAYS. */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-cyan-500/40 py-2.5 px-4 overflow-hidden relative z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            </span>
            <div className="overflow-hidden w-full">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-xs font-bold">
                <span className="text-cyan-300 font-black tracking-widest uppercase flex items-center gap-2 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-full">
                  <ShieldAlert className="w-4 h-4 text-cyan-300 animate-pulse inline" />
                  YOUR SAFETY. CONNECTED. ALWAYS.
                </span>
                <span className="text-cyan-500/60">✦</span>
                <span className="text-slate-200 font-extrabold tracking-wide">
                  GARUDA TANDAV CYBER RAKSHA · GTCR TECH NEXUS
                </span>
                <span className="text-cyan-500/60">✦</span>
                <span className="text-cyan-300 font-black tracking-widest uppercase flex items-center gap-2 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-full">
                  <ShieldAlert className="w-4 h-4 text-cyan-300 animate-pulse inline" />
                  YOUR SAFETY. CONNECTED. ALWAYS.
                </span>
                <span className="text-cyan-500/60">✦</span>
                <span className="text-indigo-300 font-bold">
                  24/7 DUAL-LAYER EMERGENCY ALERTING & GPS GEOLOCATION
                </span>
                <span className="text-cyan-500/60">✦</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs font-mono">
            {onOpenDocs && (
              <button
                onClick={onOpenDocs}
                className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs font-bold hover:border-cyan-400 transition-colors"
              >
                ⚙️ ESP32 & Setup Docs
              </button>
            )}
            <button
              onClick={handleToggleSiren}
              className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isSirenPlaying
                  ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500'
              }`}
              title="Test Loud Emergency Siren Audio"
            >
              {isSirenPlaying ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
              <span>{isSirenPlaying ? 'SIREN ACTIVE' : 'TEST SIREN'}</span>
            </button>
            <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-black uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              STATUS: NOMINAL
            </span>
          </div>
        </div>
      </div>

      {/* 1. EMERGENCY ALARM TOP BANNER (Visible if SOS active) */}
      {activeSOS && (
        <div className="bg-red-600 text-white px-5 py-2.5 text-sm font-black flex items-center justify-between gap-3 animate-pulse shadow-2xl z-50 sticky top-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-5 h-5 shrink-0 animate-bounce" />
            <span className="truncate tracking-wide">
              EMERGENCY SOS ACTIVE: {activeSOS.wearerName || 'Sarah'} triggered alert ({activeSOS.triggerSource.toUpperCase().replace('_', ' ')})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleSiren}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                isSirenPlaying
                  ? 'bg-red-950 text-red-200 border border-red-400'
                  : 'bg-black text-white hover:bg-slate-900'
              }`}
            >
              {isSirenPlaying ? <Volume2 className="w-4 h-4 text-amber-300 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span>{isSirenPlaying ? 'MUTE SIREN' : 'SOUND SIREN'}</span>
            </button>
            <button
              onClick={() => setActiveTab(currentUser?.role === 'trusted_contact' ? 'trusted' : 'wearer')}
              className="px-3.5 py-1.5 bg-white text-red-700 font-extrabold rounded-lg text-xs hover:bg-slate-100 transition-colors shadow-md"
            >
              VIEW INCIDENT
            </button>
          </div>
        </div>
      )}

      {/* 2. DESKTOP / MAIN HEADER (Enhanced height & bold attractive styling) */}
      <header className="border-b border-indigo-900/50 bg-[#070B14]/95 backdrop-blur-xl sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          {/* Brand Zone: SAFELYNK Wordmark + Team Logo.jpeg */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3.5 cursor-pointer shrink-0 group"
          >
            {/* Team Logo (Strictly original logo.jpeg with object-contain) */}
            <div className="p-1 rounded-xl bg-slate-900 border border-cyan-500/40 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all shadow-md">
              <img
                src="/logo.jpeg"
                alt="GTCR TECH NEXUS Team Logo"
                className="h-10 sm:h-11 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent font-sans">
                  SAFELYNK
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono font-black text-cyan-300 bg-cyan-950/90 border border-cyan-700/80 px-2 py-0.5 rounded-md shadow-sm">
                  GTCR TECH NEXUS
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-semibold block -mt-0.5 tracking-wide">
                GARUDA TANDAV CYBER RAKSHA
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-300">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'home'
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black'
                  : 'hover:text-white hover:bg-slate-900/80'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('wearer')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'wearer'
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black'
                  : 'hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Wearer Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('trusted')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'trusted'
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black'
                  : 'hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Parent Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black'
                  : 'hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Settings className="w-4 h-4 text-violet-400" />
              <span>System Admin</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'about'
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black'
                  : 'hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>About GTCR</span>
            </button>
          </nav>

          {/* User Account / Auth Action */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{currentUser.displayName}</span>
                  <span className="text-[10px] font-mono text-cyan-400 capitalize">{currentUser.role.replace('_', ' ')}</span>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-800 border border-indigo-500/40 flex items-center justify-center text-slate-200 text-xs font-bold">
                  {currentUser.displayName.charAt(0)}
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 transition-all flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Demo</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070B14]/95 border-t border-slate-800/80 backdrop-blur-lg px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors ${
            activeTab === 'home' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('wearer')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors ${
            activeTab === 'wearer' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Wearer</span>
        </button>

        <button
          onClick={() => setActiveTab('trusted')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors relative ${
            activeTab === 'trusted' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          {activeSOS && <span className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
          <Users className="w-4 h-4" />
          <span>Parent</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors ${
            activeTab === 'admin' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Admin</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-colors ${
            activeTab === 'about' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>GTCR</span>
        </button>
      </div>
    </>
  );
};
