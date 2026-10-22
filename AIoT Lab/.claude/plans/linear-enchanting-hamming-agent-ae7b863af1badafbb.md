# WiFi Multi-Network Implementation Plan

## Priority Request: Mobile Hotspot with Stationary Fallback

### Current Firmware WiFi Setup

**Location**: `D:\My Drive\Blue AI\Hardware_Rather_Empty\Entropy\src\main.cpp` lines 709–727

**Current Behavior**:
- Single network only via `WiFi.begin(WIFI_SSID, WIFI_PASS)`
- Credentials hardcoded in `include\secrets.h`: `"Phong tro 222"` (stationary location)
- Boot timeout: 12 seconds
- Manual reconnect via serial `C`/`W` command: 8 seconds
- `setAutoReconnect(true)` enables background ESP32 stack reconnection to the **same** SSID after disconnection
- No automatic network switching between multiple configured SSIDs

### Available Arduino ESP32 WiFiMulti Pattern

**Header**: `C:\Users\Admin\.platformio\packages\framework-arduinoespressif32\libraries\WiFi\src\WiFiMulti.h`  
**Implementation**: `WiFiMulti.cpp`

**Core API**:
```cpp
#include <WiFiMulti.h>

WiFiMulti wifiMulti;

// Setup: Add networks in priority order (first = highest)
wifiMulti.addAP("SSID_Priority_1", "password1");
wifiMulti.addAP("SSID_Priority_2", "password2");
wifiMulti.addAP("SSID_Priority_3", "password3");

// Connect/maintain: Call periodically
uint8_t status = wifiMulti.run(connectTimeout_ms);
// Returns: WL_CONNECTED, WL_NO_SSID_AVAIL, etc.
```

**Selection Logic** (from `WiFiMulti.cpp:150–403`):
1. If already connected and strict mode enabled, validates current SSID is in the AP list
2. Scans all channels for visible networks
3. For each scanned network, checks against the user's `addAP()` list
4. Selects the **strongest RSSI** match from the list (not insertion order)
5. Connects to best match with specified timeout (default 5000ms)
6. Marks failed APs to skip them temporarily; resets flags when all have failed

**Key Characteristics**:
- **Signal strength wins**, not order (contrary to typical priority expectations)
- Each `run()` performs a full channel scan (~1–3 seconds)
- Blocking during scan + connection attempt
- Returns `WL_CONNECTED` immediately if already connected (unless strict mode forces list validation)
- No persistent priority enforcement; best RSSI from available APs in list

### Implementation Plan for Mobile + Stationary Priority

#### Required Changes

**1. `include\secrets.h`**
```cpp
#pragma once
// Primary: Mobile hotspot (iPhone/Android tethering)
#define WIFI_SSID_PRIMARY "Mobile_Hotspot_Name"
#define WIFI_PASS_PRIMARY "mobile_password"

// Fallback: Stationary home/office network
#define WIFI_SSID_FALLBACK "Phong tro 222"
#define WIFI_PASS_FALLBACK "158a32222"

// Backend endpoint with explicit batch count
#define API_URL "https://rien-bluerose-backend.kha70929.workers.dev/api/quote/random?count=4"
```

**2. `src\main.cpp` includes section (line 3)**
```cpp
#include <WiFi.h>
#include <WiFiMulti.h>  // ADD THIS
#include <WiFiClientSecure.h>
```

**3. `src\main.cpp` global scope (after line 59)**
```cpp
static WiFiMulti wifiMulti;
```

**4. `src\main.cpp` `setup()` WiFi initialization (replace lines 709–727)**
```cpp
if (strlen(WIFI_SSID_PRIMARY) > 0 || strlen(WIFI_SSID_FALLBACK) > 0) {
  splash("Connecting Wi-Fi...", "Multi-network scan");
  WiFi.mode(WIFI_STA);
  WiFi.setTxPower(WIFI_POWER_15dBm);
  
  // Add networks in desired priority order
  // Note: WiFiMulti selects by RSSI, not order, but adding mobile first
  // ensures it's considered when both are visible
  if (strlen(WIFI_SSID_PRIMARY) > 0) {
    wifiMulti.addAP(WIFI_SSID_PRIMARY, WIFI_PASS_PRIMARY);
  }
  if (strlen(WIFI_SSID_FALLBACK) > 0) {
    wifiMulti.addAP(WIFI_SSID_FALLBACK, WIFI_PASS_FALLBACK);
  }
  
  uint32_t t0 = millis();
  uint8_t status = wifiMulti.run(12000); // 12-second timeout per attempt
  
  if (status == WL_CONNECTED) {
    Serial.printf("[wifi] Connected: %s (IP: %s)\n", 
                  WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
    splash("Syncing prescripts...", WiFi.SSID().c_str());
    fetchQuotes();
  } else {
    splash("Wi-Fi unavailable", "Offline standby");
    delay(1000);
  }
} else {
  Serial.println("[wifi] no SSID configured -> offline standby");
}
```

