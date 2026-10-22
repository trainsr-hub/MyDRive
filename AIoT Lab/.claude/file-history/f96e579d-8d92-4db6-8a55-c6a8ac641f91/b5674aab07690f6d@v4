// Rien-Prescript-Beeper // Model 01-Oracle  (ESP32-C3 Supermini + ST7789 170x320 + JQ8900)
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <vector>
#include <string>
#include <math.h>

#include <esp_task_wdt.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "esp_private/brownout.h"

// Wrap esp_brownout_init via -Wl,--wrap=esp_brownout_init to permanently disable brownout resets
extern "C" void __wrap_esp_brownout_init(void) {
  // Stubbed: brownout detector not initialized
}

#include "pins.h"
#include "secrets.h"
#include "lgfx_config.h"
#include "fonts_data.h"
#include "vfont.h"

// ------------------------------------------------------------------ WiFi scan result structure
struct WifiNetwork {
  String ssid;
  int32_t rssi;
  bool isMobileHotspot;
};

// ------------------------------------------------------------------ Forward declarations
bool tryConnectToWifi(const String& ssid, const String& password);

// ------------------------------------------------------------------ Mobile hotspot detection
// Detects mobile hotspots by common SSID patterns
bool isMobileHotspotSSID(const String& ssid) {
  String upper = ssid;
  upper.toUpperCase();
  // Common mobile hotspot patterns
  return ssid.startsWith("Redmi") || ssid.startsWith("Xiaomi") ||
         ssid.startsWith("iPhone") || ssid.startsWith("iPad") ||
         ssid.startsWith("Android") || ssid.startsWith("Motorola") ||
         ssid.startsWith("Huawei") || ssid.startsWith("HUAWEI") ||
         ssid.startsWith("Samsung") || ssid.startsWith("ONEPLUS") ||
         ssid.startsWith("OPPO") || ssid.startsWith("Vivo") ||
         upper.startsWith("MOBILE") || upper.startsWith("HOTSPOT") ||
         upper.startsWith("热点") || ssid.indexOf("K60") != -1 ||
         ssid.indexOf("K50") != -1 || ssid.indexOf("K30") != -1;
}

// ------------------------------------------------------------------ Wi-Fi connection with mobile hotspot priority
// Scans for all networks, prioritizes mobile hotspots, then falls back to configured networks
bool connectToWifiWithPriority() {
  Serial.println("[wifi] Scanning for available networks...");

  // Scan for networks (non-blocking, ~3 seconds)
  int n = WiFi.scanNetworks();

  if (n == 0) {
    Serial.println("[wifi] No networks found");
    return false;
  }

  Serial.printf("[wifi] Found %d networks\n", n);

  // Collect and categorize networks
  std::vector<WifiNetwork> allNetworks;
  std::vector<WifiNetwork> mobileHotspots;
  std::vector<WifiNetwork> stationaryNetworks;

  for (int i = 0; i < n; ++i) {
    WifiNetwork net;
    net.ssid = WiFi.SSID(i);
    net.rssi = WiFi.RSSI(i);
    net.isMobileHotspot = isMobileHotspotSSID(net.ssid);
    allNetworks.push_back(net);

    if (net.isMobileHotspot) {
      mobileHotspots.push_back(net);
      Serial.printf("[wifi] Mobile hotspot detected: %s (RSSI: %d)\n", net.ssid.c_str(), net.rssi);
    } else {
      stationaryNetworks.push_back(net);
      Serial.printf("[wifi] Stationary network: %s (RSSI: %d)\n", net.ssid.c_str(), net.rssi);
    }
  }

  // Priority 1: Connect to strongest mobile hotspot with valid credentials
  if (MOBILE_HOTSPOT_ENABLED && mobileHotspots.size() > 0) {
    // Sort mobile hotspots by RSSI (strongest first)
    for (size_t i = 0; i < mobileHotspots.size(); ++i) {
      for (size_t j = i + 1; j < mobileHotspots.size(); ++j) {
        if (mobileHotspots[j].rssi > mobileHotspots[i].rssi) {
          std::swap(mobileHotspots[i], mobileHotspots[j]);
        }
      }
    }

    // Try each mobile hotspot (strongest first)
    for (auto& net : mobileHotspots) {
      if (tryConnectToWifi(net.ssid, MOBILE_HOTSPOT_PASS)) {
        Serial.printf("[wifi] Connected to mobile hotspot: %s\n", net.ssid.c_str());
        return true;
      }
    }
    Serial.println("[wifi] Mobile hotspot found but authentication failed");
  }

  // Priority 2: Connect to configured primary network (stationary)
  if (strlen(WIFI_SSID) > 0) {
    Serial.printf("[wifi] Trying configured network: %s\n", WIFI_SSID);
    if (tryConnectToWifi(String(WIFI_SSID), String(WIFI_PASS))) {
      Serial.printf("[wifi] Connected to configured network: %s\n", WIFI_SSID);
      return true;
    }
  }

  // Priority 3: Try secondary configured network if available
  if (strlen(WIFI_SSID_2) > 0) {
    Serial.printf("[wifi] Trying secondary network: %s\n", WIFI_SSID_2);
    if (tryConnectToWifi(String(WIFI_SSID_2), String(WIFI_PASS_2))) {
      Serial.printf("[wifi] Connected to secondary network: %s\n", WIFI_SSID_2);
      return true;
    }
  }

  // Priority 4: Try tertiary configured network if available
  if (strlen(WIFI_SSID_3) > 0) {
    Serial.printf("[wifi] Trying tertiary network: %s\n", WIFI_SSID_3);
    if (tryConnectToWifi(String(WIFI_SSID_3), String(WIFI_PASS_3))) {
      Serial.printf("[wifi] Connected to tertiary network: %s\n", WIFI_SSID_3);
      return true;
    }
  }

  // Priority 5: Try strongest available stationary network (fallback)
  if (stationaryNetworks.size() > 0) {
    // Sort stationary networks by RSSI (strongest first)
    for (size_t i = 0; i < stationaryNetworks.size(); ++i) {
      for (size_t j = i + 1; j < stationaryNetworks.size(); ++j) {
        if (stationaryNetworks[j].rssi > stationaryNetworks[i].rssi) {
          std::swap(stationaryNetworks[i], stationaryNetworks[j]);
        }
      }
    }

    // Try strongest stationary network first (no credentials - will use saved config)
    Serial.printf("[wifi] Trying strongest available: %s\n", stationaryNetworks[0].ssid.c_str());
    if (tryConnectToWifi(stationaryNetworks[0].ssid, "")) {
      Serial.printf("[wifi] Connected to strongest available: %s\n", stationaryNetworks[0].ssid.c_str());
      return true;
    }
  }

  Serial.println("[wifi] All connection attempts failed");
  return false;
}

