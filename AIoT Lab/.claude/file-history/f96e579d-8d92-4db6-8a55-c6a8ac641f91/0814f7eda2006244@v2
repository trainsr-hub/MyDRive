#pragma once
#include <Arduino.h>
#include <string>

// Minimal reader + software renderer for the VLW-layout fonts from tools/make_fonts.py
struct Glyph {
  int w, h, adv, dY, dX;
  const uint8_t* bits;
};

struct VFont {
  const uint8_t* d = nullptr;
  uint32_t n = 0;
  int size = 0, ascent = 0, descent = 0, adv = 0;
  const uint8_t* recs = nullptr;
  const uint8_t* bmp = nullptr;

  static int32_t be(const uint8_t* p) {
    return (int32_t)(((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | p[3]);
  }
  void init(const uint8_t* data) {
    d = data;
    n = be(d);
    size = be(d + 8);
    ascent = be(d + 16);
    descent = be(d + 20);
    recs = d + 24;
    bmp = recs + n * 28;
    Glyph g;
    adv = find('M', g) ? g.adv : size * 6 / 10;
  }
  bool find(char16_t cp, Glyph& g) const {
    int lo = 0, hi = (int)n - 1;
    while (lo <= hi) {
      int mid = (lo + hi) >> 1;
      const uint8_t* r = recs + mid * 28;
      int32_t u = be(r);
      if (u == cp) {
        g.h = be(r + 4);
        g.w = be(r + 8);
        g.adv = be(r + 12);
        g.dY = be(r + 16);
        g.dX = be(r + 20);
        g.bits = bmp + be(r + 24);
        return true;
      } else if (u < cp) lo = mid + 1;
      else hi = mid - 1;
    }
    return false;
  }
};

static inline uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
  return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

static inline uint16_t mix565(uint16_t d, uint16_t s, uint8_t a) {
  uint32_t dr = d >> 11, dg = (d >> 5) & 63, db = d & 31;
  uint32_t sr = s >> 11, sg = (s >> 5) & 63, sb = s & 31;
  uint32_t ia = 255 - a;
  uint32_t r = (dr * ia + sr * a) / 255;
  uint32_t g = (dg * ia + sg * a) / 255;
  uint32_t b = (db * ia + sb * a) / 255;
  return (r << 11) | (g << 5) | b;
}

extern int g_missingGlyphs;

// Off-screen RGB565 canvas that renders glyphs with alpha blending
struct Canvas {
  uint16_t* b;
  int w, h;
  void fill(uint16_t c) {
    for (int i = 0; i < w * h; i++) b[i] = c;
  }
  void rect(int x, int y, int rw, int rh, uint16_t c) {
    for (int j = y; j < y + rh; j++) {
      if (j < 0 || j >= h) continue;
      for (int i = x; i < x + rw; i++)
        if (i >= 0 && i < w) b[j * w + i] = c;
    }
  }

  // Detect if a color is a "low contrast" color (grays/ghost colors on dark bg) that needs sharper rendering
  static inline bool isLowContrastColor(uint16_t col) {
    uint8_t r = (col >> 11) & 0x1F;
    uint8_t g = (col >> 5) & 0x3F;
    uint8_t b = col & 0x1F;
    // Expand to 8-bit for comparison
    r = (r << 3) | (r >> 2);
    g = (g << 2) | (g >> 4);
    b = (b << 3) | (b >> 2);
    // Check if it's a gray (R≈G≈B) and relatively light (low contrast on black)
    int maxC = max(r, max(g, b));
    int minC = min(r, min(g, b));
    bool isGray = (maxC - minC) < 20;
    bool isLight = maxC > 100;  // Light grays that blur on black
    return isGray && isLight;
  }

  int drawChar(const VFont& f, int x, int base, char16_t ch, uint16_t col, bool bilevel = false) {
    Glyph g;
    if (!f.find(ch, g)) {
      g_missingGlyphs++;
      if (!f.find('?', g)) return f.adv;
    }

    // Auto-enable bilevel for low-contrast colors (grays on black) to eliminate blur
    bool forceBilevel = bilevel || isLowContrastColor(col);

    int gx0 = x + g.dX, gy0 = base - g.dY;
    for (int gy = 0; gy < g.h; gy++) {
      int py = gy0 + gy;
      if (py < 0 || py >= h) continue;
      for (int gx = 0; gx < g.w; gx++) {
        int px = gx0 + gx;
        if (px < 0 || px >= w) continue;
        uint8_t a = g.bits[gy * g.w + gx];
        if (forceBilevel) {
          // Bilevel 1-bit hard thresholding: eliminate subpixel muddy halos on dark background
          if (a >= 60) b[py * w + px] = col;  // Lowered from 70 to catch more edge pixels
          continue;
        }
        if (a < 64) continue; // Cut out faint blurry grey fog around letters
        uint16_t* dst = &b[py * w + px];
        if (a >= 140) {
          *dst = col; // Solid, razor-sharp stroke
        } else {
          // Gamma boost edge pixels so they don't blend into dark mud
          uint8_t boosted = (uint8_t)(a + (255 - a) * 3 / 4);
          *dst = mix565(*dst, col, boosted);
        }
      }
    }
    return g.adv;
  }
  int text(const VFont& f, int x, int base, const std::u16string& s, uint16_t col, int maxW = 100000, bool bilevel = false) {
    int x0 = x;
    for (char16_t c : s) {
      if (x - x0 + f.adv > maxW) break;
      x += drawChar(f, x, base, c, col, bilevel);
    }
    return x - x0;
  }
};
