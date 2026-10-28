-- SAFELYNK Smart Predictive Women's Safety System Database Schema
-- Migration File: 20261027_initial_schema.sql
-- Compatible with Supabase PostgreSQL and Row Level Security (RLS)

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLE 1: PROFILES
-- Stores user identity, role, display name, and contact details
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  role TEXT NOT NULL DEFAULT 'wearer' CHECK (role IN ('wearer', 'trusted_contact', 'administrator', 'control_room_operator')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE 2: DEVICES
-- Stores authorized wearable hardware modules and telemetry connection status
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wearer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL DEFAULT 'SAFELYNK Band Pro',
  device_identifier TEXT UNIQUE NOT NULL, -- e.g. ESP32-SL-8842
  connection_status TEXT DEFAULT 'online' CHECK (connection_status IN ('online', 'offline', 'degraded', 'connecting')),
  firmware_version TEXT DEFAULT 'v1.0.4-esp32',
  battery_level INT DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
  last_seen_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE 3: EMERGENCY_CONTACTS (TRUSTED CONTACTS)
-- Stores verified emergency contacts for each wearer
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  phone_number TEXT,
  relationship TEXT NOT NULL DEFAULT 'Primary Guardian',
  enabled_channels TEXT[] DEFAULT ARRAY['email']::TEXT[], -- e.g. ['email', 'sms', 'push']
  priority INT DEFAULT 1,
  verification_status TEXT DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'unverified')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE 4: SENSOR_READINGS
-- Stores sampled heart rate (BPM), pulse signal quality, accelerometer/gyro, GPS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  heart_rate INT CHECK (heart_rate IS NULL OR (heart_rate >= 30 AND heart_rate <= 220)),
  heart_rate_quality INT DEFAULT 100 CHECK (heart_rate_quality >= 0 AND heart_rate_quality <= 100),
  motion_x NUMERIC(6,3),
  motion_y NUMERIC(6,3),
  motion_z NUMERIC(6,3),
  gyro_x NUMERIC(6,3),
  gyro_y NUMERIC(6,3),
  gyro_z NUMERIC(6,3),
  motion_magnitude NUMERIC(6,3),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  gps_accuracy NUMERIC(8,2),
  battery_level INT CHECK (battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 100)),
  is_valid_reading BOOLEAN DEFAULT TRUE,
  sensor_status TEXT DEFAULT 'nominal' CHECK (sensor_status IN ('nominal', 'elevated_hr', 'motion_spike', 'potential_fall', 'error')),
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE 5: ALERTS
-- Stores emergency SOS incidents, possible-stress warnings, and status tracking
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unique_event_id TEXT UNIQUE NOT NULL, -- Idempotency protection key
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('MANUAL_SOS', 'POSSIBLE_STRESS', 'DEVICE_OFFLINE', 'LOW_BATTERY', 'WEARER_MANUAL_SOS', 'DEVICE_MANUAL_SOS', 'MOTION_ALERT', 'SENSOR_CHECK')),
  severity TEXT NOT NULL DEFAULT 'critical' CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled')),
  user_confirmation_status TEXT DEFAULT 'unconfirmed' CHECK (user_confirmation_status IN ('unconfirmed', 'confirmed_safe', 'confirmed_sos')),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  location_accuracy NUMERIC(8,2),
  location_address TEXT,
  sensor_summary TEXT,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  event_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE 6: NOTIFICATION_DELIVERIES
-- Audit log of email/SMS dispatch attempts with provider transaction message IDs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  recipient_identifier TEXT NOT NULL, -- Email address or phone number
  recipient_channel TEXT NOT NULL DEFAULT 'email' CHECK (recipient_channel IN ('email', 'sms', 'push', 'webhook')),
  provider TEXT NOT NULL DEFAULT 'resend' CHECK (provider IN ('resend', 'twilio', 'express_relay', 'local_sim')),
  delivery_status TEXT DEFAULT 'queued' CHECK (delivery_status IN ('queued', 'sending', 'provider_accepted', 'delivered', 'failed')),
  provider_message_id TEXT,
  attempt_count INT DEFAULT 1,
  last_attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- TABLE 7: DEVICE_COMMANDS