// Helper function to try connecting to a specific network
bool tryConnectToWifi(const String& ssid, const String& password) {
  WiFi.disconnect();
  delay(100);

  if (password.length() > 0) {
    WiFi.begin(ssid.c_str(), password.c_str());
  } else {
    WiFi.begin(ssid.c_str());
  }

  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 5000) {
    delay(100);
    // Check for unexpected disconnection
    if (WiFi.status() == WL_DISCONNECTED) break;
  }

  bool connected = (WiFi.status() == WL_CONNECTED);
  if (connected) {
    WiFi.setAutoReconnect(true);
  }

  return connected;
}

int g_missingGlyphs = 0;

// ------------------------------------------------------------------ layout
static const int SW = 320, SH = 170;
static const int HDR_H = 21, FTR_H = 23;
static const int BODY_Y = HDR_H, BODY_H = SH - HDR_H - FTR_H;
static const int MAX_CHARS = 36;
static const int MAX_LINES = 4;
static const int LINE_PITCH = 21;
static const uint32_t ENTROPY_MS = 45;
static const uint32_t DRAW_TO_COMPLETE_MS = 1250;
static const uint32_t BETWEEN_COMPLETES_MS = 150;
static const uint32_t DWELL_PER_LINE_MS = 7000;

static const uint16_t C_BLACK = 0x0000, C_WHITE = 0xFFFF;
// Increased contrast colors for ST7789 RGB565 to eliminate blur on dark background
static const uint16_t C_GHOST = rgb565(0xee, 0xee, 0xee), C_TITLE = 0xFFFF;  // Brighter ghost/white
static const uint16_t C_DIM = rgb565(0xcc, 0xcc, 0xcc), C_SEP = rgb565(0x88, 0x88, 0x88);  // Brighter dim/separator
static const uint16_t C_RULE = rgb565(0x44, 0x44, 0x44);
static const uint16_t C_BOXBG = rgb565(0x11, 0x11, 0x11);  // Slightly lighter context box for contrast
static const uint16_t ACCENTS[4] = {rgb565(0x48, 0xcc, 0xff), rgb565(0xff, 0xae, 0x1b),  // Brighter accents
                                    rgb565(0x20, 0xd9, 0x91), rgb565(0xff, 0x4f, 0x6e)};

static LGFX tft;
static VFont fIT13, fBD13, fRG11, fRG10, fSB10, fSB9;
static uint16_t lineBuf[SW * 24];
static Canvas cv = {lineBuf, SW, 24};

// ------------------------------------------------------------------ data
struct Quote {
  String idx, content, context, date, specific, container, cat;
  std::vector<String> tags;
};
static std::vector<Quote> quotes;
static int curQuote = 0;

// ------------------------------------------------------------------ dynamic cloud quotes pool (RAM only)
static void setOfflineStandbyQuote() {
  quotes.clear();
  Quote q;
  q.idx = "!";
  q.content = "No cloud prescripts loaded.\nConnect to Wi-Fi to stream live\nprescripts from Cloudflare.";
  q.context = "Network Standby";
  q.date = "Live Cloud";
  q.specific = "Offline Standby";
  q.container = "Cloudflare Edge";
  q.cat = "system";
  q.tags = {"#Offline", "#Cloudflare"};
  quotes.push_back(q);
}

