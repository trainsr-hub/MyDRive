# ESP32 ↔ Turso Cloud (Read-Only) Integration & Minimal Rendering Guide

This guide details how your **ESP32 microcontroller** securely accesses your **Turso Cloud SQLite database** in **read-only mode** 24/7 over Wi-Fi, and outlines the **minimal 5-point metadata specification** for hardware quote rendering.

---

## 1. Security Architecture: Dedicated Read-Only Token

To protect your cloud database from tampering or hardware theft, the ESP32 should **never hold a full read-write token**. Turso allows creating tokens restricted exclusively to `SELECT` operations.

### Generating a Read-Only Token in Turso:
1. Open **[https://app.turso.tech](https://app.turso.tech)**.
2. Navigate to your database (`heraclitus-rien-bluerose`).
3. Click the **Tokens** tab -> **"Create Token"**.
4. Set Name: `esp32-readonly`.
5. Toggle **"Read-only"**: **ON** (`true`).
6. Set Expiration: **Never** (or preferred timeframe).
7. Copy the generated read-only token into your ESP32 sketch.

*(Any attempt by firmware using this token to execute `INSERT`, `UPDATE`, or `DELETE` is automatically rejected by the Turso kernel with HTTP 403).*

---

## 2. Minimal Metadata Rendering Specification

For microcontrollers with limited display canvas (E-Paper, TFT, OLED) and audio engines, the lesser the metadata, the better. We strip away internal UUIDs, backlinks, and shadow tags, distilling each quote to **5 essential display dimensions**:

| # | Dimension | Field Name | Description | Fallback Rule |
|---|---|---|---|---|
| **1** | **Content** | `content` | The core wisdom quote / poem text | Required |
| **2** | **Context** | `context` | Situational backdrop & reflection | Empty string if absent |
| **3** | **Origin / Creator** | `container_name` | The author, persona, or franchise (e.g. *William Blake*, *Faust*) | Joined from Table 2 |
| **4** | **Specific Endpoint** | `specific_name` | The work, chapter, or song (e.g. *Infant Joy*, *Koi no Koe*) | Joined from Table 3 |
| **5** | **Effective Date** | `effective_date` | The temporal coordinate (e.g. `2026-09-30`, `1789`) | **Display-time fallback**: If quote date is empty, automatically uses `specific.date` without mutating database |
| **+** | **Thematic Anchor** | `theme_names` | Plain text comma-separated conceptual labels (e.g. *Heartbroken*, *Order & Entropy*) | Resolved from Table 4 |
| **+** | **Evaluation & Scoring** | `scores`, `average_score` | List of scoring ratings (e.g. `[5,6,4,7,5]`) and arithmetic average (e.g. `5.4`) | `[]` and `null` if unrated |

---

## 3. The Unified Edge SQL Query (One-Trip Resolution)

Rather than forcing the ESP32 to make multiple network roundtrips to join tables, we let Turso's SQLite engine perform the join and fallback at the edge. The ESP32 sends a single query and receives the complete bundle:

### Query: Fetch Random Quote for Rendering
```sql
SELECT 
    q.idx,
    q.main_content AS content,
    COALESCE(q.context, '') AS context,
    COALESCE(NULLIF(q.date, ''), s.date, '') AS effective_date,
    COALESCE(s.name, '') AS specific_name,
    COALESCE(c.name, '') AS container_name,
    COALESCE(s.category, '') AS category,
    COALESCE((
        SELECT GROUP_CONCAT(t.name, ', ')
        FROM themes t
        WHERE t.id IN (SELECT value FROM json_each(q.theme_ids))
    ), '') AS theme_names
FROM quotes q
LEFT JOIN specifics s ON q.specific_id = s.id
LEFT JOIN containers c ON s.container_id = c.id
ORDER BY RANDOM() LIMIT 1;
```

### Query: Fetch Latest Quote for Rendering
```sql
SELECT 
    q.idx,
    q.main_content AS content,
    COALESCE(q.context, '') AS context,
    COALESCE(NULLIF(q.date, ''), s.date, '') AS effective_date,
    COALESCE(s.name, '') AS specific_name,
    COALESCE(c.name, '') AS container_name,
    COALESCE(s.category, '') AS category,
    COALESCE((
        SELECT GROUP_CONCAT(t.name, ', ')
        FROM themes t
        WHERE t.id IN (SELECT value FROM json_each(q.theme_ids))
    ), '') AS theme_names
FROM quotes q
LEFT JOIN specifics s ON q.specific_id = s.id
LEFT JOIN containers c ON s.container_id = c.id
ORDER BY q.idx DESC LIMIT 1;
```

---

## 4. Complete Read-Only Arduino C++ Sketch

Install via Arduino IDE Library Manager:
- **`ArduinoJson`** (v6 or v7 by Benoit Blanchon)

```cpp
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==============================================================================
// 1. CONFIGURATION
// ==============================================================================
const char* ssid          = "YOUR_WIFI_SSID";
const char* password      = "YOUR_WIFI_PASSWORD";

// Turso Database HTTP Endpoint (Sydney AWS edge)
const char* turso_url     = "https://heraclitus-rien-bluerose.aws-ap-southeast-2.turso.io/v2/pipeline";

// Paste your dedicated Read-Only token here
const char* turso_ro_token = "YOUR_READ_ONLY_TOKEN";

// ==============================================================================
// 2. DATA RECEPTACLE (MINIMAL 5-POINT METADATA STRUCT)
// ==============================================================================
struct QuoteRenderPayload {
  long idx;
  String content;
  String context;
  String effectiveDate;
  String specificName;
  String containerName;
  String category;
  String themeNames;
};

// ==============================================================================
// 3. SECURE READ-ONLY TURSO FETCHER
// ==============================================================================
bool fetchQuoteFromTurso(QuoteRenderPayload &out, bool randomQuote = true) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Reconnecting to Wi-Fi...");
    WiFi.begin(ssid, password);
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 15) {
      delay(500);
      retries++;
    }
    if (WiFi.status() != WL_CONNECTED) return false;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Saves RAM by bypassing full X.509 cert chain validation

  HTTPClient http;
  http.begin(client, turso_url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + turso_ro_token);

  // The minimal metadata query with date fallback, joined names, and category
  String sql = "SELECT "
               "q.idx, "
               "q.main_content AS content, "
               "COALESCE(q.context, '') AS context, "
               "COALESCE(NULLIF(q.date, ''), s.date, '') AS effective_date, "
               "COALESCE(s.name, '') AS specific_name, "
               "COALESCE(c.name, '') AS container_name, "
               "COALESCE(s.category, '') AS category, "
               "COALESCE((SELECT GROUP_CONCAT(t.name, ', ') FROM themes t WHERE t.id IN (SELECT value FROM json_each(q.theme_ids))), '') AS theme_names "
               "FROM quotes q "
               "LEFT JOIN specifics s ON q.specific_id = s.id "
               "LEFT JOIN containers c ON s.container_id = c.id ";

  sql += randomQuote ? "ORDER BY RANDOM() LIMIT 1;" : "ORDER BY q.idx DESC LIMIT 1;";

  // Escape quotation marks for JSON payload
  sql.replace("\"", "\\\"");

  String payload = "{\"requests\":[{\"type\":\"execute\",\"stmt\":{\"sql\":\"" + sql + "\"}},{\"type\":\"close\"}]}";

  Serial.println("[TURSO] Executing Read-Only SQL query...");
  int httpCode = http.POST(payload);

  if (httpCode == 200) {
    String response = http.getString();
    
    // Parse response with ArduinoJson (Lightweight ~2 KB buffer)
    DynamicJsonDocument doc(4096);
    DeserializationError error = deserializeJson(doc, response);

    if (!error) {
      JsonArray rows = doc["results"][0]["response"]["result"]["rows"];
      if (rows.size() > 0) {
        out.idx           = rows[0][0]["value"].as<long>();
        out.content       = rows[0][1]["value"].as<String>();
        out.context       = rows[0][2]["value"].as<String>();
        out.effectiveDate = rows[0][3]["value"].as<String>();
        out.specificName  = rows[0][4]["value"].as<String>();
        out.containerName = rows[0][5]["value"].as<String>();
        out.category      = rows[0][6]["value"].as<String>();
        out.themeNames    = rows[0][7]["value"].as<String>();

        http.end();
        return true;
      } else {
        Serial.println("[TURSO] Database returned 0 rows.");
      }
    } else {
      Serial.print("[JSON] Deserialization error: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.printf("[HTTP] Error %d: %s\n", httpCode, http.getString().c_str());
  }

  http.end();
  return false;
}

// ==============================================================================
// 4. DISPLAY / RENDER FUNCTION (VISION SPECIFICATION)
// ==============================================================================
// ANSI 256-Color & RGB Codes for Microcontroller Displays & Serial Terminal:
#define ANSI_RESET        "\033[0m"
#define ANSI_WHITE        "\033[1;37m"
#define ANSI_GHOST_GRAY   "\033[38;5;242m"  // Muted ghost gray for header coordinates
#define ANSI_ACCENT_BLUE  "\033[38;5;75m"   // Sapphire Blue (#38bdf8)
#define ANSI_ACCENT_GOLD  "\033[38;5;214m"  // Imperial Gold (#f59e0b)

// Vast Independent Tag Color Pool (16+ Distinct Microcontroller Colors):
const char* TAG_COLOR_POOL[] = {
  "\033[38;5;75m",  // Sapphire Blue
  "\033[38;5;214m", // Amber Gold
  "\033[38;5;44m",  // Sky Cyan
  "\033[38;5;42m",  // Emerald Green
  "\033[38;5;204m", // Crimson Rose
  "\033[38;5;177m", // Royal Violet
  "\033[38;5;208m", // Tangerine
  "\033[38;5;141m", // Lavender
  "\033[38;5;80m",  // Aquamarine
  "\033[38;5;219m", // Orchid
  "\033[38;5;119m", // Spring Mint
  "\033[38;5;220m", // Bright Topaz
  "\033[38;5;168m", // Magenta
  "\033[38;5;69m",  // Cobalt
  "\033[38;5;172m", // Ochre
  "\033[38;5;51m"   // Electric Aqua
};
const int TAG_COLOR_COUNT = 16;

void renderQuote(const QuoteRenderPayload &q) {
  // 1. Randomly pick ONE shared color for quotation marks & container (Pool of 2: Gold or Blue)
  bool pickGold = ((q.idx % 2) == 0); // Deterministic per quote or use random(0, 2)
  const char* sharedAccent = pickGold ? ANSI_ACCENT_GOLD : ANSI_ACCENT_BLUE;

  Serial.println("\n┌──────────────────────────────────────────────────────────────────────────┐");
  
  // 2. Header: #IDX ~ Specific on left, Date: <date> on right (Ghost gray & smaller)
  String headerLeft = "#" + String(q.idx) + " ~ " + q.specificName;
  String headerRight = "Date: " + q.effectiveDate;
  Serial.printf("│ " ANSI_GHOST_GRAY "%-44s" ANSI_RESET "  " ANSI_GHOST_GRAY "%24s" ANSI_RESET " │\n", 
                headerLeft.c_str(), headerRight.c_str());
  Serial.println("├──────────────────────────────────────────────────────────────────────────┤");
  
  // 3. Content: Italic-feel wrapped in distinct quotation marks sharing container's accent color
  bool isWriting = q.category.equalsIgnoreCase("writing") || q.category.equalsIgnoreCase("bài viết");
  Serial.printf("│ %s“" ANSI_RESET ANSI_WHITE "%s" ANSI_RESET "%s”" ANSI_RESET "\n", 
                sharedAccent, q.content.c_str(), sharedAccent);
  
  if (q.context.length() > 0) {
    Serial.printf("│\n│ " ANSI_GHOST_GRAY "[%s]" ANSI_RESET "\n", q.context.c_str());
  }

  Serial.println("├──────────────────────────────────────────────────────────────────────────┤");
  
  // 4. Footer: Each tag has a distinct random color block (left) · Container shares mark's color (right)
  String tagsFormatted = "";
  if (q.themeNames.length() > 0) {
    int start = 0;
    int tagIndex = 0;
    while (start < q.themeNames.length()) {
      int comma = q.themeNames.indexOf(',', start);
      if (comma == -1) comma = q.themeNames.length();
      String tag = q.themeNames.substring(start, comma);
      tag.trim();
      if (tag.length() > 0) {
        const char* tagColor = TAG_COLOR_POOL[(q.idx + tagIndex) % TAG_COLOR_COUNT];
        if (tagsFormatted.length() > 0) tagsFormatted += " ";
        tagsFormatted += String(tagColor) + "[" + "#" + tag + "]" + ANSI_RESET;
        tagIndex++;
      }
      start = comma + 1;
    }
  }

  Serial.printf("│ %-48s  %s%24s" ANSI_RESET " │\n", 
                tagsFormatted.c_str(), sharedAccent, q.containerName.c_str());
  Serial.println("└──────────────────────────────────────────────────────────────────────────┘\n");

  // On physical TFT/E-Paper displays (e.g. GxEPD2 or LovyanGFX):
  // - Render header text with smaller font (e.g. 9pt) in ghost gray
  // - Render quotes and container with shared accent color (Gold or Blue)
  // - Render each tag capsule with its designated palette color!
}

// ==============================================================================
// 5. MAIN ARDUINO ENTRYPOINTS
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.printf("\n[BOOT] Connecting to Wi-Fi '%s'...\n", ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());

  // Fetch and display a random quote on startup
  QuoteRenderPayload quote;
  if (fetchQuoteFromTurso(quote, true)) {
    renderQuote(quote);
  }
}

void loop() {
  // Cycle quote every 5 minutes (or attach to a physical button interrupt)
  delay(300000);

  QuoteRenderPayload quote;
  if (fetchQuoteFromTurso(quote, true)) {
    renderQuote(quote);
  }
}
```


---

## 5. Live Web Simulators & Hardware Previews
Before flashing your hardware, you can test and inspect the exact visual rendering live:
* `http://localhost:20137/esp32_19_display_mock.html`: Dedicated **LilyGO T-Display-S3 (1.9" IPS Bar, 320×170)** hardware chassis simulator with 1:1 real-size physical preview (65×28.5 mm).
* `http://localhost:20137/quote_presentation_test.html`: Clean high-contrast E-Paper workbench preview.
