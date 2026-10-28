import React, { useState } from 'react';
import { UserRole } from '../types/safelynk';
import { Shield, User, Lock, Mail, UserCheck, X, Sparkles, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginDemoRole: (role: UserRole) => void;
  onLoginCredentials: (email: string, role: UserRole, displayName?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginDemoRole,
  onLoginCredentials
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<UserRole>('wearer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onLoginCredentials(email, role, name || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">SAFELYNK Access</h3>
            <p className="text-xs text-slate-400">Select account role or sign in with credentials</p>
          </div>
        </div>

        {/* QUICK DEMO LOGIN BUTTONS */}
        <div className="mb-6 p-3.5 bg-slate-950/80 border border-indigo-900/40 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Hackathon Quick Demo Accounts:</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => {
                onLoginDemoRole('wearer');
                onClose();
              }}
              className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-700/60 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300">Sarah Jenkins (Wearer)</p>
                <p className="text-[10px] text-slate-400">Mobile safety control center & device monitoring</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => {
                onLoginDemoRole('trusted_contact');
                onClose();
              }}
              className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-700/60 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300">David Jenkins (Parent / Contact)</p>
                <p className="text-[10px] text-slate-400">Emergency SOS alert receiver & live map tracking</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => {
                onLoginDemoRole('administrator');
                onClose();
              }}
              className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-700/60 transition-all flex items-center justify-between group"
            >
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300">System Admin Monitor</p>
                <p className="text-[10px] text-slate-400">ESP32 telemetry stream & hardware simulator</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-slate-900 px-3 text-[11px] font-mono text-slate-500 uppercase">Or custom login</span>
        </div>

        {/* Custom Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Account Role</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setRole('wearer')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  role === 'wearer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Wearer
              </button>
              <button
                type="button"
                onClick={() => setRole('trusted_contact')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  role === 'trusted_contact' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Parent
              </button>
              <button
                type="button"
                onClick={() => setRole('administrator')}
                className={`py-1.5 rounded-lg font-semibold transition-all ${
                  role === 'administrator' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors mt-2"
          >
            {mode === 'signin' ? 'Sign In as Selected Role' : 'Create SAFELYNK Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