static String jstr(JsonVariantConst o, const char* a, const char* b = nullptr) {
  JsonVariantConst v = o[a];
  if (v.isNull() && b) v = o[b];
  if (v.isNull()) return "";
  return v.as<String>();
}

static bool fetchQuotes() {
  if (WiFi.status() != WL_CONNECTED) return false;
  WiFiClientSecure cli;
  cli.setInsecure();
  HTTPClient http;
  http.setTimeout(10000);
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  if (!http.begin(cli, API_URL)) return false;
  int code = http.GET();
  if (code != 200) {
    Serial.printf("[api] HTTP %d\n", code);
    http.end();
    return false;
  }
  String body = http.getString();
  http.end();
  JsonDocument doc;
  if (deserializeJson(doc, body)) return false;

  int added = 0;
  auto parseOne = [&](JsonVariantConst o) {
    Quote q;
    q.idx = jstr(o, "idx");
    q.content = jstr(o, "content", "main_content");
    if (q.content.length() == 0) return;
    q.context = jstr(o, "context");
    q.date = jstr(o, "date", "effectiveDate");
    q.specific = jstr(o, "specific", "specificName");
    q.container = jstr(o, "container", "containerName");
    q.cat = jstr(o, "cat", "category");
    JsonVariantConst tg = o["tags"].isNull() ? o["hashtagThemes"] : o["tags"];
    if (tg.is<JsonArrayConst>()) {
      for (JsonVariantConst t : tg.as<JsonArrayConst>()) {
        String s = t.as<String>();
        if (!s.startsWith("#")) s = "#" + s;
        q.tags.push_back(s);
      }
    }
    // Prevent duplicate quote entries in RAM
    for (const auto& existing : quotes) {
      if (existing.idx == q.idx) return;
    }
    quotes.push_back(q);
    added++;
  };

  if (doc.is<JsonArray>()) for (JsonVariantConst o : doc.as<JsonArray>()) parseOne(o);
  else parseOne(doc.as<JsonVariantConst>());

  // Purge temporary offline standby card once genuine cloud quotes are received
  if (added > 0 && !quotes.empty() && quotes[0].idx == "!") {
    quotes.erase(quotes.begin());
  }

  // Limit pool size in RAM to max 20 quotes to bound heap consumption
  while (quotes.size() > 20) {
    quotes.erase(quotes.begin());
  }

  Serial.printf("[api] Cloudflare stream: +%d quotes (RAM pool: %d)\n", added, (int)quotes.size());
  return added > 0;
}

// ------------------------------------------------------------------ utf-8
static std::u16string u8to16(const String& s) {
  std::u16string o;
  const uint8_t* p = (const uint8_t*)s.c_str();
  size_t n = s.length();
  for (size_t i = 0; i < n;) {
    uint8_t c = p[i];
    uint32_t cp;
    int len;
    if (c < 0x80) { cp = c; len = 1; }
    else if ((c >> 5) == 6) { cp = c & 0x1F; len = 2; }
    else if ((c >> 4) == 14) { cp = c & 0x0F; len = 3; }
    else if ((c >> 3) == 30) { cp = c & 0x07; len = 4; }
    else { i++; continue; }
    if (i + len > n) break;
    for (int k = 1; k < len; k++) cp = (cp << 6) | (p[i + k] & 0x3F);
    i += len;
    o.push_back(cp > 0xFFFF ? u'?' : (char16_t)cp);
  }
  return o;
}

// ------------------------------------------------------------------ paging (port of buildPrescriptPages)
struct Line { std::u16string t; bool just; };
struct Page { std::vector<Line> lines; bool ctx; };

static bool isWS(char16_t c) { return c == ' ' || c == '\t' || c == '\r' || c == 0xA0; }

static void tokenize(const std::u16string& s, std::vector<std::u16string>& tok) {
  std::u16string w;
  auto flush = [&]() { if (!w.empty()) { tok.push_back(w); w.clear(); } };
  for (char16_t c : s) {
    if (c == '\n') { flush(); tok.push_back(u"\n"); }
    else if (isWS(c)) flush();
    else w.push_back(c);
  }
  flush();
}

static std::u16string trim16(const std::u16string& s) {
  size_t a = 0, b = s.size();
  while (a < b && (isWS(s[a]) || s[a] == '\n')) a++;
  while (b > a && (isWS(s[b - 1]) || s[b - 1] == '\n')) b--;
  return s.substr(a, b - a);
}

static bool isWriting(const String& cat) {
  String c = cat; c.trim(); c.toLowerCase();
  return c == "writing" || c == "bài viết" || c == "baiviet";
}

