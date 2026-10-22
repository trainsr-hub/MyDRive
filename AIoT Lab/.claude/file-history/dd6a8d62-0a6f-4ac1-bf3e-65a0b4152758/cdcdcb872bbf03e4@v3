#ifndef I2S_SPEAKER_H
#define I2S_SPEAKER_H

#include <Arduino.h>
#include <driver/i2s.h>

/**
 * ============================================================================
 * I2SSpeaker: High-Performance Zero-Pop I2S Audio Output Driver for ESP32
 * ============================================================================
 * Designed for Faust Acoustic Field Presence on ESP32 mechatronics actuators.
 * Supports MAX98357A, PCM5102, UDA1334A, and standard I2S DACs.
 * Features:
 * - Direct 16-bit PCM streaming via DMA buffers
 * - Mono-to-Stereo duplicate expansion for universal DAC compatibility
 * - Zero-pop startup / shutdown with DMA auto-clearing
 * - Built-in hardware diagnostic tone / chime generator
 * ============================================================================
 */
class I2SSpeaker {
private:
    i2s_port_t _port;
    int8_t _bclkPin;
    int8_t _lrcPin;
    int8_t _doutPin;
    uint32_t _sampleRate;
    bool _initialized;
    bool _duplicateStereo;

public:
    I2SSpeaker(i2s_port_t port = I2S_NUM_0);
    ~I2SSpeaker();

    /**
     * Initialize I2S peripheral in TX Master mode.
     * @param bclkPin Bit Clock (SCK)
     * @param lrcPin Word Select (WS / LRC)
     * @param doutPin Data Out (SD / DIN)
     * @param sampleRate Sample rate in Hz (default: 16000)
     * @param dmaBufCount Number of DMA buffers (default: 8)
     * @param dmaBufLen Length of each DMA buffer in samples (default: 512)
     * @param duplicateStereo If true, duplicates mono samples to L and R channels
     */
    bool begin(
        int8_t bclkPin = 16,
        int8_t lrcPin = 17,
        int8_t doutPin = 15,
        uint32_t sampleRate = 16000,
        int dmaBufCount = 8,
        int dmaBufLen = 512,
        bool duplicateStereo = true
    );

    /**
     * Write raw 16-bit mono PCM samples to I2S speaker.
     * @param samples Pointer to int16_t mono samples array
     * @param count Number of samples
     * @param timeoutTicks FreeRTOS ticks to wait (default: portMAX_DELAY)
     * @return Number of bytes actually written
     */
    size_t writeSamples(const int16_t* samples, size_t count, TickType_t timeoutTicks = portMAX_DELAY);

    /**
     * Write raw PCM bytes buffer directly to I2S.
     * @param data Raw PCM bytes
     * @param bytes Number of bytes
     * @return Bytes written
     */
    size_t writeBytes(const uint8_t* data, size_t bytes, TickType_t timeoutTicks = portMAX_DELAY);

    /**
     * Play a diagnostic pure sine wave tone.
     * @param frequency Frequency in Hz (e.g. 440 for A4)
     * @param durationMs Duration in milliseconds
     * @param amplitude Peak amplitude (0 to 32767, default 12000)
     */
    void playTone(float frequency, uint32_t durationMs = 200, int16_t amplitude = 12000);

    /**
     * Play a 2-tone diagnostic chime (440Hz -> 880Hz) to confirm hardware speaker is alive.
     */
    void playChime();

    /**
     * Clear DMA buffers with silence to prevent pops and clicks.
     */
    void clearBuffer();

    /**
     * Stop I2S driver and release pins.
     */
    void end();

    bool isInitialized() const { return _initialized; }
    uint32_t getSampleRate() const { return _sampleRate; }
};

#endif // I2S_SPEAKER_H
