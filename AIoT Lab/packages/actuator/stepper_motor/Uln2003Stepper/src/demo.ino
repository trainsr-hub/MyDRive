// path: src/main.ino
#include <Uln2003Stepper.h>

/*
********************************************************************************
* [CHANGES HIGHLIGHT / MAIN DEMO]
* Khởi tạo đối tượng Uln2003Stepper với 4 chân GPIO linh hoạt (23, 19, 18, 5).
* Điều khiển động cơ quay tới vị trí đích và in vị trí ra Serial.
********************************************************************************
*/

// Khai báo chân IN1, IN2, IN3, IN4 nối với ULN2003
Uln2003Stepper stepper(15, 2, 4, 16);

void setup() {
    Serial.begin(115200);
    stepper.begin();
    
    Serial.println("ULN2003 Stepper Motor Package Ready.");
    
    // Chạy tới vị trí 2048 bước (quay ~1 vòng)
    Serial.println("Moving to position 2048...");
    stepper.setTarget(2048);
    Serial.printf("Target reached! Current pos: %d\n", stepper.getCurrentPosition());

    delay(1000);

    // Chạy lùi về vị trí 0
    Serial.println("Moving back to position 0...");
    stepper.setTarget(0);
    Serial.printf("Target reached! Current pos: %d\n", stepper.getCurrentPosition());
}

void loop() {
    // Không cần xử lý liên tục trong loop() do setTarget() là blocking
}