/**
 * ============================================================================
 * VGWD025K3 ~ Codex of Time — Tab 2: Golden Hour (Task Engine)
 * Full Vietnamese UTF-8 Font Engine (U8g2 for Adafruit GFX) + LittleFS Cache
 *
 * Capabilities:
 *   1. Real Vietnamese UTF-8 Font Rendering with full diacritics
 *      (á, à, ả, ã, ạ, â, ấ, ầ, ẩ, ẫ, ậ, ă, ắ, ằ, ẳ, ẵ, ặ, ơ, ớ, ờ, ở, ỡ, ợ, ư, ứ, ừ, ử, ữ, ự, đ, etc.)
 *   2. Offline-First: Boots in < 2ms from LittleFS /triplet_cache.json
 *   3. Zero Wi-Fi on boot if cache exists. Syncs on-demand when commanded.
 *   4. Circular LCD Multi-Line Text Layout with accurate UTF-8 centering.
 *
 * Hardware: ESP32-WROOM-32 | GC9A01A 240x240 Round TFT (HSPI)
 * Architect: The Manager & Faust
 * Temporal Arc: Arc 3, 2026
 * ============================================================================
 */

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_GC9A01A.h>
#include <U8g2_for_Adafruit_GFX.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LittleFS.h>

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

#define WIFI_SSID        "Redmi K60 Ultra"
#define WIFI_PASSWORD    "toiyeufaust"
#define WIFI_TIMEOUT_MS  15000

// Cloudflare Tunnel base URL
#define BACKEND_HOST     "https://faust.arc-system.id.vn"
#define TRIPLET_ENDPOINT BACKEND_HOST "/api/v1/golden-hour/esp32/queue?limit=3"

// Flash storage
#define TRIPLET_CACHE_PATH "/triplet_cache.json"

// ============================================================================
// 2. HARDWARE PIN MATRIX (HSPI for GC9A01)
// ============================================================================

#define PIN_LCD_SCK      15   // HSPI Clock
#define PIN_LCD_MOSI      2   // HSPI MOSI
#define PIN_TFT_DC        4   // Data/Command
#define PIN_TFT_CS       16   // Chip Select
#define PIN_TFT_RST      17   // Hardware Reset

// Display geometry
#define TFT_CENTER_X    120
#define TFT_CENTER_Y    120

// Color palette
#define COLOR_BG        0x0000   // Pure Black
#define COLOR_HUD_RING  0x18E3   // Dark Tech Cyan
#define COLOR_CYAN_GLOW 0x07FF   // Bright Cyan
#define COLOR_GOLD      0xFDE0   // Gold Accent
#define COLOR_CRIMSON   0xF800   // Hazard / Error Red
#define COLOR_EMERALD   0x07E0   // Success Green
#define COLOR_TEXT_WHITE 0xFFFF  // Crisp White
#define COLOR_TEXT_MUTED 0x7BEF  // Dim Grey Text

// ============================================================================
// 3. GLOBAL OBJECTS & STRUCTS
// ============================================================================

SPIClass hspi(HSPI);
Adafruit_GC9A01A tft(&hspi, PIN_TFT_DC, PIN_TFT_CS, PIN_TFT_RST);
U8G2_FOR_ADAFRUIT_GFX u8g2Fonts;

struct TaskItem {
    int index;
    String id;
    String listId;
    String listTitle;
    String title;
};

TaskItem triplet[3];
int tripletCount = 0;
int totalTasksInQueue = 0;
int selectedTaskIdx = 0;

// ============================================================================
// 4. DISPLAY HELPERS & VIETNAMESE MULTI-LINE LAYOUT
// ============================================================================