static std::vector<Page> buildPages(const Quote& q) {
  std::vector<Page> pages;
  std::u16string content = trim16(u8to16(q.content));
  if (content.empty()) { pages.push_back({{{u"", false}}, false}); return pages; }
  std::vector<std::u16string> tok;
  tokenize(content, tok);
  bool writing = isWriting(q.cat);
  size_t ti = 0;
  int pageNum = 0;
  while (ti < tok.size()) {
    pageNum++;
    bool first = pageNum == 1;
    std::vector<std::u16string> pl;
    for (int ln = 1; ln <= MAX_LINES && ti < tok.size(); ln++) {
      int budget = MAX_CHARS;
      if (first && ln == 1) budget = MAX_CHARS - 1;
      if (ln == MAX_LINES) budget = MAX_CHARS - 4;
      std::u16string cur;
      while (ti < tok.size()) {
        const std::u16string& nt = tok[ti];
        if (nt == u"\n") { ti++; break; }
        if (cur.empty()) { cur = nt; ti++; }
        else if ((int)(cur.size() + 1 + nt.size()) <= budget) { cur += u" "; cur += nt; ti++; }
        else break;
      }
      pl.push_back(cur);
    }
    size_t la = ti;
    while (la < tok.size() && tok[la] == u"\n") la++;
    bool more = la < tok.size();
    if (first && !pl.empty()) pl[0] = u"\u201C" + pl[0];
    if (more) pl.back() += u"...";
    else pl.back() += u"\u201D";
    Page pg; pg.ctx = false;
    for (size_t i = 0; i < pl.size(); i++) {
      bool terminal = !more && i == pl.size() - 1;
      bool just = writing && !terminal && pl[i].find(u' ') != std::u16string::npos;
      if (!trim16(pl[i]).empty()) pg.lines.push_back({pl[i], just});
    }
    pages.push_back(pg);
  }
  // context pages
  if (q.context.length() > 0) {
    std::vector<std::u16string> cw;
    tokenize(u8to16(q.context), cw);
    size_t ci = 0;
    bool firstCtx = true;
    while (ci < cw.size()) {
      std::vector<std::u16string> cl;
      for (int l = 1; l <= MAX_LINES && ci < cw.size(); l++) {
        int budget = (l == MAX_LINES) ? MAX_CHARS - 4 : MAX_CHARS;
        std::u16string cur;
        if (firstCtx && l == 1) { cur = u"[Note] "; firstCtx = false; }
        while (ci < cw.size()) {
          if (cw[ci] == u"\n") { ci++; continue; }
          if (cur.empty()) { cur = cw[ci]; ci++; }
          else if ((int)(cur.size() + 1 + cw[ci].size()) <= budget || cur == u"[Note] ") {
            if (cur != u"[Note] ") cur += u" ";
            cur += cw[ci]; ci++;
          } else break;
        }
        cl.push_back(cur);
      }
      if (ci < cw.size() && !cl.empty()) cl.back() += u"...";
      Page pg; pg.ctx = true;
      for (auto& s : cl) {
        if (!trim16(s).empty()) pg.lines.push_back({s, false});
      }
      if (!pg.lines.empty()) pages.push_back(pg);
    }
  }
  return pages;
}

// ------------------------------------------------------------------ JQ8900 (Varis Gear Driver)
#include "Jq8900Player.h"
static Jq8900Player audio(Serial1);

static void jqPlay(uint8_t track) {
  audio.playTrack(track);
}

// ------------------------------------------------------------------ drawing helpers
static uint16_t hsl565(float h, float s, float l) {
  h = fmodf(h, 360.f); if (h < 0) h += 360.f;
  float c = (1 - fabsf(2 * l - 1)) * s;
  float x = c * (1 - fabsf(fmodf(h / 60.f, 2) - 1));
  float m = l - c / 2, r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  // Boost minimum lightness to prevent low-contrast grays that blur on black
  float minLightness = 0.55f;
  float boostedL = m + (1.0f - m) * minLightness;
  return rgb565((r + boostedL) * 255, (g + boostedL) * 255, (b + boostedL) * 255);
}

static float tagHue(const String& tag, int idx) {
  int32_t hash = 0;
  for (size_t i = 0; i < tag.length(); i++)
    hash = (int32_t)((((uint32_t)hash << 5) - (uint32_t)hash) + (uint8_t)tag[i]);
  return fabsf(floorf(fmodf((float)((double)hash * 137.508 + idx * 89), 360.f)));
}

static uint16_t accentFor(const Quote& q) {
  int n = q.idx.toInt();
  if (n < 0) n = -n;
  return ACCENTS[n % 4];
}

// Ensure tag background colors have sufficient contrast on black
static uint16_t ensureContrast(uint16_t col, uint16_t bg = 0x0000) {
  uint8_t r = (col >> 11) & 0x1F;
  uint8_t g = (col >> 5) & 0x3F;
  uint8_t b = col & 0x1F;
  r = (r << 3) | (r >> 2);
  g = (g << 2) | (g >> 4);
  b = (b << 3) | (b >> 2);
  int luminance = (r * 299 + g * 587 + b * 114) / 1000;
  if (luminance < 80) {
    // Boost color to be readable on black
    float boost = 80.0f / max(luminance, 1);
    r = min(255, (int)(r * boost));
    g = min(255, (int)(g * boost));
    b = min(255, (int)(b * boost));
  }
  return rgb565(r, g, b);
}

