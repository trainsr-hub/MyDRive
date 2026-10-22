// path: D:/Sync/Branch - Varis Gear/packages/audio/Jq8900Player/src/Jq8900Player.cpp
#include "Jq8900Player.h"

Jq8900Player::Jq8900Player(HardwareSerial& serial) {
    _serial = &serial;
    _txPin = -1;
    _rxPin = -1;
}

/*
********************************************************************************
* [CHANGES HIGHLIGHT / INIT LOGIC]
* Thay thế hàm audio_init() cứng nhắc bằng begin(). 
* Cho phép cấu hình linh hoạt chân TX, RX và Serial Port.
********************************************************************************
*/
void Jq8900Player::begin(int8_t txPin, int8_t rxPin, uint32_t baud) {
    _txPin = txPin;
    _rxPin = rxPin;
    _serial->begin(baud, SERIAL_8N1, _rxPin, _txPin);
}

/*
********************************************************************************
* [CHANGES HIGHLIGHT / COMMAND EXECUTION]
* Tách hàm gửi lệnh dùng chung, đóng gói logic truyền dữ liệu qua UART.
********************************************************************************
*/
void Jq8900Player::sendCommand(uint8_t* cmd, uint8_t len) {
    _serial->write(cmd, len);
}

/*
********************************************************************************
* [CHANGES HIGHLIGHT / TRACK PLAYBACK]
* Chuyển đổi audio_play_track(trackNumber) thành phương thức Class playTrack().
********************************************************************************
*/
void Jq8900Player::playTrack(uint16_t trackNumber) {
    uint8_t cmd[6] = {0xAA, 0x07, 0x02, (uint8_t)(trackNumber >> 8), (uint8_t)(trackNumber & 0xFF), 0};
    cmd[5] = (cmd[0] + cmd[1] + cmd[2] + cmd[3] + cmd[4]) & 0xFF; 
    sendCommand(cmd, 6);
}

/*
********************************************************************************
* [CHANGES HIGHLIGHT / STOP PLAYBACK]
* Chuyển đổi audio_stop() thành phương thức Class stop().
********************************************************************************
*/
void Jq8900Player::stop() {
    uint8_t cmd[4] = {0xAA, 0x04, 0x00, 0xAE};
    sendCommand(cmd, 4);
}

/*
********************************************************************************
* [CHANGES HIGHLIGHT / FEATURE ADDITION]
* Bổ sung hàm chỉnh âm lượng (0 - 30) chuẩn lệnh Hex JQ8900 (0xAA, 0x13).
********************************************************************************
*/
void Jq8900Player::setVolume(uint8_t volume) {
    if (volume > 30) volume = 30;
    uint8_t cmd[5] = {0xAA, 0x13, 0x01, volume, 0};
    cmd[4] = (cmd[0] + cmd[1] + cmd[2] + cmd[3]) & 0xFF;
    sendCommand(cmd, 5);
}