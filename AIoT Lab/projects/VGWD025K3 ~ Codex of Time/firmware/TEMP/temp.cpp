/**
 * ============================================================================
 * VGWD025K3 ~ Codex of Time (Varis Gear Walpurgis Driver Actuator)
 * LOCAL-ONLY MVP: NFC Read UID → Flash Log → Timer + LCD
 * Core Firmware: Dual-SPI Engine + JQ8900 Audio + Ultra-Low-Power Method B
 * Temporal Arc: Arc 3, 2026
 * Architect: The Manager & Faust
 * ============================================================================
 */

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_GC9A01A.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <esp_bt.h>
#include <Jq8900Player.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

// ============================================================================
// 1. HARDWARE PIN MATRIX (DUAL HARDWARE SPI BUS & AUDIO TOPOLOGY)
// ============================================================================

// --- BUS 1: HSPI Peripheral for GC9A01 Round Display ---
#define PIN_LCD_SCK      15   // HSPI Clock (GC9A01 SCL)
#define PIN_LCD_MOSI      2   // HSPI MOSI  (GC9A01 SDA)
#define PIN_TFT_DC        4   // Data/Command
#define PIN_TFT_CS       16   // LCD Chip Select
#define PIN_TFT_RST      17   // LCD Hardware Reset

// --- BUS 2: VSPI Native Peripheral for MFRC522 RFID ---
#define PIN_RFID_SCK     18   // Native VSPI Clock
#define PIN_RFID_MOSI    23   // Native VSPI MOSI
#define PIN_RFID_MISO    19   // Native VSPI MISO (SO)
#define PIN_RFID_SS      21   // RFID Chip Select (SDA)
#define PIN_RFID_RST     22   // RFID Hard Power-Down Line (Active LOW -> 0.2 µA)

// --- Audio Actuator (JQ8900 MP3 Player on HardwareSerial2) ---
#define PIN_AUDIO_TX     33   // Serial2 TX to JQ8900 RX / One-line SDA
#define AUDIO_DEFAULT_VOL 25  // Volume (0 to 30)

// ============================================================================
// 2. CONSTANTS & MEMORY MAP
// ============================================================================
#define TIMER_MIN_SECONDS    10      // 10 seconds min
#define TIMER_MAX_SECONDS    7200    // 2 hours
#define TIMER_DEFAULT_SEC    512     // 8 minutes 32 seconds (08:32)

// Audio Track IDs (0-Indexed Flash Controller: Sound N = Index N-1)
#define TRACK_TIMER_START    1       // Sound 2: Played once when timer starts
#define TRACK_TIMER_FINISHED 6       // Sound 7: Played once when timer ends

// Display Screen Dimensions (GC9A01: 240x240 circular)
#define TFT_WIDTH            240
#define TFT_HEIGHT           240
#define TFT_CENTER_X         120
#define TFT_CENTER_Y         120

// Custom Color Palette
#define COLOR_BG             0x0000  // Pure Black
#define COLOR_HUD_RING       0x18E3  // Dark Tech Cyan
#define COLOR_CYAN_GLOW      0x07FF  // Bright Cyan
#define COLOR_GOLD           0xFDE0  // Gold Accent
#define COLOR_CRIMSON        0xF800  // Hazard / Error Red
#define COLOR_EMERALD        0x07E0  // Success Green
#define COLOR_TEXT_MUTED     0x7BEF  // Dim Grey Text
#define COLOR_TEXT_WHITE     0xFFFF  // Crisp White

// Flash Storage
#define LOG_FILE_PATH        "/codex_log.json"
#define MAX_LOG_ENTRIES      1000

// ============================================================================
// 3. GLOBAL OBJECTS & DRIVERS
// ============================================================================
SPIClass hspi(HSPI);  // Dedicated Hardware SPI Bus for GC9A01 LCD
Adafruit_GC9A01A tft(&hspi, PIN_TFT_DC, PIN_TFT_CS, PIN_TFT_RST);