static void push(int y, int h) {
  tft.startWrite();
  tft.pushImage(0, y, SW, h, lineBuf);
  tft.endWrite();
}

static void drawHeader(const Quote& q, bool busy) {
  cv.h = HDR_H;
  cv.fill(C_BLACK);
  cv.rect(0, HDR_H - 1, SW, 1, C_RULE);
  const int base = 14;
  std::u16string date = u8to16(q.date.length() ? q.date : String("—"));
  int dateW = fSB10.adv * (int)date.size();
  int labelW = fSB10.adv * 5;
  int rightW = labelW + 4 + dateW;
  int rx = SW - 12 - rightW;
  cv.text(fSB10, rx, base, u"Date:", C_DIM);
  cv.text(fSB10, rx + labelW + 4, base, date, C_GHOST);
  int x = 12;
  if (busy) {
    cv.text(fSB10, x, base, u"// Receiving prescript...", C_GHOST);
  } else {
    std::u16string idx = u"#" + u8to16(q.idx);
    x += cv.text(fBD13, x, base, idx, C_GHOST) + 4;
    x += cv.text(fSB10, x, base, u"~", C_SEP) + 4;
    std::u16string title = u8to16(q.specific);
    int avail = rx - 8 - x;
    int maxCh = avail / fSB10.adv;
    if ((int)title.size() > maxCh && maxCh > 1) title = title.substr(0, maxCh - 1) + u"\u2026";
    cv.text(fSB10, x, base, title, C_TITLE, avail);
  }
  push(0, HDR_H);
}

static void drawFooter(const Quote& q, int seed = 0) {
  cv.h = FTR_H;
  cv.fill(C_BLACK);
  cv.rect(0, 0, SW, 1, C_RULE);
  uint16_t accent = accentFor(q);
  const int base = 15;
  std::u16string cont = u8to16(q.container);
  int contMax = 150 / fSB10.adv;
  if ((int)cont.size() > contMax) cont = cont.substr(0, contMax - 1) + u"\u2026";
  int contW = fSB10.adv * (int)cont.size();
  int cx = SW - 12 - contW;
  cv.text(fBD13, cx, base, cont, accent);
  int x = 12;
  for (size_t i = 0; i < q.tags.size(); i++) {
    std::u16string t = u8to16(q.tags[i]);
    int w = fSB9.adv * (int)t.size() + 10 + 2;
    if (x + w > cx - 8) break;
    float hue = tagHue(q.tags[i], (int)i) + seed;
    uint16_t tcol = ensureContrast(hsl565(hue, 0.90f, 0.80f));
    uint16_t bg = hsl565(hue, 0.65f, 0.15f);  // Slightly lighter bg
    uint16_t bd = mix565(C_BLACK, ensureContrast(hsl565(hue, 0.75f, 0.50f)), 140);
    const int y0 = 4, hh = 15;
    cv.rect(x, y0, w, hh, bd);
    cv.rect(x + 1, y0 + 1, w - 2, hh - 2, bg);
    cv.b[y0 * cv.w + x] = C_BLACK; cv.b[y0 * cv.w + x + w - 1] = C_BLACK;
    cv.b[(y0 + hh - 1) * cv.w + x] = C_BLACK; cv.b[(y0 + hh - 1) * cv.w + x + w - 1] = C_BLACK;
    cv.text(fSB9, x + 6, y0 + 11, t, tcol);
    x += w + 4;
  }
  push(SH - FTR_H, FTR_H);
}

// ------------------------------------------------------------------ page rendering
static int bodyTop(int n) {
  int blockH = n * LINE_PITCH - 2;
  int y = BODY_Y + (BODY_H - blockH) / 2;
  return y < BODY_Y ? BODY_Y : y;
}

static void clearBody() {
  tft.startWrite();
  tft.fillRect(0, BODY_Y, SW, BODY_H, C_BLACK);
  tft.endWrite();
}

static void drawBodyLineFinal(const Line& ln, int y, bool ctx, uint16_t accent) {
  cv.h = 20;
  cv.fill(ctx ? C_BOXBG : C_BLACK);
  const VFont& fn = fBD13;
  int base = (20 - (fn.ascent + fn.descent)) / 2 + fn.ascent;
  int cellW = fn.adv;
  int x0 = ctx ? 16 : 16;
  if (ctx) cv.rect(8, 0, 3, 20, accent);
  const std::u16string& s = ln.t;
  std::vector<int> xs(s.size());
  int spaces = 0;
  for (char16_t c : s) if (c == ' ') spaces++;
  if (ln.just && spaces > 0) {
    int W = MAX_CHARS * cellW;
    int gap = W - (int)(s.size() - spaces) * cellW;
    int extra = gap - spaces * 0;
    int per = extra / spaces, rem = extra % spaces, x = x0, sp = 0;
    for (size_t i = 0; i < s.size(); i++) {
      xs[i] = x;
      if (s[i] == ' ') x += per + (sp++ < rem ? 1 : 0);
      else x += cellW;
    }
  } else {
    for (size_t i = 0; i < s.size(); i++) xs[i] = x0 + (int)i * cellW;
  }
  for (size_t i = 0; i < s.size(); i++) {
    char16_t c = s[i];
    if (c == ' ') continue;
    if (ctx) {
      if (i < 6 && s.size() >= 6 && s.substr(0, 6) == u"[Note]") {
        cv.drawChar(fBD13, xs[i], base, c, accent, true); // Bilevel 1-bit crisp
      } else {
        cv.drawChar(fBD13, xs[i], base, c, C_WHITE, true);  // Bilevel 1-bit crisp
      }
    } else {
      if (c == 0x201C || c == 0x201D || c == '.') cv.drawChar(fBD13, xs[i], base, c, accent);
      else cv.drawChar(fn, xs[i], base, c, C_WHITE);
    }
  }
  push(y, 20);
}