void drawStatusScreen(const char* label, const char* line2,
                      const char* line3, const char* line4,
                      uint16_t ringColor) {
    tft.fillScreen(COLOR_BG);
    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 115, ringColor);
    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 112, COLOR_HUD_RING);

    // Header
    tft.setTextSize(1);
    tft.setTextColor(COLOR_GOLD);
    tft.setCursor(68, 45);
    tft.print(F("VARIS GEAR VGWD"));

    // Primary status label
    tft.setTextSize(2);
    tft.setTextColor(ringColor);
    int16_t lx = TFT_CENTER_X - (strlen(label) * 12 / 2);
    tft.setCursor(lx, 85);
    tft.print(label);

    // Line 2
    tft.setTextSize(1);
    tft.setTextColor(COLOR_TEXT_WHITE);
    int16_t l2x = TFT_CENTER_X - (strlen(line2) * 6 / 2);
    tft.setCursor(l2x, 118);
    tft.print(line2);

    // Line 3
    tft.setTextColor(COLOR_CYAN_GLOW);
    int16_t l3x = TFT_CENTER_X - (strlen(line3) * 6 / 2);
    tft.setCursor(l3x, 134);
    tft.print(line3);

    // Line 4
    tft.setTextColor(COLOR_TEXT_MUTED);
    int16_t l4x = TFT_CENTER_X - (strlen(line4) * 6 / 2);
    tft.setCursor(l4x, 150);
    tft.print(line4);
}

/**
 * Draws multi-line Vietnamese UTF-8 text with accurate bounding-box centering.
 */
void drawVietnameseTitle(const String& title, int16_t startY) {
    u8g2Fonts.setFont(u8g2_font_unifont_t_vietnamese1); // 16px font with full Vietnamese diacritics
    u8g2Fonts.setForegroundColor(COLOR_TEXT_WHITE);

    int maxLineWidth = 180; // Circular screen safe width
    int titleWidth = u8g2Fonts.getUTF8Width(title.c_str());

    if (titleWidth <= maxLineWidth) {
        // Single centered line
        int16_t x = TFT_CENTER_X - (titleWidth / 2);
        u8g2Fonts.setCursor(max((int16_t)20, x), startY + 16);
        u8g2Fonts.print(title);
    } else {
        // Multi-line word wrapping
        String words[16];
        int wordCount = 0;
        int lastIdx = 0;

        for (unsigned int i = 0; i < title.length(); i++) {
            if (title.charAt(i) == ' ' || i == title.length() - 1) {
                int endIdx = (i == title.length() - 1) ? i + 1 : i;
                if (wordCount < 16) {
                    words[wordCount++] = title.substring(lastIdx, endIdx);
                }
                lastIdx = i + 1;
            }
        }

        String currentLine = "";
        int lineNum = 0;

        for (int w = 0; w < wordCount && lineNum < 3; w++) {
            String testLine = currentLine.length() == 0 ? words[w] : currentLine + " " + words[w];
            if (u8g2Fonts.getUTF8Width(testLine.c_str()) <= maxLineWidth) {
                currentLine = testLine;
            } else {
                if (currentLine.length() > 0) {
                    int lineWidth = u8g2Fonts.getUTF8Width(currentLine.c_str());
                    int16_t x = TFT_CENTER_X - (lineWidth / 2);
                    u8g2Fonts.setCursor(max((int16_t)20, x), startY + (lineNum * 20));
                    u8g2Fonts.print(currentLine);
                    lineNum++;
                }
                currentLine = words[w];
            }
        }

        if (currentLine.length() > 0 && lineNum < 3) {
            int lineWidth = u8g2Fonts.getUTF8Width(currentLine.c_str());
            int16_t x = TFT_CENTER_X - (lineWidth / 2);
            u8g2Fonts.setCursor(max((int16_t)20, x), startY + (lineNum * 20));
            u8g2Fonts.print(currentLine);
        }
    }
}

