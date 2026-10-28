import React from 'react';
import { UserProfile, SOSEvent } from '../types/safelynk';
import { ShieldAlert, User, LogOut, Radio, Activity, Users, Settings, Award, Info } from 'lucide-react';

interface NavigationProps {
  currentUser: UserProfile | null;
  activeSOS: SOSEvent | null;
  activeTab: 'home' | 'wearer' | 'trusted' | 'admin' | 'about';
  setActiveTab: (tab: 'home' | 'wearer' | 'trusted' | 'admin' | 'about') => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentUser,
  activeSOS,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout
}) => {
  return (
    <>
      {/* 1. EMERGENCY ALARM TOP BANNER (Visible if SOS active) */}
      {activeSOS && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 animate-pulse shadow-lg z-50 sticky top-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="truncate">
              EMERGENCY SOS ACTIVE: {activeSOS.wearerName || 'Sarah'} triggered alert ({activeSOS.triggerSource.toUpperCase().replace('_', ' ')})
            </span>
          </div>
          <button
            onClick={() => setActiveTab(currentUser?.role === 'trusted_contact' ? 'trusted' : 'wearer')}
            className="px-2.5 py-1 bg-white text-red-700 font-extrabold rounded text-[11px] hover:bg-slate-100 transition-colors shrink-0"
          >
            VIEW INCIDENT
          </button>
        </div>
      )}

      {/* 2. DESKTOP / MAIN HEADER */}
      <header className="border-b border-slate-800/80 bg-[#070B14]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Brand Zone: SAFELYNK Wordmark + Team Logo.jpeg */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer shrink-0 group"
          >
            {/* Team Logo (Strictly original logo.jpeg with object-contain) */}
            <img
              src="/logo.jpeg"
              alt="GTCR TECH NEXUS Team Logo"
              className="h-9 w-auto object-contain rounded-lg border border-indigo-500/30 group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white font-sans">SAFELYNK</span>
                <span className="hidden sm:inline-block text-[9px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                  GTCR TECH NEXUS
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 block -mt-0.5">GARUDA TANDAV CYBER RAKSHA</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
            <button
              onClick={() => setActiveTab('home')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'home' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400 pb-0.5' : ''
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('wearer')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'wearer' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400 pb-0.5' : ''
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Wearer Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('trusted')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'trusted' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400 pb-0.5' : ''
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Parent Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'admin' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400 pb-0.5' : ''
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>System Admin</span>
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'about' ? 'text-cyan-400 font-bold border-b-2 border-cyan-400 pb-0.5' : ''
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
