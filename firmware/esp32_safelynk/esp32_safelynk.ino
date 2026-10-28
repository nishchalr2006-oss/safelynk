/*
  ==============================================================================
  SAFELYNK — Smart Predictive Women's Safety System
  Team: GARUDA TANDAV CYBER RAKSHA (GTCR TECH NEXUS)
  Corrected ESP32 Firmware — MAX30102 PPG, Baseline Calibration & Buzzer
  ==============================================================================

  Hardware Pinout Configuration:
  - ESP32 Development Board (ESP32-WROOM-32 / DevKit V1)
  - MAX30102 / MAX30105 Heart Rate Sensor (I2C: SDA -> GPIO 21, SCL -> GPIO 22, Address: 0x57)
  - MPU6050 Accelerometer & Gyro (I2C: SDA -> GPIO 21, SCL -> GPIO 22, Address: 0x68)
  - Physical Panic SOS Button (GPIO 15 with internal PULLUP)
  - Active Buzzer (GPIO 27 - Local non-blocking audible alert)
  - Status RGB LED (Red: GPIO 13, Green: GPIO 12, Blue: GPIO 14)
  - BLE Advertising (Service UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b)

  Required Arduino IDE Libraries:
  - SparkFun MAX3010x Pulse and Proximity Sensor Library (by SparkFun)
  - Adafruit MPU6050 & Adafruit Unified Sensor (by Adafruit)
  - ArduinoJson (v6.x or v7.x by Benoit Blanchon)
  - Built-in ESP32 BLE (BLEDevice, BLEServer, BLEUtils, BLE2902)
*/

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "MAX30105.h" // SparkFun MAX3010x library
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// Wi-Fi & Backend Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* BACKEND_INGEST_URL = "https://your-safelynk-app.run.app/api/v1/device/telemetry";
const char* DEVICE_TOKEN = "Bearer tok_esp32_safelynk_prod_8842";
const char* DEVICE_ID = "ESP32-SL-8842";

// Pin Assignments
const int PIN_BUTTON = 15;
const int PIN_BUZZER = 27;
const int PIN_LED_RED = 13;
const int PIN_LED_GREEN = 12;
const int PIN_LED_BLUE = 14;
const int PIN_BATTERY = 34;

// Hardware Sensor Objects
MAX30105 particleSensor;
Adafruit_MPU6050 mpu;

// BLE Server & Characteristic
BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
bool deviceConnected = false;
bool bleAdvertisingActive = false;

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Mode: "LIVE" (actual MAX30102 hardware data), "TEST" (simulated stress testing), "DIAG" (raw IR/Red ADC values)
enum OperatingMode { MODE_LIVE, MODE_TEST, MODE_DIAG };
OperatingMode currentMode = MODE_LIVE;

// Stress State Machine
enum StressState {
  STATE_CALIBRATING,
  STATE_NORMAL,
  STATE_POSSIBLE_STRESS,
  STATE_WARNING,
  STATE_SENSOR_ERROR,
  STATE_SOS_ACTIVE
};

StressState currentStressState = STATE_CALIBRATING;

// MAX30102 PPG Peak Detection Variables
bool max30102Detected = false;
uint32_t irValue = 0;
uint32_t redValue = 0;
const uint32_t FINGER_ON_THRESHOLD = 25000; // Minimum IR raw reading for finger presence

unsigned long lastBeatTime = 0;
float currentBpm = -1; // -1 means invalid/no reading
float bpmHistory[4] = {0, 0, 0, 0};
int bpmHistoryIndex = 0;

// Baseline Calibration Variables
const int CALIBRATION_REQUIRED_SAMPLES = 20;
int validCalibrationCount = 0;
float calibrationSamples[20];
float baselineBpm = -1; // -1 means uncalibrated
bool isCalibrated = false;

// Sustained Stress Rules
unsigned long elevatedBpmStartTime = 0;
const int STRESS_DELTA_BPM = 20; // BPM elevation above baseline required for stress
const unsigned long SUSTAINED_STRESS_DURATION_MS = 10000; // 10 seconds sustained
unsigned long lastWarningCooldownTime = 0;
const unsigned long WARNING_COOLDOWN_MS = 30000; // 30 seconds cooldown between warnings

// Button & Interrupt Variables
volatile unsigned long buttonPressStartTime = 0;
volatile bool buttonLongPressed = false;
volatile bool buttonShortPressed = false;
const unsigned long LONG_PRESS_THRESHOLD_MS = 2500;

// Non-blocking Buzzer Timer
unsigned long lastBuzzerToggleTime = 0;
bool buzzerState = false;

// BLE Server Callbacks
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  };
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    BLEDevice::startAdvertising();
    bleAdvertisingActive = true;
  }
};

