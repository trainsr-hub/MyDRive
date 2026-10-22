# Rien-Prescript-Beeper — Hardware UI Specification & Screen Ratio Guide

> **Target Platform**: ESP32 / ESP32-S3 Microcontrollers  
> **Target Displays**: E-Paper (Waveshare 2.9", 4.2", 7.5" GxEPD2) & TFT/OLED (ST7789, ILI9341, SSD1306)  
> **Source Database**: Turso Cloud SQLite (`heraclitus-rien-bluerose`)  
> **Rendering Paradigm**: Clean Vision Layout (Ghosted Header · Italic Body in Quotes · Multi-Color Tag Capsules · Shared Accent Container)
> **Orientation Invariant**: **Horizontal Landscape (Like a PC Monitor / Width >> Height)**. In Arduino TFT/ST7789 driver: enforce `display.setRotation(1);` or `display.setRotation(3);`.

---

## 1. Visual Geometry & Screen Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [ZONE 1: GHOST HEADER] (Y: 0–30px, Font: 9pt Mono, Color: Ghost Gray)   │
│ #6 ~ Đàn ông thích mèo, đàn bà yêu chó                  Date: 2021~2023  │
├──────────────────────────────────────────────────────────────────────────┤
│ [ZONE 2: BODY CANVAS] (Y: 35–220px, Font: 14pt Mono Italic, White)      │
│                                                                          │
│ “Nỗi sợ lớn nhất của một người đàn ông chính là nước mắt đàn bà. Bản      │
│  năng của phái mạnh là bao bọc, che chở chứ không phải giẫm đạp, hủy     │
│  hoại. Bởi thế, đàn ông luôn tránh nói lời chia tay vì không dám đối     │
│  diện với nước mắt, sợ làm tổn thương người phụ nữ của anh ta...”        │
│                                                                          │
│ [ZONE 3: GENESIS CONTEXT] (Optional callout box, Y: 220–250px, Dim Gray) │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ [ZONE 4: FOOTER] (Y: 255–290px, Font: 10pt Mono Bold)                    │
│ [#Heartbroken] [#Wisdom]                           Spiderum - Linh Vũ    │
│ (Independent Vast Spectrum Colors)                 (Shared Accent Color) │
└──────────────────────────────────────────────────────────────────────────┘
```

---


---

## 2. Hardware Aspect Ratio Comparison & Screen Options

The physical **Rien-Prescript-Beeper** can be fabricated around several standard display modules depending on your desired form factor:

| Module Identifier | Display Tech | Native Resolution | Aspect Ratio | Physical Outer Dimensions | Viewport Characteristics |
|---|---|---|---|---|---|
| **1.9" IPS Bar** (Default) | Full-Color IPS LCD | **320 × 170 px** | **1.88 : 1** (~2:1) | **65.0 × 28.5 mm** | Sleek horizontal bar, 2-line couplets fit without wrapping. |
| **2.4" Pager / Cyberdeck** | Full-Color IPS LCD | **320 × 240 px** | **4 : 3** (1.33:1) | **60.0 × 45.0 mm** | Classic 90s pager / cyberdeck aesthetic, generous vertical room for prose. |
| **2.13" E-Paper** | Reflective E-Ink | **250 × 122 px** | **2.05 : 1** | **65.0 × 30.2 mm** | Pure e-ink paper texture, permanent zero-power ambient desk display. |
| **2.9" Panoramic E-Paper** | Reflective E-Ink | **296 × 128 px** | **2.31 : 1** | **79.0 × 36.7 mm** | Ultra-wide panoramic letterbox, book-quote spread. |
| **1.69" Compact Beeper** | Full-Color IPS LCD | **280 × 240 px** | **7 : 6** (1.16:1) | **42.0 × 35.0 mm** | Ultra-compact pocket talisman / keychain beeper. |
| **1:1 Native Mode** | Hardware LCD | **320 × 170 px** | 1:1 Pixel Native | 65.0 × 28.5 mm | Exact unscaled 1:1 pixel rendering on physical ST7789 framebuffer. |

---

## 3. Dynamic Vertical Centering & Unboxing Architecture

Unlike rigid 4-row grid displays, the **Rien-Prescript-Beeper** does not force quotes into artificial 4-row slots:
* **Natural Content Line Allocation**:
  - The unboxing chaos/cipher matrix only instantiates for lines that contain actual text characters.
  - A 1-line quote renders as exactly 1 line and sits centered vertically in the display.
  - A 2-line couplet renders as exactly 2 lines and sits centered vertically in the display with balanced margins above and below.
  - Longer passages (3–4 lines per page) fill the height naturally and paginate seamlessly.
* **The Viewport Contract**:

Unlike rigid static displays, the **Rien-Prescript-Beeper** never shrinks or crams text to fit on-screen:
* **The Viewport Contract**:
  - The Header (#IDX ~ Specific & Date:) and Footer (#Tags & Container) remain pinned at fixed hardware boundaries (top 20px and bottom 20px).
  - The middle body area is a **Scrollable Viewport** (`ep-viewport`).
  - Short couplets (~2 lines) render fully in the viewport.
  - Long philosophical prose reflections (e.g. Quote #6) flow naturally at **Size L (14pt)**; the user scrolls smoothly down the passage using tactile physical buttons (`GPIO_UP`, `GPIO_DOWN`, rotary encoder, or touch drag).

## 4. Hardware Color Codes (16-Bit RGB565 & Hex)

For full-color microcontrollers (ST7789 / ILI9341 / LovyanGFX) and monochrome E-Paper:

| Element | Color Name | Hex Code | 16-Bit RGB565 | Role / Psychological Impact |
|---|---|---|---|---|
| **Canvas Background** | Obsidian Noir | `#000000` | `0x0000` | Infinite negative space, zero eye strain |
| **Quote Body** | Crisp Paper White | `#FFFFFF` | `0xFFFF` | Maximum readability, primary focal point |
| **Quotation Marks (`“ ”`)** | **Sapphire Blue** OR **Imperial Gold** | `#38bdf8` / `#f59e0b` | `0x3DF7` / `0xFD01` | **Shared Accent**: Random pool of 2 bookending the text |
| **Container Name** | **Sapphire Blue** OR **Imperial Gold** | `#38bdf8` / `#f59e0b` | `0x3DF7` / `0xFD01` | **Shared Accent**: Harmonizes with quote marks at bottom right |
| **Header Metadata** | Ghost Slate Gray | `#666666` | `0x632C` | Subdued coordinate row (`#IDX ~ Specific` & `Date`) |
| **Context Callout** | Muted Ash | `#777777` | `0x7BEF` | Secondary background reflection note |
| **Borders / Rules** | Graphite Divider | `#222222` | `0x2104` | 1px horizontal demarcation line |

### Vast Independent Tag Color Pool (16-Color RGB565 Array)
```cpp
const uint16_t TAG_RGB565_POOL[] = {
  0x3DF7, // Sapphire Blue (#38bdf8)
  0xFD01, // Imperial Gold (#f59e0b)
  0x05B5, // Cyan (#06b6d4)
  0x15D0, // Emerald Green (#10b981)
  0xF9E7, // Crimson Rose (#f43f5e)
  0xC23F, // Royal Violet (#c084fc)
  0xFD80, // Tangerine (#fb923c)
  0xB53F, // Lavender (#a78bfa)
  0x3FD7, // Aquamarine (#22d3ee)
  0xF49F, // Orchid (#e879f9)
  0x8E84, // Spring Mint (#4ade80)
  0xFDE4, // Topaz Amber (#facc15)
  0xFA0F, // Magenta (#f43f5e)
  0x4CD7, // Cobalt (#60a5fa)
  0xD380, // Ochre (#d97706)
  0x07FF  // Electric Aqua (#00ffff)
};
const int TAG_RGB565_COUNT = 16;
```

---

## 5. Typographic Engine & Category Alignment Rules

The `specifics.category` column determines the hardware paragraph formatting:

```cpp
bool isJustified = category.equalsIgnoreCase("writing") || 
                   category.equalsIgnoreCase("bài viết") || 
                   category.equalsIgnoreCase("baiviet");
```

1. **`writing` (`Bài Viết`, Prose, Essay)**:
   - Calculate line width and distribute remaining whitespace evenly between words.
   - Produces a flush left-and-right magazine / book column.
2. **`music` (Song lyrics)**:
   - Natural left-alignment. Line breaks (`\n`) are preserved to maintain rhythmic flow.
3. **`poem` (Poetry, Verses)**:
   - Natural left-alignment. Short lines retain their poetic meter and ragged right edge.

---

## 6. Single-Statement Edge SQL Query

This exact query fetches the entire 5-point bundle in a single network roundtrip to Turso:

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

---

## 7. Complete C++ Firmware Implementation (GxEPD2 / LovyanGFX / TFT)

```cpp
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ==============================================================================
// 1. HARDWARE DATA STRUCT
// ==============================================================================
struct QuotePayload {
  long idx;
  String content;
  String context;
  String effectiveDate;
  String specificName;
  String containerName;
  String category;
  String themeNames;
};

// 2-Color Accent Pool for Quote Marks & Container
const uint16_t ACCENT_POOL_RGB565[] = {
  0x3DF7, // Sapphire Blue (#38bdf8)
  0xFD01  // Imperial Gold (#f59e0b)
};

// ==============================================================================
// 2. DISPATCH RENDERER TO TFT / E-PAPER (LOVYANGFX / ADAFRUIT_GFX COMPATIBLE)
// ==============================================================================
void drawQuoteOnDisplay(const QuotePayload &q) {
  // Select shared accent color for quote marks & container from pool of 2
  uint16_t sharedAccent = ACCENT_POOL_RGB565[q.idx % 2];

  // 1. Clear background to Obsidian Noir
  // display.fillScreen(0x0000);

  // 2. Render Header (Ghost Gray, 9pt): #IDX ~ Specific on left, Date on right
  // display.setTextColor(0x632C);
  // display.setCursor(16, 20);
  // display.printf("#%ld ~ %s", q.idx, q.specificName.c_str());
  
  // display.setCursor(display.width() - 120, 20);
  // display.printf("Date: %s", q.effectiveDate.c_str());

  // 3. Draw Divider Line (Graphite 1px)
  // display.drawFastHLine(16, 30, display.width() - 32, 0x2104);

  // 4. Render Quotation Marks (Shared Accent: Blue or Gold)
  // display.setTextColor(sharedAccent);
  // display.print("“");

  // 5. Render Italic Quote Content (Crisp White: 0xFFFF)
  // display.setTextColor(0xFFFF);
  // bool isWriting = q.category.equalsIgnoreCase("writing") || q.category.equalsIgnoreCase("bài viết");
  // if (isWriting) {
  //   renderJustifiedText(q.content, 16, 50, display.width() - 32);
  // } else {
  //   renderLeftAlignedText(q.content, 16, 50, display.width() - 32);
  // }

  // display.setTextColor(sharedAccent);
  // display.print("”");

  // 6. Draw Bottom Divider
  // display.drawFastHLine(16, display.height() - 40, display.width() - 32, 0x2104);

  // 7. Render Footer:
  // - Tags on Left (Each with independent color from TAG_RGB565_POOL)
  // - Container on Right (Shares sharedAccent with quote marks)
}

// ==============================================================================
// 3. SERIAL TERMINAL PREVIEW (ANSI HIGH CONTRAST)
// ==============================================================================
void printQuoteToSerial(const QuotePayload &q) {
  bool pickGold = ((q.idx % 2) == 0);
  const char* accentColor = pickGold ? "\033[38;5;214m" : "\033[38;5;75m"; // Gold or Blue
  const char* ghostColor  = "\033[38;5;242m";
  const char* resetColor  = "\033[0m";
  const char* whiteColor  = "\033[1;37m";

  Serial.println("\n┌──────────────────────────────────────────────────────────────────────────┐");
  
  // Header: Ghosted smaller scale
  String leftHeader = "#" + String(q.idx) + " ~ " + q.specificName;
  String rightHeader = "Date: " + q.effectiveDate;
  Serial.printf("│ %s%-44s%s  %s%24s%s │\n", 
                ghostColor, leftHeader.c_str(), resetColor, 
                ghostColor, rightHeader.c_str(), resetColor);
  Serial.println("├──────────────────────────────────────────────────────────────────────────┤");

  // Body: Italic in quotes
  Serial.printf("│ %s“%s%s%s%s%s”%s\n", 
                accentColor, resetColor, whiteColor, q.content.c_str(), resetColor, accentColor, resetColor);

  if (q.context.length() > 0) {
    Serial.printf("│\n│ %s[%s]%s\n", ghostColor, q.context.c_str(), resetColor);
  }

  Serial.println("├──────────────────────────────────────────────────────────────────────────┤");

  // Footer: Tags on Left (Vast random spectrum) · Container on Right (Accent)
  String tagsFormatted = "";
  if (q.themeNames.length() > 0) {
    int start = 0;
    int idx = 0;
    while (start < q.themeNames.length()) {
      int comma = q.themeNames.indexOf(',', start);
      if (comma == -1) comma = q.themeNames.length();
      String tag = q.themeNames.substring(start, comma);
      tag.trim();
      if (tag.length() > 0) {
        int colorCode = 35 + ((q.idx * 17 + idx * 37) % 180);
        tagsFormatted += "\033[38;5;" + String(colorCode) + "m[#" + tag + "]" + resetColor + " ";
        idx++;
      }
      start = comma + 1;
    }
  }

  Serial.printf("│ %-48s  %s%24s%s │\n", 
                tagsFormatted.c_str(), accentColor, q.containerName.c_str(), resetColor);
  Serial.println("└──────────────────────────────────────────────────────────────────────────┘\n");
}
```
