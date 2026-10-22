// path: src/main.ino
#include <Tb6612Driver.h>

/*
********************************************************************************
* [CHANGES HIGHLIGHT / MAIN DEMO]
* Khai báo cấu hình chân GPIO và thông số PWM bên ngoài file main.ino.
* Điều khiển động cơ TB6612 linh hoạt, hỗ trợ đảo chiều và phanh thắng.
********************************************************************************
*/

// Định nghĩa cấu hình chân linh hoạt (Không bị hàn cứng)
Tb6612Pins motorPins = {
    .stby = 33,
    .in1L = 25,
    .in2L = 26,
    .pwmL = 27,
    .in1R = 14,
    .in2R = 12,
    .pwmR = 13
};

// Định nghĩa thông số PWM (Tần số 20kHz, độ phân giải 8-bit, Kênh L=0, Kênh R=1)
Tb6612PwmConfig motorPwmConfig = {
    .frequency = 20000,
    .resolution = 8,
    .channelL = 0,
    .channelR = 1
};

Tb6612Driver motors(motorPins, motorPwmConfig);

void setup() {
    Serial.begin(115200);

    // Khởi tạo motor driver
    motors.begin();

    // Giới hạn tốc độ PWM tối đa cho xe (Base: 50, MaxDrive: 200, AbsMax: 255)
    motors.setPwmLimits(50, 200, 255);

    Serial.println("TB6612 Motor Driver Package Ready.");

    // Chạy tiến 50% công suất
    Serial.println("Moving forward...");
    motors.drive(150, 150);
    delay(2000);

    // Phanh gấp
    Serial.println("Braking...");
    motors.brake();
    delay(1000);

    // Chạy lùi 50% công suất
    Serial.println("Moving backward...");
    motors.drive(-150, -150);
    delay(2000);

    // Dừng motor và chuyển sang Standby ngắt nguồn
    Serial.println("Standby...");
    motors.standby();
}

void loop() {
}