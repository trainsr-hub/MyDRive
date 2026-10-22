// path: D:/Sync/Branch - Varis Gear/packages/sensor/distance/Srf05Sensor/src/Srf05Sensor.h
#ifndef SRF05_SENSOR_H
#define SRF05_SENSOR_H

#include <Arduino.h>

class Srf05Sensor {
private:
    uint8_t gpioPin;
    volatile unsigned long echoStart;
    volatile unsigned long echoEnd;
    volatile bool newData;
    volatile bool measuring;

    /*
    ********************************************************************************
    * [CHANGES HIGHLIGHT / ISR FLAG ADDITION]
    * Bổ sung biến isAttached để theo dõi trạng thái khởi tạo ngắt GPIO.
    ********************************************************************************
    */
    bool isAttached;

    float samples[3];
    int sampleIndex;
    unsigned long lastTrigger;

    static Srf05Sensor* instance;
    static void IRAM_ATTR isrHandler();

    void triggerInternal();

public:
    explicit Srf05Sensor(uint8_t pin = 32);
    void begin();
    float getDistance();
};

#endif