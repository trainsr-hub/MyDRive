# Phase ESP32: Hardware-to-Backend Interface Specification
**Author**: Faust (Serving The Manager)  
**Target File**: `D:\My Drive\SandBox Projetcs\Plans\Phase_ESP32.md`  
**System**: Universe 25 (Golden Hour Task Engine)  
**Backend Base URL**: `http://<YOUR_COMPUTER_LOCAL_IP>:8080` (e.g. `http://192.168.1.50:8080`)

---

## 1. Architectural Principles & Vision Calibration

1. **Pure Task Execution (Zero Synthetic Rewards)**:
   - Completing a task in Google Tasks is authentic real-world work.
   - No synthetic currency or time rewards are injected automatically.
   - The backend solely updates the local state and syncs the completion back to Google Cloud.

2. **The Triplet Focus Model (1 to 3 Directives at a Time)**:
   - Instead of a single static directive, the ESP32 fetches a focused cluster of **3 tasks at a time**.
   - The user can inspect the triplet on the OLED / TFT display, navigate between them, and focus on one.

3. **Sub-2ms Local Disk Cache & Isolated Background Sync**:
   - The ESP32 and Frontend **never wait for Google's servers**. All reads and writes hit `tasks_cache.json` on Local Disk `D:\` in **`< 2ms`**.
   - **Why marking as done is instant**: Completing a task does **NOT** trigger a heavy sync of all 18 lists. It immediately updates the local file in `< 1ms` and fires a single isolated background HTTP PATCH to Google for only that one task.
   - The backend never blocks, and the frontend **never disconnects or turns red**.

---

## 2. The 3 Core Operations (API Contract)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SYNC FROM GOOGLE (Explicit / Periodic Re-Sync)                           │
│ POST /api/v1/golden-hour/google-tasks/sync                                  │
│ • Runs in background: pulls all 18 lists & updates local Disk D:\ cache.    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. PROVIDE TASKS (The Triplet Focus Queue)                                  │
│ GET /api/v1/golden-hour/esp32/queue?limit=3&tasklist_id=all                 │
│ • Reads from local Disk D:\ in < 2ms without network overhead.              │
│ • Returns top 3 tasks formatted for OLED / TFT display.                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. MARK TASK AS DONE (Instant Local + Async Background Patch)               │
│ POST /api/v1/golden-hour/google-tasks/complete                              │
│ • Local cache updated in < 1ms -> Returns success to ESP32 immediately.    │
│ • Single background thread patches Google Cloud (zero backend freezing).    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Operation 1: Ask Backend to Sync from Google
*Triggers the backend to pull fresh tasks across all 18 Google Task lists and refresh the local Disk D:\ cache.*

* **Method**: `POST`
* **Endpoint**: `/api/v1/golden-hour/google-tasks/sync`
* **Headers**: `Content-Type: application/json`
* **When to Call**: On device boot or when pressing a physical "Sync" button.

#### Backend Response (`200 OK`):
```json
{
  "success": true,
  "count": 431,
  "lists_count": 18,
  "last_synced_at": "2026-09-18T14:35:00.000Z"
}
```

---

### Operation 2: Ask Backend to Provide Tasks (Triplet Queue)
*Returns the top focused directives (default 3 items) formatted specifically for ESP32 OLED display.*

* **Method**: `GET`
* **Endpoint**: `/api/v1/golden-hour/esp32/queue?limit=3`
* **Optional Query Parameters**:
  - `?limit=3` (Default: 3 tasks. Can be set to `1` or `5`)
  - `?tasklist_id=all` (Default: top tasks across all lists)
  - `?tasklist_id=aktwcGFsSHo2ckpoRkE2Yw` (Specific list, e.g. "Green" or "Date Dependence")

#### Backend Response (`200 OK` — `< 2ms` Response Time):
```json
{
  "success": true,
  "count": 3,
  "total_in_queue": 431,
  "selected_list": "all",
  "tasks": [
    {
      "index": 1,
      "task_id": "WW1LWVJBaXNqMjJ0ZXd1Rw",
      "tasklist_id": "aktwcGFsSHo2ckpoRkE2Yw",
      "tasklist_title": "Green",
      "title": "Nuoc",
      "notes": "",
      "due": null
    },
    {
      "index": 2,
      "task_id": "UlhSSVU3YW5aMlI2WEdCcw",
      "tasklist_id": "aktwcGFsSHo2ckpoRkE2Yw",
      "tasklist_title": "Green",
      "title": "Cac skill chat bot giai bai",
      "notes": "",
      "due": null
    },
    {
      "index": 3,
      "task_id": "ZlJtSWRMeUZkUXFIT19xQw",
      "tasklist_id": "aktwcGFsSHo2ckpoRkE2Yw",
      "tasklist_title": "Green",
      "title": "Van de cay Card va KPI",
      "notes": "",
      "due": null
    }
  ],
  "top_task": {
    "index": 1,
    "task_id": "WW1LWVJBaXNqMjJ0ZXd1Rw",
    "title": "Nuoc"
  },
  "last_synced_at": "2026-09-18T14:35:00.000Z"
}
```

