// path: D:/Sync/Branch - Varis Gear/packages/gamepad/BluepadController/src/BluepadController.h
#ifndef BLUEPAD_CONTROLLER_H
#define BLUEPAD_CONTROLLER_H

#include <Arduino.h>
#include <Bluepad32.h>

/*
********************************************************************************
* [PACKAGE DESIGN / CLASS DEFINITION]
* Đóng gói toàn bộ logic quản lý kết nối Bluetooth Gamepad từ Bluepad32.
* Sử dụng con trỏ Singleton tĩnh để liên kết C-callback của Bluepad32 với C++ Class.
********************************************************************************
*/
class BluepadController {
private:
    static BluepadController* instance;
    ControllerPtr myControllers[BP32_MAX_GAMEPADS];
    
    bool bluetoothConnected;
    int connectedControllerIndex;
    String currentButtons;
    String currentDpad;

    static void onConnectedStatic(ControllerPtr ctl);
    static void onDisconnectedStatic(ControllerPtr ctl);

    void onConnected(ControllerPtr ctl);
    void onDisconnected(ControllerPtr ctl);
    void processGamepad(ControllerPtr ctl);

public:
    BluepadController();
    void begin();
    void update();

    bool isConnected() const;
    int getConnectedIndex() const;
    String getButtons() const;
    String getDpad() const;
};

#endif