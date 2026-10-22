// path: D:/Sync/Branch - Varis Gear/packages/actuator/stepper_motor/Uln2003Stepper/src/Uln2003Stepper.cpp
#include "Uln2003Stepper.h"

const float Uln2003Stepper::START_FREQ_CW = 300.0f;
const float Uln2003Stepper::TARGET_FREQ_CW = 450.0f;
const float Uln2003Stepper::RAMP_STEP_HZ = 2.0f;
const float Uln2003Stepper::FREQ_CCW = 450.0f;

const int Uln2003Stepper::stepMatrixFullStep[4][4] = {
    {1, 1, 0, 0},
    {0, 1, 1, 0},
    {0, 0, 1, 1},
    {1, 0, 0, 1}
};

Uln2003Stepper::Uln2003Stepper(uint8_t in1, uint8_t in2, uint8_t in3, uint8_t in4) {
    pinIn1 = in1;
    pinIn2 = in2;
    pinIn3 = in3;
    pinIn4 = in4;
    currentStepperPos = 0;
    currentFreqHz = START_FREQ_CW;
    mode = STEPPER_IDLE;
    lastStepMicros = 0;
}

void Uln2003Stepper::begin() {
    pinMode(pinIn1, OUTPUT);
    pinMode(pinIn2, OUTPUT);
    pinMode(pinIn3, OUTPUT);
    pinMode(pinIn4, OUTPUT);
    stopCoils();
}

void Uln2003Stepper::applyStep(int stepIndex) {
    digitalWrite(pinIn1, stepMatrixFullStep[stepIndex][0]);
    digitalWrite(pinIn2, stepMatrixFullStep[stepIndex][1]);
    digitalWrite(pinIn3, stepMatrixFullStep[stepIndex][2]);
    digitalWrite(pinIn4, stepMatrixFullStep[stepIndex][3]);
}

void Uln2003Stepper::stopCoils() {
    digitalWrite(pinIn1, LOW);
    digitalWrite(pinIn2, LOW);
    digitalWrite(pinIn3, LOW);
    digitalWrite(pinIn4, LOW);
}

void Uln2003Stepper::rotateCW() {
    if (mode != STEPPER_ROTATE_CW) {
        currentFreqHz = START_FREQ_CW; // Reset tần số đề-ba mượt khi bắt đầu hoặc đổi chiều
        lastStepMicros = micros();
        mode = STEPPER_ROTATE_CW;
    }
}

void Uln2003Stepper::rotateCCW() {
    if (mode != STEPPER_ROTATE_CCW) {
        currentFreqHz = START_FREQ_CW; // Reset tần số đề-ba mượt khi bắt đầu hoặc đổi chiều
        lastStepMicros = micros();
        mode = STEPPER_ROTATE_CCW;
    }
}

void Uln2003Stepper::stop() {
    if (mode != STEPPER_IDLE) {
        mode = STEPPER_IDLE;
        stopCoils();
        currentFreqHz = START_FREQ_CW;
    }
}

void Uln2003Stepper::update() {
    if (mode == STEPPER_IDLE) return;

    unsigned long now = micros();
    // Áp dụng Ramping tần số chung cho cả CW lẫn CCW
    unsigned long intervalMicros = (unsigned long)(1000000.0f / currentFreqHz);

    if (now - lastStepMicros >= intervalMicros) {
        lastStepMicros = now;

        if (mode == STEPPER_ROTATE_CW) {
            currentStepperPos++;
        } else if (mode == STEPPER_ROTATE_CCW) {
            currentStepperPos--;
        }

        // Tăng tốc dần đều lên TARGET_FREQ_CW
        if (currentFreqHz < TARGET_FREQ_CW) {
            currentFreqHz += RAMP_STEP_HZ;
            if (currentFreqHz > TARGET_FREQ_CW) currentFreqHz = TARGET_FREQ_CW;
        }

        int stepIndex = (currentStepperPos % 4 + 4) % 4;
        applyStep(stepIndex);
    }
}

bool Uln2003Stepper::isMoving() const {
    return (mode != STEPPER_IDLE);
}

int Uln2003Stepper::getCurrentPosition() const {
    return currentStepperPos;
}