import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { UserProfile, UserRole, SOSEvent } from './types/safelynk';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { WearerDashboard } from './components/WearerDashboard';
import { TrustedContactDashboard } from './components/TrustedContactDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutTeamPage } from './components/AboutTeamPage';
import { AuthModal } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(api.getCurrentUser());
  const [activeSOS, setActiveSOS] = useState<SOSEvent | null>(api.getActiveSOS());
  const [activeTab, setActiveTab] = useState<'home' | 'wearer' | 'trusted' | 'admin' | 'about'>('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsub = api.subscribe(() => {
      setCurrentUser(api.getCurrentUser());
      setActiveSOS(api.getActiveSOS());
    });
    return unsub;
  }, []);

  const addToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    desc?: string
  ) => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      title,
      description: desc
    };
    setToasts(prev => [...prev.slice(-4), newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLoginDemoRole = (role: UserRole) => {
    api.loginAsDemoRole(role);
    if (role === 'wearer') setActiveTab('wearer');
    else if (role === 'trusted_contact') setActiveTab('trusted');
    else setActiveTab('admin');

    addToast('success', 'Logged in as Demo Role', `Role set to ${role.replace('_', ' ')}.`);
  };

  const handleLoginCredentials = (email: string, role: UserRole, displayName?: string) => {
    api.loginWithCredentials(email, role, displayName);
    if (role === 'wearer') setActiveTab('wearer');
    else if (role === 'trusted_contact') setActiveTab('trusted');
    else setActiveTab('admin');

    addToast('success', 'Signed In', `Welcome to SAFELYNK (${role}).`);
  };

  const handleLogout = () => {
    api.logout();
    setActiveTab('home');
    addToast('info', 'Logged Out', 'Signed out of SAFELYNK account.');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-20 md:pb-0">
      {/* Navigation Header */}
      <Navigation
        currentUser={currentUser}
        activeSOS={activeSOS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Port */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <LandingPage
            onStartWearer={() => {
              api.loginAsDemoRole('wearer');
              setActiveTab('wearer');
            }}
            onStartParent={() => {
              api.loginAsDemoRole('trusted_contact');
              setActiveTab('trusted');
            }}
            onStartAdmin={() => {
              api.loginAsDemoRole('administrator');
              setActiveTab('admin');
            }}
          />
        )}

        {activeTab === 'wearer' && <WearerDashboard onShowToast={addToast} />}

        {activeTab === 'trusted' && <TrustedContactDashboard onShowToast={addToast} />}

        {activeTab === 'admin' && <AdminDashboard onShowToast={addToast} />}

        {activeTab === 'about' && <AboutTeamPage />}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginDemoRole={handleLoginDemoRole}
        onLoginCredentials={handleLoginCredentials}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
