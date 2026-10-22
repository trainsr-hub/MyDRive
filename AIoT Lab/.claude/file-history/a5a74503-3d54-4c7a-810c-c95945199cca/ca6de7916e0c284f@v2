#ifndef JQ8900_PLAYER_H
#define JQ8900_PLAYER_H

#include <Arduino.h>

class Jq8900Player {
private:
    HardwareSerial* _serial;
    int8_t _txPin;
    int8_t _rxPin;

    void sendCommand(uint8_t* cmd, uint8_t len);

public:
    Jq8900Player(HardwareSerial& serial = Serial1);

    void begin(int8_t txPin, int8_t rxPin = -1, uint32_t baud = 9600);
    void playTrack(uint16_t trackNumber);
    void stop();
    void setVolume(uint8_t volume);
};

#endif