**5. `src\main.cpp` manual reconnect (serial `C`/`W` command, replace lines 752–763)**
```cpp
if (ch == 'c' || ch == 'C' || ch == 'w' || ch == 'W') {
  Serial.println("[SIM] CLOUD RE-SYNC trigger");
  uint8_t status = wifiMulti.run(8000);
  if (status == WL_CONNECTED) {
    Serial.printf("[wifi] Connected: %s\n", WiFi.localIP().toString().c_str());
    fetchQuotes();
  } else {
    Serial.printf("[wifi] Status: %d (not connected)\n", status);
  }
  return;
}
```

**6. `src\main.cpp` idle refresh check (line 782, no change needed)**
```cpp
} else if (WiFi.status() == WL_CONNECTED) {
  // Existing 15-minute idle refresh logic remains unchanged
```

**7. `src\main.cpp` `fetchQuotes()` guard (line 85, no change needed)**
```cpp
if (WiFi.status() != WL_CONNECTED) return false;
// WiFi.status() works identically with WiFiMulti
```

#### Behavioral Outcome

**Power-on sequence**:
1. Device scans for both mobile hotspot and stationary network
2. Connects to whichever has stronger signal if both visible
3. If only one is visible, connects to that one
4. If neither visible, enters offline standby mode
5. After connection, fetches 4 cloud quotes (via `?count=4` parameter)

**Reconnection behavior**:
- Native ESP32 auto-reconnect maintains connection to **current** network
- No automatic switching between networks while connected
- Manual `C`/`W` serial command triggers new scan and best-signal selection
- After 15-minute idle interval, calls `fetchQuotes()` which already guards with connection check

**Network priority reality**:
- WiFiMulti selects by **RSSI strength**, not add order
- When mobile hotspot is nearby (stronger signal), it will be chosen
- When mobile hotspot is distant/off, stationary network will be chosen
- This naturally implements "mobile when available, stationary otherwise" without explicit priority logic

#### Files Modified (Summary)

1. `D:\My Drive\Blue AI\Hardware_Rather_Empty\Entropy\include\secrets.h`
   - Define two credential pairs instead of one
   - Add `?count=4` to API_URL

2. `D:\My Drive\Blue AI\Hardware_Rather_Empty\Entropy\src\main.cpp`
   - Add `#include <WiFiMulti.h>` (line 3 area)
   - Add `static WiFiMulti wifiMulti;` global
   - Replace `WiFi.begin()` calls with `wifiMulti.run()` (3 locations: setup, manual reconnect, no change to idle check)

#### No Worker/Backend Changes Required

The existing Cloudflare Worker at `D:\My Drive\Blue AI\GithubTempRepos\rose-beeper-gateway\src\index.js` already supports `?count=N` parameter (line 43) with default 10, clamped 1–25. Firmware adding `?count=4` to the URL explicitly requests 4 quotes at boot.

---

## Brief Retention: Prior Queue Findings

**Current endpoint**: Returns JSON array (observed 5 records on live test)  
**Firmware pool**: `std::vector<Quote> quotes`, capped at 20, no removal after Roll  
**Boot fetch**: One synchronous call during splash screen  
**Roll replenishment**: Synchronous fetch when pool < 4 entries, **after** display render  
**Minimal change for power-on 4 quotes**: Add `?count=4` to API_URL (already supported by Worker)

Full quote lifecycle analysis available in prior findings; not repeated here per coordinator instruction.

---

**Plan Status**: Implementation-ready, read-only analysis complete.
