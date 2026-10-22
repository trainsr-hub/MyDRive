// path: D:/Sync/Branch - Varis Gear/packages/sensor/distance/Srf05Sensor/src/Srf05Sensor.cpp
#include "Srf05Sensor.h"

Srf05Sensor* Srf05Sensor::instance = nullptr;

void IRAM_ATTR Srf05Sensor::isrHandler() {
    if (instance == nullptr) return;

    if (digitalRead(instance->gpioPin) == HIGH) {
        instance->echoStart = micros();
    } else {
        instance->echoEnd = micros();
        instance->newData = true;
        instance->measuring = false;
    }
}

Srf05Sensor::Srf05Sensor(uint8_t pin) {
    gpioPin = pin;
    echoStart = 0;
    echoEnd = 0;
    newData = false;
    measuring = false;
    sampleIndex = 0;
    lastTrigger = 0;
    isAttached = false;

    for (int i = 0; i < 3; i++) {
        samples[i] = 999.0f;
    }
}

void Srf05Sensor::begin() {
    instance = this;
    pinMode(gpioPin, INPUT);
}

void Srf05Sensor::triggerInternal() {
    if (measuring) {
        if (micros() - echoStart > 30000) {
            measuring = false;
        } else {
            return;
        }
    }

    if (isAttached) {
        detachInterrupt(digitalPinToInterrupt(gpioPin));
        isAttached = false;
    }

    pinMode(gpioPin, OUTPUT);
    digitalWrite(gpioPin, LOW);
    delayMicroseconds(2);
    digitalWrite(gpioPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(gpioPin, LOW);

    pinMode(gpioPin, INPUT);
    measuring = true;
    
    // Xóa cờ dữ liệu cũ tránh đọc nhầm xung nhiễu từ lần đo trước
    newData = false; 
    attachInterrupt(digitalPinToInterrupt(gpioPin), isrHandler, CHANGE);
    isAttached = true;
}

float Srf05Sensor::getDistance() {
    if (millis() - lastTrigger >= 40) { // Tăng nhẹ interval lên 40ms để sóng âm phân tán hết
        triggerInternal();
        lastTrigger = millis();
    }

    if (newData) {
        if (echoEnd > echoStart) {
            long duration = echoEnd - echoStart;
            float dist = (duration * 0.0343f) / 2.0f;

            // =========================================================================
            // LỌC NHIỄU ĐỘNG CƠ:
            // Cảm biến SRF05 mù ở khoảng < 3cm (xung < 175us).
            // Mọi giá trị dist < 3.0f (bao gồm cả lỗi 1.7cm ~ 100us) đều do nhiễu EMI
            // từ PWM động cơ và sẽ bị loại bỏ hoàn toàn, không nạp vào mảng samples.
            // =========================================================================
            if (dist >= 3.0f && dist <= 400.0f) {
                samples[sampleIndex] = dist;
                sampleIndex = (sampleIndex + 1) % 3;
            }
        }
        newData = false;
    }

    // Lấy trung vị (Median Filter) từ 3 mẫu gần nhất hợp lệ
    float sorted[3];
    for (int i = 0; i < 3; i++) {
        sorted[i] = samples[i];
    }

    for (int i = 0; i < 2; i++) {
        for (int j = i + 1; j < 3; j++) {
            if (sorted[i] > sorted[j]) {
                float temp = sorted[i];
                sorted[i] = sorted[j];
                sorted[j] = temp;
            }
        }
    }

    return sorted[1];
}