// Default VSPI (SPI object) for MFRC522 RFID
MFRC522 rfid(PIN_RFID_SS, PIN_RFID_RST);
MFRC522::MIFARE_Key key;

// JQ8900 Audio Driver on HardwareSerial2
Jq8900Player audio(Serial2);

// ============================================================================
// 4. SYSTEM STATE MUTEX
// ============================================================================
enum SystemState {
    STATE_IDLE_READY,       // Waiting for RFID card swipe (RFID Active)
    STATE_CARD_DETECTED,    // Card detected, reading UID
    STATE_TIMER_RUNNING,    // Active countdown (RFID 0.2 µA Hard Power-Down)
    STATE_TIMER_FINISHED,   // Countdown reached 00:00
    STATE_ERROR             // Read failure
};

SystemState currentState = STATE_IDLE_READY;

// Card & Session Telemetry
String currentCardUID = "";
uint32_t sessionStartTime = 0;  // Unix timestamp when card was read

// Timer State
uint32_t timerDurationSeconds = TIMER_DEFAULT_SEC;
uint32_t timerStartMillis = 0;
uint32_t lastSecondsRemaining = 0xFFFFFFFF;
uint32_t stateEntryMillis = 0;

// Non-blocking Refresh Control
uint32_t lastDisplayUpdateMillis = 0;
uint32_t lastRfidPollMillis = 0;

// Power State
bool rfidHardSleeping = false;

// ============================================================================
// 5. HELPER FORWARD DECLARATIONS
// ============================================================================
void transitionToState(SystemState newState);
void drawIdleScreen();
void drawCardDetectedScreen();
void drawTimerRunningScreen(uint32_t remainingSeconds, bool forceRedraw = false);
void drawTimerFinishedScreen();
void drawErrorScreen(const char* errorMsg);
void drawProgressArc(float progressRatio, uint16_t color);
void handleSerialCommands();
void powerDownRfidHardware();
void wakeUpRfidHardware();
void logEntryToFlash(const String& uid, uint32_t timestamp);
void initFlashStorage();
void readLogFromFlash();

// ============================================================================
// 6. LOW-POWER ROUTINES (METHOD B: HARD POWER-DOWN & PARASITIC PREVENTION)
// ============================================================================

void powerDownRfidHardware() {
    if (rfidHardSleeping) return;

    Serial.println(F("[POWER_OPT] Forcing MFRC522 into 0.2 µA Hard Power-Down..."));

    // Step 1: Turn off internal RF transmitter
    rfid.PCD_AntennaOff();

    // Step 2: Drive RST LOW (Enters Hard Power Down Mode on NXP Silicon)
    digitalWrite(PIN_RFID_RST, LOW);

    // Step 3: Anti-Parasitic Leakage: Set SPI pins to LOW to prevent phantom powering via ESD diodes
    digitalWrite(PIN_RFID_SS, LOW);
    digitalWrite(PIN_RFID_MOSI, LOW);
    digitalWrite(PIN_RFID_SCK, LOW);

    rfidHardSleeping = true;
    Serial.println(F("[POWER_OPT] MFRC522 RF oscillator killed. Zero RF emission active."));
}

void wakeUpRfidHardware() {
    if (!rfidHardSleeping) return;

    Serial.println(F("[POWER_OPT] Waking MFRC522 from Hard Power-Down..."));

    // Step 1: Exit Hard Power-Down
    digitalWrite(PIN_RFID_RST, HIGH);
    delay(25); // Allow crystal oscillator to stabilize

    // Step 2: Re-initialize VSPI Bus
    digitalWrite(PIN_RFID_SS, HIGH);
    SPI.begin(PIN_RFID_SCK, PIN_RFID_MISO, PIN_RFID_MOSI, PIN_RFID_SS);

    // Step 3: Re-initialize MFRC522 registers and antenna
    rfid.PCD_Init();
    delay(10);
    rfid.PCD_SetAntennaGain(MFRC522::RxGain_max);
    rfid.PCD_AntennaOn();

    // Re-load default Key A
    for (byte i = 0; i < 6; i++) {
        key.keyByte[i] = 0xFF;
    }

    rfidHardSleeping = false;
    Serial.println(F("[POWER_OPT] MFRC522 is ONLINE & antenna energized for card scan."));
}

