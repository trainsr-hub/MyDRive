/**
 * ============================================================================
 * Faust Acoustic Field Speaker - ESP32 I2S Real-Time Audio Receiver
 * ============================================================================
 * Hardware: ESP32 + MAX98357A / PCM5102 / UDA1334A I2S DAC Amp
 *
 * Pinout:
 *   - I2S BCLK (SCK):  GPIO 16
 *   - I2S LRC  (WS):   GPIO 17
 *   - I2S DIN  (SD):   GPIO 15
 *   - GND to GND, VIN to 5V (or 3.3V)
 *
 * Features:
 *   1. Hardware Self-Test: Plays a 2-tone chime on boot to verify speaker wiring.
 *   2. High-Speed UART: 921,600 baud streaming from Faust Resident Daemon.
 *   3. Universal Compatibility: Stereo frame expansion for Mono/Stereo DACs.
 *   4. Zero-Pop DMA auto-clearing.
 * ============================================================================
 */

#include <Arduino.h>
#include <driver/i2s.h>
#include <math.h>

#define I2S_PORT        I2S_NUM_0
#define I2S_SCK         16     // BCLK (Bit Clock)
#define I2S_WS          17     // LRC / WS (Word Select)
#define I2S_SD          15     // DOUT to Speaker Amp DIN

#define SAMPLE_RATE     16000  // 16 kHz
#define UART_BAUD       921600 // 921.6k baud for high-fidelity PCM streaming
#define RX_BUFFER_SIZE  1024   // 512 mono samples (1024 bytes) per batch

int16_t mono_samples[RX_BUFFER_SIZE / 2];
int16_t stereo_samples[RX_BUFFER_SIZE]; // Mono expanded to Left + Right

void setup_i2s() {
    const i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_I2S),
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 512,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0
    };

    const i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_SCK,
        .ws_io_num = I2S_WS,
        .data_out_num = I2S_SD,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        while (true) { delay(100); }
    }

    err = i2s_set_pin(I2S_PORT, &pin_config);
    if (err != ESP_OK) {
        while (true) { delay(100); }
    }

    i2s_zero_dma_buffer(I2S_PORT);
}

// Hardware diagnostic chime (plays 440Hz -> 880Hz sine wave)
void play_startup_chime() {
    const int freq1 = 440; // A4
    const int freq2 = 880; // A5
    const int duration_ms = 150;
    const int total_samples_per_tone = (SAMPLE_RATE * duration_ms) / 1000;

    int16_t tone_buf[512 * 2]; // Stereo buffer

    // Tone 1 (440Hz)
    int samples_left = total_samples_per_tone;
    int phase = 0;
    while (samples_left > 0) {
        int chunk = min(512, samples_left);
        for (int i = 0; i < chunk; i++) {
            float t = (float)phase / (float)SAMPLE_RATE;
            int16_t val = (int16_t)(sin(2.0 * M_PI * freq1 * t) * 12000.0);
            tone_buf[i * 2]     = val;
            tone_buf[i * 2 + 1] = val;
            phase++;
        }
        size_t written = 0;
        i2s_write(I2S_PORT, tone_buf, chunk * 2 * sizeof(int16_t), &written, portMAX_DELAY);
        samples_left -= chunk;
    }

    delay(30);

    // Tone 2 (880Hz)
    samples_left = total_samples_per_tone;
    phase = 0;
    while (samples_left > 0) {
        int chunk = min(512, samples_left);
        for (int i = 0; i < chunk; i++) {
            float t = (float)phase / (float)SAMPLE_RATE;
            int16_t val = (int16_t)(sin(2.0 * M_PI * freq2 * t) * 12000.0);
            tone_buf[i * 2]     = val;
            tone_buf[i * 2 + 1] = val;
            phase++;
        }
        size_t written = 0;
        i2s_write(I2S_PORT, tone_buf, chunk * 2 * sizeof(int16_t), &written, portMAX_DELAY);
        samples_left -= chunk;
    }

    i2s_zero_dma_buffer(I2S_PORT);
}

void setup() {
    Serial.begin(UART_BAUD);
    // Increase internal UART RX buffer to 8192 bytes
    Serial.setRxBufferSize(8192);

    setup_i2s();

    // Play startup chime to confirm I2S speaker hardware is alive
    play_startup_chime();

    Serial.println();
    Serial.println(F("[FAUST_I2S_SPEAKER_READY]"));
}

void loop() {
    int available = Serial.available();
    if (available >= 2) {
        // Read in chunks up to RX_BUFFER_SIZE (must be aligned to 2 bytes)
        int to_read = min(available, (int)RX_BUFFER_SIZE);
        to_read = to_read & (~1);

        int bytes_read = Serial.readBytes((char*)mono_samples, to_read);
        if (bytes_read > 0) {
            int samples_count = bytes_read / 2;

            // Expand mono samples to stereo frame (Left + Right)
            for (int i = 0; i < samples_count; i++) {
                int16_t sample = mono_samples[i];
                stereo_samples[i * 2]     = sample;
                stereo_samples[i * 2 + 1] = sample;
            }

            size_t bytes_written = 0;
            i2s_write(
                I2S_PORT,
                stereo_samples,
                samples_count * 2 * sizeof(int16_t),
                &bytes_written,
                portMAX_DELAY
            );
        }
    }
}
