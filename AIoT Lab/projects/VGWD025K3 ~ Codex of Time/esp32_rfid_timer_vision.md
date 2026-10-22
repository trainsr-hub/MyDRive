# ESP32 RFID Timer — Project Vision & Beta Specification

## 1. Objective

The device is an **RFID timer** based on an ESP32:

1. Tap/scan an RFID card.
2. Identify the card.
3. Read the number of times the timer has been activated from the card.
4. Increment the counter by `1`.
5. Overwrite the new counter value in the card memory.
6. Start a short timer from **5 minutes to 2 hours**.
7. Display status/countdown on the round TFT display.
8. Use Wi-Fi to occasionally send requests and receive small parameter/configuration updates.
9. Allow the counter to be reset to `0`.

The current stage is **beta/prototype**, so simplicity, easy debugging, and easy changes are prioritized.

## 2. Selected Hardware Architecture

### MCU

**ESP32 30-pin DevKit / ESP32-WROOM-32** for the beta stage.

Reasons:

- Sufficient performance for RFID + TFT + timer + Wi-Fi.
- Has a GPIO matrix, allowing SPI peripherals to be routed to suitable GPIOs.
- Can use `millis()` / timer APIs for timekeeping.
- Built-in Wi-Fi.

There is no need for an ESP32-S3/C6 for the current requirements.

### Modules

- **1.28 Inch Round TFT IPS GC9A01**, SPI interface.
- **MFRC522 RFID**, 13.56 MHz.
- Blank **MIFARE Classic S50 / 1K** card compatible with MFRC522.

## 3. LCD — Confirmed Pin Mapping

The current wiring arrangement is convenient and should be kept:

| ESP32 | GC9A01 | Function |
|---|---|---|
| `3V3` | `VCC` | Power |
| `GND` | `GND` | Ground |
| `GPIO15` | `SCL` | SPI Clock |
| `GPIO2` | `SDA` | SPI MOSI/Data |
| `GPIO4` | `DC` | Data/Command |
| `GPIO16` | `CS` | Chip Select |
| `GPIO17` | `RST` | Reset |

### Meaning of SCL/SDA on GC9A01 modules

On SPI GC9A01 modules:

- `SCL` is typically **SPI clock**.
- `SDA` is typically **SPI MOSI/data**.

They are not I2C SCL/SDA lines.

Therefore:

```text
GPIO15 -> SCL = SPI Clock
GPIO2  -> SDA = SPI MOSI
```

### GPIO2 and GPIO15

ESP32-WROOM has strapping pins. GPIO2 is related to boot strapping, while GPIO15 is a strapping pin related to boot configuration/log output.

Important points for this wiring:

- GC9A01 does not normally drive the ESP32's SPI MOSI `SDA`.
- ESP32 is the transmitter on `SDA/MOSI`.
- After boot, GPIO2/GPIO15 operate as normal GPIOs.
- For GPIO2, the download-boot condition is especially related to the state of GPIO0; keeping GPIO0 HIGH selects normal SPI boot.

### Beta decision

**Keep the mapping above.**

Do not change the GPIOs just because GPIO2/GPIO15 are strapping pins. Test power-on/reset with the LCD connected and verify that the ESP32 boots normally.

## 4. RFID — MFRC522

### Basic pins

The MFRC522 uses SPI:

```text
SCK
MOSI
MISO
SS/SDA (Chip Select)
RST
IRQ (optional)
3.3V
GND
```

### IRQ

`IRQ` is an interrupt output from the MFRC522 to the ESP32. It allows the RC522 to notify the MCU that an event/interrupt has occurred instead of requiring continuous polling.

Possible interrupt sources include:

- command completion,
- transmit/receive completion,
- timeout,
- FIFO/protocol-related interrupt states.

### Beta decision

**Do not use IRQ in the first version.**

Polling is sufficient for this use case:

```text
IDLE
  -> poll MFRC522
  -> detect card
  -> read UID
  -> read counter
  -> increment counter
  -> write counter
  -> start timer
```

IRQ should only be introduced later if there is a real need for:

- deep sleep,
- waking the ESP32 from an RFID event,
- reducing polling,
- or a fully interrupt-driven design.

When unused, `IRQ` can remain **NC (not connected)**.

## 5. SPI Connection

ESP32 supports peripheral routing through its GPIO matrix, so SPI does not have to use one fixed GPIO set.

There are two possible approaches:

### Option A — Separate pin sets

LCD and MFRC522 use separate SPI GPIOs.

### Option B — Shared SPI bus (preferred)

Both devices share:

```text
SCK
MOSI
MISO
```

but have separate chip-select signals:

```text
LCD_CS
RFID_SS
```

This saves GPIOs.

With the current LCD mapping:

```text
LCD:
SCK  = GPIO15
MOSI = GPIO2
```

The MFRC522 can potentially share these SPI signals while using its own `SS/CS`, provided the selected library/driver is configured correctly.

## 6. RFID Card

