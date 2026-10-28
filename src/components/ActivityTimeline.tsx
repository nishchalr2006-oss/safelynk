import React, { useState } from 'react';
import { SOSEvent, SafetyCheck, NotificationLog, SensorReading } from '../types/safelynk';
import { ShieldAlert, AlertCircle, Heart, Mail, CheckCircle2, Clock } from 'lucide-react';

interface ActivityTimelineProps {
  sosHistory: SOSEvent[];
  safetyCheck: SafetyCheck | null;
  notificationLogs: NotificationLog[];
  sensorHistory: SensorReading[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  sosHistory,
  safetyCheck,
  notificationLogs,
  sensorHistory
}) => {
  const [filter, setFilter] = useState<'all' | 'sos' | 'safety_checks' | 'notifications'>('all');

  // Format date helper
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>Real-Time Safety Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Chronological log of safety checks, SOS alarms, and delivery logs</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('sos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'sos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            SOS ({sosHistory.length})
          </button>
          <button
            onClick={() => setFilter('notifications')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === 'notifications' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Notifications ({notificationLogs.length})
          </button>
        </div>
      </div>

      {/* Timeline items */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-800">
        {/* Active Safety Check item if present */}
        {safetyCheck && (filter === 'all' || filter === 'safety_checks') && (
          <div className="relative pl-9 flex items-start gap-3 group">
            <div className="absolute left-2.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-slate-900 animate-ping" />
            <div className="absolute left-2.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-slate-900" />
            <div className="flex-1 bg-amber-950/30 border border-amber-800/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>SAFETY CHECK PENDING</span>
                </span>
                <span className="text-[11px] font-mono text-amber-300">{formatDate(safetyCheck.triggeredAt)}</span>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-medium">{safetyCheck.triggerReason}</p>
              <p className="text-[11px] text-amber-300/80 mt-1">Awaiting user confirmation in Wearer Dashboard.</p>
            </div>
          </div>
        )}

        {/* SOS Events */}
        {(filter === 'all' || filter === 'sos') &&
          sosHistory.map(sos => (
            <div key={sos.id} className="relative pl-9 flex items-start gap-3 group">
              <div className={`absolute left-2.5 top-1 -translate-x-1/2 w-3.5 h-3.5 rounded-full ring-4 ring-slate-900 ${
                sos.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-slate-600'
              }`} />
              <div className={`flex-1 border rounded-xl p-3.5 transition-all ${
                sos.status === 'active'
                  ? 'bg-red-950/40 border-red-800/90 shadow-lg shadow-red-950/20'
                  : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-4 h-4 ${sos.status === 'active' ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className={`text-xs font-bold ${sos.status === 'active' ? 'text-red-300' : 'text-slate-300'}`}>
                      EMERGENCY SOS: {sos.triggerSource.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{formatDate(sos.createdAt)}</span>
                </div>

                <div className="mt-2 text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Status: <strong className="text-white">{sos.status.toUpperCase()}</strong></span>
                  {sos.acknowledgedBy && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Acknowledged by {sos.acknowledgedBy}
                    </span>
                  )}
                  {sos.resolvedNote && <span className="text-slate-400 italic">Note: {sos.resolvedNote}</span>}
                </div>
              </div>
            </div>
          ))}

        {/* Notification Logs */}
        {(filter === 'all' || filter === 'notifications') &&
          notificationLogs.map(log => (
            <div key={log.id} className="relative pl-9 flex items-start gap-3 group">
              <div className="absolute left-2.5 top-1 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
              <div className="flex-1 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      Alert Email Sent to {log.recipientName} ({log.recipientEmail})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{formatDate(log.attemptedAt)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Status: Delivered
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">ID: {log.providerMessageId}</span>
                </div>
              </div>
            </div>
          ))}

        {sosHistory.length === 0 && notificationLogs.length === 0 && !safetyCheck && (
          <div className="text-center py-8 text-slate-500 text-xs">
            No safety events recorded yet. Perform a test SOS or trigger a simulated event to populate logs.
          </div>
        )}
      </div>
    </div>
  );
};
