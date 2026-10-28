# SAFELYNK — Smart Predictive Women's Safety System

**SAFELYNK** is a wearable-assisted personal safety platform designed to assist wearers in requesting emergency assistance, performing discreet safety checks, monitoring pulse and accelerometer biometrics, and broadcasting emergency alerts to trusted contacts with live GPS coordinates.

---

## 🌟 Key Features

1. **Mobile-First Wearer Dashboard:**
   - **Hold-to-SOS Panic Control:** Deliberate 2.5-second press-and-hold button prevents accidental false triggers.
   - **Predictive Safety Check Workflows:** Automated 45s "Are You Safe?" countdown triggered on pulse spikes (>130 BPM) or G-force impact acceleration (>3.0G).
   - **Real-Time Biometric Monitoring:** Waveform graphs for MAX30102 pulse sensor and MPU6050 accelerometer vector metrics.

2. **Trusted Contact / Parent View:**
   - **Emergency SOS Incident Flashing Panel:** Loud alert badge, direct phone call link, live location radar, and Google Maps directions link.
   - **Acknowledgement Tracking:** Records contact response timestamps and logs delivery audit trails.
   - **Network Invitation Manager:** Pair new trusted contacts via email authorization.

3. **Admin & Hardware Telemetry Monitoring Console:**
   - **Live Ingestion Stream:** JSON telemetry stream inspection for incoming ESP32 HTTP requests.
   - **Hardware Event Simulator:** Test hardware long-press button, motion falls, and pulse spikes directly from the web interface.
   - **Official Escalation State Machine:** Clear compliance state tracking with official integration disclaimer notices.

4. **ESP32 Arduino C++ Firmware:**
   - Production-ready C++ code (`/firmware/esp32_safelynk/esp32_safelynk.ino`) supporting MPU6050, MAX30102 PPG, non-blocking button long-press interrupt handler, and HTTPS bearer token security.

---

## 🏗️ Architecture & Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion.
- **Backend:** Node.js, Express full-stack entry point (`server.ts`).
- **Database & Auth:** PostgreSQL / Supabase schema with Row Level Security (RLS) policies (`/supabase/migrations/20261027_initial_schema.sql`).
- **Hardware Layer:** ESP32, MPU6050 Accelerometer/Gyro, MAX30102 PPG pulse sensor, physical tactile panic button.

---

## 🚀 Quick Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full-Stack Application
```bash
npm run dev
```
The application will launch on **http://localhost:3000** with Express backend routes mounted.

### 3. Deploy Supabase Database Migrations
If connecting to a live Supabase project:
1. Log in to [Supabase Console](https://supabase.com).
2. Open the SQL Editor and paste the contents of `supabase/migrations/20261027_initial_schema.sql`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env` file.

### 4. Flashing ESP32 Firmware
1. Open `/firmware/esp32_safelynk/esp32_safelynk.ino` in Arduino IDE.
2. Follow the wiring diagram in `/firmware/esp32_safelynk/README_HARDWARE.md`.
3. Set your Wi-Fi SSID and Password and flash to your ESP32 board.

---

## 🔒 Security & Privacy

- **Row Level Security (RLS):** Ensures wearers can only view their own sensor records and trusted contacts can only access data for linked wearers.
- **Device Token Authentication:** ESP32 HTTP requests require `Authorization: Bearer tok_esp32_safelynk_prod_8842` headers.
- **Emergency Escalation Disclaimer:** Official emergency-service integration is not configured. Contact local emergency services directly if immediate assistance is required.
