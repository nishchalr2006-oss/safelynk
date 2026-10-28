import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Device, SensorReading, SafetyCheck, SOSEvent } from '../types/safelynk';
import { InteractiveMap } from './InteractiveMap';
import { ActivityTimeline } from './ActivityTimeline';
import { locationService, RealTimeLocation } from '../services/locationService';
import {
  ShieldAlert,
  ShieldCheck,
  Heart,
  Activity,
  Battery,
  Wifi,
  WifiOff,
  Navigation,
  AlertCircle,
  Key,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

interface WearerDashboardProps {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
}

export const WearerDashboard: React.FC<WearerDashboardProps> = ({ onShowToast }) => {
  const [device, setDevice] = useState<Device>(api.getDevice());
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>(api.getSensorHistory());
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheck | null>(api.getActiveSafetyCheck());
  const [activeSOS, setActiveSOS] = useState<SOSEvent | null>(api.getActiveSOS());
  const [sosHistory, setSOSHistory] = useState<SOSEvent[]>(api.getSOSHistory());
  const [notificationLogs, setNotificationLogs] = useState(api.getNotificationLogs());

  // Hold-to-SOS progress tracking
  const [isHoldingSOS, setIsHoldingSOS] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time GPS State from locationService
  const [location, setLocation] = useState<RealTimeLocation | null>(locationService.getLocation());
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  // Device Token Copied State
  const [copiedToken, setCopiedToken] = useState(false);
  const [resolveNote, setResolveNote] = useState('');

  // Subscribe to API updates
  useEffect(() => {
    const unsub = api.subscribe(() => {
      setDevice(api.getDevice());
      setSensorHistory(api.getSensorHistory());
      setSafetyCheck(api.getActiveSafetyCheck());
      setActiveSOS(api.getActiveSOS());
      setSOSHistory(api.getSOSHistory());
      setNotificationLogs(api.getNotificationLogs());
    });
    return unsub;
  }, []);

  // Continuous real-time GPS tracking listener
  useEffect(() => {
    const unsubLoc = locationService.subscribe(loc => {
      setLocation(loc);
    });
    return unsubLoc;
  }, []);

  const handleRefreshLocation = async () => {
    setIsRefreshingLocation(true);
    try {
      const freshLoc = await locationService.refreshLocation();
      if (freshLoc) {
        setLocation(freshLoc);
        onShowToast('success', 'GPS Fix Updated', freshLoc.address || `${freshLoc.latitude.toFixed(5)}°, ${freshLoc.longitude.toFixed(5)}°`);
      } else {
        onShowToast('info', 'Searching Satellites...', 'Attempting to acquire precision GPS lock.');
      }
    } catch {
      onShowToast('warning', 'Location Error', 'Unable to refresh location sensor.');
    } finally {
      setIsRefreshingLocation(false);
    }
  };

  // Handle Hold-to-SOS Timer (2.5 seconds hold)
  const handleSOSMouseDown = () => {
    if (activeSOS) return;
    setIsHoldingSOS(true);
    setHoldProgress(0);

    const startTime = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / 2500) * 100));
      setHoldProgress(pct);

      if (pct >= 100) {
        clearInterval(holdIntervalRef.current as NodeJS.Timeout);
        setIsHoldingSOS(false);
        setHoldProgress(0);
        executeSOSTrigger();
      }
    }, 50);
  };

  const handleSOSMouseUp = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    setIsHoldingSOS(false);
    setHoldProgress(0);
  };

  const executeSOSTrigger = async () => {
    const curLoc = location || locationService.getLocation();
    const lat = curLoc ? curLoc.latitude : null;
    const lng = curLoc ? curLoc.longitude : null;
    const acc = curLoc ? curLoc.accuracy : 12;
    const addr = curLoc?.address || 'Current Real-Time Location';

    onShowToast('warning', 'Emergency SOS Activated!', 'Broadcasting alert to trusted contacts with live GPS coordinates...');
    await api.triggerSOS('web_app_hold', lat, lng, acc, addr);
  };

  // Safety Check Countdown timer effect
  const [safetyCheckCountdown, setSafetyCheckCountdown] = useState(45);
  useEffect(() => {
    if (!safetyCheck) return;
    const interval = setInterval(() => {
      const expires = new Date(safetyCheck.expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setSafetyCheckCountdown(diff);

      if (diff <= 0) {
        clearInterval(interval);
        onShowToast('error', 'Safety Check Expired', 'Auto-escalating to Emergency SOS!');
        api.resolveSafetyCheck(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [safetyCheck]);

  // Test Mode toggle state
  const [testModeEnabled, setTestModeEnabled] = useState(false);

  const latestReading = sensorHistory[sensorHistory.length - 1] || {
    heartRate: 75,
    heartRateSignalQuality: 98,
    motionMagnitude: 1.0,
    sensorStatus: 'nominal'
  };

  const copyDeviceToken = () => {
    navigator.clipboard.writeText('tok_esp32_safelynk_prod_8842');
    setCopiedToken(true);
    onShowToast('success', 'ESP32 Device Token Copied', 'Paste into esp32_safelynk.ino sketch');
    setTimeout(() => setCopiedToken(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. SAFETY STATUS HERO HEADER */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden shadow-2xl ${
        activeSOS
          ? 'bg-red-950/80 border-red-800 shadow-red-950/40'
          : safetyCheck
          ? 'bg-amber-950/70 border-amber-800 shadow-amber-950/30'
          : 'bg-slate-900/80 border-slate-800'
      }`}>
        {/* Glow backdrop */}
        <div className={`absolute -right-10 -bottom-10 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
          activeSOS ? 'bg-red-600/20' : safetyCheck ? 'bg-amber-600/20' : 'bg-indigo-600/10'
        }`}></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {activeSOS ? (
                <span className="px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <ShieldAlert className="w-4 h-4" /> SOS ACTIVATED
                </span>
              ) : safetyCheck ? (
                <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> SAFETY CHECK REQUIRED
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> SYSTEM NOMINAL & PROTECTED
                </span>
              )}

              <span className="text-xs font-mono text-slate-400 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                {device.connectionStatus === 'online' ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-red-400" />
                )}
                <span>{device.deviceIdentifier}</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex flex-wrap items-center gap-3">
              <span>Wearer Safety Hub</span>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-700/80 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Your Safety, Our Priority
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              {activeSOS
                ? 'Your Safety, Our Priority — Emergency alert is active. Trusted contacts have been notified with live GPS location.'
                : safetyCheck
                ? 'Your Safety, Our Priority — Elevated heart rate or motion anomaly detected. Please confirm your safety.'
                : 'Your Safety, Our Priority — Real-time ESP32 biometric pulse and accelerometer telemetry monitoring.'}
            </p>
          </div>

          {/* Quick Battery & Hardware Status */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl shrink-0">
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-400">ESP32 Battery</p>
                <p className="text-xs font-bold text-white font-mono">{device.batteryLevel}%</p>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400 animate-pulse" />
              <div>
                <p className="text-[10px] text-slate-400">Pulse (PPG {latestReading.heartRateSignalQuality || 98}%)</p>
                <p className="text-xs font-bold text-white font-mono">{latestReading.heartRate || 75} BPM</p>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-800 hidden sm:block"></div>

            <button
              onClick={() => {
                setTestModeEnabled(!testModeEnabled);
                onShowToast('info', testModeEnabled ? 'Test Mode Disabled' : 'Test Mode Active', 'In test mode, notifications are simulated locally.');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                testModeEnabled
                  ? 'bg-amber-500 text-slate-950 border border-amber-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {testModeEnabled ? '⚡ TEST MODE ACTIVE' : 'Enable Test Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. PENDING SAFETY CHECK ALERT BANNER */}
      {safetyCheck && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-slate-900 border-2 border-amber-600 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500 text-slate-950 rounded-2xl shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Are you safe right now?</h3>
                <p className="text-xs text-amber-200 mt-0.5">
                  Trigger: {safetyCheck.triggerReason}. Auto-escalating to SOS in{' '}
                  <span className="font-mono font-bold text-white text-sm bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                    {safetyCheckCountdown}s
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  api.resolveSafetyCheck(true);
                  onShowToast('success', 'Confirmed Safe', 'Safety check cleared successfully.');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors"
              >
                I'm Safe
              </button>

              <button
                onClick={() => {
                  api.resolveSafetyCheck(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-colors"
              >
                I Need Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EMERGENCY SOS BUTTON & LIVE MAP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Interactive Press-and-Hold SOS Button */}
        <div className={`p-6 rounded-3xl border flex flex-col justify-between relative overflow-hidden transition-all ${
          activeSOS
            ? 'bg-red-950/60 border-red-800'
            : 'bg-slate-900/80 border-slate-800'
        }`}>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Emergency Action Control</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Press and hold the SOS button for 2.5 seconds to trigger instant panic alerts.
            </p>
          </div>

          <div className="my-8 flex flex-col items-center justify-center">
            {activeSOS ? (
              <div className="text-center space-y-4 max-w-sm">
                <div className="w-24 h-24 mx-auto rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl animate-pulse">
                  <ShieldAlert className="w-12 h-12" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-white">SOS ALARM ACTIVE</h4>
                  <p className="text-xs text-red-300 mt-1">
                    Trusted contacts notified. Live GPS coordinates broadcasting.
                  </p>
                </div>

                {/* Cancel / Resolve Modal inside */}
                <div className="pt-2 space-y-2">
                  <input
                    type="text"
                    value={resolveNote}
                    onChange={e => setResolveNote(e.target.value)}
                    placeholder="Enter resolution note (e.g. False alarm)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      api.resolveSOS(resolveNote || 'User confirmed safe and cancelled alert.');
                      setResolveNote('');
                      onShowToast('info', 'SOS Alarm Cancelled', 'Alarm status resolved.');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancel / Resolve SOS Alarm</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Hold to SOS Button Container */}
                <div className="relative flex items-center justify-center">
                  {/* Outer Progress Ring */}
                  <svg className="w-48 h-48 -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      className="stroke-slate-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="84"
                      className="stroke-red-500 transition-all duration-75"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="527"
                      strokeDashoffset={527 - (527 * holdProgress) / 100}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Physical Button Surface */}
                  <button
                    onMouseDown={handleSOSMouseDown}
                    onMouseUp={handleSOSMouseUp}
                    onMouseLeave={handleSOSMouseUp}
                    onTouchStart={handleSOSMouseDown}
                    onTouchEnd={handleSOSMouseUp}
                    className={`absolute w-36 h-36 rounded-full font-black text-white text-lg tracking-wider flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-95 select-none ${
                      isHoldingSOS
                        ? 'bg-red-700 scale-95 shadow-red-900/80'
                        : 'bg-gradient-to-tr from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-950/60'
                    }`}
                  >
                    <ShieldAlert className="w-10 h-10 mb-1" />
                    <span>HOLD SOS</span>
                  </button>
                </div>

                <p className="text-xs font-mono text-slate-400 mt-4 text-center">
                  {isHoldingSOS ? `Holding... ${holdProgress}%` : 'Press & Hold for 2.5s'}
                </p>
              </div>
            )}
          </div>

          {/* Hardware Token & Flashing Guide Card */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-slate-300 font-semibold">ESP32 Integration Token:</span>
                <code className="text-indigo-300 font-mono ml-2 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  tok_esp32_safelynk_prod_8842
                </code>
              </div>
            </div>
            <button
              onClick={copyDeviceToken}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Token Copied!' : 'Copy Device Token'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Real-Time Location Map */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Live Geolocation Broadcast</h3>
              </div>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                location?.source === 'gps_high_accuracy'
                  ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
                  : location
                  ? 'text-cyan-400 bg-cyan-950/80 border-cyan-800/80'
                  : 'text-amber-400 bg-amber-950/80 border-amber-800/80'
              }`}>
                {location?.source === 'gps_high_accuracy' ? 'GPS SATELLITE FIX' : location ? 'LIVE FIX' : 'ACQUIRING...'}
              </span>
            </div>

            <InteractiveMap
              latitude={location?.latitude ?? null}
              longitude={location?.longitude ?? null}
              accuracy={location?.accuracy ?? 12}
              addressNotes={location?.address || 'Current Real-Time Position'}
              sourceText={
                location?.source === 'gps_high_accuracy'
                  ? 'Hardware / Browser GPS (High Accuracy)'
                  : location?.source === 'browser_geolocation'
                  ? 'Browser Geolocation'
                  : location?.source === 'ip_network'
                  ? 'Network Geo-IP Position'
                  : undefined
              }
              isEmergency={Boolean(activeSOS)}
              onRefreshLocation={handleRefreshLocation}
              isRefreshing={isRefreshingLocation}
            />
          </div>
        </div>
      </div>

      {/* 4. SENSOR METRICS GRAPH & MONITORING */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Real-Time Biometric & Motion Telemetry</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Streamed from MAX30102 PPG & MPU6050 Accelerometer</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                api.pushSensorReading(138, 0.2, 0.4, 3.5); // Simulate fall/spike
                onShowToast('warning', 'Simulated Motion Spike', 'G-force spike injected to trigger Safety Check');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Simulate G-Force Fall
            </button>
            <button
              onClick={() => {
                api.pushSensorReading(142, 0.05, 0.98, 0.12); // High HR
                onShowToast('warning', 'Simulated Pulse Spike', 'High BPM injected to trigger Safety Check');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Simulate High Pulse
            </button>
          </div>
        </div>

        {/* Pulse & Accelerometer Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Heart Rate Visual */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-400" /> Heart Rate (BPM)
              </span>
              <span className="text-xs font-mono font-bold text-white bg-red-950/60 border border-red-800/80 px-2 py-0.5 rounded">
                {latestReading.heartRate || 75} BPM
              </span>
            </div>

            {/* SVG BPM Wave Graph */}
            <div className="h-32 w-full bg-[#070B14] rounded-xl p-2 flex items-end relative overflow-hidden border border-slate-800/80">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path
                  d={`M 0 ${40 - (sensorHistory[0]?.heartRate || 70) / 4} ${sensorHistory
                    .map(
                      (s, i) =>
                        `L ${(i / (sensorHistory.length - 1)) * 100} ${40 - (s.heartRate || 70) / 4}`
                    )
                    .join(' ')}`}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-500">Threshold: 130 BPM</div>
            </div>
          </div>

          {/* Accelerometer Visual */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-400" /> MPU6050 Acceleration Vector (G-Force)
              </span>
              <span className="text-xs font-mono font-bold text-white bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded">
                {latestReading.motionMagnitude || 1.0} G
              </span>
            </div>

            {/* SVG Motion Graph */}
            <div className="h-32 w-full bg-[#070B14] rounded-xl p-2 flex items-end relative overflow-hidden border border-slate-800/80">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                <path
                  d={`M 0 ${40 - (sensorHistory[0]?.motionMagnitude || 1) * 8} ${sensorHistory
                    .map(
                      (s, i) =>
                        `L ${(i / (sensorHistory.length - 1)) * 100} ${
                          40 - (s.motionMagnitude || 1) * 8
                        }`
                    )
                    .join(' ')}`}
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-500">Threshold: 3.0 G</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. AUDIT TIMELINE */}
      <ActivityTimeline
        sosHistory={sosHistory}
        safetyCheck={safetyCheck}
        notificationLogs={notificationLogs}
        sensorHistory={sensorHistory}
      />
    </div>
  );
};