// ============================================================================
// 7. FLASH STORAGE ROUTINES (LittleFS-based JSON log)
// ============================================================================

void initFlashStorage() {
    if (!LittleFS.begin()) {
        Serial.println(F("[STORAGE] LittleFS mount failed!"));
        return;
    }
    Serial.println(F("[STORAGE] LittleFS mounted successfully."));

    // Create log file if it doesn't exist
    if (!LittleFS.exists(LOG_FILE_PATH)) {
        File logFile = LittleFS.open(LOG_FILE_PATH, "w");
        if (logFile) {
            logFile.print("[]");
            logFile.close();
            Serial.println(F("[STORAGE] Created new log file."));
        }
    }
}

void logEntryToFlash(const String& uid, uint32_t timestamp) {
    File logFile = LittleFS.open(LOG_FILE_PATH, "r");
    if (!logFile) {
        Serial.println(F("[STORAGE] Error opening log for read."));
        return;
    }

    // Read existing entries
    StaticJsonDocument<8192> doc;
    DeserializationError error = deserializeJson(doc, logFile);
    logFile.close();

    if (error) {
        Serial.printf("[STORAGE] JSON parse error: %s\n", error.c_str());
        return;
    }

    // Check if array, if not create one
    if (!doc.is<JsonArray>()) {
        doc.clear();
        doc = JsonArray();
    }

    // Trim to max entries if needed
    JsonArray entries = doc.as<JsonArray>();
    while (entries.size() >= MAX_LOG_ENTRIES) {
        entries.remove(0);
    }

    // Create new entry
    JsonObject newEntry = entries.createNestedObject();
    newEntry["uid"] = uid;
    newEntry["timestamp"] = timestamp;
    newEntry["status"] = "completed";

    // Write back
    logFile = LittleFS.open(LOG_FILE_PATH, "w");
    if (logFile) {
        serializeJson(doc, logFile);
        logFile.close();
        Serial.printf("[STORAGE] Logged entry: UID=%s @ %u\n", uid.c_str(), timestamp);
    }
}

void readLogFromFlash() {
    File logFile = LittleFS.open(LOG_FILE_PATH, "r");
    if (!logFile) {
        Serial.println(F("[STORAGE] Error opening log for read."));
        return;
    }

    StaticJsonDocument<8192> doc;
    DeserializationError error = deserializeJson(doc, logFile);
    logFile.close();

    if (error) {
        Serial.printf("[STORAGE] JSON parse error: %s\n", error.c_str());
        return;
    }

    if (!doc.is<JsonArray>()) {
        Serial.println(F("[STORAGE] Log is empty or malformed."));
        return;
    }

    JsonArray entries = doc.as<JsonArray>();
    Serial.printf("[STORAGE] Total entries in log: %u\n", entries.size());

    for (size_t i = 0; i < entries.size() && i < 10; i++) {
        JsonObject entry = entries[i];
        Serial.printf("  [%u] UID=%s @ %u (status: %s)\n",
                      i,
                      entry["uid"].as<const char*>(),
                      entry["timestamp"].as<uint32_t>(),
                      entry["status"].as<const char*>());
    }

    if (entries.size() > 10) {
        Serial.printf("  ... and %u more entries\n", entries.size() - 10);
    }
}

