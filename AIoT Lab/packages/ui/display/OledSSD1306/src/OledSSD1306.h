// D:/Sync/Branch - Varis Gear/packages/display/OledSSD1306/src/OledSSD1306.h
#ifndef OLED_SSD1306_H
#define OLED_SSD1306_H

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

/*
********************************************************************************
* [PACKAGE DESIGN / CLASS DEFINITION]
* Đóng gói toàn bộ logic khởi tạo và giao tiếp SSD1306 vào Class OledSSD1306.
********************************************************************************
*/
class OledSSD1306 {
private:
    Adafruit_SSD1306* display;
    uint16_t width;
    uint16_t height;

public:
    OledSSD1306(uint16_t w = 128, uint16_t h = 64);
    ~OledSSD1306();

    bool begin(int sdaPin, int sclPin, uint8_t address = 0x3C, uint32_t frequency = 100000);
    void clear();
    void printText(const String& text, int16_t x = 0, int16_t y = 0, uint8_t textSize = 1);
    void show();
    Adafruit_SSD1306* getDriver();
};

#endif