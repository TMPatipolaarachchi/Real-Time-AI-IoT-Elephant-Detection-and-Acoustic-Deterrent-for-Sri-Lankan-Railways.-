# Firebase Authentication Setup Guide

This app uses **Firebase Authentication** to provide secure, offline-capable authentication without requiring a custom backend.

## Why Firebase?

✅ **No Backend Required** - Firebase handles all authentication server-side  
✅ **Offline Support** - Users can authenticate offline after first login  
✅ **Secure** - Industry-standard security practices built-in  
✅ **Free Tier** - Generous free tier suitable for most use cases  
✅ **Easy Integration** - Simple setup with React Native  

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `elephant-detection-app` (or your preferred name)
4. Disable Google Analytics (optional for this app)
5. Click **"Create project"**

---

## Step 2: Register Your App

1. In Firebase Console, click the **Web icon** (</>) to add a web app
2. Enter app nickname: `Elephant Detection Web App`
3. **DO NOT** check "Firebase Hosting" (not needed)
4. Click **"Register app"**
5. Copy the Firebase configuration object - you'll need this!

Example configuration:
```javascript
{
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}
```

---

## Step 3: Enable Email/Password Authentication

1. In Firebase Console, go to **"Authentication"** from the left menu
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Enable the **first toggle** (Email/Password)
6. Click **"Save"**

---

## Step 4: Configure Your App

1. Open the file: `src/config/firebaseConfig.js`
2. Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // Replace with your apiKey
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",  // Replace with your authDomain
  projectId: "YOUR_PROJECT_ID",              // Replace with your projectId
  storageBucket: "YOUR_PROJECT_ID.appspot.com",   // Replace with your storageBucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",  // Replace with your messagingSenderId
  appId: "YOUR_APP_ID"                       // Replace with your appId
};
```

3. Save the file

---

## Step 5: Test the App

### First Time Setup (Requires Internet):
1. Start the app: `npm start`
2. On the login screen, click **"Don't have an account? Sign Up"**
3. Fill in:
   - **Full Name**: Your name
   - **Email**: Valid email address
   - **Password**: At least 6 characters
   - **Confirm Password**: Same as password
4. Click **"Sign Up"**
5. You should see a success message and be logged in!

### Testing Offline Mode:
1. After signing up/signing in once with internet
2. Turn off WiFi/Mobile data
3. Close and restart the app
4. Enter the **same email and password** you used before
5. Click **"Sign In"**
6. You should see **"Offline Mode"** badge and be able to use the app!

---

## How Offline Authentication Works

### Online Authentication (First Time):
1. User enters email/password
2. Firebase verifies credentials against server
3. App stores encrypted user data locally
4. User is authenticated

### Offline Authentication (Subsequent):
1. User enters email/password
2. App detects no internet connection
3. App verifies against locally cached credentials
4. User is authenticated in **Offline Mode**
5. Full app functionality remains available

---

## Security Features

🔒 **Password Hashing** - Passwords are hashed before storage  
🔒 **Secure Storage** - Uses AsyncStorage with encryption  
🔒 **Session Management** - Automatic token refresh and validation  
🔒 **Rate Limiting** - Firebase prevents brute force attacks  
🔒 **Email Verification** - Can be enabled for additional security  

---

## Managing Users

### View All Users:
1. Go to Firebase Console
2. Click **"Authentication"** → **"Users"** tab
3. See all registered users with email, creation date, etc.

### Delete a User:
1. In the Users tab, click the menu (⋮) next to a user
2. Click **"Delete account"**

### Reset User Password:
Users can reset their password via the "Forgot Password" flow (can be implemented if needed)

---

## Troubleshooting

### Error: "Network request failed"
- Check internet connection
- Verify Firebase configuration is correct
- Ensure Email/Password auth is enabled in Firebase Console

### Error: "Email already in use"
- This email is already registered
- Use "Sign In" instead of "Sign Up"
- Or use a different email address

### Error: "Invalid email"
- Enter a valid email format (e.g., user@example.com)

### Error: "Weak password"
- Password must be at least 6 characters long

### Offline login not working:
- Make sure you've signed in successfully at least once with internet
- Verify you're using the exact same email and password
- Check that you see cached auth data in AsyncStorage

---

## Production Checklist

Before deploying to production:

- [ ] Enable email verification in Firebase Console
- [ ] Set up password reset functionality
- [ ] Configure Firebase security rules
- [ ] Enable 2FA for admin accounts
- [ ] Monitor authentication metrics in Firebase Console
- [ ] Set up Firebase Analytics (optional)
- [ ] Configure proper error logging
- [ ] Test thoroughly in offline scenarios

---

## Cost Estimation

Firebase Authentication **Free Tier**:
- ✅ **Unlimited** users
- ✅ **Unlimited** sign-ins
- ✅ No credit card required
- ✅ Perfect for this application

Only pay if you exceed quotas (very high limits):
- 50,000+ monthly active users → $0.0055/user
- 3000+ SMS MFA verifications → $0.06/verification

**For a train driver app, you'll likely never exceed the free tier!**

---

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs/auth)
- [React Native Firebase Guide](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Status Page](https://status.firebase.google.com/)

---

## Next Steps

After setting up Firebase:

1. ✅ Configure firebaseConfig.js with your credentials
2. ✅ Test sign up with internet connection
3. ✅ Test offline login functionality
4. ✅ Add more users through the app
5. 📱 Start using the elephant detection features!

**Need help? Check the troubleshooting section or Firebase documentation.**