Provided card information:

- 13.56 MHz
- MFRC522 compatible
- Philips S50 compatible
- 8 Kbit
- 16 sectors
- ISO 14443
- Advertised read time: 1–2 ms

For S50 / MIFARE Classic 1K:

```text
1 KB memory
16 sectors
4 blocks per sector
16 bytes per block
```

Each sector contains:

```text
3 data blocks
1 sector trailer
```

The sector trailer should not be used as a normal data block because it contains keys and access conditions.

## 7. Counter Stored on the Card

The goal is to store the number of times the card has activated the timer.

A `uint32_t` (4-byte) counter is sufficient, for example:

```text
Block X
Byte 0..3   = activation_count
Byte 4..15  = reserved
```

Example:

```text
00 00 00 2A
```

can represent counter = `42`, depending on the firmware's chosen byte order.

### Counter write flow

```text
Card detected
    ↓
Read UID
    ↓
Authenticate sector
    ↓
Read counter
    ↓
counter++
    ↓
Write counter
    ↓
Start timer
```

### Reset

A reset operation can simply do:

```text
counter = 0
write block
```

### Value Block

MIFARE Classic provides a Value Block mechanism for increment/decrement operations. However, for beta, **a normal data block + uint32_t counter** is preferred because it is simpler to understand and debug.

## 8. Timer

Requirements:

- minimum: **5 minutes**
- maximum: **2 hours**
- display resolution: **seconds**

No separate RTC is required for the current requirement.

The timer can use:

```cpp
startTime = millis();
```

and calculate elapsed/remaining time from timestamps instead of decrementing a variable once per second with an interrupt.

Example:

```text
Duration = 1800 s
Start    = T0

Remaining = Duration - elapsed
```

Display:

```text
30:00
29:59
29:58
...
00:01
00:00
```

### Proposed state machine

```text
IDLE
  ↓ card detected
UPDATING_CARD
  ↓ write successful
RUNNING
  ↓ timer expired
FINISHED
  ↓
IDLE
```

## 9. Power Loss

The behavior during power loss in the middle of a timer must be defined explicitly.

Possible approaches:

```text
A. Power loss -> timer is lost
B. Power loss -> restore the timer
C. Power loss -> save state to flash/NVS
D. Server is the source of timer state
```

For beta, this is a requirement that should be decided before implementing persistence.

## 10. Wi-Fi / Internet

Wi-Fi does not need to remain continuously active.

Purpose:

- send small requests,
- receive updated parameters/configuration,
- use the network only occasionally.

Example:

```text
ESP32
  ↓ Wi-Fi
GET /config
  ↓
duration / parameters
```

The ESP32 can connect only when an update is needed and then disconnect to reduce overhead.

## 11. Minimal LCD UI

The LCD is responsible only for displaying state; it does not own timer logic.

Example screen:

```text
READY

CARD: XXXXXXXX
COUNT: 42

TIMER
29:58
```

Other states may include:

```text
READY
CARD DETECTED
UPDATING...
TIMER RUNNING
FINISHED
ERROR
```

The display code should not block for long periods during an operation, so RFID handling remains responsive.

## 12. Firmware Architecture

Separate the logic into modules:

```text
RFID Manager
    ├─ detect card
    ├─ read UID
    ├─ authenticate
    ├─ read counter
    └─ write counter

Timer Manager
    ├─ start
    ├─ running
    ├─ remaining
    └─ finished

Display Manager
    └─ GC9A01 UI

Network Manager
    ├─ Wi-Fi connect
    ├─ request config
    └─ update parameters

Main State Machine
    └─ coordinates the whole system
```

The LCD should not block long enough to make RFID handling noticeably slow.

## 13. Beta Hardware Pin Allocation — Working Proposal

### LCD (confirmed)

```text
GPIO15 -> GC9A01 SCL / SPI CLK
GPIO2  -> GC9A01 SDA / SPI MOSI
GPIO4  -> GC9A01 DC
GPIO16 -> GC9A01 CS
GPIO17 -> GC9A01 RST
```

### MFRC522

Initial proposal if using separate pins:

```text
MFRC522 SCK  -> GPIO18
MFRC522 MOSI -> GPIO23
MFRC522 MISO -> GPIO19
MFRC522 SS   -> GPIO21
MFRC522 RST  -> GPIO22
MFRC522 IRQ  -> NC
```

However, if using a **shared SPI bus**, preferably share `SCK/MOSI/MISO` with the LCD and allocate only a separate `SS/CS` for the RFID.

The final RFID pin map should be locked together with the actual SPI library/implementation being used.

## 14. Design Principles

### Beta priorities

- simple,
- easy to test,
- easy to change pins,
- easy to debug,
- avoid unnecessary interrupts/hardware,
- do not over-engineer.

### Not required at the first stage

- separate RTC,
- RFID IRQ,
- a more powerful ESP32 solely because of the LCD,
- complex cloud architecture,
- timer persistence until the power-loss behavior is defined.
