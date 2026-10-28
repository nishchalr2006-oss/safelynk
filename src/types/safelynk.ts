export type UserRole = 'wearer' | 'trusted_contact' | 'administrator' | 'control_room_operator';

export type SystemSafetyState =
  | 'NORMAL'
  | 'POSSIBLE_STRESS'
  | 'WARNING_ACTIVE'
  | 'USER_CONFIRMED_SAFE'
  | 'SOS_ACTIVE'
  | 'ALERT_PROCESSING'
  | 'ALERT_ACKNOWLEDGED'
  | 'ALERT_RESOLVED';

export type AlertEventType =
  | 'MANUAL_SOS'
  | 'POSSIBLE_STRESS'
  | 'DEVICE_OFFLINE'
  | 'LOW_BATTERY'
  | 'WEARER_MANUAL_SOS'
  | 'DEVICE_MANUAL_SOS'
  | 'MOTION_ALERT'
  | 'SENSOR_CHECK';

export type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TrustedContact {
  id: string;
  wearerId: string;
  contactUserId?: string;
  contactName: string;
  contactEmail: string;
  phoneNumber?: string;
  relationship: string;
  invitationStatus: 'pending' | 'accepted' | 'declined';
  notificationChannels?: ('email' | 'sms' | 'push')[];
  priority?: number;
  verificationStatus?: 'verified' | 'unverified';
  createdAt: string;
  updatedAt?: string;
}

export interface Device {
  id: string;
  wearerId: string;
  deviceName: string;
  deviceIdentifier: string; // e.g., ESP32-SL-8842
  connectionStatus: 'online' | 'offline' | 'degraded' | 'connecting';
  lastSeenAt: string;
  batteryLevel: number; // percentage 0-100
  firmwareVersion: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SensorReading {
  id: string;
  userId?: string;
  deviceId: string;
  heartRate: number | null; // BPM
  heartRateSignalQuality: number; // 0-100 % confidence
  motionX: number | null; // g or m/s^2
  motionY: number | null;
  motionZ: number | null;
  gyroX?: number | null;
  gyroY?: number | null;
  gyroZ?: number | null;
  motionMagnitude: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  batteryLevel?: number | null;
  sensorStatus: 'nominal' | 'elevated_hr' | 'motion_spike' | 'potential_fall' | 'error';
  isValidReading: boolean;
  recordedAt: string;
}

export type SafetyCheckStatus = 'pending' | 'resolved_safe' | 'escalated_sos' | 'expired';

export interface SafetyCheck {
  id: string;
  wearerId: string;
  deviceId: string;
  triggerReason: string; // e.g. "Sustained high HR (>130 BPM) for 15s", "Sudden 3.5G impact"
  status: SafetyCheckStatus;
  triggeredAt: string;
  expiresAt: string;
  resolvedAt?: string;
}

export type SOSTriggerSource =
  | 'physical_button'
  | 'web_app_hold'
  | 'safety_check_timeout'
  | 'fall_detection'
  | 'manual_sos';

export type SOSStatus = 'active' | 'acknowledged' | 'resolved' | 'cancelled';

export interface SOSEvent {
  id: string;
  uniqueEventId: string; // Idempotency key
  wearerId: string;
  wearerName?: string;
  deviceId: string;
  triggerSource: SOSTriggerSource;
  eventType: AlertEventType;
  severity: AlertSeverity;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null; // meters
  locationAddress?: string;
  status: SOSStatus;
  userConfirmationStatus?: 'unconfirmed' | 'confirmed_safe' | 'confirmed_sos';
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedNote?: string;
  escalationState:
    | 'sos_created'
    | 'contacts_notified'
    | 'contact_acknowledged'
    | 'official_escalation_unavailable'
    | 'resolved';
}

export interface NotificationLog {
  id: string;
  alertId: string;
  recipientIdentifier: string; // email or phone
  recipientName: string;
  recipientEmail?: string;
  channel: 'email' | 'sms' | 'browser_push' | 'webhook';
  provider: 'resend' | 'twilio' | 'express_relay' | 'local_sim';
  deliveryStatus: 'queued' | 'sending' | 'provider_accepted' | 'delivered' | 'failed';
  providerMessageId?: string;
  trackingUrl?: string;
  googleMapsUrl?: string;
  attemptCount: number;
  attemptedAt: string;
  deliveredAt?: string;
  errorMessage?: string;
}

export interface DeviceCommand {
  id: string;
  deviceId: string;
  commandType: 'ACKNOWLEDGE_ALERT' | 'SILENCE_BUZZER' | 'UPDATE_CONFIG' | 'STATUS_REPORT';
  payload?: Record<string, any>;
  status: 'pending' | 'sent' | 'executed' | 'failed';
  createdAt: string;
  executedAt?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DeviceTelemetryPayload {
  deviceIdentifier: string;
  deviceToken: string;
  uniqueEventId?: string;
  heartRate?: number;
  heartRateQuality?: number;
  motionX?: number;
  motionY?: number;
  motionZ?: number;
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  batteryLevel?: number;
  buttonPressed?: boolean;
  buttonPressDurationMs?: number;
  timestamp?: string;
}

export interface HardwareSimConfig {
  heartRate: number;
  heartRateQuality: number;
  motionIntensity: number;
  batteryLevel: number;
  isOnline: boolean;
  simulateFall: boolean;
  simulateElevatedHR: boolean;
  simulateBuzzerPattern: 'none' | 'warning' | 'emergency_sos';
}
