#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>

const uint8_t WIFI_CHANNEL = 1;

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

volatile bool hasNewPacket = false;
RCControlPacket rxBufferPacket;
RCControlPacket prevPacket; // Lưu lại trạng thái gói trước đó để so sánh
uint8_t masterMac[6];

unsigned long lastPrintTime = 0;
const unsigned long HEARTBEAT_INTERVAL = 2000; // 2 giây in 1 lần nếu không có thao tác mới

// Callback nhận ESP-NOW
void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
    if (len == sizeof(RCControlPacket)) {
        memcpy((void*)&rxBufferPacket, incomingData, sizeof(RCControlPacket));
        memcpy(masterMac, info->src_addr, 6);
        hasNewPacket = true;
    }
}

void setup() {
    Serial.begin(115200);
    delay(2000); 
    
    Serial.println("\n==================================================");
    Serial.println("[SYSTEM] ESP32 Slave ready (Print-on-Change mode)");

    WiFi.mode(WIFI_STA);
    WiFi.disconnect(false); 
    delay(100); 

    esp_wifi_set_promiscuous(true);
    esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
    esp_wifi_set_promiscuous(false);
    esp_wifi_set_ps(WIFI_PS_NONE); 

    if (esp_now_init() == ESP_OK) {
        esp_now_register_recv_cb(OnDataRecv);
    } else {
        Serial.println("[ESP-NOW] Loi khoi tao!");
        return;
    }

    Serial.printf("=> MAC Slave: %s\n", WiFi.macAddress().c_str());
    Serial.println("=> Cho lenh tu Master (Chỉ in log khi BẤM/THẢ nút)...");
    Serial.println("==================================================\n");

    // Khởi tạo trạng thái ban đầu
    memset(&prevPacket, 0xFF, sizeof(RCControlPacket)); // Đặt giá trị rác để lần nhận đầu tiên luôn in
}

void loop() {
    if (hasNewPacket) {
        RCControlPacket pkt;
        uint8_t mac[6];

        noInterrupts();
        pkt = rxBufferPacket;
        memcpy(mac, masterMac, 6);
        hasNewPacket = false;
        interrupts();

        // Kiểm tra xem dữ liệu có thay đổi so với gói trước không
        bool hasChanged = (pkt.speedL != prevPacket.speedL ||
                           pkt.speedR != prevPacket.speedR ||
                           pkt.stepperTarget != prevPacket.stepperTarget ||
                           pkt.audioTrack != prevPacket.audioTrack ||
                           pkt.cmdType != prevPacket.cmdType);

        unsigned long now = millis();

        // Chỉ in ra Serial nếu dữ liệu THAY ĐỔI hoặc trôi qua 2 giây (Heartbeat)
        if (hasChanged || (now - lastPrintTime >= HEARTBEAT_INTERVAL)) {
            lastPrintTime = now;
            prevPacket = pkt;

            // In 1 dòng duy nhất dạng Table/Compact cực kỳ dễ nhìn
            Serial.printf("[Seq:%05u] | DRIVE: L=%-4d R=%-4d | STEPPER: %-2d | AUDIO: Track %-2u | Type: 0x%02X %s\n",
                          pkt.sequence,
                          pkt.speedL, 
                          pkt.speedR,
                          pkt.stepperTarget,
                          pkt.audioTrack,
                          pkt.cmdType,
                          hasChanged ? "<<" : "(Idle)");
        }
    }
}