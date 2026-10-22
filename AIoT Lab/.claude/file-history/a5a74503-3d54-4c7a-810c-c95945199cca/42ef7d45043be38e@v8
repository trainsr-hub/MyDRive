#pragma once
#define LGFX_USE_V1
#include <LovyanGFX.hpp>
#include "pins.h"

// 1.9" ST7789 170x320 (panel RAM is 240x320, visible window offset by 35 columns)
class LGFX : public lgfx::LGFX_Device {
  lgfx::Panel_ST7789 _panel;
  lgfx::Bus_SPI _bus;

public:
  LGFX() {
    {
      auto cfg = _bus.config();
      cfg.spi_host = SPI2_HOST;
      cfg.spi_mode = 3;            // Mode 3 required when CS is tied to GND (SCLK idles HIGH)
      cfg.freq_write = 12000000;   // 12MHz safe, rock-solid speed for jumper wires
      cfg.freq_read = 4000000;
      cfg.spi_3wire = false;       // 4-wire SPI (SCK, MOSI, DC)
      cfg.use_lock = true;
      cfg.dma_channel = 0;         // Disable DMA: eliminate DMA descriptor lockups & FreeRTOS deadlocks
      cfg.pin_sclk = PIN_LCD_SCK;
      cfg.pin_mosi = PIN_LCD_MOSI;
      cfg.pin_miso = -1;
      cfg.pin_dc = PIN_LCD_DC;
      _bus.config(cfg);
      _panel.setBus(&_bus);
    }
    {
      auto cfg = _panel.config();
      cfg.pin_cs = -1;  // tied to GND
      cfg.pin_rst = PIN_LCD_RST;
      cfg.pin_busy = -1;
      cfg.panel_width = 170;
      cfg.panel_height = 320;
      cfg.offset_x = 35;
      cfg.offset_y = 0;
      cfg.offset_rotation = 0;
      cfg.readable = false;
      cfg.invert = true;
      cfg.rgb_order = false;
      cfg.bus_shared = false;
      _panel.config(cfg);
    }
    setPanel(&_panel);
  }
};