static void renderPageFinal(const Page& pg, uint16_t accent) {
  clearBody();
  int y = bodyTop((int)pg.lines.size());
  for (size_t i = 0; i < pg.lines.size(); i++) drawBodyLineFinal(pg.lines[i], y + (int)i * LINE_PITCH, pg.ctx, accent);
}

// ------------------------------------------------------------------ entropy animation
struct Cell { char16_t target, cur; uint32_t life, nextScr; bool locked; };
static Cell grid[MAX_LINES][MAX_CHARS + 8];
static int gridLen[MAX_LINES];
static const char SCRAMBLE[] = "ABCDEF@HIJ_LM%OPQR^WX#YZa#b+cdefgh*iqrxyz0123456789!$*+=-~?/";
static char16_t rndCipher() { return SCRAMBLE[random(sizeof(SCRAMBLE) - 1)]; }

// ------------------------------------------------------------------ state
static std::vector<Page> pages;
static int curPage = 0;
static bool animating = false;
static uint32_t animStart = 0, lastFrame = 0;
static uint32_t nextGapChime = 0xFFFFFFFF; // Absolute ms timestamp of next gap complete chime
static uint16_t curAccent = ACCENTS[0];

static uint32_t animFrameCount = 0;

static void finishAnimation(bool playChime) {
  animating = false;
  nextGapChime = 0xFFFFFFFF;
  Serial.printf("[anim] FINISH at %u ms (%u frames, playChime=%d)\n", millis() - animStart, animFrameCount, playChime);
  renderPageFinal(pages[curPage], curAccent);
  drawHeader(quotes[curQuote], false);
  if (playChime) jqPlay(TRACK_COMPLETE);
}

static bool renderAnimationFrame(uint32_t el) {
  Page& pg = pages[curPage];
  bool all = true;
  int y = bodyTop((int)pg.lines.size());
  const int base = (20 - (fBD13.ascent + fBD13.descent)) / 2 + fBD13.ascent;

  for (int r = 0; r < (int)pg.lines.size() && r < MAX_LINES; r++) {
    cv.h = 20;
    cv.fill(C_BLACK);
    for (int c = 0; c < gridLen[r]; c++) {
      Cell& ce = grid[r][c];
      if (!ce.locked) {
        if (el >= ce.life) {
          ce.locked = true;
          ce.cur = ce.target;
        } else {
          all = false;
          // Active continuous cipher scramble on every frame
          ce.cur = rndCipher();
        }
      }
      int x = 16 + c * fBD13.adv;
      if (ce.locked) {
        if (ce.target == ' ') continue;
        if (ce.target == 0x201C || ce.target == 0x201D || ce.target == '.')
          cv.drawChar(fBD13, x, base, ce.target, curAccent);
        else
          cv.drawChar(fBD13, x, base, ce.target, C_WHITE);
      } else {
        cv.drawChar(fBD13, x, base, ce.cur, C_WHITE);
      }
    }
    push(y + r * LINE_PITCH, 20);
  }
  return all;
}

static void showPage(bool animate, bool sound) {
  const Quote& q = quotes[curQuote];
  curAccent = accentFor(q);
  Page& pg = pages[curPage];
  drawFooter(q);
  if (!animate || pg.ctx) {
    animating = false;
    nextGapChime = 0xFFFFFFFF;
    drawHeader(q, false);
    renderPageFinal(pg, curAccent);
    if (sound) jqPlay(TRACK_COMPLETE);
    return;
  }
  drawHeader(q, true);
  clearBody();
  uint32_t total = max<uint32_t>(900, ENTROPY_MS * 35);
  for (int r = 0; r < (int)pg.lines.size() && r < MAX_LINES; r++) {
    const std::u16string& s = pg.lines[r].t;
    gridLen[r] = min<int>((int)s.size(), MAX_CHARS + 8);
    for (int c = 0; c < gridLen[r]; c++)
      grid[r][c] = {s[c], rndCipher(), (uint32_t)random(total), (uint32_t)random(40), false};
  }
  animating = true;
  animFrameCount = 0;
  Serial.printf("[anim] START Quote #%s (total=%u ms)\n", q.idx.c_str(), total);

  // Fire draw_sound FIRST — before any SPI framebuffer work, matching mock cadence
  if (sound) jqPlay(TRACK_DRAW);

  // Instantly render Frame 0 of scramble — zero black void
  renderAnimationFrame(0);

  // Time base begins strictly after initial frame is dispatched to screen
  animStart = millis();
  lastFrame = animStart;

  // Arm gap chime scheduler: first complete chime at DRAW_TO_COMPLETE_MS, then every BETWEEN_COMPLETES_MS
  nextGapChime = sound ? (animStart + DRAW_TO_COMPLETE_MS) : 0xFFFFFFFF;
}

