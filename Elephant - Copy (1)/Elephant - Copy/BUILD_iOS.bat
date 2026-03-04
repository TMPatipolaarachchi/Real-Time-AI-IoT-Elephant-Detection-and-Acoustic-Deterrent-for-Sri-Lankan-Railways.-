@echo off
echo ========================================
echo Elephant Detection App - iOS Build
echo ========================================
echo.
echo REQUIREMENTS:
echo - Apple Developer Account ($99/year)
echo - Expo account (free at expo.dev)
echo - Internet connection
echo.
echo This will build an iOS app (.ipa file)
echo You can install it via TestFlight or App Store
echo.
pause
echo.
echo Step 1: Installing EAS CLI...
call npm install -g eas-cli
echo.
echo Step 2: Logging in to Expo...
call eas login
echo.
echo Step 3: Configuring build (if needed)...
call eas build:configure
echo.
echo Step 4: Building iOS app...
echo (This will take 15-30 minutes)
call eas build -p ios --profile preview
echo.
echo ========================================
echo Build Options:
echo.
echo For Development Build (TestFlight):
echo   eas build -p ios --profile preview
echo.
echo For App Store Submission:
echo   eas build -p ios --profile production
echo.
echo For Development Device (Ad Hoc):
echo   eas build -p ios --profile development
echo ========================================
echo.
echo Build complete!
echo Check the link above to download your .ipa file
echo.
pause
