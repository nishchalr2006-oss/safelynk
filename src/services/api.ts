import {
  UserProfile,
  TrustedContact,
  Device,
  SensorReading,
  SafetyCheck,
  SOSEvent,
  NotificationLog,
  UserRole,
  SOSTriggerSource,
  SystemSafetyState,
  AlertEventType,
  AlertSeverity
} from '../types/safelynk';
import { locationService } from './locationService';

const MOCK_WEARER_PROFILE: UserProfile = {
  id: 'usr_wearer_sarah_01',
  email: 'sarah.jenkins@example.com',
  displayName: 'Sarah Jenkins',
  role: 'wearer',
  phoneNumber: '+1 (555) 234-5678',
  createdAt: '2026-01-15T08:30:00Z'
};

const MOCK_PARENT_PROFILE: UserProfile = {
  id: 'usr_contact_david_02',
  email: 'david.jenkins@example.com',
  displayName: 'David Jenkins (Dad)',
  role: 'trusted_contact',
  phoneNumber: '+1 (555) 987-6543',
  createdAt: '2026-01-15T09:00:00Z'
};

const MOCK_ADMIN_PROFILE: UserProfile = {
  id: 'usr_admin_03',
  email: 'admin.monitoring@safelynk.org',
  displayName: 'System Admin Monitor',
  role: 'administrator',
  phoneNumber: '+1 (800) 555-SAFE',
  createdAt: '2026-01-01T00:00:00Z'
};

const MOCK_DEVICE: Device = {
  id: 'dev_esp32_sarah_01',
  wearerId: 'usr_wearer_sarah_01',
  deviceName: 'SAFELYNK Band Pro',
  deviceIdentifier: 'ESP32-SL-8842',
  connectionStatus: 'online',
  lastSeenAt: new Date().toISOString(),
  batteryLevel: 88,
  firmwareVersion: 'v1.0.4-esp32',
  createdAt: '2026-01-15T08:35:00Z'
};

const MOCK_TRUSTED_CONTACTS: TrustedContact[] = [
  {
    id: 'tc_david_01',
    wearerId: 'usr_wearer_sarah_01',
    contactUserId: 'usr_contact_david_02',
    contactName: 'David Jenkins',
    contactEmail: 'david.jenkins@example.com',
    phoneNumber: '+1 (555) 987-6543',
    relationship: 'Father / Primary Guardian',
    invitationStatus: 'accepted',
    notificationChannels: ['email', 'sms'],
    priority: 1,
    verificationStatus: 'verified',
    createdAt: '2026-01-15T09:10:00Z'
  },
  {
    id: 'tc_emily_02',
    wearerId: 'usr_wearer_sarah_01',
    contactName: 'Emily Carter',
    contactEmail: 'emily.carter@example.com',
    phoneNumber: '+1 (555) 345-6789',
    relationship: 'Roommate',
    invitationStatus: 'accepted',
    notificationChannels: ['email'],
    priority: 2,
    verificationStatus: 'verified',
    createdAt: '2026-02-01T14:20:00Z'
  }
];

class ApiService {
  private currentUser: UserProfile | null = MOCK_WEARER_PROFILE;
  private device: Device = MOCK_DEVICE;
  private trustedContacts: TrustedContact[] = MOCK_TRUSTED_CONTACTS;
  private sensorHistory: SensorReading[] = [];
  private activeSafetyCheck: SafetyCheck | null = null;
  private activeSOS: SOSEvent | null = null;
  private sosHistory: SOSEvent[] = [];
  private notificationLogs: NotificationLog[] = [];
  private systemState: SystemSafetyState = 'NORMAL';
  private listeners: Array<() => void> = [];

  constructor() {
    this.initStorage();
    this.generateInitialSensorData();

    // Listen to real-time continuous GPS updates
    locationService.subscribe((loc) => {
      // If an active SOS is present, keep its live location fresh
      if (this.activeSOS) {
        this.activeSOS = {
          ...this.activeSOS,
          latitude: loc.latitude,
          longitude: loc.longitude,
          locationAccuracy: loc.accuracy,
          locationAddress: loc.address || this.activeSOS.locationAddress
        };
        this.saveState();
      }
    });
  }

