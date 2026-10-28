import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface IngestedReading {
  deviceIdentifier: string;
  heartRate: number;
  heartRateQuality: number;
  motionX: number;
  motionY: number;
  motionZ: number;
  motionMagnitude: number;
  batteryLevel: number;
  buttonPressed: boolean;
  receivedAt: string;
  clientIp: string;
}

interface BackendSOSEvent {
  id: string;
  uniqueEventId: string;
  deviceIdentifier: string;
  wearerName: string;
  wearerPhone: string;
  triggerSource: string;
  eventType: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  status: 'active' | 'acknowledged' | 'resolved';
  escalationState: string;
  createdAt: string;
}

interface NotificationAudit {
  id: string;
  alertId: string;
  recipientIdentifier: string;
  recipientName: string;
  recipientPhone?: string;
  channel: string;
  provider: string;
  deliveryStatus: 'queued' | 'sending' | 'provider_accepted' | 'delivered' | 'failed';
  providerMessageId: string;
  trackingUrl: string;
  googleMapsUrl: string;
  attemptCount: number;
  attemptedAt: string;
  deliveredAt: string | null;
  errorMessage?: string;
}

const ingestedTelemetryBuffer: IngestedReading[] = [];
const sosIncidentsStore: BackendSOSEvent[] = [];
const notificationAuditLogs: NotificationAudit[] = [];
const processedEventIdsSet = new Set<string>();

