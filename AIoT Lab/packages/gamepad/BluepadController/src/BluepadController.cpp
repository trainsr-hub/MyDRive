// path: D:/Sync/Branch - Varis Gear/packages/gamepad/BluepadController/src/BluepadController.cpp
#include "BluepadController.h"

BluepadController* BluepadController::instance = nullptr;

/*
********************************************************************************
* [IMPLEMENTATION / CONSTRUCTOR & CALLBACKS]
* Ánh xạ callback tĩnh của Bluepad32 tới phương thức nội bộ của đối tượng Class.
********************************************************************************
*/
BluepadController::BluepadController() {
    instance = this;
    bluetoothConnected = false;
    connectedControllerIndex = -1;
    currentButtons = "--";
    currentDpad = "--";
    
    for (int i = 0; i < BP32_MAX_GAMEPADS; i++) {
        myControllers[i] = nullptr;
    }
}

void BluepadController::onConnectedStatic(ControllerPtr ctl) {
    if (instance) instance->onConnected(ctl);
}

void BluepadController::onDisconnectedStatic(ControllerPtr ctl) {
    if (instance) instance->onDisconnected(ctl);
}

void BluepadController::begin() {
    BP32.setup(&onConnectedStatic, &onDisconnectedStatic);
}

void BluepadController::onConnected(ControllerPtr ctl) {
    for (int i = 0; i < BP32_MAX_GAMEPADS; i++) {
        if (myControllers[i] == nullptr) {
            myControllers[i] = ctl;
            bluetoothConnected = true;
            connectedControllerIndex = i;

            Serial.println("\n================================");
            Serial.println("Bluetooth Controller Connected");
            Serial.print("Controller Index: ");
            Serial.println(i);

            ControllerProperties properties = ctl->getProperties();
            Serial.print("Model: ");
            Serial.println(ctl->getModelName());
            Serial.printf("VID: 0x%04X | PID: 0x%04X\n", properties.vendor_id, properties.product_id);
            Serial.println("================================");
            break;
        }
    }
}

void BluepadController::onDisconnected(ControllerPtr ctl) {
    for (int i = 0; i < BP32_MAX_GAMEPADS; i++) {
        if (myControllers[i] == ctl) {
            myControllers[i] = nullptr;
            Serial.println("\n================================");
            Serial.println("Bluetooth Controller Disconnected");
            Serial.print("Controller Index: ");
            Serial.println(i);
            Serial.println("================================");
            break;
        }
    }

    bluetoothConnected = false;
    connectedControllerIndex = -1;
    currentButtons = "--";
    currentDpad = "--";
}

void BluepadController::processGamepad(ControllerPtr ctl) {
    String buttons = "";
    String dpad = "";

    if (ctl->a())  buttons += "A ";
    if (ctl->b())  buttons += "B ";
    if (ctl->x())  buttons += "X ";
    if (ctl->y())  buttons += "Y ";

    if (ctl->l1()) buttons += "L1 ";
    if (ctl->r1()) buttons += "R1 ";
    if (ctl->l2()) buttons += "L2 ";
    if (ctl->r2()) buttons += "R2 ";

    if (ctl->miscButtons()) buttons += "MISC ";

    uint8_t dpadValue = ctl->dpad();
    if (dpadValue & 0x01) dpad += "U ";
    if (dpadValue & 0x02) dpad += "D ";
    if (dpadValue & 0x04) dpad += "R ";
    if (dpadValue & 0x08) dpad += "L ";

    if (buttons.length() == 0) buttons = "--";
    if (dpad.length() == 0) dpad = "--";

    currentButtons = buttons;
    currentDpad = dpad;
}

void BluepadController::update() {
    BP32.update();

    bool foundController = false;

    for (int i = 0; i < BP32_MAX_GAMEPADS; i++) {
        ControllerPtr ctl = myControllers[i];
        if (ctl && ctl->isConnected() && ctl->hasData()) {
            foundController = true;
            bluetoothConnected = true;
            connectedControllerIndex = i;
            processGamepad(ctl);
            break;
        }
    }

    if (!foundController) {
        bool actuallyConnected = false;
        for (int i = 0; i < BP32_MAX_GAMEPADS; i++) {
            if (myControllers[i] && myControllers[i]->isConnected()) {
                actuallyConnected = true;
                connectedControllerIndex = i;
                break;
            }
        }

        bluetoothConnected = actuallyConnected;
        if (!actuallyConnected) {
            currentButtons = "--";
            currentDpad = "--";
            connectedControllerIndex = -1;
        }
    }
}

bool BluepadController::isConnected() const { return bluetoothConnected; }
int BluepadController::getConnectedIndex() const { return connectedControllerIndex; }
String BluepadController::getButtons() const { return currentButtons; }
String BluepadController::getDpad() const { return currentDpad; }