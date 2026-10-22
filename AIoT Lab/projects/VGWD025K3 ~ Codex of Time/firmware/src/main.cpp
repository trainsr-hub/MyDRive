/**
 * ============================================================================
 * VGWD025K3 ~ Codex of Time (Varis Gear Walpurgis Driver Actuator)
 * Faust Acoustic Field Speaker Firmware (ESP32-S3 + MAX98357A I2S Receiver)
 * ============================================================================
 * Hardware Pinout:
 *   - CH343 UART0             : RX=GPIO 44, TX=GPIO 43 (COM5)
 *   - I2S BCLK (Bit Clock)    : GPIO 5
 *   - I2S LRC  (Word Select)   : GPIO 4
 *   - I2S DOUT (Data to Amp)   : GPIO 6
 *
 * Audio Specification:
 *   - Format      : 16-bit Mono PCM (Expanded to Stereo L+R in DMA)
 *   - Sample Rate : 24,000 Hz (Native Kokoro Neural Rate)
 *   - UART Baud   : 921,600 baud
 * ============================================================================
 */

#include <Arduino.h>
#include <I2SSpeaker.h>

#define PIN_UART_RX        44
#define PIN_UART_TX        43

#define I2S_BCLK_PIN       5
#define I2S_LRC_PIN        4
#define I2S_DOUT_PIN       6

#define I2S_PORT           I2S_NUM_0
#define SAMPLE_RATE        24000
#define SERIAL_BAUD_RATE   921600
#define SERIAL_RX_BUF_SIZE 8192
#define BUFFER_SAMPLES     256

static int16_t mono_buffer[BUFFER_SAMPLES];
static int16_t stereo_buffer[BUFFER_SAMPLES * 2];

I2SSpeaker speaker(I2S_PORT);

unsigned long last_heartbeat = 0;

void setup() {
    // 1. Explicitly configure CH343 UART0 on Pins 44 (RX) and 43 (TX)
    Serial.setRxBufferSize(SERIAL_RX_BUF_SIZE);
    Serial.begin(SERIAL_BAUD_RATE, SERIAL_8N1, PIN_UART_RX, PIN_UART_TX);

    // 2. Initialize I2S Speaker Driver on Pins 5 (BCLK), 4 (LRC), 6 (DOUT) @ 24kHz
    bool ok = speaker.begin(
        I2S_BCLK_PIN,
        I2S_LRC_PIN,
        I2S_DOUT_PIN,
        SAMPLE_RATE,
        8,
        BUFFER_SAMPLES,
        true
    );

    speaker.clearBuffer();

    // 3. Confirm startup over UART
    delay(100);
    Serial.println();
    Serial.println(F("========================================"));
    Serial.println(F("[FAUST] ESP32-S3 I2S Speaker Ready"));
    Serial.printf("[FAUST] Pins: BCLK=%d, LRC=%d, DOUT=%d\n", I2S_BCLK_PIN, I2S_LRC_PIN, I2S_DOUT_PIN);
    Serial.printf("[FAUST] Sample Rate: %d Hz | Baud: %d\n", SAMPLE_RATE, SERIAL_BAUD_RATE);
    Serial.println(F("========================================"));
}

void loop() {
    int available = Serial.available();
    if (available >= 2) {
        int samples_to_read = min(available / 2, (int)BUFFER_SAMPLES);
        int bytes_read = Serial.readBytes((char*)mono_buffer, samples_to_read * 2);
        if (bytes_read > 0) {
            int count = bytes_read / 2;
            for (int i = 0; i < count; i++) {
                int16_t s = mono_buffer[i];
                stereo_buffer[i * 2]     = s;
                stereo_buffer[i * 2 + 1] = s;
            }
            size_t written = 0;
            i2s_write(I2S_PORT, stereo_buffer, count * 2 * sizeof(int16_t), &written, portMAX_DELAY);
        }
    }
}
