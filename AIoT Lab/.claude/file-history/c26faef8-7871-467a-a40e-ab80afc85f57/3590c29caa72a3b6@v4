# Rien-Prescript-Beeper // Model 01-Oracle

Firmware for the physical **Rien-Prescript-Beeper (Model 01-Oracle)** handheld device running on an ESP32-C3 Supermini with an ST7789V 1.9" IPS display (170×320) and a JQ8900 audio synthesizer module.

---

## 1. Hardware Pinout & Wiring

| Peripheral | Function / Pin | ESP32-C3 Pin | Notes |
| :--- | :--- | :--- | :--- |
| **ST7789V Display** | SCL / SCK | GPIO 4 | SPI Clock |
| | SDA / MOSI | GPIO 6 | SPI Data |
| | DC / RS | GPIO 5 | Data / Command |
| | RES / RST | GPIO 3 | Hardware Reset |
| | CS | GND | Hardwired to GND (Chip Select always active) |
| | BLK / LEDA | 3V3 | Hardwired to 3.3V (Always ON backlight) |
| | VCC / GND | 3V3 / GND | Power |
| **JQ8900 Audio** | RX | GPIO 1 (TX) | Serial control via 1kΩ resistor |
| | VCC / GND | **5V (VBUS)** / GND | **Strict Power Isolation:** Power from 5V to keep speaker current surges off 3.3V LDO |
| | Decoupling | 3V3 / GND | Recommend 100μF–470μF electrolytic capacitor across 3V3 & GND |
| **Tactile Buttons** | ROLL (Draw) | **GPIO 0 (Primary) / GPIO 7 (Alt)** | External button to GND (Internal `INPUT_PULLUP`) |
| | SCROLL (Page) | **GPIO 10 (Primary)** | External button to GND (Internal `INPUT_PULLUP`) |

---

## 2. JQ8900 Audio Constants & Track Mapping

Audio volume is locked to a single named hardware constant:
* **Constant:** `#define JQ_VOLUME_CONSTANT 28` (out of 30 scale, ~93% maximum volume for crisp, loud output without amplifier distortion).

Tracks are triggered via UART (`Jq8900Player` driver):

| Action | Audio File | Hardware IO Pin | UART Serial Track # |
| :--- | :--- | :--- | :--- |
| **Draw Prescript** | `0003.wav` | IO3 | **Track 6** |
| **Complete / Chime** | `0004.wav` | IO4 | **Track 7** |

---

## 3. Display Specifications

* **Controller:** ST7789V
* **Resolution:** 170 × 320 px (RAM is 240 × 320, visible window offset X = 35)
* **Rotation:** Landscape (Rotation 1) → Effective 320 × 170 px
* **Graphic Driver:** LovyanGFX v1.2+
* **Font Engine:** Bilevel 1-bit crisp vector rendering on Context Box (`[Note]`) and bold IBM Plex Mono

---

## 4. Software Architecture & Cloud Data Integration

* **Platform:** PlatformIO / Arduino Framework (`esp32c3_supermini`) with `huge_app.csv` (3.1MB partition)
* **Zero Mock Data Policy:** All hardcoded quotes have been completely removed from flash storage.
* **RAM Prefetch Pipeline (Double Buffer):**
  * Prescripts are stored purely in volatile dynamic RAM (`std::vector<Quote> quotes`).
  * **Zero Flash Wear:** No flash write cycles, preserving SPI NOR flash endurance.
  * **0ms Tactile Latency:** Clicking the Roll button immediately unboxes the next quote from the RAM pool with instant scramble animation and audio.
  * **Background Cloud Curl:** While the user reads or after the animation completes, the ESP32 curls fresh random quotes from `https://rien-bluerose-backend.kha70929.workers.dev/api/quote/random` in the background, keeping the RAM queue filled.
  * **Standby Mode:** If Wi-Fi is disconnected at boot, an offline standby card is presented until connection is restored.
* **Audio Engine:** `Jq8900Player` (Varis Gear C++ driver on UART1, GPIO 1) running at constant volume level 28/30.

---

## 5. Architectural Invariants & Defect Prevention

To prevent regressions, the firmware enforces four mandatory hardware invariants:

1. **Bootloader Linker-Wrapped Brownout Neutralization:**
   * `-Wl,--wrap=esp_brownout_init` in `platformio.ini` stubs out `esp_brownout_init` before the ESP-IDF startup code can register the brownout interrupt. This completely prevents nuisance reboot loops caused by transient breadboard voltage dips.
2. **Zero-Wait Non-Blocking USB CDC:**
   * `Serial.setTxTimeoutMs(0)` is invoked in `setup()`. If the device is connected to a charger or a PC with no active serial terminal reading COM3, the USB ring buffer drops bytes in 0ms, eliminating the 2.0s–4.0s backpressure freezing bug.
3. **Decoupled Animation Time Base:**
   * `animStart` is captured strictly after Frame 0 is drawn and audio is issued, ensuring the full animation duration is allocated to visual cipher transformations.
4. **Asymmetric Button Debounce Filter:**
   * `Btn` fires instantly on the first falling edge (0ms latency), but requires a 50ms stable HIGH state before unlatching, making internal pull-ups immune to contact bounce without requiring external resistors.

