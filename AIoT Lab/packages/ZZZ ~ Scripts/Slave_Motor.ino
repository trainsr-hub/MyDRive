// path: src/main.ino
#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <Tb6612Driver.h>
#include <Uln2003Stepper.h>
#include <Srf05Sensor.h>
#include <Jq8900Player.h>

#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

/*
********************************************************************************
* [CENTRAL CONFIGURATION & PIN MAPPING]
********************************************************************************
*/

const uint8_t WIFI_CHANNEL = 1;

// --- 1. TB6612 DC Motor Driver ---
const Tb6612Pins MOTOR_PINS = {
    .stby = 33,
    .in1L = 25,
    .in2L = 26,
    .pwmL = 27,
    .in1R = 14,
    .in2R = 12,
    .pwmR = 13
};

const Tb6612PwmConfig MOTOR_PWM_CONFIG = {
    .frequency = 20000,
    .resolution = 8,
    .channelL = 0,
    .channelR = 1
};

const int BASE_PWM = 50;
const int MAX_DRIVE_PWM = 200;

// --- 2. ULN2003 Stepper Motor ---
const uint8_t STEPPER_PIN_IN1 = 15;
const uint8_t STEPPER_PIN_IN2 = 2;
const uint8_t STEPPER_PIN_IN3 = 4;
const uint8_t STEPPER_PIN_IN4 = 16;

// --- 3. SRF05 Ultrasonic Sensor & Distance Thresholds ---
const uint8_t SRF05_PIN = 32;
const float SLOWDOWN_DISTANCE_CM = 100.0f; // Bắt đầu giảm tốc từ 100cm
const float STOP_DISTANCE_CM     = 30.0f;  // Dừng mượt hẳn khi dưới 30cm

// --- 4. JQ8900 Audio Player ---
const uint8_t JQ8900_TX_PIN = 17;
const uint8_t JQ8900_RX_PIN = 18;
const uint32_t JQ8900_BAUD = 9600;

/*
********************************************************************************
* [ESP-NOW PROTOCOL DEFINITION & TIMEOUTS]
********************************************************************************
*/
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

const unsigned long FAILSAFE_TIMEOUT_MS = 1000; 
const unsigned long STEPPER_TIMEOUT_MS  = 150;  

unsigned long lastRecvTime = 0;
unsigned long lastStepperCmdTime = 0;

volatile bool hasNewPacket = false;
RCControlPacket rxBufferPacket;

/*
********************************************************************************
* [OBJECT INSTANTIATIONS & GLOBAL VARIABLES]
********************************************************************************
*/
Tb6612Driver motors(MOTOR_PINS, MOTOR_PWM_CONFIG);
Uln2003Stepper stepper(STEPPER_PIN_IN1, STEPPER_PIN_IN2, STEPPER_PIN_IN3, STEPPER_PIN_IN4);
Srf05Sensor distanceSensor(SRF05_PIN);
Jq8900Player audio(Serial2);

int targetSpeedL = 0;
int targetSpeedR = 0;
int currentPwmL = 0;
int currentPwmR = 0;
int trackk = 1;

bool isAudioWarned = false;

// Function Prototypes
void processControlPacket(const RCControlPacket& packet);
void processSerialCommand(String cmd);
void updateDriveLogic();
void checkFailsafe();
float getFilteredDistance();
void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len);

void setup() {
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

    Serial.begin(115200);
    delay(1000);

    motors.begin();
    motors.setPwmLimits(BASE_PWM, MAX_DRIVE_PWM, 255);
    stepper.begin();
    distanceSensor.begin();
    audio.begin(JQ8900_TX_PIN, JQ8900_RX_PIN, JQ8900_BAUD);
    audio.setVolume(100);

    // Khởi tạo Wi-Fi & ESP-NOW
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(false); 
    delay(100);

    esp_wifi_set_promiscuous(true);
    esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
    esp_wifi_set_promiscuous(false);
    esp_wifi_set_ps(WIFI_PS_NONE);

    if (esp_now_init() == ESP_OK) {
        esp_now_register_recv_cb(OnDataRecv);
        Serial.println("[ESP-NOW] Khoi tao thanh cong.");
    } else {
        Serial.println("[ESP-NOW] Loi khoi tao!");
    }

    Serial.println("==================================================");
    Serial.printf("ESP32 Slave MAC Address: %s\n", WiFi.macAddress().c_str());
    Serial.printf("Soft-Brake Dist: %.1f cm -> %.1f cm\n", SLOWDOWN_DISTANCE_CM, STOP_DISTANCE_CM);
    Serial.println("==================================================");

    lastRecvTime = millis();
}