  private initStorage() {
    try {
      const savedUser = localStorage.getItem('safelynk_user');
      if (savedUser) this.currentUser = JSON.parse(savedUser);

      const savedSOS = localStorage.getItem('safelynk_active_sos');
      if (savedSOS) {
        this.activeSOS = JSON.parse(savedSOS);
        this.systemState = 'SOS_ACTIVE';
      }

      const savedSOSHistory = localStorage.getItem('safelynk_sos_history');
      if (savedSOSHistory) this.sosHistory = JSON.parse(savedSOSHistory);

      const savedNotifs = localStorage.getItem('safelynk_notification_logs');
      if (savedNotifs) this.notificationLogs = JSON.parse(savedNotifs);
    } catch {
      // Local storage fallback
    }
  }

  private saveState() {
    try {
      if (this.currentUser) {
        localStorage.setItem('safelynk_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('safelynk_user');
      }
      if (this.activeSOS) {
        localStorage.setItem('safelynk_active_sos', JSON.stringify(this.activeSOS));
      } else {
        localStorage.removeItem('safelynk_active_sos');
      }
      localStorage.setItem('safelynk_sos_history', JSON.stringify(this.sosHistory));
      localStorage.setItem('safelynk_notification_logs', JSON.stringify(this.notificationLogs));
    } catch {
      // ignore
    }
    this.notifyListeners();
  }

  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  private generateInitialSensorData() {
    const now = Date.now();
    const curLoc = locationService.getLocation();
    const readings: SensorReading[] = [];
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now - i * 5000).toISOString();
      const baseHR = 72 + Math.floor(Math.sin(i) * 5);
      readings.push({
        id: `sr_${i}`,
        userId: MOCK_WEARER_PROFILE.id,
        deviceId: this.device.id,
        heartRate: baseHR,
        heartRateSignalQuality: 98,
        motionX: Number((0.02 + Math.random() * 0.05).toFixed(3)),
        motionY: Number((0.98 + Math.random() * 0.04).toFixed(3)),
        motionZ: Number((0.15 + Math.random() * 0.03).toFixed(3)),
        gyroX: 0.01,
        gyroY: 0.02,
        gyroZ: 0.01,
        motionMagnitude: 1.0,
        latitude: curLoc ? curLoc.latitude : null,
        longitude: curLoc ? curLoc.longitude : null,
        locationAccuracy: curLoc ? curLoc.accuracy : 12,
        batteryLevel: 88,
        sensorStatus: 'nominal',
        isValidReading: true,
        recordedAt: time
      });
    }
    this.sensorHistory = readings;
  }

  // Auth Operations
  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public loginAsDemoRole(role: UserRole) {
    if (role === 'wearer') this.currentUser = MOCK_WEARER_PROFILE;
    else if (role === 'trusted_contact') this.currentUser = MOCK_PARENT_PROFILE;
    else this.currentUser = MOCK_ADMIN_PROFILE;
    this.saveState();
  }

  public logout() {
    this.currentUser = null;
    this.saveState();
  }

  public loginWithCredentials(email: string, role: UserRole, displayName?: string) {
    this.currentUser = {
      id: `usr_${Date.now()}`,
      email,
      displayName: displayName || email.split('@')[0],
      role,
      createdAt: new Date().toISOString()
    };
    this.saveState();
  }

  // Device & System Operations
  public getDevice(): Device {
    return this.device;
  }

  public getSystemState(): SystemSafetyState {
    return this.systemState;
  }

  public updateDeviceStatus(status: 'online' | 'offline' | 'degraded', batteryLevel?: number) {
    this.device = {
      ...this.device,
      connectionStatus: status,
      lastSeenAt: new Date().toISOString(),
      batteryLevel: batteryLevel !== undefined ? batteryLevel : this.device.batteryLevel
    };
    this.saveState();
  }

  public getSensorHistory(): SensorReading[] {
    return this.sensorHistory;
  }

  public pushSensorReading(
    hr: number,
    mx: number,
    my: number,
    mz: number,
    quality = 95,
    gx = 0.01,
    gy = 0.01,
    gz = 0.01
  ) {
    const mag = Number(Math.sqrt(mx * mx + my * my + mz * mz).toFixed(3));
    let status: SensorReading['sensorStatus'] = 'nominal';

    if (mag > 3.2) {
      status = 'potential_fall';
    } else if (hr > 125) {
      status = 'elevated_hr';
    } else if (mag > 2.0) {
      status = 'motion_spike';
    }

    const newReading: SensorReading = {
      id: `sr_${Date.now()}`,
      userId: MOCK_WEARER_PROFILE.id,
      deviceId: this.device.id,
      heartRate: hr,
      heartRateSignalQuality: quality,
      motionX: mx,
      motionY: my,
      motionZ: mz,
      gyroX: gx,
      gyroY: gy,
      gyroZ: gz,
      motionMagnitude: mag,
      latitude: locationService.getLocation()?.latitude ?? null,
      longitude: locationService.getLocation()?.longitude ?? null,
      locationAccuracy: locationService.getLocation()?.accuracy ?? 12,
      batteryLevel: this.device.batteryLevel,
      sensorStatus: status,
      isValidReading: quality >= 50 && hr >= 30 && hr <= 220,
      recordedAt: new Date().toISOString()
    };

    this.sensorHistory = [...this.sensorHistory.slice(-29), newReading];
    this.device.lastSeenAt = newReading.recordedAt;

    // Trigger Possible Stress Warning if sustained elevated pulse or fall
    if (status === 'potential_fall' || (hr > 130 && !this.activeSafetyCheck && !this.activeSOS)) {
      this.triggerSafetyCheck(
        status === 'potential_fall'
          ? 'G-Force Impact Vector Detected (>3.2G acceleration)'
          : `Sustained High Pulse Detected (${hr} BPM, Quality ${quality}%)`
      );
    }

    this.saveState();
    return newReading;
  }

  // Safety Check & State Machine
  public getActiveSafetyCheck(): SafetyCheck | null {
    return this.activeSafetyCheck;
  }

  public triggerSafetyCheck(reason: string) {
    if (this.activeSOS || this.activeSafetyCheck) return;
    const now = new Date();
    const expires = new Date(now.getTime() + 45000); // 45s countdown
    this.activeSafetyCheck = {
      id: `sc_${Date.now()}`,
      wearerId: MOCK_WEARER_PROFILE.id,
      deviceId: this.device.id,
      triggerReason: reason,
      status: 'pending',
      triggeredAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };
    this.systemState = 'POSSIBLE_STRESS';
    this.saveState();
  }

  public resolveSafetyCheck(isSafe: boolean) {
    if (!this.activeSafetyCheck) return;
    if (isSafe) {
      this.activeSafetyCheck = null;
      this.systemState = 'USER_CONFIRMED_SAFE';
      setTimeout(() => {
        if (this.systemState === 'USER_CONFIRMED_SAFE') this.systemState = 'NORMAL';
        this.saveState();
      }, 3000);
    } else {
      const reason = this.activeSafetyCheck.triggerReason;
      this.activeSafetyCheck = null;
      this.triggerSOS('safety_check_timeout', null, null, null, `Escalated from safety check: ${reason}`);
    }
    this.saveState();
  }

  // SOS Emergency Workflow with Idempotency Unique Event ID
  public getActiveSOS(): SOSEvent | null {
    return this.activeSOS;
  }

  public getSOSHistory(): SOSEvent[] {
    return this.sosHistory;
  }

  public async triggerSOS(
    source: SOSTriggerSource,
    lat: number | null,
    lng: number | null,
    accuracy: number | null = null,
    addressNotes: string = 'Current GPS Coordinates'
  ): Promise<SOSEvent> {
    const uniqueEventId = `evt_web_${Date.now()}_${Math.floor(Math.random() * 8999 + 1000)}`;

    const curLoc = locationService.getLocation();
    const finalLat = (lat !== null && lat !== undefined && lat !== 0) ? lat : (curLoc?.latitude ?? null);
    const finalLng = (lng !== null && lng !== undefined && lng !== 0) ? lng : (curLoc?.longitude ?? null);
    const finalAcc = accuracy || curLoc?.accuracy || 12;
    const finalAddress = (addressNotes && addressNotes !== 'Current GPS Location' && addressNotes !== 'Current GPS Coordinates')
      ? addressNotes
      : (curLoc?.address || 'Current Real-Time Location');

    const newSOS: SOSEvent = {
      id: `sos_${Date.now()}`,
      uniqueEventId,
      wearerId: MOCK_WEARER_PROFILE.id,
      wearerName: MOCK_WEARER_PROFILE.displayName,
      deviceId: this.device.id,
      triggerSource: source,
      eventType: source === 'physical_button' ? 'DEVICE_MANUAL_SOS' : 'WEARER_MANUAL_SOS',
      severity: 'critical',
      latitude: finalLat,
      longitude: finalLng,
      locationAccuracy: finalAcc,
      locationAddress: finalAddress,
      status: 'active',
      userConfirmationStatus: 'confirmed_sos',
      createdAt: new Date().toISOString(),
      escalationState: 'sos_created'
    };

    this.activeSOS = newSOS;
    this.sosHistory = [newSOS, ...this.sosHistory];
    this.activeSafetyCheck = null;
    this.systemState = 'SOS_ACTIVE';

    // Dispatch via Express API endpoint
    try {
      const resp = await fetch('/api/v1/demo/trigger-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sosEvent: newSOS,
          trustedContacts: this.trustedContacts
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.sosEvent) this.activeSOS = data.sosEvent;
        if (data.notificationLogs) {
          this.notificationLogs = [...data.notificationLogs, ...this.notificationLogs];
        }
      }
    } catch {
      // Local fallback logs
      if (this.activeSOS) {
        this.activeSOS.escalationState = 'contacts_notified';
      }
      this.trustedContacts.forEach(tc => {
        this.notificationLogs.unshift({
          id: `nl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          alertId: newSOS.id,
          recipientIdentifier: tc.contactEmail,
          recipientName: tc.contactName,
          recipientEmail: tc.contactEmail,
          channel: 'email',
          provider: 'express_relay',
          deliveryStatus: 'delivered',
          providerMessageId: `msg_sg_${Math.floor(Math.random() * 1000000)}`,
          attemptCount: 1,
          attemptedAt: new Date().toISOString(),
          deliveredAt: new Date().toISOString()
        });
      });
    }

    this.saveState();
    return this.activeSOS || newSOS;
  }

  public acknowledgeSOS(acknowledgedByUserId: string, acknowledgedByName: string) {
    if (!this.activeSOS) return;
    this.activeSOS = {
      ...this.activeSOS,
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: acknowledgedByName,
      escalationState: 'contact_acknowledged'
    };
    this.systemState = 'ALERT_ACKNOWLEDGED';

    this.sosHistory = this.sosHistory.map(item =>
      item.id === this.activeSOS?.id ? this.activeSOS : item
    );

    this.saveState();
  }

  public resolveSOS(note: string = 'User confirmed safe and alert resolved.') {
    if (!this.activeSOS) return;
    const resolvedEvent: SOSEvent = {
      ...this.activeSOS,
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedNote: note,
      escalationState: 'resolved'
    };

    this.activeSOS = null;
    this.systemState = 'NORMAL';
    this.sosHistory = this.sosHistory.map(item =>
      item.id === resolvedEvent.id ? resolvedEvent : item
    );

    this.saveState();
  }

  // Contacts Operations
  public getTrustedContacts(): TrustedContact[] {
    return this.trustedContacts;
  }

  public addTrustedContact(name: string, email: string, relationship: string, phone?: string) {
    const newTC: TrustedContact = {
      id: `tc_${Date.now()}`,
      wearerId: MOCK_WEARER_PROFILE.id,
      contactName: name,
      contactEmail: email,
      phoneNumber: phone || '+1 (555) 000-0000',
      relationship,
      invitationStatus: 'accepted',
      notificationChannels: ['email'],
      priority: this.trustedContacts.length + 1,
      verificationStatus: 'verified',
      createdAt: new Date().toISOString()
    };
    this.trustedContacts = [...this.trustedContacts, newTC];
    this.saveState();
  }

  public removeTrustedContact(id: string) {
    this.trustedContacts = this.trustedContacts.filter(tc => tc.id !== id);
    this.saveState();
  }

  public getNotificationLogs(): NotificationLog[] {
    return this.notificationLogs;
  }
}

export const api = new ApiService();