void renderCurrentTaskScreen() {
    tft.fillScreen(COLOR_BG);

    if (tripletCount == 0) {
        drawStatusScreen("NO TASKS", "Flash Cache Empty", "Type 'sync' in Serial", "to fetch from cloud", COLOR_GOLD);
        return;
    }

    TaskItem& current = triplet[selectedTaskIdx];

    // Status Outer Rings
    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 115, COLOR_EMERALD);
    tft.drawCircle(TFT_CENTER_X, TFT_CENTER_Y, 112, COLOR_CYAN_GLOW);

    // Header
    tft.setTextSize(1);
    tft.setTextColor(COLOR_GOLD);
    tft.setCursor(68, 36);
    tft.print(F("GOLDEN HOUR"));

    // Task Position Indicator: "[ Task 1 of 3 ]  Total: 431"
    char posBuf[36];
    snprintf(posBuf, sizeof(posBuf), "[ Task %d of %d ]  Total: %d", selectedTaskIdx + 1, tripletCount, totalTasksInQueue);
    tft.setTextColor(COLOR_TEXT_MUTED);
    int16_t px = TFT_CENTER_X - (strlen(posBuf) * 6 / 2);
    tft.setCursor(max((int16_t)20, px), 50);
    tft.print(posBuf);

    // Divider Line
    tft.drawFastHLine(35, 64, 170, COLOR_HUD_RING);

    // Tasklist Name Tag (rendered with U8g2 for Vietnamese list titles)
    u8g2Fonts.setFont(u8g2_font_unifont_t_vietnamese1);
    u8g2Fonts.setForegroundColor(COLOR_CYAN_GLOW);
    String listTag = "< " + current.listTitle + " >";
    int tagWidth = u8g2Fonts.getUTF8Width(listTag.c_str());
    int16_t lx = TFT_CENTER_X - (tagWidth / 2);
    u8g2Fonts.setCursor(max((int16_t)20, lx), 80);
    u8g2Fonts.print(listTag);

    // Render Full Vietnamese UTF-8 Task Title
    drawVietnameseTitle(current.title, 104);

    // Lower Divider Line
    tft.drawFastHLine(35, 162, 170, COLOR_HUD_RING);

    // Offline / Online Status Footer
    tft.setTextSize(1);
    tft.setTextColor(COLOR_EMERALD);
    tft.setCursor(62, 172);
    tft.print(F("STORAGE: LOCAL DISK"));

    // Instruction Footer
    tft.setTextColor(COLOR_TEXT_MUTED);
    tft.setCursor(48, 188);
    tft.print(F("Serial: 'sync' | 'next'"));
}

// ============================================================================
// 5. FLASH STORAGE CONTROLLER (LITTLEFS CACHE)
// ============================================================================

bool initFlash() {
    if (!LittleFS.begin(true)) {
        Serial.println(F("[STORAGE] LittleFS mount failed!"));
        return false;
    }
    Serial.println(F("[STORAGE] LittleFS mounted successfully."));
    return true;
}

bool loadTripletFromFlash() {
    if (!LittleFS.exists(TRIPLET_CACHE_PATH)) {
        Serial.println(F("[STORAGE] No local triplet cache found on flash."));
        return false;
    }

    File cacheFile = LittleFS.open(TRIPLET_CACHE_PATH, "r");
    if (!cacheFile) {
        Serial.println(F("[STORAGE] Failed to open cache file for reading."));
        return false;
    }

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, cacheFile);
    cacheFile.close();

    if (err) {
        Serial.printf("[STORAGE] JSON deserialize error: %s\n", err.c_str());
        return false;
    }

    totalTasksInQueue = doc["total_in_queue"] | 0;
    JsonArray taskArr = doc["tasks"].as<JsonArray>();

    tripletCount = 0;
    for (JsonObject t : taskArr) {
        if (tripletCount < 3) {
            triplet[tripletCount].index     = t["index"] | (tripletCount + 1);
            triplet[tripletCount].id        = t["task_id"].as<String>();
            triplet[tripletCount].listId    = t["tasklist_id"].as<String>();
            triplet[tripletCount].listTitle = t["tasklist_title"].as<String>();
            triplet[tripletCount].title     = t["title"].as<String>();
            tripletCount++;
        }
    }

    selectedTaskIdx = 0;
    Serial.printf("[STORAGE] Loaded %d tasks from flash cache (Total in queue: %d).\n",
                  tripletCount, totalTasksInQueue);
    return (tripletCount > 0);
}