void loop() {
    // 1. Nhận gói tin từ ESP-NOW
    if (hasNewPacket) {
        RCControlPacket pkt;
        noInterrupts();
        pkt = rxBufferPacket;
        hasNewPacket = false;
        interrupts();

        processControlPacket(pkt);
    }

    // 2. Đọc lệnh từ Serial Monitor
    if (Serial.available() > 0) {
        String input = Serial.readStringUntil('\n');
        input.trim();
        if (input.length() > 0) {
            processSerialCommand(input);
            lastRecvTime = millis();
        }
    }

    // 3. Tự động dừng Stepper khi nhả nút
    if (stepper.isMoving() && (millis() - lastStepperCmdTime > STEPPER_TIMEOUT_MS)) {
        stepper.stop();
    }

    // 4. Phát xung Stepper
    stepper.update();

    // 5. Kiểm tra Failsafe & Cập nhật động cơ DC
    checkFailsafe();
    updateDriveLogic();
}

void OnDataRecv(const esp_now_recv_info *info, const uint8_t *incomingData, int len) {
    if (len == sizeof(RCControlPacket)) {
        memcpy((void*)&rxBufferPacket, incomingData, sizeof(RCControlPacket));
        hasNewPacket = true;
        lastRecvTime = millis();
    }
}

void processControlPacket(const RCControlPacket& packet) {
    if (packet.cmdType == CMD_ESTOP) {
        targetSpeedL = 0;
        targetSpeedR = 0;
        currentPwmL = 0;
        currentPwmR = 0;
        motors.drive(0, 0);
        stepper.stop();
        return;
    }

    // Phân loại xử lý Stepper rõ ràng theo cmdType
    if (packet.cmdType == CMD_STEPPER) {
        lastStepperCmdTime = millis();
        if (packet.stepperTarget > 0) {
            stepper.rotateCW();
        } else if (packet.stepperTarget < 0) {
            stepper.rotateCCW();
        } else {
            stepper.stop();
        }
    } 
    else {
        // Nếu là gói tin lái CMD_DRIVE, chỉ nhận stepperTarget nếu thực sự có truyền dữ liệu điều khiển
        if (packet.stepperTarget > 0) {
            lastStepperCmdTime = millis();
            stepper.rotateCW();
        } else if (packet.stepperTarget < 0) {
            lastStepperCmdTime = millis();
            stepper.rotateCCW();
        }
    }

    targetSpeedL = packet.speedL;
    targetSpeedR = packet.speedR;

    if (packet.audioTrack > 0) {
        if (packet.volume > 0 && packet.volume <= 30) {
            audio.setVolume(packet.volume);
        }
        audio.playTrack(packet.audioTrack);
    }
}

void checkFailsafe() {
    if (millis() - lastRecvTime > FAILSAFE_TIMEOUT_MS) {
        if (targetSpeedL != 0 || targetSpeedR != 0) {
            targetSpeedL = 0;
            targetSpeedR = 0;
            currentPwmL = 0;
            currentPwmR = 0;
            motors.drive(0, 0);
            Serial.println("[FAILSAFE] Mat ket noi voi Master! Thang tu do.");
        }
    }
}

float getFilteredDistance() {
    float d1 = distanceSensor.getDistance();
    delayMicroseconds(500);
    float d2 = distanceSensor.getDistance();
    delayMicroseconds(500);
    float d3 = distanceSensor.getDistance();

    if ((d1 <= d2 && d2 <= d3) || (d3 <= d2 && d2 <= d1)) return d2;
    if ((d2 <= d1 && d1 <= d3) || (d3 <= d1 && d1 <= d2)) return d1;
    return d3;
}

