:: path: D:\Sync\Branch - Varis Gear\packages\sync_packages.bat
@echo off
setlocal enabledelayedexpansion

:: Cấu hình đường dẫn
set "PACKAGES_ROOT=D:\My Drive\AIoT Lab\packages"
set "ARDUINO_LIBS=%USERPROFILE%\Documents\Arduino\libraries"

echo --- DANG QUET VA DONG BO PACKAGES ---

if not exist "%ARDUINO_LIBS%" (
    mkdir "%ARDUINO_LIBS%"
)

:: ============================================================================
:: [CHANGES HIGHLIGHT / BROKEN LINK CLEANUP]
:: Chuyển đổi logic quét ReparsePoint của PowerShell sang CMD Batch.
:: Sử dụng 'dir /b /al' để chỉ liệt kê Junction Links.
:: Tự động xóa link nếu thư mục đích ở ổ D không còn tồn tại.
:: ============================================================================
for /f "tokens=*" %%D in ('dir /b /al "%ARDUINO_LIBS%" 2^>nul') do (
    if not exist "%ARDUINO_LIBS%\%%D\*" (
        rmdir "%ARDUINO_LIBS%\%%D"
        echo [CLEANUP] Da xoa Junction Link hong: %%D
    )
)
:: ============================================================================

:: ============================================================================
:: [CHANGES HIGHLIGHT / SCAN AND LINK]
:: Sử dụng 'for /R' để quét đệ quy file library.properties ở mọi cấp thư mục con.
:: Trích xuất tên thư mục chứa và tạo Junction Link bằng 'mklink /J'.
:: ============================================================================
for /R "%PACKAGES_ROOT%" %%F in (library.properties) do (
    if exist "%%F" (
        for %%I in ("%%~dpF.") do (
            set "PKG_FOLDER=%%~fI"
            set "PKG_NAME=%%~nxI"
        )
        
        set "TARGET_LINK=%ARDUINO_LIBS%\!PKG_NAME!"

        if not exist "!TARGET_LINK!" (
            mklink /J "!TARGET_LINK!" "!PKG_FOLDER!" >nul
            echo [LINKED]  !PKG_NAME! ^(!PKG_FOLDER!^)
        ) else (
            echo [SKIP]    !PKG_NAME! da duoc lien ket tu truoc.
        )
    )
)
:: ============================================================================

echo --- HOAN TAT DONG BO ---