static void loadQuote(int idx, bool animate, bool sound) {
  curQuote = idx;
  pages = buildPages(quotes[curQuote]);
  curPage = 0;
  g_missingGlyphs = 0;
  showPage(animate, sound);
  Serial.printf("[quote] #%s pages=%d missingGlyphs=%d heap=%u\n", quotes[curQuote].idx.c_str(),
                (int)pages.size(), g_missingGlyphs, ESP.getFreeHeap());
}

static void abortAndFinishActiveAnimation() {
  if (animating) {
    animating = false;
    nextGapChime = 0xFFFFFFFF;
    renderPageFinal(pages[curPage], curAccent);
    drawHeader(quotes[curQuote], false);
    delay(20);
  }
}

static uint32_t lastRollTime = 0;
static void rollQuote() {
  uint32_t now = millis();
  if (now - lastRollTime < 400) return; // Debounce rapid multi-clicks
  lastRollTime = now;

  // Fire draw_sound on button press — immediate tactile response before any stop/load overhead
  jqPlay(TRACK_DRAW);

  animating = false;
  nextGapChime = 0xFFFFFFFF;
  audio.stop();
  delay(15);

  if (quotes.empty()) {
    if (WiFi.status() == WL_CONNECTED) {
      fetchQuotes();
    }
    if (quotes.empty()) {
      setOfflineStandbyQuote();
    }
  }

  int n = (int)quotes.size(), i = curQuote;
  if (n > 1) {
    while (i == curQuote) i = random(n);
  } else {
    i = 0;
  }
  curQuote = i;
  Serial.printf("[roll] Rolling to Quote #%s...\n", quotes[curQuote].idx.c_str());
  // Pass sound=false: draw_sound already fired on button press; arm gap chime scheduler manually
  loadQuote(curQuote, true, false);
  // Arm gap chimes: animStart is now set by showPage(), schedule from it
  if (animating) nextGapChime = animStart + DRAW_TO_COMPLETE_MS;

  // Prefetch fresh batch from Cloudflare Worker if RAM pool is running low
  if (quotes.size() < 4 && WiFi.status() == WL_CONNECTED) {
    fetchQuotes();
  }
}

static uint32_t lastPageTime = 0;
static void changePage() {
  uint32_t now = millis();
  if (now - lastPageTime < 300) return; // Debounce rapid multi-clicks
  lastPageTime = now;

  // If animating, click FIRST ends animation and reveals full text
  if (animating) {
    Serial.println("[page] Finishing active animation on click");
    abortAndFinishActiveAnimation();
    jqPlay(TRACK_COMPLETE);
    return;
  }
  curPage = (curPage + 1) % (int)pages.size();
  Serial.printf("[page] Manual turn to Page %d / %d\n", curPage + 1, (int)pages.size());
  showPage(true, true);
}

static void stepAnimation() {
  uint32_t now = millis();
  uint32_t el = now - animStart;

  // Target smooth ~30ms frame pace
  if (now - lastFrame < 30) {
    vTaskDelay(1);
    return;
  }
  lastFrame = now;
  animFrameCount++;

  // Gap chime scheduler: fire complete_sound at DRAW_TO_COMPLETE_MS, then every BETWEEN_COMPLETES_MS
  if (now >= nextGapChime) {
    jqPlay(TRACK_COMPLETE);
    nextGapChime = now + BETWEEN_COMPLETES_MS;
  }

  bool all = renderAnimationFrame(el);
  if (all || el >= 2500) finishAnimation(true);
  vTaskDelay(1);
}

// ------------------------------------------------------------------ boot UI
static void splash(const char* l1, const char* l2 = "") {
  cv.h = 24;
  tft.fillRect(0, 60, SW, 60, C_BLACK);
  std::u16string a = u8to16(l1), b = u8to16(l2);
  cv.fill(C_BLACK);
  cv.text(fSB10, (SW - (int)a.size() * fSB10.adv) / 2, 16, a, C_WHITE);
  push(66, 24);
  cv.fill(C_BLACK);
  cv.text(fRG10, (SW - (int)b.size() * fRG10.adv) / 2, 16, b, C_GHOST);
  push(92, 24);
}

struct Btn {
  uint8_t pin;
  bool latched = false;
  uint32_t highSince = 0;