void IRAM_ATTR handleButtonInterrupt() {
  int state = digitalRead(PIN_BUTTON);
  if (state == LOW) {
    buttonPressStartTime = millis();
  } else {
    if (buttonPressStartTime > 0) {
      unsigned long duration = millis() - buttonPressStartTime;
      if (duration >= LONG_PRESS_THRESHOLD_MS) {
        buttonLongPressed = true;
      } else if (duration >= 80) {
        buttonShortPressed = true;
      }
      buttonPressStartTime = 0;
    }
  }
}

void setStatusLED(bool red, bool green, bool blue) {
  digitalWrite(PIN_LED_RED, red ? HIGH : LOW);
  digitalWrite(PIN_LED_GREEN, green ? HIGH : LOW);
  digitalWrite(PIN_LED_BLUE, blue ? HIGH : LOW);
}

void generateUniqueEventId(char* buffer) {
  snprintf(buffer, 32, "evt_esp32_%lu_%ld", millis(), random(1000, 9999));
}

// ------------------------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[SAFELYNK] Starting Wearable Controller — GTCR TECH NEXUS");

  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_BLUE, OUTPUT);
  pinMode(PIN_BATTERY, INPUT);

  digitalWrite(PIN_BUZZER, LOW);
  attachInterrupt(digitalPinToInterrupt(PIN_BUTTON), handleButtonInterrupt, CHANGE);

  // Initialize I2C Bus (SDA = GPIO 21, SCL = GPIO 22)
  Wire.begin(21, 22);

  // Initialize MAX30102 PPG Sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[ERROR] MAX30102: NOT DETECTED (Check SDA/SCL pullups & 3.3V power)");
    max30102Detected = false;
    currentStressState = STATE_SENSOR_ERROR;
    setStatusLED(true, false, false);
  } else {
    Serial.println("[STATUS] MAX30102: Detected successfully at I2C 0x57");
    max30102Detected = true;
    // Configure MAX30102 LED brightness, sample rate (100 Hz), pulse width (411 us)
    byte powerLevel = 0x1F; // 6.4mA LED current
    byte sampleAverage = 4;
    byte ledMode = 2; // Red + IR mode
    int sampleRate = 100; // 100 samples/sec
    int pulseWidth = 411; // 411 us
    int adcRange = 4096;
    particleSensor.setup(powerLevel, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
    particleSensor.clearFIFO();
    setStatusLED(false, false, true);
  }

  // Initialize MPU6050 Motion Sensor
  if (mpu.begin(0x68, &Wire)) {
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  }

  // Initialize BLE Server & Advertising
  BLEDevice::init("SAFELYNK-BAND-PRO");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );
  pCharacteristic->addDescriptor(new BLE2902());
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();
  bleAdvertisingActive = true;

  // Attempt Wi-Fi Connection
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 10) {
    delay(300);
    retries++;
  }
}

// ------------------------------------------------------------------------------
// PPG PULSE PEAK DETECTION & BPM CALCULATION
// ------------------------------------------------------------------------------
void processPulseSensor() {
  if (!max30102Detected) {
    currentBpm = -1;
    currentStressState = STATE_SENSOR_ERROR;
    return;
  }

  irValue = particleSensor.getIR();
  redValue = particleSensor.getRed();

  // Check finger presence
  if (irValue < FINGER_ON_THRESHOLD) {
    currentBpm = -1;
    if (currentStressState != STATE_SOS_ACTIVE) {
      currentStressState = isCalibrated ? STATE_SENSOR_ERROR : STATE_CALIBRATING;
    }
    return;
  }

  // Peak detection logic using IR channel derivative/threshold
  static uint32_t lastIrValue = 0;
  static uint32_t maxPeak = 0;
  static bool rising = false;

  uint32_t now = millis();

  if (irValue > lastIrValue + 150) {
    rising = true;
  } else if (rising && irValue < lastIrValue - 150) {
    // Local peak found
    rising = false;
    unsigned long delta = now - lastBeatTime;

    // Refractory period constraint: 300ms (max 200 BPM) to 2000ms (min 30 BPM)
    if (delta >= 300 && delta <= 2000) {
      float rawBpm = 60000.0 / delta;

      // Filter plausible human pulse range
      if (rawBpm >= 40.0 && rawBpm <= 180.0) {
        bpmHistory[bpmHistoryIndex] = rawBpm;
        bpmHistoryIndex = (bpmHistoryIndex + 1) % 4;

        // Exponential smoothing
        float avgBpm = 0;
        int count = 0;
        for (int i = 0; i < 4; i++) {
          if (bpmHistory[i] > 0) {
            avgBpm += bpmHistory[i];
            count++;
          }
        }
        currentBpm = count > 0 ? (avgBpm / count) : rawBpm;

        // BASELINE CALIBRATION LOGIC
        if (!isCalibrated && validCalibrationCount < CALIBRATION_REQUIRED_SAMPLES) {
          calibrationSamples[validCalibrationCount] = currentBpm;
          validCalibrationCount++;

          if (validCalibrationCount >= CALIBRATION_REQUIRED_SAMPLES) {
            // Calculate median baseline
            for (int i = 0; i < CALIBRATION_REQUIRED_SAMPLES - 1; i++) {
              for (int j = i + 1; j < CALIBRATION_REQUIRED_SAMPLES; j++) {
                if (calibrationSamples[i] > calibrationSamples[j]) {
                  float tmp = calibrationSamples[i];
                  calibrationSamples[i] = calibrationSamples[j];
                  calibrationSamples[j] = tmp;
                }
              }
            }
            baselineBpm = calibrationSamples[CALIBRATION_REQUIRED_SAMPLES / 2];
            isCalibrated = true;
            currentStressState = STATE_NORMAL;
            setStatusLED(false, true, false); // Green
          }
        }
      }
    }
    lastBeatTime = now;
  }
  lastIrValue = irValue;
}