-- Remote command queue for ESP32 hardware devices (e.g., silence buzzer, update config)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.device_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL CHECK (command_type IN ('ACKNOWLEDGE_ALERT', 'SILENCE_BUZZER', 'UPDATE_CONFIG', 'STATUS_REPORT')),
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'executed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  executed_at TIMESTAMPTZ
);

-- ==============================================================================
-- TABLE 8: AUDIT_LOGS
-- Records security actions, alert acknowledgements, and configuration changes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_time ON public.sensor_readings(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON public.alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_unique_event ON public.alerts(unique_event_id);
CREATE INDEX IF NOT EXISTS idx_devices_wearer ON public.devices(wearer_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_owner ON public.emergency_contacts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_alert ON public.notification_deliveries(alert_id);

-- ==============================================================================
-- AUTOMATED UPDATED_AT TRIGGER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_devices_updated_at ON public.devices;
CREATE TRIGGER trigger_devices_updated_at BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_emergency_contacts_updated_at ON public.emergency_contacts;
CREATE TRIGGER trigger_emergency_contacts_updated_at BEFORE UPDATE ON public.emergency_contacts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_alerts_updated_at ON public.alerts;
CREATE TRIGGER trigger_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures strict data isolation per user role
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile or profiles of linked contacts" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.emergency_contacts ec
      WHERE ec.owner_user_id = auth.uid() AND ec.contact_user_id = profiles.id
    )
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Devices Policies
CREATE POLICY "Wearers can manage their devices" ON public.devices
  FOR ALL USING (auth.uid() = wearer_id);

CREATE POLICY "Emergency contacts can view devices of linked wearers" ON public.devices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.emergency_contacts ec
      WHERE ec.owner_user_id = devices.wearer_id
      AND (ec.contact_user_id = auth.uid() OR ec.contact_email = auth.jwt()->>'email')
    )
  );

-- 3. Emergency Contacts Policies
CREATE POLICY "Owners can manage their emergency contacts" ON public.emergency_contacts
  FOR ALL USING (auth.uid() = owner_user_id);

CREATE POLICY "Contacts can view relationship records" ON public.emergency_contacts
  FOR SELECT USING (contact_user_id = auth.uid() OR contact_email = auth.jwt()->>'email');

-- 4. Sensor Readings Policies
CREATE POLICY "Wearers can view their sensor readings" ON public.sensor_readings
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.devices d
      WHERE d.id = sensor_readings.device_id AND d.wearer_id = auth.uid()
    )
  );

-- 5. Alerts Policies
CREATE POLICY "Wearers can manage their alerts" ON public.alerts
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Emergency contacts can view and acknowledge alerts" ON public.alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.emergency_contacts ec
      WHERE ec.owner_user_id = alerts.user_id
      AND (ec.contact_user_id = auth.uid() OR ec.contact_email = auth.jwt()->>'email')
    )
  );

-- 6. Notification Deliveries Policies
CREATE POLICY "Users can view notification delivery logs for their alerts" ON public.notification_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.alerts a
      WHERE a.id = notification_deliveries.alert_id
      AND (a.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.emergency_contacts ec
        WHERE ec.owner_user_id = a.user_id AND (ec.contact_user_id = auth.uid() OR ec.contact_email = auth.jwt()->>'email')
      ))
    )
  );

-- Enable Supabase Realtime Publication for Live Dashboard Updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;

-- ==============================================================================
-- VERIFICATION QUERY
-- ==============================================================================
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'devices', 'emergency_contacts', 'sensor_readings', 'alerts', 'notification_deliveries', 'device_commands', 'audit_logs');