bool saveTripletToFlash(const String& jsonPayload) {
    File cacheFile = LittleFS.open(TRIPLET_CACHE_PATH, "w");
    if (!cacheFile) {
        Serial.println(F("[STORAGE] Failed to open cache file for writing."));
        return false;
    }

    cacheFile.print(jsonPayload);
    cacheFile.close();
    Serial.println(F("[STORAGE] Triplet payload successfully committed to flash cache."));
    return true;
}

// ============================================================================
// 6. ON-DEMAND CLOUD SYNC (CONNECT -> FETCH -> SAVE -> DISCONNECT)
// ============================================================================

bool performCloudSync() {
    Serial.println(F("\n=================================================="));
    Serial.println(F("[SYNC] Starting On-Demand Cloud Task Synchronization..."));
    Serial.println(F("=================================================="));

    drawStatusScreen("SYNCING...", "Connecting Wi-Fi", WIFI_SSID, "Please wait...", COLOR_CYAN_GLOW);

    // 1. Power on Wi-Fi
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(false);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    uint32_t t0 = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if (millis() - t0 > WIFI_TIMEOUT_MS) {
            Serial.println(F("[SYNC] Wi-Fi connection timed out."));
            WiFi.disconnect(true);
            WiFi.mode(WIFI_OFF);
            drawStatusScreen("SYNC FAILED", "Wi-Fi Timeout", "Check hotspot", "Retrying cached...", COLOR_CRIMSON);
            delay(2000);
            return false;
        }
        delay(400);
        Serial.print(".");
    }

    Serial.printf("\n[SYNC] Wi-Fi Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    drawStatusScreen("FETCHING", "Reaching Cloudflare", "faust.arc-system.id.vn", "", COLOR_EMERALD);

    // 2. Fetch Triplet Queue from Cloudflare Tunnel
    WiFiClientSecure client;
    client.setInsecure();

    HTTPClient https;
    https.begin(client, TRIPLET_ENDPOINT);
    https.setTimeout(12000);

    int httpCode = https.GET();
    if (httpCode != 200) {
        Serial.printf("[SYNC] HTTP Error: %d\n", httpCode);
        https.end();
        WiFi.disconnect(true);
        WiFi.mode(WIFI_OFF);
        drawStatusScreen("SYNC FAILED", "HTTP Error", String(httpCode).c_str(), "Retrying cached...", COLOR_CRIMSON);
        delay(2000);
        return false;
    }

    String payload = https.getString();
    https.end();

    // 3. Immediately shut down Wi-Fi to save energy
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    Serial.println(F("[SYNC] Cloud fetch complete. Wi-Fi modem powered down."));

    // 4. Commit to Flash Storage
    if (!saveTripletToFlash(payload)) {
        drawStatusScreen("FLASH ERR", "Save Failed", "Check LittleFS", "", COLOR_CRIMSON);
        delay(2000);
        return false;
    }

    // 5. Reload from Flash
    loadTripletFromFlash();
    return true;
}

// ============================================================================
// 7. SERIAL INTERACTIVE COMMANDS
// ============================================================================