  bool pressed() {
    bool reading = digitalRead(pin);
    uint32_t now = millis();

    if (reading == LOW) {
      highSince = 0;
      if (!latched) {
        latched = true;
        return true; // 0ms instantaneous response on press
      }
    } else {
      if (latched) {
        if (highSince == 0) {
          highSince = now;
        } else if (now - highSince >= 50) {
          // Stably released for 50ms, release latch (handles internal ~45k pull-up rise time)
          latched = false;
          highSince = 0;
        }
      }
    }
    return false;
  }
};
static Btn btnRoll = {PIN_BTN_ROLL};
static Btn btnRollAlt = {PIN_BTN_ROLL_ALT};
static Btn btnScroll = {PIN_BTN_SCROLL};

void setup() {
  // Disable hardware brownout detector to prevent nuisance resets during speaker amplifier transients
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  Serial.setTxTimeoutMs(0); // Never block execution on USB CDC when host is not reading
  pinMode(PIN_BTN_ROLL, INPUT_PULLUP);
  pinMode(PIN_BTN_ROLL_ALT, INPUT_PULLUP);
  pinMode(PIN_BTN_SCROLL, INPUT_PULLUP);
  randomSeed(esp_random());

  // Initialize audio driver with constant high volume (28/30)
  audio.begin(PIN_JQ_TX);
  delay(100);
  audio.setVolume(JQ_VOLUME_CONSTANT);

  // Hardware reset pulse on LCD RST pin
  pinMode(PIN_LCD_RST, OUTPUT);
  digitalWrite(PIN_LCD_RST, HIGH);
  delay(50);
  digitalWrite(PIN_LCD_RST, LOW);
  delay(100);
  digitalWrite(PIN_LCD_RST, HIGH);
  delay(150);

  tft.init();
  tft.setRotation(1);
  tft.setBrightness(255);
  tft.fillScreen(C_BLACK);

  fIT13.init(FONT_IT13); fBD13.init(FONT_BD13); fRG11.init(FONT_RG11);
  fRG10.init(FONT_RG10); fSB10.init(FONT_SB10); fSB9.init(FONT_SB9);
  Serial.println("Fonts initialized");

  delay(300);

  Serial.println("Showing splash screen...");
  splash("RIEN-PRESCRIPT-BEEPER", "MODEL 01-ORACLE");
  delay(900);

  if (strlen(WIFI_SSID) > 0 || MOBILE_HOTSPOT_ENABLED) {
    splash("Connecting Wi-Fi...", "Mobile Hotspot Priority");
    WiFi.mode(WIFI_STA);
    WiFi.setTxPower(WIFI_POWER_15dBm);

    // Use new mobile hotspot priority connection system
    if (connectToWifiWithPriority()) {
      Serial.printf("[wifi] Connected: %s\n", WiFi.localIP().toString().c_str());
      splash("Syncing prescripts...", "Cloudflare Edge");
      fetchQuotes();
    } else {
      splash("Wi-Fi unavailable", "Offline standby");
      delay(1000);
    }
  } else {
    Serial.println("[wifi] no SSID configured -> offline standby");
  }

  if (quotes.empty()) {
    setOfflineStandbyQuote();
  }

  loadQuote(0, true, true);
}

void loop() {
  // Serial command interface for remote manual triggering
  if (Serial.available()) {
    char ch = Serial.read();
    if (ch == 'r' || ch == 'R') {
      Serial.println("[SIM] ROLL trigger");
      rollQuote();
      return;
    }
    if (ch == 's' || ch == 'S' || ch == 'p' || ch == 'P') {
      Serial.println("[SIM] SCROLL / PAGE trigger");
      changePage();
      return;
    }
    if (ch == 'c' || ch == 'C' || ch == 'w' || ch == 'W') {
      Serial.println("[SIM] CLOUD RE-SYNC trigger");
      if (WiFi.status() != WL_CONNECTED) {
        Serial.printf("[wifi] Connecting to %s...\n", WIFI_SSID);
        WiFi.begin(WIFI_SSID, WIFI_PASS);
        uint32_t t0 = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - t0 < 8000) delay(200);
      }
      if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[wifi] Connected: %s\n", WiFi.localIP().toString().c_str());
        fetchQuotes();
      } else {
        Serial.printf("[wifi] Status: %d\n", WiFi.status());
      }
      return;
    }
  }

  // Physical button checks (100% manual control)
  if (btnRoll.pressed() || btnRollAlt.pressed()) {
    Serial.println("[btn] ROLL");
    rollQuote();
    return;
  }
  if (btnScroll.pressed()) {
    Serial.println("[btn] SCROLL");
    changePage();
    return;
  }

  if (animating) {
    stepAnimation();
  } else if (WiFi.status() == WL_CONNECTED) {
    // Background cloud sync every 15 minutes when idle
    static uint32_t lastApiRefresh = 0;
    if (millis() - lastApiRefresh > 15UL * 60 * 1000) {
      lastApiRefresh = millis();
      fetchQuotes();
    }
  }

  // Pure manual mode: NO auto-page, NO auto-reroll!
  delay(1);
}
