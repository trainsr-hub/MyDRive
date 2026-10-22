#include "I2SSpeaker.h"
#include <math.h>

I2SSpeaker::I2SSpeaker(i2s_port_t port)
    : _port(port),
      _bclkPin(-1),
      _lrcPin(-1),
      _doutPin(-1),
      _sampleRate(16000),
      _initialized(false),
      _duplicateStereo(true) {}

I2SSpeaker::~I2SSpeaker() {
    end();
}

bool I2SSpeaker::begin(
    int8_t bclkPin,
    int8_t lrcPin,
    int8_t doutPin,
    uint32_t sampleRate,
    int dmaBufCount,
    int dmaBufLen,
    bool duplicateStereo
) {
    if (_initialized) {
        end();
    }

    _bclkPin = bclkPin;
    _lrcPin = lrcPin;
    _doutPin = doutPin;
    _sampleRate = sampleRate;
    _duplicateStereo = duplicateStereo;

    const i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = _sampleRate,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = _duplicateStereo ? I2S_CHANNEL_FMT_RIGHT_LEFT : I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = i2s_comm_format_t(I2S_COMM_FORMAT_STAND_I2S),
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = dmaBufCount,
        .dma_buf_len = dmaBufLen,
        .use_apll = false,
        .tx_desc_auto_clear = true,
        .fixed_mclk = 0
    };

    const i2s_pin_config_t pin_config = {
        .bck_io_num = _bclkPin,
        .ws_io_num = _lrcPin,
        .data_out_num = _doutPin,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    esp_err_t err = i2s_driver_install(_port, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        return false;
    }

    err = i2s_set_pin(_port, &pin_config);
    if (err != ESP_OK) {
        i2s_driver_uninstall(_port);
        return false;
    }

    i2s_zero_dma_buffer(_port);
    _initialized = true;
    return true;
}

size_t I2SSpeaker::writeSamples(const int16_t* samples, size_t count, TickType_t timeoutTicks) {
    if (!_initialized || samples == nullptr || count == 0) {
        return 0;
    }

    size_t bytes_written = 0;
    if (_duplicateStereo) {
        // Expand mono samples to stereo frame (L + R) in a temporary buffer
        const size_t CHUNK_SIZE = 256;
        int16_t stereoBuffer[CHUNK_SIZE * 2];

        size_t processed = 0;
        size_t total_bytes_written = 0;

        while (processed < count) {
            size_t to_process = min(CHUNK_SIZE, count - processed);
            for (size_t i = 0; i < to_process; i++) {
                int16_t val = samples[processed + i];
                stereoBuffer[i * 2]     = val; // Left
                stereoBuffer[i * 2 + 1] = val; // Right
            }

            size_t chunk_bytes = to_process * 2 * sizeof(int16_t);
            bytes_written = 0;
            esp_err_t res = i2s_write(_port, stereoBuffer, chunk_bytes, &bytes_written, timeoutTicks);
            if (res == ESP_OK) {
                total_bytes_written += bytes_written;
            }
            processed += to_process;
        }
        return total_bytes_written;
    } else {
        size_t total_bytes = count * sizeof(int16_t);
        i2s_write(_port, samples, total_bytes, &bytes_written, timeoutTicks);
        return bytes_written;
    }
}

size_t I2SSpeaker::writeBytes(const uint8_t* data, size_t bytes, TickType_t timeoutTicks) {
    if (!_initialized || data == nullptr || bytes == 0) {
        return 0;
    }
    const int16_t* samples = (const int16_t*)data;
    size_t count = bytes / sizeof(int16_t);
    return writeSamples(samples, count, timeoutTicks);
}

void I2SSpeaker::playTone(float frequency, uint32_t durationMs, int16_t amplitude) {
    if (!_initialized || frequency <= 0 || durationMs == 0) {
        return;
    }

    const size_t CHUNK_SIZE = 256;
    int16_t buffer[CHUNK_SIZE];
    size_t total_samples = (size_t)((_sampleRate * durationMs) / 1000);
    size_t generated = 0;

    while (generated < total_samples) {
        size_t chunk = min(CHUNK_SIZE, total_samples - generated);
        for (size_t i = 0; i < chunk; i++) {
            float t = (float)(generated + i) / (float)_sampleRate;
            buffer[i] = (int16_t)(sinf(2.0f * (float)M_PI * frequency * t) * (float)amplitude);
        }
        writeSamples(buffer, chunk);
        generated += chunk;
    }
}

void I2SSpeaker::playChime() {
    if (!_initialized) return;
    playTone(523.25f, 120, 14000); // C5
    delay(20);
    playTone(659.25f, 120, 14000); // E5
    delay(20);
    playTone(783.99f, 200, 15000); // G5
    clearBuffer();
}

void I2SSpeaker::clearBuffer() {
    if (_initialized) {
        i2s_zero_dma_buffer(_port);
    }
}

void I2SSpeaker::end() {
    if (_initialized) {
        i2s_zero_dma_buffer(_port);
        i2s_driver_uninstall(_port);
        _initialized = false;
    }
}