void updateDriveLogic() {
    if (stepper.isMoving()) {
        motors.drive(0, 0);
        currentPwmL = 0;
        currentPwmR = 0;
        return;
    }

    float currentDist = getFilteredDistance();

    static unsigned long lastDistPrint = 0;
    if (millis() - lastDistPrint >= 500) {
        lastDistPrint = millis();
        Serial.printf("[SONAR] Dist: %.1f cm | TargetL/R: %d/%d | PWML/R: %d/%d\n", 
                      currentDist, targetSpeedL, targetSpeedR, currentPwmL, currentPwmR);
    }

    int adjustedTargetL = targetSpeedL;
    int adjustedTargetR = targetSpeedR;

    // CHỈ áp dụng điều chỉnh tốc độ khi xe chạy TIẾN (> 0)
    if (targetSpeedL > 0 && targetSpeedR > 0) {
        if (currentDist < STOP_DISTANCE_CM) {
            // Quá gần vật cản: Đưa target về 0 để Ramp PWM hạ tốc độ dừng mượt mà
            adjustedTargetL = 0;
            adjustedTargetR = 0;

            if (!isAudioWarned) {
                isAudioWarned = true;
                Serial.printf("[SMOOTH STOP] Vat can phia truoc (%.1f cm < %.1f cm)\n", 
                              currentDist, STOP_DISTANCE_CM);
                audio.playTrack(trackk);
                trackk = trackk + 1;
            }
        } 
        else if (currentDist < SLOWDOWN_DISTANCE_CM) {
            // Ở vùng cảnh báo: Giảm tốc tỉ lệ tuyến tính từ 100% xuống 0%
            float factor = (currentDist - STOP_DISTANCE_CM) / (SLOWDOWN_DISTANCE_CM - STOP_DISTANCE_CM);
            factor = constrain(factor, 0.0f, 1.0f);

            adjustedTargetL = (int)(targetSpeedL * factor);
            adjustedTargetR = (int)(targetSpeedR * factor);
            isAudioWarned = false;
        } 
        else {
            isAudioWarned = false;
        }
    } else {
        isAudioWarned = false;
    }

    // Bộ Ramp PWM (Hạ/tăng tốc độ mượt để giảm dòng khởi động & dòng giật)
    static unsigned long lastRampTime = 0;
    if (millis() - lastRampTime >= 10) {
        lastRampTime = millis();

        int step = 15; // Tốc độ đáp ứng PWM mỗi 10ms
        if (currentPwmL < adjustedTargetL) currentPwmL = min(currentPwmL + step, adjustedTargetL);
        else if (currentPwmL > adjustedTargetL) currentPwmL = max(currentPwmL - step, adjustedTargetL);

        if (currentPwmR < adjustedTargetR) currentPwmR = min(currentPwmR + step, adjustedTargetR);
        else if (currentPwmR > adjustedTargetR) currentPwmR = max(currentPwmR - step, adjustedTargetR);

        motors.drive(currentPwmL, currentPwmR);
    }
}

void processSerialCommand(String cmd) {
    cmd.toUpperCase();

    if (cmd.startsWith("MOVE ")) {
        int spaceIdx = cmd.indexOf(' ', 5);
        if (spaceIdx != -1) {
            targetSpeedL = cmd.substring(5, spaceIdx).toInt();
            targetSpeedR = cmd.substring(spaceIdx + 1).toInt();
        }
    } 
    else if (cmd == "STOP") {
        targetSpeedL = 0;
        targetSpeedR = 0;
        currentPwmL = 0;
        currentPwmR = 0;
        motors.drive(0, 0);
        stepper.stop();
    } 
    else if (cmd.startsWith("STEP ")) {
        int dir = cmd.substring(5).toInt();
        if (dir > 0) {
            stepper.rotateCW();
            lastStepperCmdTime = millis();
        } else if (dir < 0) {
            stepper.rotateCCW();
            lastStepperCmdTime = millis();
        } else {
            stepper.stop();
        }
    } 
    else if (cmd.startsWith("PLAY ")) {
        uint16_t track = cmd.substring(5).toInt();
        audio.playTrack(track);
    } 
    else if (cmd.startsWith("VOL ")) {
        uint8_t vol = cmd.substring(4).toInt();
        audio.setVolume(vol);
    }
}