// ============================================================================
// 8. SETUP & INITIALIZATION
// ============================================================================
void setup() {
    // 1. CPU DYNAMIC POWER SCALING: Drop from 240MHz to 80MHz (60% power reduction)
    setCpuFrequencyMhz(80);

    Serial.begin(115200);
    delay(200);

    Serial.println();
    Serial.println(F("**************************************************"));
    Serial.println(F("*  VGWD025K3 ~ CODEX OF TIME (LOCAL-ONLY MVP)   *"));
    Serial.println(F("*  Varis Gear Chrono Actuator | ESP32-WROOM-32  *"));
    Serial.println(F("**************************************************"));

    // 2. HARDWARE POWER SAVING: Kill Wi-Fi and Bluetooth controllers
    WiFi.mode(WIFI_OFF);
    btStop();
    esp_bt_controller_disable();
    Serial.printf("[POWER_OPT] CPU Clock: %d MHz | Wi-Fi: OFF | Bluetooth: OFF\n", getCpuFrequencyMhz());

    // 3. Initialize Flash Storage
    initFlashStorage();

    // Pin Modes
    pinMode(PIN_TFT_CS, OUTPUT);
    pinMode(PIN_RFID_SS, OUTPUT);
    pinMode(PIN_RFID_RST, OUTPUT);
    pinMode(PIN_RFID_MOSI, OUTPUT);
    pinMode(PIN_RFID_SCK, OUTPUT);

    digitalWrite(PIN_TFT_CS, HIGH);
    digitalWrite(PIN_RFID_SS, HIGH);

    // 4. Initialize JQ8900 Audio Player on GPIO 33
    Serial.printf("[AUDIO] Initializing JQ8900 Audio Driver on GPIO %d (Serial2 @ 9600)...\n", PIN_AUDIO_TX);
    audio.begin(PIN_AUDIO_TX, -1, 9600);
    delay(100);
    audio.setVolume(AUDIO_DEFAULT_VOL);

    // 5. Start HSPI for GC9A01 Display (GPIO 15 Clock, GPIO 2 Data)
    hspi.begin(PIN_LCD_SCK, -1, PIN_LCD_MOSI, PIN_TFT_CS);
    tft.begin();
    tft.setRotation(2); // Inverted 180° orientation
    tft.fillScreen(COLOR_BG);

    // 6. Start VSPI for MFRC522 RFID
    digitalWrite(PIN_RFID_RST, HIGH);
    delay(30);
    SPI.begin(PIN_RFID_SCK, PIN_RFID_MISO, PIN_RFID_MOSI, PIN_RFID_SS);
    rfid.PCD_Init();
    delay(20);
    rfid.PCD_SetAntennaGain(MFRC522::RxGain_max);
    rfid.PCD_AntennaOn();

    for (byte i = 0; i < 6; i++) {
        key.keyByte[i] = 0xFF;
    }
    rfidHardSleeping = false;

    // Enter Standby State
    transitionToState(STATE_IDLE_READY);
    Serial.println(F("[SYSTEM] Codex of Time Ready. Standby waiting for card.\n"));
}