// ------------------------------------------------------------------------------
// EXPERIMENTAL STRESS EVALUATION
// ------------------------------------------------------------------------------
void evaluateStressRules() {
  if (currentStressState == STATE_SOS_ACTIVE) return;

  if (!isCalibrated) {
    currentStressState = STATE_CALIBRATING;
    return;
  }

  if (currentBpm < 0) {
    currentStressState = STATE_SENSOR_ERROR;
    return;
  }

  // Check if BPM is elevated above baseline by STRESS_DELTA_BPM
  if (currentBpm >= (baselineBpm + STRESS_DELTA_BPM)) {
    if (elevatedBpmStartTime == 0) {
      elevatedBpmStartTime = millis();
    } else if (millis() - elevatedBpmStartTime >= SUSTAINED_STRESS_DURATION_MS) {
      if (millis() - lastWarningCooldownTime >= WARNING_COOLDOWN_MS) {
        currentStressState = STATE_POSSIBLE_STRESS;
        lastWarningCooldownTime = millis();
        setStatusLED(true, true, false); // Yellow
      }
    }
  } else {
    elevatedBpmStartTime = 0;
    if (currentStressState != STATE_POSSIBLE_STRESS && currentStressState != STATE_WARNING) {
      currentStressState = STATE_NORMAL;
      setStatusLED(false, true, false);
    }
  }
}

// ------------------------------------------------------------------------------
// LOCAL BUZZER PATTERN GENERATOR
// ------------------------------------------------------------------------------
void updateBuzzer() {
  unsigned long now = millis();

  if (currentStressState == STATE_NORMAL || currentStressState == STATE_CALIBRATING || currentStressState == STATE_SENSOR_ERROR) {
    digitalWrite(PIN_BUZZER, LOW);
    buzzerState = false;
  }
  else if (currentStressState == STATE_POSSIBLE_STRESS || currentStressState == STATE_WARNING) {
    // Intermittent short beep: 150ms ON, 500ms OFF
    if (buzzerState && (now - lastBuzzerToggleTime >= 150)) {
      digitalWrite(PIN_BUZZER, LOW);
      buzzerState = false;
      lastBuzzerToggleTime = now;
    } else if (!buzzerState && (now - lastBuzzerToggleTime >= 500)) {
      digitalWrite(PIN_BUZZER, HIGH);
      buzzerState = true;
      lastBuzzerToggleTime = now;
    }
  }
  else if (currentStressState == STATE_SOS_ACTIVE) {
    // Rapid panic alarm: 100ms ON, 100ms OFF
    if (now - lastBuzzerToggleTime >= 100) {
      buzzerState = !buzzerState;
      digitalWrite(PIN_BUZZER, buzzerState ? HIGH : LOW);
      lastBuzzerToggleTime = now;
    }
  }
}