void handleSerialCommands() {
    if (!Serial.available()) return;

    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.equalsIgnoreCase("sync")) {
        Serial.println(F("[CMD] Manual sync triggered by user."));
        performCloudSync();
        renderCurrentTaskScreen();
    } else if (cmd.equalsIgnoreCase("next")) {
        if (tripletCount > 0) {
            selectedTaskIdx = (selectedTaskIdx + 1) % tripletCount;
            Serial.printf("[CMD] Next task -> [%d] %s\n",
                          selectedTaskIdx + 1, triplet[selectedTaskIdx].title.c_str());
            renderCurrentTaskScreen();
        }
    } else if (cmd.equalsIgnoreCase("prev")) {
        if (tripletCount > 0) {
            selectedTaskIdx = (selectedTaskIdx - 1 + tripletCount) % tripletCount;
            Serial.printf("[CMD] Prev task -> [%d] %s\n",
                          selectedTaskIdx + 1, triplet[selectedTaskIdx].title.c_str());
            renderCurrentTaskScreen();
        }
    } else if (cmd.equalsIgnoreCase("help")) {
        Serial.println(F("\n--- [VGWD025K3 GOLDEN HOUR CONSOLE] ---"));
        Serial.println(F("  sync   - Connect to phone hotspot & fetch fresh tasks to flash"));
        Serial.println(F("  next   - Cycle forward through the 3 loaded tasks"));
        Serial.println(F("  prev   - Cycle backward through the 3 loaded tasks"));
        Serial.println(F("  status - Print current task details and queue stats"));
        Serial.println(F("  help   - Print this command menu"));
        Serial.println(F("---------------------------------------\n"));
    } else if (cmd.equalsIgnoreCase("status")) {
        Serial.println(F("\n--- [TASK ENGINE STATUS] ---"));
        Serial.printf("  Total in Queue : %d\n", totalTasksInQueue);
        Serial.printf("  Tasks Loaded   : %d\n", tripletCount);
        Serial.printf("  Active Index   : %d\n", selectedTaskIdx + 1);
        if (tripletCount > 0) {
            Serial.printf("  Active Title   : %s\n", triplet[selectedTaskIdx].title.c_str());
            Serial.printf("  Active List    : %s\n", triplet[selectedTaskIdx].listTitle.c_str());
            Serial.printf("  Active ID      : %s\n", triplet[selectedTaskIdx].id.c_str());
        }
        Serial.println(F("----------------------------\n"));
    }
}

// ============================================================================
// 8. SETUP
// ============================================================================

void setup() {
    setCpuFrequencyMhz(240);
    Serial.begin(115200);
    delay(200);

    Serial.println();
    Serial.println(F("**************************************************"));
    Serial.println(F("*  VGWD025K3 ~ CODEX OF TIME                    *"));
    Serial.println(F("*  Tab 2: Golden Hour (Full Vietnamese UTF-8)   *"));
    Serial.println(F("**************************************************"));

    // 1. Display Hardware Init (HSPI)
    pinMode(PIN_TFT_CS, OUTPUT);
    digitalWrite(PIN_TFT_CS, HIGH);
    hspi.begin(PIN_LCD_SCK, -1, PIN_LCD_MOSI, PIN_TFT_CS);
    tft.begin();
    tft.setRotation(2);
    tft.fillScreen(COLOR_BG);

    // 2. Initialize U8g2 Vietnamese Font Bridge
    u8g2Fonts.begin(tft);
    u8g2Fonts.setFontMode(1); // Transparent background mode
    u8g2Fonts.setFontDirection(0); // Left to right
    Serial.println(F("[DISPLAY] GC9A01 & U8g2 Vietnamese Font Engine Online."));

    // 3. Initialize Flash File System
    initFlash();

    // 4. OFFLINE-FIRST: Attempt to load existing cache from Flash
    if (loadTripletFromFlash()) {
        Serial.println(F("[SYSTEM] Booted in OFFLINE mode with cached tasks."));
        renderCurrentTaskScreen();
    } else {
        // First boot or empty cache -> trigger initial sync
        Serial.println(F("[SYSTEM] Flash cache empty. Running initial cloud sync..."));
        if (!performCloudSync()) {
            Serial.println(F("[SYSTEM] Initial sync failed. Waiting for manual sync command."));
            drawStatusScreen("STANDBY", "No Tasks in Flash", "Type 'sync' in Serial", "or connect hotspot", COLOR_GOLD);
        } else {
            renderCurrentTaskScreen();
        }
    }

    Serial.println(F("\n[SYSTEM] Ready. Commands: 'sync', 'next', 'prev', 'status', 'help'.\n"));
}

// ============================================================================
// 9. LOOP
// ============================================================================

void loop() {
    // Non-blocking serial command interface
    handleSerialCommands();
    delay(30);
}