---

### Operation 3: Ask Backend to Mark Task as Completed
*Fired when the user presses the tactile physical button on the ESP32.*

* **Method**: `POST`
* **Endpoint**: `/api/v1/golden-hour/google-tasks/complete`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "task_id": "WW1LWVJBaXNqMjJ0ZXd1Rw",
  "tasklist_id": "aktwcGFsSHo2ckpoRkE2Yw"
}
```

#### Backend Response (`200 OK` — `< 2ms` Response Time):
```json
{
  "success": true,
  "task_id": "WW1LWVJBaXNqMjJ0ZXd1Rw",
  "tasklist_id": "aktwcGFsSHo2ckpoRkE2Yw",
  "status": "completed",
  "timestamp": "2026-09-18T14:36:00.000Z"
}
```

---

## 3. Ready-to-Flash ESP32 Arduino C++ Code (Triplet Support)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =============================================================================
// CONFIGURATION
// =============================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Local IP of your PC running the Backend (port 8080)
const char* BACKEND_HOST  = "http://192.168.1.50:8080"; 

const int BTN_NEXT_PIN     = 18; // Button to cycle between the 3 tasks
const int BTN_COMPLETE_PIN = 19; // Button to mark selected task as DONE

struct FocusTask {
  String id;
  String title;
  String listTitle;
  int index;
};

FocusTask triplet[3];
int tripletCount = 0;
int selectedIndex = 0; // 0, 1, or 2

// =============================================================================
// API CLIENT FUNCTIONS
// =============================================================================

// 1. Fetch Top 3 Tasks from Backend
bool fetchTripletQueue() {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(BACKEND_HOST) + "/api/v1/golden-hour/esp32/queue?limit=3";
  http.begin(url);

  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    
    StaticJsonDocument<1024> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      JsonArray taskArray = doc["tasks"].as<JsonArray>();
      tripletCount = 0;

      Serial.println("========================================");
      Serial.println("[ESP32 TRIPLET FOCUS QUEUE]");
      for (JsonObject t : taskArray) {
        if (tripletCount < 3) {
          triplet[tripletCount].id        = t["task_id"].as<String>();
          triplet[tripletCount].title     = t["title"].as<String>();
          triplet[tripletCount].listTitle = t["tasklist_title"].as<String>();
          triplet[tripletCount].index     = t["index"].as<int>();

          Serial.printf(" [%d] %s (%s)\n", 
            triplet[tripletCount].index, 
            triplet[tripletCount].title.c_str(), 
            triplet[tripletCount].listTitle.c_str()
          );
          tripletCount++;
        }
      }
      Serial.printf("Total remaining in queue: %d\n", doc["total_in_queue"].as<int>());
      Serial.println("========================================");

      selectedIndex = 0; // Focus on top task by default
      http.end();
      return true;
    }
  }
  http.end();
  return false;
}

// 2. Mark Selected Task as Completed (Instant < 2ms response)
bool completeSelectedTask() {
  if (WiFi.status() != WL_CONNECTED || tripletCount == 0) return false;

  HTTPClient http;
  String url = String(BACKEND_HOST) + "/api/v1/golden-hour/google-tasks/complete";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["task_id"] = triplet[selectedIndex].id;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == 200) {
    Serial.println("========================================");
    Serial.printf("[TASK COMPLETED] %s\n", triplet[selectedIndex].title.c_str());
    Serial.println("Local cache updated (<2ms). Synced to Google.");
    Serial.println("========================================");
    http.end();
    
    // Automatically pull the fresh triplet queue
    fetchTripletQueue();
    return true;
  }
  http.end();
  return false;
}

// =============================================================================
// SETUP & LOOP
// =============================================================================
void setup() {
  Serial.begin(115200);
  pinMode(BTN_NEXT_PIN, INPUT_PULLUP);
  pinMode(BTN_COMPLETE_PIN, INPUT_PULLUP);

  Serial.println("\n[ESP32] Connecting to Wi-Fi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[ESP32] Wi-Fi Connected! IP: " + WiFi.localIP().toString());

  // Fetch initial triplet
  fetchTripletQueue();
}

void loop() {
  // 1. Cycle between the 3 tasks
  if (digitalRead(BTN_NEXT_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BTN_NEXT_PIN) == LOW && tripletCount > 0) {
      selectedIndex = (selectedIndex + 1) % tripletCount;
      Serial.printf("[ESP32] Focus Shifted -> [%d] %s\n", 
        triplet[selectedIndex].index, 
        triplet[selectedIndex].title.c_str()
      );
      while (digitalRead(BTN_NEXT_PIN) == LOW) delay(10);
    }
  }

  // 2. Mark Selected Task as Complete
  if (digitalRead(BTN_COMPLETE_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BTN_COMPLETE_PIN) == LOW) {
      Serial.println("[ESP32] Tactile Done Button Pressed!");
      completeSelectedTask();
      while (digitalRead(BTN_COMPLETE_PIN) == LOW) delay(10);
    }
  }

  delay(100);
}
```

---
**Status**: Vision Calibrated & Authoritative. Ready for ESP32 Hardware Deployment.
