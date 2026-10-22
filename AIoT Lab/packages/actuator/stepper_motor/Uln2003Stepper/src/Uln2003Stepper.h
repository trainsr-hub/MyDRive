// path: D:/Sync/Branch - Varis Gear/packages/actuator/stepper_motor/Uln2003Stepper/src/Uln2003Stepper.h
#ifndef ULN2003_STEPPER_H
#define ULN2003_STEPPER_H

#include <Arduino.h>

enum StepperMode {
    STEPPER_IDLE = 0,
    STEPPER_ROTATE_CW,
    STEPPER_ROTATE_CCW
};

class Uln2003Stepper {
private:
    uint8_t pinIn1, pinIn2, pinIn3, pinIn4;
    int currentStepperPos;
    float currentFreqHz;
    StepperMode mode;
    unsigned long lastStepMicros;

    static const float START_FREQ_CW;
    static const float TARGET_FREQ_CW;
    static const float RAMP_STEP_HZ;
    static const float FREQ_CCW;
    static const int stepMatrixFullStep[4][4];

    void applyStep(int stepIndex);

public:
    Uln2003Stepper(uint8_t in1, uint8_t in2, uint8_t in3, uint8_t in4);
    void begin();
    
    // Các hàm điều khiển trạng thái
    void rotateCW();
    void rotateCCW();
    void stop();
    
    // Gọi liên tục trong loop() để phát xung non-blocking
    void update();

    void stopCoils();
    bool isMoving() const;
    int getCurrentPosition() const;
};

#endif