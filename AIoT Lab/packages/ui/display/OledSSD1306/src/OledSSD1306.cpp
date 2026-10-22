// D:/Sync/Branch - Varis Gear/packages/display/OledSSD1306/src/OledSSD1306.cpp
#include "OledSSD1306.h"

/*
********************************************************************************
* [PACKAGE DESIGN / IMPLEMENTATION]
* Thực thi phương thức khởi tạo I2C động theo tham số truyền vào (sdaPin, sclPin).
********************************************************************************
*/
OledSSD1306::OledSSD1306(uint16_t w, uint16_t h) {
    width = w;
    height = h;
    display = new Adafruit_SSD1306(width, height, &Wire, -1);
}

OledSSD1306::~OledSSD1306() {
    if (display) {
        delete display;
    }
}

bool OledSSD1306::begin(int sdaPin, int sclPin, uint8_t address, uint32_t frequency) {
    Wire.begin(sdaPin, sclPin);
    Wire.setClock(frequency);

    if (!display->begin(SSD1306_SWITCHCAPVCC, address)) {
        uint8_t altAddress = (address == 0x3C) ? 0x3D : 0x3C;
        if (!display->begin(SSD1306_SWITCHCAPVCC, altAddress)) {
            return false;
        }
    }

    display->clearDisplay();
    display->setTextColor(SSD1306_WHITE);
    display->display();
    return true;
}

void OledSSD1306::clear() {
    if (display) {
        display->clearDisplay();
    }
}

void OledSSD1306::printText(const String& text, int16_t x, int16_t y, uint8_t textSize) {
    if (display) {
        display->setTextSize(textSize);
        display->setCursor(x, y);
        display->println(text);
    }
}

void OledSSD1306::show() {
    if (display) {
        display->display();
    }
}

Adafruit_SSD1306* OledSSD1306::getDriver() {
    return display;
}