// ============================================================================
// 9. MAIN RUNTIME LOOP
// ============================================================================
void loop() {
    uint32_t currentMillis = millis();

    // 1. Process Debug / Command Input via Serial
    handleSerialCommands();

    // 2. State Machine Dispatcher
    switch (currentState) {
        case STATE_IDLE_READY: {
            // Periodic Non-blocking RFID Polling (every 100ms in standby)
            if (currentMillis - lastRfidPollMillis >= 100) {
                lastRfidPollMillis = currentMillis;

                // Look for new card
                if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
                    currentCardUID = "";
                    for (byte i = 0; i < rfid.uid.size; i++) {
                        if (rfid.uid.uidByte[i] < 0x10) currentCardUID += "0";
                        currentCardUID += String(rfid.uid.uidByte[i], HEX);
                        if (i < rfid.uid.size - 1) currentCardUID += ":";
                    }
                    currentCardUID.toUpperCase();

                    MFRC522::PICC_Type piccType = rfid.PICC_GetType(rfid.uid.sak);
                    Serial.println(F("--------------------------------------------------"));
                    Serial.printf("[CARD DETECTED]\n");
                    Serial.printf("  ├─ UID String : %s\n", currentCardUID.c_str());
                    Serial.printf("  ├─ SAK Byte   : 0x%02X\n", rfid.uid.sak);
                    Serial.printf("  └─ Card Type  : %s\n", rfid.PICC_GetTypeName(piccType));
                    Serial.println(F("--------------------------------------------------"));

                    // Halt card immediately (no writes)
                    rfid.PICC_HaltA();
                    rfid.PCD_StopCrypto1();

                    // Capture timestamp and transition
                    sessionStartTime = (uint32_t)(millis() / 1000);
                    transitionToState(STATE_CARD_DETECTED);
                }
            }
            break;
        }

        case STATE_CARD_DETECTED: {
            // Log entry to flash immediately
            logEntryToFlash(currentCardUID, sessionStartTime);

            // Start timer
            timerStartMillis = millis();
            lastSecondsRemaining = 0xFFFFFFFF;
            transitionToState(STATE_TIMER_RUNNING);
            break;
        }

        case STATE_TIMER_RUNNING: {
            // ZERO RFID POLLING (MFRC522 in 0.2 µA Hard Power Down)
            uint32_t elapsedSec = (currentMillis - timerStartMillis) / 1000;
            if (elapsedSec >= timerDurationSeconds) {
                Serial.println(F("\n[TIMER] Countdown expired! Session Completed."));
                transitionToState(STATE_TIMER_FINISHED);
            } else {
                uint32_t remainingSec = timerDurationSeconds - elapsedSec;
                if (remainingSec != lastSecondsRemaining) {
                    lastSecondsRemaining = remainingSec;
                    drawTimerRunningScreen(remainingSec);

                    if (remainingSec % 60 == 0) {
                        Serial.printf("[TIMER RUNNING] Remaining: %02u:%02u | Elapsed: %u s\n",
                                      remainingSec / 60, remainingSec % 60, elapsedSec);
                    }
                }
            }
            break;
        }

        case STATE_TIMER_FINISHED: {
            // Display completion for 10 seconds then return to Standby
            if (currentMillis - stateEntryMillis > 10000) {
                Serial.println(F("[SYSTEM] Returning to Standby mode."));
                transitionToState(STATE_IDLE_READY);
            }
            break;
        }

        case STATE_ERROR: {
            if (currentMillis - stateEntryMillis > 3500) {
                Serial.println(F("[SYSTEM] Clearing error state. Returning to Standby."));
                transitionToState(STATE_IDLE_READY);
            }
            break;
        }
    }

    // Power-friendly task pacing (prevents CPU 100% busy-loop thrashing)
    delay(30);
}

// ============================================================================
// 10. STATE TRANSITION CONTROLLER (METHOD B POWER & AUDIO HOOKS)
// ============================================================================
void transitionToState(SystemState newState) {
    currentState = newState;
    stateEntryMillis = millis();

    switch (currentState) {
        case STATE_IDLE_READY:
            // WAKE UP RFID: Exit Hard Power-Down & re-energize antenna for next card
            wakeUpRfidHardware();
            drawIdleScreen();
            break;

        case STATE_CARD_DETECTED:
            drawCardDetectedScreen();
            break;

        case STATE_TIMER_RUNNING:
            // METHOD B POWER SAVING: Force Hard Power-Down on MFRC522 via RST clamp
            powerDownRfidHardware();

            drawTimerRunningScreen(timerDurationSeconds, true);
            // TRIGGER AUDIO: Track 2 played ONCE on timer start
            Serial.printf("[AUDIO] Triggering Track %d (Timer Start Chime)...\n", TRACK_TIMER_START);
            audio.playTrack(TRACK_TIMER_START);
            break;

        case STATE_TIMER_FINISHED:
            drawTimerFinishedScreen();
            // TRIGGER AUDIO: Track 7 played ONCE on countdown completion
            Serial.printf("[AUDIO] Triggering Track %d (Timer Finished Melody)...\n", TRACK_TIMER_FINISHED);
            audio.playTrack(TRACK_TIMER_FINISHED);
            break;

        case STATE_ERROR:
            break;
    }
}

