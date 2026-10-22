#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Cấu hình màn hình OLED I2C 128x64
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

const uint8_t WIFI_CHANNEL = 1;

// Địa chỉ MAC của Slave đã xác minh
uint8_t slaveAddress[] = {0x68, 0x09, 0x47, 0x46, 0xFC, 0xFC};

enum CommandType : uint8_t {
    CMD_DRIVE   = 0x01,
    CMD_STEPPER = 0x02,
    CMD_AUDIO   = 0x03,
    CMD_ESTOP   = 0xFF
};

#pragma pack(push, 1)
typedef struct {
    uint8_t  cmdType;       
    int16_t  speedL;        
    int16_t  speedR;        
    int32_t  stepperTarget; 
    uint16_t audioTrack;    
    uint8_t  volume;        
    uint32_t sequence;      
} RCControlPacket;
#pragma pack(pop)

RCControlPacket txPacket;
uint32_t packetCounter = 0;
String lastSendStatus = "Khoi tao...";

// Callback xác nhận trạng thái gửi (Chuẩn API Core cũ)
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
    if (status == ESP_NOW_SEND_SUCCESS) {
        lastSendStatus = "Gui: THANH CONG";
    } else {
        lastSendStatus = "Gui: THAT BAI!";
    }
}

// Cập nhật giao diện Debug lên màn hình OLED
void updateOLEDDisplay() {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);

    // Tiêu đề
    display.setCursor(0, 0);
    display.println("--- ESP-NOW MASTER ---");

    // Địa chỉ MAC đích
    display.printf("Slave: %02X:%02X:%02X:%02X:%02X:%02X\n", 
                   slaveAddress[0], slaveAddress[1], slaveAddress[2],
                   slaveAddress[3], slaveAddress[4], slaveAddress[5]);

    // Trạng thái gửi
    display.setCursor(0, 22);
    display.println(lastSendStatus);

    // Chi tiết gói tin vừa gửi
    display.setCursor(0, 35);
    display.printf("Seq : %u\n", txPacket.sequence);
    display.printf("Cmd : 0x%02X (DRIVE)\n", txPacket.cmdType);
    display.printf("Spd : L=%d | R=%d\n", txPacket.speedL, txPacket.speedR);

    display.display();
}

void setup() {
    Serial.begin(115200);
    delay(1000);

    // Bắt buộc khai báo lại chân I2C theo phần cứng thực tế: SDA = 19, SCL = 18
    Wire.begin(19, 18);

    // Khởi tạo màn hình OLED
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
        Serial.println(F("[OLED] Khong tim thay man hinh SSD1306!"));
    } else {
        display.clearDisplay();
        display.setTextSize(1);
        display.setTextColor(SSD1306_WHITE);
        display.setCursor(0, 20);
        display.println("Dang khoi tao Master...");
        display.display();
    }

    // Cấu hình WiFi
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(false);

    esp_wifi_set_promiscuous(true);
    esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
    esp_wifi_set_promiscuous(false);

    // Khởi tạo ESP-NOW
    if (esp_now_init() != ESP_OK) {
        Serial.println("[ESP-NOW] Loi khoi tao!");
        return;
    }

    // Đăng ký Callback gửi (API bản cũ)
    esp_now_register_send_cb(OnDataSent);

    // Đăng ký thông tin Peer (Slave)
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, slaveAddress, 6);
    peerInfo.channel = WIFI_CHANNEL;
    peerInfo.encrypt = false;

    if (esp_now_add_peer(&peerInfo) != ESP_OK) {
        Serial.println("[ESP-NOW] Them Peer THAT BAI!");
        return;
    }

    Serial.println("[SYSTEM] Master da san sang gui lenh!");
}

void loop() {
    // Giả lập dữ liệu gửi đi (Mỗi 1 giây gửi 1 gói tin DRIVE)
    packetCounter++;
    
    txPacket.cmdType       = CMD_DRIVE;
    txPacket.speedL        = 150 + (packetCounter % 50); 
    txPacket.speedR        = 150 - (packetCounter % 50); 
    txPacket.stepperTarget = 0;
    txPacket.audioTrack    = 0;
    txPacket.volume        = 0;
    txPacket.sequence      = packetCounter;

    // Gửi gói tin qua ESP-NOW
    esp_err_t result = esp_now_send(slaveAddress, (uint8_t *)&txPacket, sizeof(txPacket));

    if (result == ESP_OK) {
        Serial.printf("[TX] Da phat goi #%u\n", packetCounter);
    } else {
        Serial.println("[TX] Lỗi khi gọi hàm esp_now_send!");
    }

    // Cập nhật màn hình OLED
    updateOLEDDisplay();

    delay(1000); 
}