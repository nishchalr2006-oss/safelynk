import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TrustedContact, SOSEvent, Device, NotificationLog } from '../types/safelynk';
import { InteractiveMap } from './InteractiveMap';
import { ActivityTimeline } from './ActivityTimeline';
import { locationService, RealTimeLocation } from '../services/locationService';
import {
  Users,
  ShieldAlert,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  UserPlus,
  Battery,
  Heart,
  Wifi,
  ExternalLink,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';

interface TrustedContactDashboardProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

export const TrustedContactDashboard: React.FC<TrustedContactDashboardProps> = ({ onShowToast }) => {
  const [activeSOS, setActiveSOS] = useState<SOSEvent | null>(api.getActiveSOS());
  const [sosHistory, setSOSHistory] = useState<SOSEvent[]>(api.getSOSHistory());
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>(api.getTrustedContacts());
  const [device, setDevice] = useState<Device>(api.getDevice());
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(api.getNotificationLogs());
  const [wearerLocation, setWearerLocation] = useState<RealTimeLocation | null>(locationService.getLocation());
  const [isRefreshingLoc, setIsRefreshingLoc] = useState(false);

  // Sound Alert state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('Secondary Contact');

  useEffect(() => {
    const unsub = api.subscribe(() => {
      setActiveSOS(api.getActiveSOS());
      setSOSHistory(api.getSOSHistory());
      setTrustedContacts(api.getTrustedContacts());
      setDevice(api.getDevice());
      setNotificationLogs(api.getNotificationLogs());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubLoc = locationService.subscribe(loc => {
      setWearerLocation(loc);
    });
    return unsubLoc;
  }, []);

  const handleRefreshLocation = async () => {
    setIsRefreshingLoc(true);
    try {
      const loc = await locationService.refreshLocation();
      if (loc) {
        setWearerLocation(loc);
        onShowToast('success', 'Location Synchronized', loc.address || `${loc.latitude.toFixed(5)}°, ${loc.longitude.toFixed(5)}°`);
      }
    } catch {
      onShowToast('warning', 'Location Sync', 'Attempting satellite reconnection.');
    } finally {
      setIsRefreshingLoc(false);
    }
  };

  const handleAcknowledge = () => {
    const user = api.getCurrentUser();
    const name = user ? user.displayName : 'David Jenkins (Dad)';
    api.acknowledgeSOS('usr_contact_david_02', name);
    onShowToast('success', 'Incident Acknowledged', 'Logged acknowledgement timestamp for wearer.');
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    api.addTrustedContact(inviteName, inviteEmail, inviteRelationship);
    onShowToast('success', 'Invitation Sent', `Added ${inviteName} as trusted contact.`);
    setInviteName('');
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. ACTIVE EMERGENCY SOS FLASHING INCIDENT PANEL */}
      {activeSOS ? (
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-slate-900 border-2 border-red-600 rounded-3xl p-6 shadow-2xl shadow-red-950/50 space-y-6 relative overflow-hidden animate-pulse-slow">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xl animate-bounce">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-red-300 font-extrabold uppercase tracking-widest bg-red-950/80 px-2.5 py-0.5 rounded border border-red-700">
                  CRITICAL ALARM IN PROGRESS
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  EMERGENCY SOS: {activeSOS.wearerName || 'Sarah Jenkins'}
                </h2>
                <p className="text-xs text-red-200 mt-0.5">
                  Trigger Source: <strong className="text-white uppercase">{activeSOS.triggerSource.replace('_', ' ')}</strong> · {new Date(activeSOS.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2.5 rounded-xl bg-red-950 border border-red-800 text-red-200 hover:text-white transition-colors"
                title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              </button>

              {activeSOS.status === 'acknowledged' ? (
                <div className="px-4 py-2 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-xl font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ACKNOWLEDGED BY YOU</span>
                </div>
              ) : (
                <button
                  onClick={handleAcknowledge}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-950/50 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Acknowledge Incident</span>
                </button>
              )}
            </div>
          </div>

          {/* Incident Location Map & Contacts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <InteractiveMap
              latitude={activeSOS.latitude}
              longitude={activeSOS.longitude}
              accuracy={activeSOS.locationAccuracy}
              addressNotes={activeSOS.locationAddress || 'Emergency GPS Fix'}
              sourceText="Live Satellite GPS Coordinates"
              isEmergency={true}
              onRefreshLocation={handleRefreshLocation}
              isRefreshing={isRefreshingLoc}
            />

            <div className="bg-slate-950/90 border border-red-900/60 rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider mb-2">Emergency Response Actions</h4>
                <div className="space-y-2">
                  <a
                    href={`tel:${activeSOS.wearerName ? '+15552345678' : ''}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-900/80 hover:bg-red-800 text-white text-xs font-bold flex items-center justify-between transition-colors border border-red-700"
                  >
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-red-300" />
                      <span>Direct Phone Call to Sarah</span>
                    </span>
                    <span className="font-mono text-red-200">+1 (555) 234-5678</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${activeSOS.latitude},${activeSOS.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors border border-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span>Open Live Route Directions</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-red-900/40 text-[11px] text-red-200/90 flex items-center justify-between">
                <span>Notification Status: <strong>DELIVERED TO EMAIL</strong></span>
                <span className="font-mono">Audit ID: {activeSOS.id}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SAFE STATE HEADER */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                MONITORING ACTIVE
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">Wearers Protected & Nominal</h2>
              <p className="text-xs text-slate-400">All connected wearer devices are online with no active SOS alerts.</p>
            </div>
          </div>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Trusted Contact</span>
          </button>
        </div>
      )}

      {/* 2. CONNECTED WEARER PROFILE & DEVICE STATUS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Connected Wearer Profile</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Authorization: Verified Parent/Guardian</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wearer Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold flex items-center justify-center text-lg shadow-lg">
                SJ
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Sarah Jenkins</h4>
                <p className="text-xs text-slate-400">Linked Wearer</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-white">+1 (555) 234-5678</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Device ID:</span>
                <span className="font-mono text-indigo-400">{device.deviceIdentifier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Online
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Snapshot */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live Device Telemetry</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Battery className="w-4 h-4 text-indigo-400" /> Battery
                </div>
                <p className="text-lg font-bold font-mono text-white">{device.batteryLevel}%</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Heart className="w-4 h-4 text-red-400" /> Heart Rate
                </div>
                <p className="text-lg font-bold font-mono text-white">76 BPM</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">Last ESP32 heartbeat: {new Date(device.lastSeenAt).toLocaleTimeString()}</p>
          </div>

          {/* Trusted Contacts Network */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Trusted Contacts ({trustedContacts.length})</h4>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2">
              {trustedContacts.map(tc => (
                <div key={tc.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{tc.contactName}</p>
                    <p className="text-[10px] text-slate-400">{tc.relationship} · {tc.contactEmail}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Safe Location Map (Nominal State) */}
        {!activeSOS && (
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live Wearer GPS Position (Safe Zone)
                </h4>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                wearerLocation?.source === 'gps_high_accuracy'
                  ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                  : 'text-cyan-400 bg-cyan-950/80 border-cyan-800'
              }`}>
                {wearerLocation?.source === 'gps_high_accuracy' ? 'GPS FIX ACTIVE' : 'LIVE FIX'}
              </span>
            </div>

            <InteractiveMap
              latitude={wearerLocation?.latitude ?? null}
              longitude={wearerLocation?.longitude ?? null}
              accuracy={wearerLocation?.accuracy ?? 12}
              addressNotes={wearerLocation?.address || 'Current Wearer Safe Position'}
              sourceText={
                wearerLocation?.source === 'gps_high_accuracy'
                  ? 'Hardware / Browser GPS (High Accuracy)'
                  : wearerLocation?.source === 'browser_geolocation'
                  ? 'Browser Geolocation'
                  : wearerLocation?.source === 'ip_network'
                  ? 'Network Geo-IP Position'
                  : undefined
              }
              isEmergency={false}
              onRefreshLocation={handleRefreshLocation}
              isRefreshing={isRefreshingLoc}
            />
          </div>
        )}
      </div>

      {/* 3. AUDIT TIMELINE */}
      <ActivityTimeline
        sosHistory={sosHistory}
        safetyCheck={null}
        notificationLogs={notificationLogs}
        sensorHistory={[]}
      />

      {/* INVITATION MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Invite Trusted Contact</h3>
            <p className="text-xs text-slate-400 mb-4">Add a new family member or guardian to receive emergency SOS alerts.</p>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Dr. Robert Jenkins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Relationship</label>
                <input
                  type="text"
                  value={inviteRelationship}
                  onChange={e => setInviteRelationship(e.target.value)}
                  placeholder="e.g. Brother / Primary Guardian"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors mt-2"
              >
                Send Trusted Contact Authorization
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
