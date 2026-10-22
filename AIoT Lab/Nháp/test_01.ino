// path: esp32s3_max98357a_demo.ino
#include <Arduino.h>
#include "driver/i2s.h"

// Cấu hình chân I2S cho ESP32-S3 kết nối MAX98357A
#define I2S_BCLK_PIN       5
#define I2S_LRC_PIN        4
#define I2S_DOUT_PIN       6

#define I2S_PORT           I2S_NUM_0

// =========================================================================
// [SỬA ĐỔI: LOẠI BỎ TOÀN BỘ WIFI, THIẾT LẬP SERIAL TỐC ĐỘ CAO 2.000.000 BAUD]
// =========================================================================
#define SAMPLE_RATE        24000
#define BUFFER_SAMPLES     256
#define SERIAL_BAUD_RATE   2000000   // 2 Mbps: Băng thông gấp đôi nhu cầu thực tế của 24kHz Stereo
#define SERIAL_RX_BUF_SIZE 4096      // Nới rộng bộ đệm nhận phần cứng lên 4KB để chống rách âm

static uint8_t raw_audio_buffer[BUFFER_SAMPLES * 4]; // 256 mẫu * 4 bytes (16-bit Stereo) = 1024 bytes
// =========================================================================
/* [COMMENT SỬA ĐỔI]:
 * 1. Xóa hoàn toàn thư viện <WiFi.h> và <WiFiUdp.h>.
 * 2. Thiết lập tốc độ Serial lên 2.000.000 baud để đảm bảo băng thông 96 KB/s truyền ổn định.
 * 3. Kích thước buffer đọc mỗi đợt là 1024 bytes, khớp với khung dữ liệu PCM từ PC.
 */
// =========================================================================

void setupI2S() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = BUFFER_SAMPLES,
        .use_apll = false,
        .tx_desc_auto_clear = true
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = I2S_BCLK_PIN,
        .ws_io_num = I2S_LRC_PIN,
        .data_out_num = I2S_DOUT_PIN,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        while (true) { delay(1000); }
    }

    err = i2s_set_pin(I2S_PORT, &pin_config);
    if (err != ESP_OK) {
        while (true) { delay(1000); }
    }

    i2s_zero_dma_buffer(I2S_PORT);
}

// =========================================================================
// [SỬA ĐỔI: CẤU HÌNH BỘ ĐỆM SERIAL HARDWARE TRƯỚC KHI KHỞI TẠO]
// =========================================================================
void setup() {
    // Bắt buộc gọi setRxBufferSize() TRƯỚC Serial.begin() để mở rộng FIFO RAM
    Serial.setRxBufferSize(SERIAL_RX_BUF_SIZE);
    Serial.begin(SERIAL_BAUD_RATE);
    
    setupI2S();
}
// =========================================================================
/* [COMMENT SỬA ĐỔI]:
 * Arduino mặc định chỉ cấp 64 đến 256 bytes cho bộ đệm RX. Nếu không nâng lên 4096 bytes,
 * dữ liệu PCM đổ về từ PC ở tốc độ 2Mbps sẽ bị tràn hàng đợi (buffer overflow) ngay lập tức.
 */
// =========================================================================

// =========================================================================
// [SỬA ĐỔI: PIPELINE CHUYỂN TRỰC TIẾP DỮ LIỆU TỪ SERIAL SANG I2S DMA]
// =========================================================================
void loop() {
    if (Serial.available() >= sizeof(raw_audio_buffer)) {
        // Đọc khối 1024 bytes nhị phân từ cáp USB
        size_t bytes_read = Serial.readBytes((char*)raw_audio_buffer, sizeof(raw_audio_buffer));
        
        if (bytes_read > 0) {
            size_t bytes_written = 0;
            // Đẩy trực tiếp vào DMA I2S điều khiển MAX98357A
            i2s_write(I2S_PORT, raw_audio_buffer, bytes_read, &bytes_written, portMAX_DELAY);
        }
    }
}
// =========================================================================
/* [COMMENT SỬA ĐỔI]:
 * Cơ chế luân chuyển dữ liệu không qua xử lý trung gian: Serial RX -> RAM Buffer -> I2S DMA.
 * Tận dụng lệnh chặn portMAX_DELAY của I2S để tự động giữ xung nhịp với DAC phần cứng.
 */
// =========================================================================