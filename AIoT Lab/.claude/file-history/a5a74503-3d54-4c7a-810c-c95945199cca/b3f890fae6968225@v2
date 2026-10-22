"""Generate Vietnamese-capable IBM Plex Mono bitmap fonts (VLW layout) as C arrays.

Output: src/fonts_data.cpp + include/fonts_data.h
VLW header: 6 x int32 BE (count, 11, size, 0, ascent, descent)
Glyph rec : 7 x int32 BE (unicode, h, w, advance, dY, dX, bitmapOffset)  [sorted by unicode]
Bitmaps   : 8-bit alpha, w*h each.
Requires: pip install pillow fonttools
"""
import os, struct, urllib.request
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "fonts_src")
BASE = "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/"

# name -> (ttf, px size)
FONTS = {
    "IT13": ("IBMPlexMono-Italic.ttf", 13),    # body quote text
    "BD13": ("IBMPlexMono-Bold.ttf", 13),      # quote marks / numbers
    "RG11": ("IBMPlexMono-SemiBold.ttf", 11),  # context box (upgraded to SemiBold 11 for high density)
    "RG10": ("IBMPlexMono-SemiBold.ttf", 10),  # header title & date (upgraded to SemiBold 10)
    "SB10": ("IBMPlexMono-SemiBold.ttf", 10),  # idx / date / container
    "SB9":  ("IBMPlexMono-SemiBold.ttf", 10),  # tag capsules (upgraded to 10 for sharp readability)
}

CODEPOINTS = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) +
    [0x1A0, 0x1A1, 0x1AF, 0x1B0] + list(range(0x1EA0, 0x1EFA)) +
    [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x25CF]
)


def fetch(name):
    os.makedirs(SRC, exist_ok=True)
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        print("downloading", name)
        urllib.request.urlretrieve(BASE + name, p)
    return p


def build(ttf, size):
    path = fetch(ttf)
    cmap = TTFont(path).getBestCmap()
    font = ImageFont.truetype(path, size)
    asc, desc = font.getmetrics()
    recs, bitmaps, off = [], bytearray(), 0
    for cp in sorted(set(CODEPOINTS)):
        if cp not in cmap:
            continue
        ch = chr(cp)
        adv = int(round(font.getlength(ch)))
        pad = 4
        img = Image.new("L", (adv + 2 * pad + size, asc + desc + 2 * pad), 0)
        ImageDraw.Draw(img).text((pad, pad), ch, font=font, fill=255)
        bb = img.getbbox()
        if bb is None:
            w = h = dy = dx = 0
            data = b""
        else:
            crop = img.crop(bb)
            w, h = crop.size
            dy = (pad + asc) - bb[1]
            dx = bb[0] - pad
            raw = crop.tobytes()
            # High-density gamma boost for razor-sharp micro-IPS rendering
            data = bytes(min(255, int((b / 255.0) ** 0.55 * 255.0)) if b > 25 else 0 for b in raw)
        recs.append(struct.pack(">7i", cp, h, w, adv, dy, dx, off))
        bitmaps += data
        off += len(data)
    hdr = struct.pack(">6i", len(recs), 11, size, 0, asc, desc)
    return hdr + b"".join(recs) + bytes(bitmaps), len(recs)


def main():
    cpp = ['#include <Arduino.h>', '#include "fonts_data.h"', ""]
    hdr = ["#pragma once", "#include <stdint.h>", ""]
    for name, (ttf, size) in FONTS.items():
        blob, n = build(ttf, size)
        print(f"{name}: {n} glyphs, {len(blob)} bytes")
        hdr.append(f"extern const uint8_t FONT_{name}[];")
        body = ",".join(str(b) for b in blob)
        cpp.append(f"const uint8_t FONT_{name}[] PROGMEM = {{{body}}};")
        cpp.append("")
    open(os.path.join(ROOT, "src", "fonts_data.cpp"), "w").write("\n".join(cpp))
    open(os.path.join(ROOT, "include", "fonts_data.h"), "w").write("\n".join(hdr) + "\n")


if __name__ == "__main__":
    main()
