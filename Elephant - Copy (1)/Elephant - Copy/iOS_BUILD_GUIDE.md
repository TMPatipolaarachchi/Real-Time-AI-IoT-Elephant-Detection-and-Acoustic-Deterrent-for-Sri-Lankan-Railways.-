# 🍎 iOS Build Guide - Elephant Detection App

## Prerequisites

### 1. Apple Developer Account
- **Cost:** $99/year
- **Sign up:** https://developer.apple.com/programs/
- **Required for:** Installing on physical iOS devices and App Store distribution

### 2. Expo Account
- **Cost:** Free
- **Sign up:** https://expo.dev/signup
- **Required for:** Building the app

---

## 📱 Installation Methods

### Method A: TestFlight (Recommended for Testing)
Build → Upload to App Store Connect → Distribute via TestFlight

### Method B: Ad Hoc Distribution
Build → Install directly on registered devices (up to 100 devices)

### Method C: App Store
Build → Submit for App Store review → Public distribution

---

## 🚀 Build Instructions

### Step 1: Install Dependencies

Open Command Prompt in project folder and run:
```bash
npm install
```

### Step 2: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 3: Login to Expo

```bash
eas login
```
Enter your Expo account credentials.

### Step 4: Configure Build (First Time Only)

```bash
eas build:configure
```

This creates an `eas.json` file with build configurations.

### Step 5: Build for iOS

**For TestFlight Distribution:**
```bash
eas build -p ios --profile preview
```

**For App Store Submission:**
```bash
eas build -p ios --profile production
```

**For Development/Testing on Your Device:**
```bash
eas build -p ios --profile development
```

---

## 📲 Installation Process

### Using TestFlight (Best for Testing):

1. **After build completes**, you'll get a download link
2. **Download the .ipa file**
3. **Upload to App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Create a new app
   - Upload the .ipa using Transporter app
4. **Add testers in TestFlight:**
   - Go to TestFlight section
   - Add internal testers (up to 100)
   - Share link with testers
5. **Testers install:**
   - Install TestFlight app from App Store
   - Open invitation link
   - Install Elephant Detection app

### Using Ad Hoc (Direct Installation):

1. **Register device UDIDs** in Apple Developer Portal
2. **Build with development profile**
3. **Install via:**
   - Xcode → Devices and Simulators
   - Or use tools like Diawi/InstallOnAir

---

## 🔧 Troubleshooting

### Error: "Apple credentials required"
**Solution:** Run `eas credentials` and follow prompts to add Apple Developer credentials

### Error: "No provisioning profile"
**Solution:** EAS will automatically create one. Make sure you're logged in to your Apple Developer account

### Error: "Build failed"
**Solution:** Check the build logs at expo.dev/accounts/[your-account]/projects

---

## 📝 Build Profiles (eas.json)

The app uses these build profiles:

**preview:** For TestFlight distribution
**production:** For App Store submission  
**development:** For testing on specific devices

---

## 💰 Cost Breakdown

| Item | Cost | Required For |
|------|------|-------------|
| Expo Account | Free | Yes |
| Apple Developer Account | $99/year | Yes |
| EAS Build | Free (limited builds) | Yes |

**Note:** Expo offers free builds with limitations. For unlimited builds, upgrade to Expo EAS plan.

---

## 🎯 Quick Start

Just double-click **`BUILD_iOS.bat`** and follow the prompts!

Or run these commands:
```bash
npm install -g eas-cli
eas login
eas build -p ios --profile preview
```

---

## 📞 Support

- **Expo Documentation:** https://docs.expo.dev/build/introduction/
- **iOS Build Guide:** https://docs.expo.dev/build-reference/ios-builds/
- **Apple Developer:** https://developer.apple.com/support/

---

## ⏱️ Build Time

Typical build times:
- **iOS Build:** 15-30 minutes
- **First build:** May take longer (30-45 minutes)

---

## 🔐 Credentials Management

EAS will help you manage:
- Distribution certificates
- Provisioning profiles
- Push notification keys
- App signing

Just follow the interactive prompts during first build.

---

## ✅ Post-Build Checklist

- [ ] Build completed successfully
- [ ] Downloaded .ipa file
- [ ] Uploaded to App Store Connect (for TestFlight)
- [ ] Added testers in TestFlight
- [ ] Testers received invitation
- [ ] App installed and tested on device

---

**Ready to build?** Run `BUILD_iOS.bat` or the commands above!
