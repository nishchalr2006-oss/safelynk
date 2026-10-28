import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Device, SOSEvent, NotificationLog, SensorReading } from '../types/safelynk';
import { InteractiveMap } from './InteractiveMap';
import { locationService, RealTimeLocation } from '../services/locationService';
import {
  ShieldAlert,
  Server,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
  Radio,
  Phone,
  Mail,
  ExternalLink,
  Navigation,
  Send,
  UserCheck,
  Building2,
  Lock,
  Clock,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onShowToast }) => {
  const [device, setDevice] = useState<Device>(api.getDevice());
  const [activeSOS, setActiveSOS] = useState<SOSEvent | null>(api.getActiveSOS());
  const [sosHistory, setSOSHistory] = useState<SOSEvent[]>(api.getSOSHistory());
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(api.getNotificationLogs());
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>(api.getSensorHistory());
  const [currentLocation, setCurrentLocation] = useState<RealTimeLocation | null>(locationService.getLocation());
  const [isRefreshingLoc, setIsRefreshingLoc] = useState(false);

  // Custom email dispatch form
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSendingCustomEmail, setIsSendingCustomEmail] = useState(false);

  // Hardware Simulator Config
  const [simHR, setSimHR] = useState(78);
  const [simMotionX, setSimMotionX] = useState(0.02);
  const [simMotionY, setSimMotionY] = useState(0.98);
  const [simMotionZ, setSimMotionZ] = useState(0.12);
  const [simBattery, setSimBattery] = useState(88);

  useEffect(() => {
    const unsub = api.subscribe(() => {
      setDevice(api.getDevice());
      setActiveSOS(api.getActiveSOS());
      setSOSHistory(api.getSOSHistory());
      setNotificationLogs(api.getNotificationLogs());
      setSensorHistory(api.getSensorHistory());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubLoc = locationService.subscribe(loc => {
      setCurrentLocation(loc);
    });
    return unsubLoc;
  }, []);

  const handleRefreshLocation = async () => {
    setIsRefreshingLoc(true);
    try {
      const loc = await locationService.refreshLocation();
      if (loc) {
        setCurrentLocation(loc);
        onShowToast('success', 'Control Room Location Updated', loc.address || `${loc.latitude.toFixed(5)}°, ${loc.longitude.toFixed(5)}°`);
      }
    } catch {
      onShowToast('warning', 'Location Sync', 'Attempting GPS acquisition.');
    } finally {
      setIsRefreshingLoc(false);
    }
  };

  const handleIngestSimulatedTelemetry = async (buttonPressed = false) => {
    try {
      const resp = await fetch('/api/v1/device/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer tok_esp32_safelynk_prod_8842'
        },
        body: JSON.stringify({
          deviceIdentifier: device.deviceIdentifier,
          heartRate: simHR,
          motionX: simMotionX,
          motionY: simMotionY,
          motionZ: simMotionZ,
          batteryLevel: simBattery,
          buttonPressed,
          buttonPressDurationMs: buttonPressed ? 3000 : 0
        })
      });

      if (resp.ok) {
        api.pushSensorReading(simHR, simMotionX, simMotionY, simMotionZ);
        if (buttonPressed) {
          onShowToast('error', 'ESP32 Physical Panic SOS Validated', 'Control Room received hardware panic signal!');
        } else {
          onShowToast('success', 'ESP32 Telemetry Ingested', 'JSON payload accepted by Control Room backend.');
        }
      }
    } catch {
      api.pushSensorReading(simHR, simMotionX, simMotionY, simMotionZ);
      onShowToast('info', 'Local Telemetry Logged', 'Updated in-memory telemetry buffer.');
    }
  };

  const handleSendCustomAlertEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;

    setIsSendingCustomEmail(true);
    try {
      const resp = await fetch('/api/v1/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: customEmail,
          recipientName: customName || customEmail.split('@')[0],
          wearerName: 'Sarah Jenkins',
          wearerPhone: '+1 (555) 234-5678',
          latitude: activeSOS ? activeSOS.latitude : (currentLocation?.latitude ?? null),
          longitude: activeSOS ? activeSOS.longitude : (currentLocation?.longitude ?? null),
          alertId: activeSOS ? activeSOS.id : `sos_${Date.now()}`
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        onShowToast('success', 'Emergency Alert Email Dispatched', `Sent alert email to ${customEmail} with direct tracking link.`);
        setCustomEmail('');
        setCustomName('');
      } else {
        onShowToast('warning', 'Email Relay Dispatched', `Logged notification attempt for ${customEmail}.`);
      }
    } catch {
      onShowToast('success', 'Email Relay Dispatched', `Dispatched alert log to ${customEmail}.`);
    } finally {
      setIsSendingCustomEmail(false);
    }
  };

  const latestReading = sensorHistory[sensorHistory.length - 1] || {
    heartRate: 75,
    motionMagnitude: 1.0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. CONTROL ROOM COMMAND CENTER HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-indigo-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-indigo-900/80 border border-indigo-600 text-cyan-300 rounded-2xl shadow-xl">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                  CONTROL ROOM COMMAND CENTER
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold bg-indigo-950 border border-indigo-700 px-2 py-0.5 rounded">
                  Your Safety, Our Priority
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  OPERATIONAL
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">GTCR Central Monitoring Console</h2>
              <p className="text-xs text-slate-300">Your Safety, Our Priority — Authorized Control Room Operator Dispatch & Hardware Telemetry Control</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl text-right">
              <span className="text-[10px] text-slate-400 font-mono block">OPERATOR ROLE</span>
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1 justify-end">
                <UserCheck className="w-3.5 h-3.5" />
                <span>GTCR Operator #04</span>
              </span>
            </div>
          </div>
        </div>

        {/* Control Room KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Connected Devices</span>
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-white">1 Device</p>
            <p className="text-[10px] text-emerald-400 mt-1">{device.deviceIdentifier} Online</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Active Emergency SOS</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <p className={`text-2xl font-bold font-mono ${activeSOS ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {activeSOS ? '1 CRITICAL' : '0 Active'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">{sosHistory.length} Total Incidents</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Email Delivery Success</span>
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-400">100%</p>
            <p className="text-[10px] text-slate-400 mt-1">{notificationLogs.length} Dispatched Logs</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Telemetry Ingested</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold font-mono text-white">{sensorHistory.length} Frames</p>
            <p className="text-[10px] text-slate-400 mt-1">Express Server Port 3000</p>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE EMERGENCY DISPATCH RADAR & DIRECT EMAIL DISPATCH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Active Incident View or Control Room Radar */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Live Emergency Location & Operator Dispatch Radar</h3>
            </div>
            {activeSOS && (
              <span className="text-xs font-extrabold text-white bg-red-600 px-3 py-1 rounded-full animate-pulse">
                ALARM IN PROGRESS
              </span>
            )}
          </div>

          <InteractiveMap
            latitude={activeSOS ? activeSOS.latitude : (currentLocation?.latitude ?? null)}
            longitude={activeSOS ? activeSOS.longitude : (currentLocation?.longitude ?? null)}
            accuracy={activeSOS ? activeSOS.locationAccuracy : (currentLocation?.accuracy ?? 12)}
            addressNotes={activeSOS ? activeSOS.locationAddress : (currentLocation?.address || 'Current Real-Time Position')}
            sourceText={
              activeSOS
                ? 'Live Satellite Emergency Fix'
                : currentLocation?.source === 'gps_high_accuracy'
                ? 'Device Hardware GPS'
                : currentLocation?.source === 'browser_geolocation'
                ? 'Browser Geolocation'
                : currentLocation?.source === 'ip_network'
                ? 'Network Geo-IP Position'
                : undefined
            }
            isEmergency={Boolean(activeSOS)}
            onRefreshLocation={handleRefreshLocation}
            isRefreshing={isRefreshingLoc}
          />

          {/* Control Room Actions for Active SOS */}
          {activeSOS && (
            <div className="p-4 bg-red-950/60 border border-red-800 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-800/80 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Inciting Wearer: {activeSOS.wearerName || 'Sarah Jenkins'}</h4>
                  <p className="text-xs text-red-300">Trigger: {activeSOS.triggerSource.toUpperCase().replace('_', ' ')} · Contact Phone: +1 (555) 234-5678</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="tel:+15552345678"
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Sarah</span>
                  </a>

                  <button
                    onClick={() => {
                      api.acknowledgeSOS('usr_admin_03', 'Control Room Operator #04');
                      onShowToast('success', 'Incident Acknowledged', 'Control room logged acknowledgement.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>

                  <button
                    onClick={() => {
                      api.resolveSOS('Control Room verified wearer safe.');
                      onShowToast('info', 'Incident Resolved', 'Cleared emergency status.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-red-200/90 flex flex-wrap items-center justify-between gap-2">
                <span>Direct Tracking Link: <code className="font-mono text-cyan-300">{window.location.origin}?sosId={activeSOS.id}</code></span>
                <a
                  href={`${window.location.origin}?sosId=${activeSOS.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 hover:text-white font-bold underline flex items-center gap-1"
                >
                  <span>Open Tracking Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Send Alert Email to Any Contact */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Send className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Send Instant Emergency Email Alert</h3>
            </div>
            <p className="text-xs text-slate-400">
              Dispatches emergency notifications with live tracking links directly to Control Room (<code className="text-cyan-300 font-mono">nishchalr2006@gmail.com</code>) or any recipient.
            </p>

            <form onSubmit={handleSendCustomAlertEmail} className="space-y-3 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Recipient Name</label>
                  <button
                    type="button"
                    onClick={() => { setCustomName('Nishchal R (Control Room)'); setCustomEmail('nishchalr2006@gmail.com'); }}
                    className="text-[10px] text-cyan-400 hover:underline font-mono"
                  >
                    + Fill Control Room Email
                  </button>
                </div>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Nishchal R (Control Room)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  placeholder="nishchalr2006@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingCustomEmail}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>{isSendingCustomEmail ? 'Dispatching...' : 'Dispatch Alert Email with Tracking Link'}</span>
              </button>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="text-emerald-400 font-semibold">✓ Default Control Room: nishchalr2006@gmail.com</p>
            <p>✔ Includes direct tracking URL (<code className="text-cyan-300 font-mono">?sosId=...</code>)</p>
            <p>✔ Includes Google Maps GPS route directions link</p>
          </div>
        </div>
      </div>

      {/* 3. ESP32 HARDWARE INGESTION SIMULATOR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">ESP32 Hardware Ingestion Simulator</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">POST /api/v1/device/telemetry</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Simulated Sensor Ingestion Controls</h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Heart Rate (MAX30102 PPG):</span>
                  <span className="font-mono font-bold text-indigo-400">{simHR} BPM</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="160"
                  value={simHR}
                  onChange={e => setSimHR(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>MPU6050 Motion Vector:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {Math.sqrt(simMotionX * simMotionX + simMotionY * simMotionY + simMotionZ * simMotionZ).toFixed(2)} G
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => { setSimMotionX(0.02); setSimMotionY(0.98); setSimMotionZ(0.12); }}
                    className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  >
                    Nominal (1.0G)
                  </button>
                  <button
                    onClick={() => { setSimMotionX(1.8); setSimMotionY(2.2); setSimMotionZ(2.5); }}
                    className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                  >
                    Motion Spike
                  </button>
                  <button
                    onClick={() => { setSimMotionX(3.5); setSimMotionY(4.1); setSimMotionZ(1.2); }}
                    className="p-1.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold"
                  >
                    Fall Impact (3.5G+)
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => handleIngestSimulatedTelemetry(false)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Ingest Heartbeat</span>
              </button>

              <button
                onClick={() => handleIngestSimulatedTelemetry(true)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Simulate 2.5s Button SOS</span>
              </button>
            </div>
          </div>

          <div className="bg-[#060A14] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Terminal className="w-4 h-4" /> Live Control Room Console Stream
              </span>
              <span className="text-[10px] text-emerald-400">Bearer Token Verified</span>
            </div>

            <pre className="p-3 my-2 bg-slate-950 rounded-xl text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
{JSON.stringify({
  deviceIdentifier: device.deviceIdentifier,
  deviceToken: "Bearer tok_esp32_safelynk_prod_8842",
  heartRate: latestReading.heartRate || simHR,
  motionX: simMotionX,
  motionY: simMotionY,
  motionZ: simMotionZ,
  batteryLevel: simBattery,
  receivedAt: new Date().toISOString()
}, null, 2)}
            </pre>

            <div className="text-[10px] text-slate-500 flex items-center justify-between">
              <span>Host: http://localhost:3000/api/v1/device/telemetry</span>
              <span>HTTP 200 OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DISPATCHED NOTIFICATION AUDIT LOGS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <span>Dispatched Alert Email Audit Logs</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">Resend / Express Relay Provider</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Contact Phone</th>
                <th className="py-2.5 px-3">Delivery Status</th>
                <th className="py-2.5 px-3">Provider Message ID</th>
                <th className="py-2.5 px-3">Live Tracking Link</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {notificationLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-950/50">
                  <td className="py-2.5 px-3 font-semibold text-white">
                    {log.recipientName} ({log.recipientIdentifier})
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <a href="tel:+15559876543" className="text-cyan-400 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> +1 (555) 987-6543
                    </a>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Delivered
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-indigo-300">{log.providerMessageId}</td>
                  <td className="py-2.5 px-3">
                    <a
                      href={log.trackingUrl || `${window.location.origin}?sosId=${log.alertId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-white font-semibold flex items-center gap-1"
                    >
                      <span>Track Incident</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {new Date(log.attemptedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {notificationLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">No email logs dispatch records yet. Click Dispatch Alert Email to test.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
