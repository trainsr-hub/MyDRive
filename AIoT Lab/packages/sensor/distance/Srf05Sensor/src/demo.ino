// path: src/main.ino
#include <Srf05Sensor.h>

/*
********************************************************************************
* [CHANGES HIGHLIGHT / MAIN DEMO]
* Loại bỏ hoàn toàn các biến volatile, hàm ISR và logic bóp cò thủ công.
* Gọi package Srf05Sensor, khởi tạo chân 32 và in kết quả ra Serial.
********************************************************************************
*/

Srf05Sensor distanceSensor(32);

unsigned long lastPrintTime = 0;
const unsigned long PRINT_INTERVAL = 100;

void setup() {
    Serial.begin(115200);
    distanceSensor.begin();
    Serial.println("SRF05 Distance Sensor Ready.");
}

void loop() {
    float distance = distanceSensor.getDistance();

    if (millis() - lastPrintTime >= PRINT_INTERVAL) {
        lastPrintTime = millis();
        Serial.print("Distance: ");
        Serial.print(distance, 2);
        Serial.println(" cm");
    }
}