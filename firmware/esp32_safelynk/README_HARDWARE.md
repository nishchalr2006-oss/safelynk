# SAFELYNK Firmware & Hardware Integration Guide
**Team:** GARUDA TANDAV CYBER RAKSHA (GTCR TECH NEXUS)  
**Sketch:** `firmware/esp32_safelynk/esp32_safelynk.ino`

---

## 1. Verified Pinout Table

| ESP32 GPIO Pin | Connected Hardware Component | Notes |
| :--- | :--- | :--- |
| **GPIO 21 (SDA)** | MAX30102 SDA & MPU6050 SDA | Requires 4.7kΩ I2C pullup resistors to 3.3V |
| **GPIO 22 (SCL)** | MAX30102 SCL & MPU6050 SCL | Requires 4.7kΩ I2C pullup resistors to 3.3V |
| **GPIO 15** | Physical Panic SOS Button | Internal `INPUT_PULLUP` enabled (Active LOW) |
| **GPIO 27** | Active Buzzer Module | Local non-blocking PWM/digital tone alert |
| **GPIO 13** | Red LED (Status Light) | Active HIGH |
| **GPIO 12** | Green LED (Status Light) | Active HIGH |
| **GPIO 14** | Blue LED (Status Light) | Active HIGH |
| **GPIO 34 (A0)** | Battery Voltage Divider | Optional 10k/100k analog voltage reader |

---

## 2. Required Arduino IDE Libraries & Versions

1. **SparkFun MAX3010x Pulse and Proximity Sensor Library** (by SparkFun Electronics, v1.1.2 or higher)
2. **Adafruit MPU6050** (by Adafruit, v2.2.4 or higher)
3. **Adafruit Unified Sensor** (by Adafruit, v1.1.9 or higher)
4. **ArduinoJson** (by Benoit Blanchon, v6.21.x or v7.x)
5. **NimBLE-Arduino** or built-in **ESP32 BLE** (`BLEDevice.h`)

---

## 3. Serial Monitor Output Format Specification

The corrected firmware emits compact, single-line status messages:

### A. Initial Calibration Phase
```
[STATUS] BLE: ADV | Mode: LIVE | BPM: -- | Base: Calibrating (7/20) | Stress: CALIBRATING
```

### B. Calibrated Normal Operational State
```
[STATUS] BLE: ADV | Mode: LIVE | BPM: 76 | Base: 74 | Stress: NORMAL
```

### C. Finger Removed / Invalid Signal State
```
[STATUS] BLE: ADV | Mode: LIVE | BPM: -- | Base: 74 | Stress: SENSOR_ERROR | Signal: INVALID
```

### D. Sensor Hardware Error / Disconnected State
```
[ERROR] MAX30102: NOT DETECTED
```

### E. Experimental Stress Warning Triggered
```
[WARNING] POSSIBLE_STRESS | BPM: 98 | Base: 74 | Buzzer: ACTIVE
```

---

## 4. Test Procedure for Simulated Stress & Emergency SOS

1. **Baseline Calibration Test:**
   - Place index finger firmly on MAX30102 sensor optical window.
   - Observe `Base: Calibrating (X/20)` counter incrementing.
   - Once 20 valid beats are collected, verify baseline establishes (e.g. `Base: 74`).

2. **Simulated Stress Event:**
   - Switch `currentMode = MODE_TEST;` in `esp32_safelynk.ino` or inject simulated heart rate > `baseline + 20 BPM`.
   - Verify `[WARNING] POSSIBLE_STRESS` is logged and active buzzer emits 2 short beeps.
   - Press button on GPIO 15 briefly (short press < 1s) to test local buzzer silence.

3. **Physical Long-Press Emergency SOS Test:**
   - Press and hold button on GPIO 15 for 2.5 seconds.
   - Verify `[EMERGENCY] SOS_ACTIVE` is logged, continuous rapid alarm sounds, and HTTP POST is sent to backend ingestion endpoint.
