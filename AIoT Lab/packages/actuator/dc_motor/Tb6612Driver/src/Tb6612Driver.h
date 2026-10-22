// path: D:/Sync/Branch - Varis Gear/packages/actuator/dc_motor/Tb6612Driver/src/Tb6612Driver.h
#ifndef TB6612_DRIVER_H
#define TB6612_DRIVER_H

#include <Arduino.h>

/*
********************************************************************************
* [PACKAGE DESIGN / CLASS DEFINITION]
* Đóng gói mạch điều khiển động cơ kép TB6612FNG.
* Loại bỏ hoàn toàn macro #define và biến extern hardcode. Tất cả chân GPIO,
* kênh LEDC PWM, tần số và giới hạn tốc độ đều được cấu hình qua Constructor/Setter.
********************************************************************************
*/

struct Tb6612Pins {
    uint8_t stby;
    uint8_t in1L;
    uint8_t in2L;
    uint8_t pwmL;
    uint8_t in1R;
    uint8_t in2R;
    uint8_t pwmR;
};

struct Tb6612PwmConfig {
    uint32_t frequency;
    uint8_t resolution;
    uint8_t channelL;
    uint8_t channelR;
};

class Tb6612Driver {
private:
    Tb6612Pins pins;
    Tb6612PwmConfig pwmConfig;

    int maxPwmVal;
    int driveMaxPwm;
    int basePwm;

    void applyMotorL(int speed);
    void applyMotorR(int speed);

public:
    Tb6612Driver(Tb6612Pins pinsConfig, 
                 Tb6612PwmConfig pwmConf = {20000, 8, 0, 1});

    void begin();
    
    void setPwmLimits(int basePwmVal, int maxDrivePwm, int absoluteMaxPwm = 255);
    void setSpeedL(int speed);
    void setSpeedR(int speed);
    void drive(int speedL, int speedR);

    void enable();
    void standby();
    void brake();
};

#endif