// ============================================================================
// 11. GRAPHICAL UI (GC9A01 240x240 ROUND TFT)
// ============================================================================

void drawProgressArc(float progressRatio, uint16_t color) {
    const int radius = 112;
    const int numTicks = 60;
    int activeTicks = (int)(progressRatio * numTicks);

    for (int i = 0; i < numTicks; i++) {
        float angle = (i * (360.0 / numTicks) - 90.0) * DEG_TO_RAD;
        int x1 = TFT_CENTER_X + cos(angle) * (radius - 5);
        int y1 = TFT_CENTER_Y + sin(angle) * (radius - 5);
        int x2 = TFT_CENTER_X + cos(angle) * radius;
        int y2 = TFT_CENTER_Y + sin(angle) * radius;

        uint16_t tickColor = (i <= activeTicks) ? color : COLOR_HUD_RING;
        tft.drawLine(x1, y1, x2, y2, tickColor);
    }
}

void drawIdleScreen() {
    tft.fillScreen(COLOR_BG);

    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 115, COLOR_HUD_RING);
    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 112, COLOR_CYAN_GLOW);

    tft.setTextSize(1);
    tft.setTextColor(COLOR_GOLD);
    tft.setCursor(68, 50);
    tft.print(F("VARIS GEAR VGWD"));

    tft.setTextColor(COLOR_TEXT_MUTED);
    tft.setCursor(72, 65);
    tft.print(F("CODEX OF TIME"));

    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 32, COLOR_HUD_RING);
    tft.fillCircle(TFT_CENTER_X, TFT_CENTER_Y, 30, 0x0110);

    tft.setTextSize(2);
    tft.setTextColor(COLOR_CYAN_GLOW);
    tft.setCursor(85, 112);
    tft.print(F("READY"));

    tft.setTextSize(1);
    tft.setTextColor(COLOR_TEXT_WHITE);
    tft.setCursor(75, 165);
    tft.print(F("TAP RFID CARD"));

    char durBuf[32];
    snprintf(durBuf, sizeof(durBuf), "DEFAULT: %02u:%02u", timerDurationSeconds / 60, timerDurationSeconds % 60);
    tft.setTextColor(COLOR_TEXT_MUTED);
    tft.setCursor(76, 185);
    tft.print(durBuf);
}

void drawCardDetectedScreen() {
    tft.fillScreen(COLOR_BG);

    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 115, COLOR_GOLD);
    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 112, COLOR_HUD_RING);

    tft.setTextSize(1);
    tft.setTextColor(COLOR_GOLD);
    tft.setCursor(80, 60);
    tft.print(F("CARD DETECTED"));

    tft.setTextSize(2);
    tft.setTextColor(COLOR_TEXT_WHITE);
    tft.setCursor(50, 105);
    tft.print(F("LOGGING..."));

    tft.setTextSize(1);
    tft.setTextColor(COLOR_CYAN_GLOW);
    tft.setCursor(45, 150);
    tft.printf("UID: %s", currentCardUID.c_str());

    tft.setTextColor(COLOR_TEXT_MUTED);
    tft.setCursor(60, 170);
    tft.print(F("STARTING TIMER"));
}

