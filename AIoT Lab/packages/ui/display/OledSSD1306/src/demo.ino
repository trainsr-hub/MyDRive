// src/main.ino
#include <OledSSD1306.h>

OledSSD1306 oled(128, 64);

void setup() {
    Serial.begin(115200);

    // Cấu hình linh hoạt: SDA = 21, SCL = 47 (hoặc đổi thành bất kỳ chân nào trên board khác)
    if (!oled.begin(19, 18, 0x3C)) {
        Serial.println("Loi khoi tao màn hình OLED!");
        return;
    }

    oled.clear();
    oled.printText("Varis Gear Package", 0, 0, 1);
    oled.printText("Dinh tuyen linh hoat", 0, 16, 1);
    oled.printText("SDA: 21 | SCL: 47", 0, 32, 1);
    oled.show();
}

void loop() {
    // Không làm gì thêm
}