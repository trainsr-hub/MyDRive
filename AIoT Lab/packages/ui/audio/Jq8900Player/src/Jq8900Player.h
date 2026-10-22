// path: D:/Sync/Branch - Varis Gear/packages/audio/Jq8900Player/src/Jq8900Player.h
#ifndef JQ8900_PLAYER_H
#define JQ8900_PLAYER_H

#include <Arduino.h>

/*
********************************************************************************
* [CHANGES HIGHLIGHT / CLASS DESIGN]
* Chuyển đổi từ các hàm C rời rạc (audio_init, audio_play_track, audio_stop)
* thành C++ Class Oop Jq8900Player. Cho phép truyền động HardwareSerial và chân TX/RX.
********************************************************************************
*/
class Jq8900Player {
private:
    HardwareSerial* _serial;
    int8_t _txPin;
    int8_t _rxPin;

    void sendCommand(uint8_t* cmd, uint8_t len);

public:
    Jq8900Player(HardwareSerial& serial = Serial2);
    
    void begin(int8_t txPin, int8_t rxPin = -1, uint32_t baud = 9600);
    void playTrack(uint16_t trackNumber);
    void stop();
    void setVolume(uint8_t volume);
};

#endif