void drawTimerRunningScreen(uint32_t remainingSeconds, bool forceRedraw) {
    if (forceRedraw) {
        tft.fillScreen(COLOR_BG);
        tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 118, COLOR_HUD_RING);

        tft.setTextSize(1);
        tft.setTextColor(COLOR_GOLD);
        tft.setCursor(82, 45);
        tft.print(F("CHRONO RUN"));

        tft.setTextColor(COLOR_CYAN_GLOW);
        tft.setCursor(85, 60);
        tft.print(F("TIMER ACTIVE"));

        tft.setTextColor(COLOR_TEXT_MUTED);
        tft.setCursor(50, 185);
        tft.printf("CARD: %s", currentCardUID.c_str());
    }

    float progress = 1.0f - ((float)remainingSeconds / (float)timerDurationSeconds);
    drawProgressArc(progress, COLOR_CYAN_GLOW);

    tft.fillRect(40, 95, 160, 48, COLOR_BG);

    uint32_t mins = remainingSeconds / 60;
    uint32_t secs = remainingSeconds % 60;
    char timeStr[16];
    snprintf(timeStr, sizeof(timeStr), "%02u:%02u", mins, secs);

    tft.setTextSize(4);
    tft.setTextColor(COLOR_TEXT_WHITE);
    tft.setCursor(60, 105);
    tft.print(timeStr);
}

void drawTimerFinishedScreen() {
    tft.fillScreen(COLOR_BG);

    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 115, COLOR_EMERALD);
    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 112, COLOR_GOLD);

    tft.setTextSize(1);
    tft.setTextColor(COLOR_GOLD);
    tft.setCursor(68, 55);
    tft.print(F("VARIS GEAR VGWD"));

    tft.setTextSize(3);
    tft.setTextColor(COLOR_EMERALD);
    tft.setCursor(48, 100);
    tft.print(F("FINISHED"));

    tft.setTextSize(1);
    tft.setTextColor(COLOR_TEXT_WHITE);
    tft.setCursor(65, 150);
    tft.print(F("SESSION COMPLETED"));

    tft.setTextColor(COLOR_CYAN_GLOW);
    tft.setCursor(55, 170);
    tft.print(F("LOGGED TO DEVICE"));
}

void drawErrorScreen(const char* errorMsg) {
    tft.fillScreen(COLOR_BG);

    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 115, COLOR_CRIMSON);
    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 112, COLOR_CRIMSON);

    tft.setTextSize(2);
    tft.setTextColor(COLOR_CRIMSON);
    tft.setCursor(85, 80);
    tft.print(F("ERROR"));

    tft.setTextSize(1);
    tft.setTextColor(COLOR_TEXT_WHITE);
    tft.setCursor(50, 125);
    tft.print(errorMsg);

    tft.setTextColor(COLOR_TEXT_MUTED);
    tft.setCursor(55, 160);
    tft.print(F("RETRACT CARD & RETRY"));
}