// ------------------------------------------------------------------------------
// HTTP BACKEND TELEMETRY DISPATCH
// ------------------------------------------------------------------------------
void transmitBackendTelemetry(const char* eventType, bool isSos = false) {
  if (WiFi.status() != WL_CONNECTED) return;

  sensors_event_t a, g, temp;
  float ax = 0.05, ay = 0.98, az = 0.12;
  if (mpu.getEvent(&a, &g, &temp)) {
    ax = a.acceleration.x / 9.81;
    ay = a.acceleration.y / 9.81;
    az = a.acceleration.z / 9.81;
  }

  char eventId[32];
  generateUniqueEventId(eventId);

  StaticJsonDocument<350> doc;
  doc["deviceIdentifier"] = DEVICE_ID;
  doc["uniqueEventId"] = eventId;
  doc["eventType"] = eventType;
  doc["heartRate"] = currentBpm > 0 ? (int)currentBpm : 0;
  doc["heartRateQuality"] = currentBpm > 0 ? 95 : 0;
  doc["motionX"] = ax;
  doc["motionY"] = ay;
  doc["motionZ"] = az;
  doc["batteryLevel"] = 88;
  doc["buttonPressed"] = isSos;

  String jsonString;
  serializeJson(doc, jsonString);

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  http.begin(client, BACKEND_INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", DEVICE_TOKEN);

  int code = http.POST(jsonString);
  http.end();
}

// ------------------------------------------------------------------------------
// SERIAL MONITOR COMPACT STATUS PRINTER (TASK 7 FORMAT)
// ------------------------------------------------------------------------------
void printCompactStatus() {
  static unsigned long lastPrintTime = 0;
  if (millis() - lastPrintTime < 1000) return;
  lastPrintTime = millis();

  const char* bleStr = deviceConnected ? "CONN" : (bleAdvertisingActive ? "ADV" : "OFF");
  const char* modeStr = (currentMode == MODE_LIVE) ? "LIVE" : ((currentMode == MODE_TEST) ? "TEST" : "DIAG");

  if (currentMode == MODE_DIAG) {
    Serial.printf("[DIAG] IR: %u | RED: %u | BPM: %.0f | State: %d\n", irValue, redValue, currentBpm, currentStressState);
    return;
  }

  if (!max30102Detected) {
    Serial.println("[ERROR] MAX30102: NOT DETECTED");
    return;
  }

  if (currentStressState == STATE_POSSIBLE_STRESS || currentStressState == STATE_WARNING) {
    Serial.printf("[WARNING] POSSIBLE_STRESS | BPM: %.0f | Base: %.0f | Buzzer: ACTIVE\n", currentBpm, baselineBpm);
    return;
  }

  if (currentStressState == STATE_SOS_ACTIVE) {
    Serial.printf("[EMERGENCY] SOS_ACTIVE | BPM: %.0f | Base: %.0f | Buzzer: ALARM\n", currentBpm > 0 ? currentBpm : 0, baselineBpm);
    return;
  }

  if (currentStressState == STATE_SENSOR_ERROR || irValue < FINGER_ON_THRESHOLD) {
    if (isCalibrated) {
      Serial.printf("[STATUS] BLE: %s | Mode: %s | BPM: -- | Base: %.0f | Stress: SENSOR_ERROR | Signal: INVALID\n", bleStr, modeStr, baselineBpm);
    } else {
      Serial.printf("[STATUS] BLE: %s | Mode: %s | BPM: -- | Base: Calibrating (%d/%d) | Stress: SENSOR_ERROR | Signal: INVALID\n", bleStr, modeStr, validCalibrationCount, CALIBRATION_REQUIRED_SAMPLES);
    }
    return;
  }

  if (!isCalibrated) {
    Serial.printf("[STATUS] BLE: %s | Mode: %s | BPM: -- | Base: Calibrating (%d/%d) | Stress: CALIBRATING\n", bleStr, modeStr, validCalibrationCount, CALIBRATION_REQUIRED_SAMPLES);
    return;
  }

  // Normal Calibrated Status
  Serial.printf("[STATUS] BLE: %s | Mode: %s | BPM: %.0f | Base: %.0f | Stress: NORMAL\n", bleStr, modeStr, currentBpm, baselineBpm);
}

// ------------------------------------------------------------------------------
// MAIN LOOP
// ------------------------------------------------------------------------------
void loop() {
  processPulseSensor();
  evaluateStressRules();
  updateBuzzer();
  printCompactStatus();

  // 1. Physical Long-Press Emergency SOS
  if (buttonLongPressed) {
    buttonLongPressed = false;
    currentStressState = STATE_SOS_ACTIVE;
    setStatusLED(true, false, false); // Red
    transmitBackendTelemetry("MANUAL_SOS", true);
  }

  // 2. Short Button Press = Silence Local Buzzer / Confirm Safe
  if (buttonShortPressed) {
    buttonShortPressed = false;
    if (currentStressState == STATE_POSSIBLE_STRESS || currentStressState == STATE_WARNING || currentStressState == STATE_SOS_ACTIVE) {
      Serial.println("[ACTION] Silence / Local Safe Confirmation Button Pressed.");
      currentStressState = isCalibrated ? STATE_NORMAL : STATE_CALIBRATING;
      setStatusLED(false, true, false);
      digitalWrite(PIN_BUZZER, LOW);
    }
  }

  // Periodic Backend Heartbeat (every 6s)
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat >= 6000) {
    lastHeartbeat = millis();
    if (currentStressState == STATE_NORMAL) {
      transmitBackendTelemetry("SENSOR_CHECK", false);
    }
  }

  delay(10);
}
