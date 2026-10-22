# 🔌 VGWD025K3 ~ Codex of Time Hardware Pinout & Wiring Specification

```
Project: Varis Gear VGWD025K3 (Walpurgis Driver Actuator)
Platform: ESP32-WROOM-32 / ESP32 DevKit V1 (30-pin)
Architecture: Dual Hardware SPI Peripherals (HSPI for LCD, VSPI for RFID)
Display: GC9A01 1.28" Round IPS TFT (HSPI, 240x240)
RFID: MFRC522 13.56 MHz Reader (VSPI, MIFARE Classic 1K)
Audio Module: JQ8900 MP3 Player (Serial2 UART TX on GPIO 33)
```

---

## 1. Dual Independent SPI Bus Architecture

### Bus 1: GC9A01 Round Display (HSPI Peripheral)
| Signal | GC9A01 Pin | ESP32 GPIO | Description |
|---|---|---|---|
| **HSPI SCK** | `SCL` | `GPIO 15` | High-speed SPI Clock (up to 40MHz) |
| **HSPI MOSI**| `SDA` | `GPIO 2`  | High-speed SPI Data Out |
| **Control**  | `DC`  | `GPIO 4`  | Data / Command Selection |
| **Control**  | `CS`  | `GPIO 16` | Display Chip Select (Active LOW) |
| **Control**  | `RST` | `GPIO 17` | Display Hardware Reset |
| **Power**    | `VCC` | `3.3V`    | Logic & Backlight Power |
| **Power**    | `GND` | `GND`     | System Ground |

### Bus 2: MFRC522 RFID Module (VSPI Native Hardware Peripheral)
| Signal | MFRC522 Pin | ESP32 GPIO | Description |
|---|---|---|---|
| **VSPI SCK** | `SCK` | `GPIO 18` | Native SPI Clock |
| **VSPI MOSI**| `MOSI` | `GPIO 23` | Native Master Out / Slave In |
| **VSPI MISO**| `MISO / SO` | `GPIO 19` | Native Master In / Slave Out |
| **Control**  | `SDA / SS / CS` | `GPIO 21` | RFID Chip Select (Active LOW) |
| **Control**  | `RST` | `GPIO 22` | RFID Hardware Reset |
| **IRQ**      | `IRQ` | `NC` | Not Connected (Polling Mode) |
| **Power**    | `3.3V` | `3.3V` | Logic Power (Do NOT connect 5V) |
| **Power**    | `GND` | `GND` | System Ground |

---

## 2. Acoustic Actuator (JQ8900 MP3 Audio Player)

| Component | Pin Label | ESP32 GPIO | Description |
|---|---|---|---|
| **JQ8900 Audio** | `RX / SDA` | `GPIO 33` | Dedicated HardwareSerial2 TX (9600 baud) |
| **JQ8900 Audio** | `VCC` | `3.3V / 5.0V` | Power Rail (5V recommended for high volume) |
| **JQ8900 Audio** | `GND` | `GND` | Common Ground |

### Audio Track Mapping:
- **Track 2**: Played ONCE when timer starts (`STATE_TIMER_RUNNING`).
- **Track 7**: Played ONCE when countdown completes (`STATE_TIMER_FINISHED`).

---

## 3. Peripheral Controls

| Component | Signal | ESP32 GPIO | Description |
|---|---|---|---|
| **Abort Button** | `Digital IN` | `GPIO 18` (or custom) | Tactile abort / cancel button (Internal Pull-Up) |

---

## 4. MIFARE Classic 1K Card Memory Mapping

| Sector | Block | Usage | Data Content |
|---|---|---|---|
| **Sector 0** | Block 0..2 | Manufacturer Data | Read-only UID & Vendor Info |
| **Sector 0** | Block 3 | Sector Trailer 0 | Key A / Access Bits / Key B |
| **Sector 1** | **Block 4** | **Activation Counter** | `Bytes 0..3`: `uint32_t` counter (Little-Endian)<br>`Bytes 4..5`: Signature `0x56 0x47` ('VG')<br>`Bytes 6..15`: Reserved (0x00) |
| **Sector 1** | Block 5..6 | User Data | Reserved for future timer parameters |
| **Sector 1** | Block 7 | Sector Trailer 1 | Key A default (`0xFF 0xFF 0xFF 0xFF 0xFF`) |