// ============================================================================
// 12. SERIAL DEBUGGING & INTERACTIVE COMMAND INTERFACE
// ============================================================================
void handleSerialCommands() {
    if (!Serial.available()) return;

    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.equalsIgnoreCase("help")) {
        Serial.println(F("\n--- [VGWD025K3 COMMAND CONSOLE] ---"));
        Serial.println(F("  power          - Print deep power management status"));
        Serial.println(F("  status         - Print current system telemetry & state"));
        Serial.println(F("  log            - Display all logged entries from flash"));
        Serial.println(F("  play <track>   - Test play audio track (e.g. 'play 1', 'play 6')"));
        Serial.println(F("  vol <0-30>     - Set audio volume (e.g. 'vol 25')"));
        Serial.println(F("  cancel         - Abort current running timer session"));
        Serial.println(F("  set_time <sec> - Set timer duration in seconds (10 to 7200)"));
        Serial.println(F("  help           - Print this menu"));
        Serial.println(F("----------------------------------\n"));
    }
    else if (cmd.equalsIgnoreCase("power")) {
        Serial.println(F("\n=================================================="));
        Serial.println(F(">>>       SYSTEM ENERGY & POWER TELEMETRY      <<<"));
        Serial.println(F("=================================================="));
        Serial.printf("  ├─ CPU Core Frequency : %d MHz (Downclocked for 60%% power cut)\n", getCpuFrequencyMhz());
        Serial.printf("  ├─ Wi-Fi Modem State  : %s (PHY / Baseband Powered Off)\n", WiFi.getMode() == WIFI_OFF ? "DISABLED (0.0 mA)" : "ACTIVE");
        Serial.printf("  ├─ Bluetooth Engine   : %s (Controller Clock Gated)\n", esp_bt_controller_get_status() == ESP_BT_CONTROLLER_STATUS_IDLE ? "DISABLED (0.0 mA)" : "ACTIVE");
        Serial.printf("  ├─ MFRC522 Power State: %s\n", rfidHardSleeping ? "HARD POWER-DOWN (0.2 µA - RST Clamped LOW)" : "ACTIVE / ENERGIZED (RxGain Max)");
        Serial.printf("  └─ Active System State: %d\n", currentState);
        Serial.println(F("==================================================\n"));
    }
    else if (cmd.equalsIgnoreCase("log")) {
        Serial.println(F("\n[STORAGE] Reading log from flash..."));
        readLogFromFlash();
        Serial.println();
    }
    else if (cmd.startsWith("play")) {
        int spaceIdx = cmd.indexOf(' ');
        if (spaceIdx > 0) {
            uint16_t track = cmd.substring(spaceIdx + 1).toInt();
            Serial.printf("[AUDIO] Manual test: Playing track %d...\n", track);
            audio.playTrack(track);
        }
    }
    else if (cmd.startsWith("vol")) {
        int spaceIdx = cmd.indexOf(' ');
        if (spaceIdx > 0) {
            uint8_t vol = cmd.substring(spaceIdx + 1).toInt();
            audio.setVolume(vol);
            Serial.printf("[AUDIO] Volume set to %d/30.\n", vol);
        }
    }
    else if (cmd.equalsIgnoreCase("status")) {
        Serial.println(F("\n--- [SYSTEM TELEMETRY] ---"));
        Serial.printf("  Current State : %d\n", currentState);
        Serial.printf("  Last Card UID : %s\n", currentCardUID.c_str());
        Serial.printf("  Timer Setting : %u seconds (%02u:%02u)\n", timerDurationSeconds, timerDurationSeconds / 60, timerDurationSeconds % 60);
        Serial.printf("  RFID Hardware : %s\n", rfidHardSleeping ? "0.2µA Hard Sleep" : "Awake & Energized");
        Serial.printf("  CPU Clock     : %d MHz\n", getCpuFrequencyMhz());
        Serial.println(F("--------------------------\n"));
    }
    else if (cmd.equalsIgnoreCase("cancel")) {
        if (currentState == STATE_TIMER_RUNNING) {
            Serial.println(F("[CMD] Active timer cancelled by user command."));
            audio.stop();
            transitionToState(STATE_IDLE_READY);
        } else {
            Serial.println(F("[CMD] No active timer running to cancel."));
        }
    }
    else if (cmd.startsWith("set_time")) {
        int spaceIdx = cmd.indexOf(' ');
        if (spaceIdx > 0) {
            uint32_t val = cmd.substring(spaceIdx + 1).toInt();
            if (val >= TIMER_MIN_SECONDS && val <= TIMER_MAX_SECONDS) {
                timerDurationSeconds = val;
                Serial.printf("[CMD] Timer duration updated to %u seconds (%02u:%02u).\n",
                              timerDurationSeconds, timerDurationSeconds / 60, timerDurationSeconds % 60);
                if (currentState == STATE_IDLE_READY) {
                    drawIdleScreen();
                }
            } else {
                Serial.printf("[CMD] Error: Duration must be between %d and %d seconds.\n",
                              TIMER_MIN_SECONDS, TIMER_MAX_SECONDS);
            }
        }
    }
}
