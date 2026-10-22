// path: D:/Sync/Branch - Varis Gear/packages/actuator/dc_motor/Tb6612Driver/src/Tb6612Driver.cpp
#include "Tb6612Driver.h"

/*
********************************************************************************
* [IMPLEMENTATION / CONSTRUCTOR & SETUP]
* Khởi tạo cấu hình linh hoạt. Mặc định tần số PWM 20kHz, độ phân giải 8-bit (0-255).
********************************************************************************
*/
Tb6612Driver::Tb6612Driver(Tb6612Pins pinsConfig, Tb6612PwmConfig pwmConf) {
    pins = pinsConfig;
    pwmConfig = pwmConf;

    maxPwmVal = (1 << pwmConfig.resolution) - 1; // 255 nếu 8-bit
    driveMaxPwm = maxPwmVal;
    basePwm = 0;
}

void Tb6612Driver::begin() {
    pinMode(pins.stby, OUTPUT);
    pinMode(pins.in1L, OUTPUT);
    pinMode(pins.in2L, OUTPUT);
    pinMode(pins.in1R, OUTPUT);
    pinMode(pins.in2R, OUTPUT);

    // =========================================================================
    // NÂNG CẤP CORE 3.X: Thay thế ledcSetup + ledcAttachPin bằng ledcAttach
    // API mới tự động quản lý Channel, chỉ cần truyền (GPIO, Frequency, Resolution)
    // =========================================================================
    ledcAttach(pins.pwmL, pwmConfig.frequency, pwmConfig.resolution);
    ledcAttach(pins.pwmR, pwmConfig.frequency, pwmConfig.resolution);

    standby();
}

/*
********************************************************************************
* [CHANGES HIGHLIGHT / DYNAMIC PARAMETERS & LIMITS]
********************************************************************************
*/
void Tb6612Driver::setPwmLimits(int basePwmVal, int maxDrivePwm, int absoluteMaxPwm) {
    basePwm = basePwmVal;
    driveMaxPwm = maxDrivePwm;
    maxPwmVal = absoluteMaxPwm;
}

void Tb6612Driver::enable() {
    digitalWrite(pins.stby, HIGH);
}

void Tb6612Driver::standby() {
    digitalWrite(pins.stby, LOW);
}

/*
********************************************************************************
* [CHANGES HIGHLIGHT / MOTOR DIRECTION & PWM CONTROL]
* NÂNG CẤP CORE 3.X: ledcWrite() giờ đây nhận tham số đầu vào là Chân PIN (pins.pwmL)
* thay vì truyền Channel như bản 2.x cũ.
********************************************************************************
*/
void Tb6612Driver::applyMotorL(int speed) {
    speed = constrain(speed, -driveMaxPwm, driveMaxPwm);

    if (speed > 0) {
        digitalWrite(pins.in1L, HIGH);
        digitalWrite(pins.in2L, LOW);
        ledcWrite(pins.pwmL, speed);
    } else if (speed < 0) {
        digitalWrite(pins.in1L, LOW);
        digitalWrite(pins.in2L, HIGH);
        ledcWrite(pins.pwmL, -speed);
    } else {
        digitalWrite(pins.in1L, LOW);
        digitalWrite(pins.in2L, LOW);
        ledcWrite(pins.pwmL, 0);
    }
}

void Tb6612Driver::applyMotorR(int speed) {
    speed = constrain(speed, -driveMaxPwm, driveMaxPwm);

    if (speed > 0) {
        digitalWrite(pins.in1R, HIGH);
        digitalWrite(pins.in2R, LOW);
        ledcWrite(pins.pwmR, speed);
    } else if (speed < 0) {
        digitalWrite(pins.in1R, LOW);
        digitalWrite(pins.in2R, HIGH);
        ledcWrite(pins.pwmR, -speed);
    } else {
        digitalWrite(pins.in1R, LOW);
        digitalWrite(pins.in2R, LOW);
        ledcWrite(pins.pwmR, 0);
    }
}

void Tb6612Driver::setSpeedL(int speed) {
    enable();
    applyMotorL(speed);
}

void Tb6612Driver::setSpeedR(int speed) {
    enable();
    applyMotorR(speed);
}

void Tb6612Driver::drive(int speedL, int speedR) {
    enable();
    applyMotorL(speedL);
    applyMotorR(speedR);
}

void Tb6612Driver::brake() {
    digitalWrite(pins.in1L, HIGH);
    digitalWrite(pins.in2L, HIGH);
    digitalWrite(pins.in1R, HIGH);
    digitalWrite(pins.in2R, HIGH);
    ledcWrite(pins.pwmL, maxPwmVal);
    ledcWrite(pins.pwmR, maxPwmVal);
}