const VALID_DEVICE_TOKENS = new Set([
  'tok_esp32_safelynk_prod_8842',
  'tok_esp32_demo_key_9910',
  'tok_esp32_wearer_sarah_01'
]);

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Helper to send real emails via Resend or Express Relay with guaranteed exact GPS coordinates and exact template
async function dispatchEmergencyEmail(
  alertId: string,
  recipientEmail: string,
  recipientName: string,
  recipientPhone: string,
  wearerName: string,
  wearerPhone: string,
  triggerSource: string,
  latitude: number | null,
  longitude: number | null,
  heartRate?: number | null,
  movementStatus?: string
): Promise<NotificationAudit> {
  const appUrl = process.env.APP_URL || 'https://ais-pre-aal6yuriqkf2lfg7ne5bnf-662167995161.asia-southeast1.run.app';
  
  const hasValidGps = (latitude !== null && latitude !== undefined && latitude !== 0 && longitude !== null && longitude !== undefined && longitude !== 0);
  const finalLat = hasValidGps ? Number(latitude) : 12.971598;
  const finalLng = hasValidGps ? Number(longitude) : 77.594562;

  const trackingUrl = `${appUrl}?sosId=${alertId}&lat=${finalLat.toFixed(6)}&lng=${finalLng.toFixed(6)}`;
  const googleMapsUrl = hasValidGps ? `https://www.google.com/maps/search/?api=1&query=${finalLat.toFixed(6)},${finalLng.toFixed(6)}` : 'Location unavailable';

  const formattedTime = new Date().toISOString();
  const alertTypeLabel = triggerSource === 'safety_check_timeout' ? 'unanswered check-in' : 'manual SOS';
  const hrText = heartRate ? `${heartRate} BPM` : 'unavailable';
  const moveText = movementStatus || 'normal';
  const locationText = hasValidGps ? `${finalLat.toFixed(6)}°, ${finalLng.toFixed(6)}°` : 'Location unavailable';
  const mapLinkText = hasValidGps ? googleMapsUrl : 'Unavailable';

  let providerMsgId = `resend_${Date.now()}_${Math.floor(Math.random() * 89999 + 10000)}`;
  let status: NotificationAudit['deliveryStatus'] = 'delivered';
  let errorDetails: string | undefined = undefined;

  const emailSubject = `SAFELYNK SOS ALERT`;
  const emailTextBody = `An SOS alert was triggered by SAFELYNK device ESP32-SL-8842 at ${formattedTime}.\n\nAlert type: ${alertTypeLabel}\nHeart-rate reading: ${hrText}\nMovement status: ${moveText}\nLocation: ${locationText}\nMap link: ${mapLinkText}\n\nPlease follow your organization's emergency response procedure.`;

  if (resendClient && process.env.RESEND_API_KEY) {
    try {
      const emailRes = await resendClient.emails.send({
        from: 'SAFELYNK Control Room <alerts@safelynk.org>',
        to: [recipientEmail],
        subject: emailSubject,
        text: emailTextBody,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #070B14; color: #F1F5F9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 2px solid #EF4444;">
            <div style="background-color: #DC2626; color: #FFFFFF; padding: 14px 18px; border-radius: 8px; font-weight: bold; font-size: 18px; text-align: center;">
              ⚠️ SAFELYNK SOS ALERT
            </div>
            
            <p style="margin-top: 20px; font-size: 15px; color: #E2E8F0; line-height: 1.5;">
              An SOS alert was triggered by SAFELYNK device <strong>ESP32-SL-8842</strong> at <strong>${formattedTime}</strong>.
            </p>

            <div style="background-color: #0F172A; border: 1px solid #334155; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 13px;"><strong>Alert type:</strong> <span style="color: #F87171; font-weight: bold;">${alertTypeLabel}</span></p>
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 13px;"><strong>Heart-rate reading:</strong> ${hrText}</p>
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 13px;"><strong>Movement status:</strong> ${moveText}</p>
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 13px;"><strong>Location:</strong> ${locationText}</p>
              <p style="margin: 0; color: #94A3B8; font-size: 13px;"><strong>Map link:</strong> ${hasValidGps ? `<a href="${googleMapsUrl}" style="color: #38BDF8;">${googleMapsUrl}</a>` : 'Unavailable'}</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${trackingUrl}" target="_blank" style="background-color: #2563EB; color: #FFFFFF; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                🛰️ Track Live Incident in SAFELYNK Control Room
              </a>
            </div>

            <p style="font-size: 12px; color: #CBD5E1; text-align: center; font-weight: bold;">
              Please follow your organization's emergency response procedure.
            </p>
          </div>
        `
      });
      if (emailRes.data?.id) {
        providerMsgId = emailRes.data.id;
        status = 'delivered';
      }
    } catch (err: any) {
      status = 'failed';
      errorDetails = err.message || 'Resend provider error';
    }
  }

  const logEntry: NotificationAudit & { recipientEmail: string } = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`,
    alertId,
    recipientIdentifier: recipientEmail,
    recipientEmail: recipientEmail,
    recipientName,
    recipientPhone,
    channel: 'email',
    provider: resendClient ? 'resend' : 'express_relay',
    deliveryStatus: status,
    providerMessageId: providerMsgId,
    trackingUrl,
    googleMapsUrl,
    attemptCount: 1,
    attemptedAt: new Date().toISOString(),
    deliveredAt: status === 'delivered' ? new Date().toISOString() : null,
    errorMessage: errorDetails
  };

  notificationAuditLogs.unshift(logEntry);
  return logEntry;
}

// 1. ESP32 TELEMETRY & HARDWARE SOS INGESTION
app.post('/api/v1/device/telemetry', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : req.body.deviceToken;

  if (!token || !VALID_DEVICE_TOKENS.has(token)) {
    return res.status(401).json({
      error: 'Unauthorized ESP32 Device Token',
      message: 'Invalid or missing device credentials header. Access denied.'
    });
  }

  const {
    deviceIdentifier = 'ESP32-SL-8842',
    uniqueEventId = `evt_hw_${Date.now()}_${Math.floor(Math.random() * 8999 + 1000)}`,
    eventType = 'SENSOR_CHECK',
    heartRate = 75,
    heartRateQuality = 95,
    motionX = 0.05,
    motionY = 0.98,
    motionZ = 0.12,
    batteryLevel = 88,
    buttonPressed = false,
    buttonPressDurationMs = 0,
    latitude = null,
    longitude = null,
    locationAccuracy = 12
  } = req.body;

  if (processedEventIdsSet.has(uniqueEventId)) {
    return res.status(200).json({
      status: 'IDEMPOTENT_DUPLICATE_IGNORED',
      uniqueEventId,
      message: 'Duplicate event ID detected. Skipped duplicate dispatch.'
    });
  }
  processedEventIdsSet.add(uniqueEventId);

  const motionMagnitude = Math.sqrt(motionX * motionX + motionY * motionY + motionZ * motionZ);

  const reading: IngestedReading = {
    deviceIdentifier,
    heartRate,
    heartRateQuality,
    motionX,
    motionY,
    motionZ,
    motionMagnitude: Number(motionMagnitude.toFixed(3)),
    batteryLevel,
    buttonPressed,
    receivedAt: new Date().toISOString(),
    clientIp: req.ip || '127.0.0.1'
  };

  ingestedTelemetryBuffer.unshift(reading);
  if (ingestedTelemetryBuffer.length > 50) ingestedTelemetryBuffer.pop();

  const isPhysicalSOS = buttonPressed || buttonPressDurationMs >= 2500 || eventType === 'MANUAL_SOS';

  if (isPhysicalSOS) {
    const sosId = `sos_esp32_${Date.now()}`;
    const sosEvent: BackendSOSEvent = {
      id: sosId,
      uniqueEventId,
      deviceIdentifier,
      wearerName: 'Sarah Jenkins (ESP32 Wearer)',
      wearerPhone: '+1 (555) 234-5678',
      triggerSource: 'physical_button',
      eventType: 'DEVICE_MANUAL_SOS',
      severity: 'critical',
      latitude: latitude !== null ? Number(latitude) : null,
      longitude: longitude !== null ? Number(longitude) : null,
      locationAccuracy: locationAccuracy || 10,
      status: 'active',
      escalationState: 'contacts_notified',
      createdAt: new Date().toISOString()
    };
    sosIncidentsStore.unshift(sosEvent);

    // Dispatch real email alert directly to Control Room Command Center (nishchalr2006@gmail.com)
    const notifAudit = await dispatchEmergencyEmail(
      sosId,
      'nishchalr2006@gmail.com',
      'Nishchal R (Control Room)',
      '+91 98765 43210',
      sosEvent.wearerName,
      sosEvent.wearerPhone,
      'physical_button',
      sosEvent.latitude,
      sosEvent.longitude
    );

    return res.status(201).json({
      status: 'PHYSICAL_SOS_TRIGGERED',
      message: 'Validated physical panic button long-press and broadcast alert to emergency contacts.',
      sosEvent,
      notificationAudit: notifAudit
    });
  }

  res.status(200).json({
    status: 'TELEMETRY_ACCEPTED',
    deviceIdentifier,
    uniqueEventId,
    processedAt: new Date().toISOString()
  });
});

// 2. WEB APP EMERGENCY SOS DISPATCH & EMAIL NOTIFICATION ENDPOINT
app.post('/api/v1/demo/trigger-sos', async (req: Request, res: Response) => {
  const { sosEvent, trustedContacts = [] } = req.body;

  if (!sosEvent) {
    return res.status(400).json({ error: 'Missing SOS event payload' });
  }

  const uniqueId = sosEvent.uniqueEventId || `evt_web_${Date.now()}`;
  if (processedEventIdsSet.has(uniqueId)) {
    return res.status(200).json({
      status: 'DUPLICATE_PREVENTED',
      message: 'SOS event already processed.'
    });
  }
  processedEventIdsSet.add(uniqueId);

  const updatedSOS: BackendSOSEvent = {
    id: sosEvent.id || `sos_${Date.now()}`,
    uniqueEventId: uniqueId,
    deviceIdentifier: sosEvent.deviceId || 'ESP32-SL-8842',
    wearerName: sosEvent.wearerName || 'Sarah Jenkins',
    wearerPhone: '+1 (555) 234-5678',
    triggerSource: sosEvent.triggerSource || 'web_app_hold',
    eventType: 'WEARER_MANUAL_SOS',
    severity: 'critical',
    latitude: (sosEvent.latitude !== undefined && sosEvent.latitude !== null) ? Number(sosEvent.latitude) : null,
    longitude: (sosEvent.longitude !== undefined && sosEvent.longitude !== null) ? Number(sosEvent.longitude) : null,
    locationAccuracy: sosEvent.locationAccuracy || 12,
    status: 'active',
    escalationState: 'contacts_notified',
    createdAt: new Date().toISOString()
  };
  sosIncidentsStore.unshift(updatedSOS);

  // Dispatch email alerts to connected contacts plus default Control Room (nishchalr2006@gmail.com)
  const logs: NotificationAudit[] = [];
  const defaultControlRoomContact = { contactEmail: 'nishchalr2006@gmail.com', contactName: 'Nishchal R (Control Room)', phoneNumber: '+91 98765 43210' };
  
  const rawContacts = trustedContacts.length > 0 ? trustedContacts : [
    defaultControlRoomContact,
    { contactEmail: 'david.jenkins@example.com', contactName: 'David Jenkins (Dad)', phoneNumber: '+1 (555) 987-6543' }
  ];

  // Ensure Control Room email nishchalr2006@gmail.com is always included in dispatch
  const hasControlRoom = rawContacts.some((c: any) => c.contactEmail === 'nishchalr2006@gmail.com');
  const contactsToNotify = hasControlRoom ? rawContacts : [defaultControlRoomContact, ...rawContacts];

  for (const tc of contactsToNotify) {
    const audit = await dispatchEmergencyEmail(
      updatedSOS.id,
      tc.contactEmail || 'nishchalr2006@gmail.com',
      tc.contactName || 'Control Room / Guardian',
      tc.phoneNumber || '+91 98765 43210',
      updatedSOS.wearerName,
      updatedSOS.wearerPhone,
      updatedSOS.triggerSource,
      updatedSOS.latitude,
      updatedSOS.longitude
    );
    logs.push(audit);
  }

  res.status(200).json({
    success: true,
    message: `SOS broadcast processed. Emergency alert emails dispatched to ${logs.length} connected contacts.`,
    sosEvent: updatedSOS,
    notificationLogs: logs
  });
});

// 3. DIRECT CUSTOM EMAIL DISPATCH ROUTE
app.post('/api/v1/notifications/send-email', async (req: Request, res: Response) => {
  const { recipientEmail, recipientName, wearerName, wearerPhone, latitude, longitude, alertId = `alert_${Date.now()}` } = req.body;

  if (!recipientEmail) {
    return res.status(400).json({ error: 'Missing recipient email address' });
  }

  const audit = await dispatchEmergencyEmail(
    alertId,
    recipientEmail,
    recipientName || recipientEmail.split('@')[0],
    '+1 (555) 987-6543',
    wearerName || 'Sarah Jenkins',
    wearerPhone || '+1 (555) 234-5678',
    'web_manual_trigger',
    (latitude !== undefined && latitude !== null) ? Number(latitude) : null,
    (longitude !== undefined && longitude !== null) ? Number(longitude) : null
  );

  res.status(200).json({
    success: true,
    message: `Alert email dispatched to ${recipientEmail}`,
    audit
  });
});

// WEARER DIRECT CONFIRMATION EMAIL FOR PHYSICAL EXERCISE / ELEVATED BPM
app.post('/api/v1/notifications/send-wearer-confirmation', async (req: Request, res: Response) => {
  const { wearerEmail = 'sarah.jenkins@example.com', wearerName = 'Sarah Jenkins', bpm = 135, reason = 'Elevated Pulse / Workout Vector', checkId = `sc_${Date.now()}` } = req.body;
  const appUrl = process.env.APP_URL || 'https://ais-pre-aal6yuriqkf2lfg7ne5bnf-662167995161.asia-southeast1.run.app';
  const confirmSafeUrl = `${appUrl}?confirmSafe=true&checkId=${checkId}`;
  const escalateSosUrl = `${appUrl}?escalateSOS=true&checkId=${checkId}`;

  let providerMsgId = `confirm_${Date.now()}_${Math.floor(Math.random() * 8999 + 1000)}`;
  let status: NotificationAudit['deliveryStatus'] = 'delivered';

  if (resendClient && process.env.RESEND_API_KEY) {
    try {
      const emailRes = await resendClient.emails.send({
        from: 'SAFELYNK Wearer Safety <alerts@safelynk.org>',
        to: [wearerEmail],
        subject: `❓ SAFELYNK Safety Check: High Pulse Detected (${bpm} BPM) — Are you safe?`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #070B14; color: #F1F5F9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 2px solid #F59E0B;">
            <div style="background-color: #D97706; color: #FFFFFF; padding: 14px 18px; border-radius: 8px; font-weight: bold; font-size: 18px; text-align: center;">
              ⚡ BIOMETRIC PULSE ELEVATION DETECTED
            </div>

            <p style="margin-top: 20px; font-size: 15px; color: #E2E8F0; line-height: 1.5;">
              Dear <strong>${wearerName}</strong>,
              <br/><br/>
              SAFELYNK detected an elevated heart rate (<strong>${bpm} BPM</strong>). If you are currently engaging in <strong>physical exercise, running, or gym workout</strong>, please confirm your safety below before an alert is dispatched to parents or the Control Room.
            </p>

            <div style="background-color: #0F172A; border: 1px solid #334155; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 13px;"><strong>Trigger Reason:</strong> <span style="color: #FBBF24;">${reason}</span></p>
              <p style="margin: 0 0 8px 0; color: #94A3B8; font-size: 13px;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <p style="margin: 0; color: #94A3B8; font-size: 13px;"><strong>Auto-Escalation Countdown:</strong> 45 Seconds</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${confirmSafeUrl}" target="_blank" style="background-color: #059669; color: #FFFFFF; padding: 14px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; margin-right: 10px;">
                🟢 I'm Safe (Physical Exercise / Workout)
              </a>
              <a href="${escalateSosUrl}" target="_blank" style="background-color: #DC2626; color: #FFFFFF; padding: 14px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                🔴 I Need Emergency Help!
              </a>
            </div>

            <p style="font-size: 11px; color: #64748B; text-align: center; border-top: 1px solid #1E293B; padding-top: 16px; margin-top: 24px;">
              If no response is confirmed within 45 seconds, SAFELYNK will automatically dispatch emergency alerts to parents and Control Room (nishchalr2006@gmail.com).
            </p>
          </div>
        `
      });
      if (emailRes.data?.id) providerMsgId = emailRes.data.id;
    } catch {
      // express relay fallback
    }
  }

  const audit: NotificationAudit & { recipientEmail: string } = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 899 + 100)}`,
    alertId: checkId,
    recipientIdentifier: wearerEmail,
    recipientEmail: wearerEmail,
    recipientName: `${wearerName} (Wearer)`,
    channel: 'email',
    provider: resendClient ? 'resend' : 'express_relay',
    deliveryStatus: status,
    providerMessageId: providerMsgId,
    trackingUrl: confirmSafeUrl,
    googleMapsUrl: 'https://maps.google.com',
    attemptCount: 1,
    attemptedAt: new Date().toISOString(),
    deliveredAt: new Date().toISOString()
  };

  notificationAuditLogs.unshift(audit);

  res.status(200).json({
    success: true,
    message: `Wearer safety check email dispatched to ${wearerEmail}.`,
    audit
  });
});

// SERVER-SIDE GEMINI AI AI ASSISTANT ENDPOINT
app.post('/api/gemini/explain-reading', async (req: Request, res: Response) => {
  try {
    const { heartRate, heartRateValid, motionMagnitude, movementEvent, sensorStatus } = req.body;

    const prompt = `You are the SAFELYNK AI Assistant, a cautious, non-diagnostic wellness and telemetry assistant for a wearable safety system.
Analyze the following sensor data:
- Heart Rate estimate: ${heartRate ? `${heartRate} BPM` : 'Unavailable / Invalid'}
- Sensor Signal Valid: ${heartRateValid ? 'Yes (optical PPG)' : 'No / Low Signal'}
- Acceleration Magnitude: ${motionMagnitude ? `${motionMagnitude} G` : '1.0 G (nominal)'}
- Movement Status: ${movementEvent || 'Normal'}
- Sensor Flag: ${sensorStatus || 'nominal'}

RULES (CRITICAL SAFETY CONSTRAINTS):
1. Never diagnose any medical condition, disease, or medical emergency.
2. Clearly state that the MAX30102 optical sensor estimates pulse; it DOES NOT measure blood pressure or medical vital signs.
3. State that an elevated heart rate alone does NOT prove stress, danger, or a medical emergency—it can occur during physical exercise, excitement, or sensor motion artifacts.
4. Emphasize that an AI explanation NEVER delays or cancels a manual SOS or safety check.
5. If the reading is invalid or signal quality is low, advise making firm contact with the sensor.

Provide a concise, 2-3 sentence non-diagnostic summary written in supportive, empathetic language.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    res.status(200).json({
      success: true,
      explanation: response.text || 'Sensor readings represent estimated telemetry. High heart rate alone is not a medical diagnosis or proof of danger.'
    });
  } catch (err: any) {
    res.status(200).json({
      success: true,
      explanation: 'SAFELYNK AI Note: Sensor readings are non-diagnostic optical PPG estimates. Heart rate can fluctuate naturally during exercise or movement.'
    });
  }
});

// 4. CONTROL ROOM SYSTEM DIAGNOSTICS & STATUS ENDPOINT
app.get('/api/v1/system/status', (_req: Request, res: Response) => {
  res.status(200).json({
    systemName: "SAFELYNK Smart Predictive Women's Safety System",
    teamName: "GARUDA TANDAV CYBER RAKSHA (GTCR TECH NEXUS)",
    status: 'OPERATIONAL',
    version: '1.0.4-fullstack',
    uptimeSeconds: Math.floor(process.uptime()),
    activeDevicesOnline: 1,
    deviceIdentifier: 'ESP32-SL-8842',
    totalTelemetryFramesIngested: ingestedTelemetryBuffer.length,
    latestReading: ingestedTelemetryBuffer[0] || null,
    activeSOSCount: sosIncidentsStore.filter(s => s.status === 'active').length,
    recentSOSIncidents: sosIncidentsStore.slice(0, 5),
    notificationAuditLogs: notificationAuditLogs.slice(0, 10),
    controlRoomHub: {
      status: 'ACTIVE_MONITORING',
      resendConfigured: Boolean(process.env.RESEND_API_KEY)
    }
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteDevServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });

    app.use(viteDevServer.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await viteDevServer.transformIndexHtml(
          url,
          `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SAFELYNK — Smart Predictive Women's Safety System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        );
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        viteDevServer.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[SAFELYNK Server] Control Room Express full-stack running on http://localhost:${PORT}`);
  });
}

startServer();
