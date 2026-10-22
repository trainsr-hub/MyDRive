// path: src/main.ino
#include <Arduino.h>
#include <Jq8900Player.h>

/*
********************************************************************************
* [CHANGES HIGHLIGHT / REFACTOR]
* Thay thế bao gồm config.h và các hàm C toàn cục bằng Class Jq8900Player.
********************************************************************************
*/

#define JQ8900_TX_PIN 17

Jq8900Player audio(Serial2);

void setup() {
    Serial.begin(115200);

    // Khởi tạo audio player truyền chân TX linh hoạt
    audio.begin(JQ8900_TX_PIN);

    // Chỉnh âm lượng mức 20
    audio.setVolume(20);

    // Phát bài nhạc số 1
    audio.playTrack(1);
}

void loop() {
    // Logic dự án
}