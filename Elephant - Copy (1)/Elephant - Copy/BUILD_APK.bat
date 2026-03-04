@echo off
echo ========================================
echo Elephant Detection App - Building APK
echo ========================================
echo.
echo This will build a production-ready APK for Android
echo.
echo Prerequisites:
echo - Expo account (create at expo.dev)
echo - Internet connection
echo.
pause
echo.
echo Step 1: Installing EAS CLI...
call npm install -g eas-cli
echo.
echo Step 2: Logging in to Expo...
call eas login
echo.
echo Step 3: Configuring build...
call eas build:configure
echo.
echo Step 4: Building APK...
call eas build -p android --profile preview
echo.
echo ========================================
echo Build complete! 
echo Download link will appear above.
echo Transfer APK to your phone and install.
echo ========================================
pause
