# Firestore Database Setup Guide

This guide will help you set up **Firestore** (Firebase's cloud database) to store and sync your elephant detection notifications.

---

## What is Firestore?

Firestore is a cloud-hosted, NoSQL database that allows you to:
- ✅ Store notifications in the cloud
- ✅ Access notifications from any device
- ✅ Sync data automatically when online
- ✅ Query and analyze notifications
- ✅ Free tier with generous limits

---

## Step-by-Step Setup

### **STEP 1: Open Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `elephant-detection-app`
3. You should see your project dashboard

---

### **STEP 2: Create a Firestore Database**

1. In the left menu, click **"Build"** → **"Firestore Database"**
2. You'll see a button: **"Create database"** - click it
3. A popup will appear asking for configuration:

   **Location**: Select your region (e.g., `us-central1` or closest to you)
   - For Sri Lanka, consider `asia-south1` (India) as closest option
   
   Click **"Create Database"**

4. Wait for the database to be created (takes 1-2 minutes)
5. You should see "Firestore Database" with a green checkmark

---

### **STEP 3: Create Collections**

A **collection** is like a table in a database. Create these collections:

#### **Collection 1: Notifications**

1. In Firestore, click **"Start collection"**
2. Collection ID: `notifications`
3. Click **"Next"**
4. Leave "Auto ID" selected
5. Click **"Save"** (you'll add documents later)

The structure will look like:
```
notifications/
  ├── doc1: {
  │     userId: "user123",
  │     pillarId: "P001",
  │     riskLevel: "high",
  │     timestamp: "2024-01-05T10:30:00Z"
  │   }
  └── doc2: {...}
```

---

### **STEP 4: Set Security Rules**

This is **IMPORTANT** - it controls who can access your data.

1. In Firestore, click the **"Rules"** tab (at the top)
2. Replace all the content with this code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can create notifications
    match /notifications/{document=**} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId;
      allow delete: if request.auth.uid == resource.data.userId;
    }
    
    // Allow users to read/write their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"** button (blue button at the bottom right)
4. Confirm the popup: Click **"Publish"**

---

### **STEP 5: Verify Your Firestore Config**

Your `src/config/firebaseConfig.js` should already have Firestore imported:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { app, firestore };
```

✅ This is already set up in your project!

---

### **STEP 6: Test the Connection**

Run the app and verify Firestore works:

```bash
npm start
```

1. Login to the app
2. Go to Dashboard
3. When elephant alerts happen, check Firestore:
   - Open Firebase Console
   - Click **"Firestore Database"**
   - Click **"notifications"** collection
   - You should see new documents appearing!

---

## How Your Sync Service Works

```
Elephant Alert Detected
        ↓
Is Internet Connected?
    ↙         ↘
  YES          NO
    ↓           ↓
Store in    Store Locally
Firestore   in AsyncStorage
    ↓           ↓
Done    Wait for Internet
            ↓
        Auto-Sync to
        Firestore
```

---

## Testing Offline & Sync

### **Test Offline Mode:**

1. Start the app with internet
2. Generate an elephant alert
3. **Turn OFF internet** (WiFi + mobile data)
4. Generate another elephant alert
5. **Turn internet back ON**
6. App automatically syncs pending alerts to Firestore! ✅

### **Check Pending Sync:**

In DashboardScreen, you can show sync status:

```javascript
const status = await notificationSyncService.getSyncStatus();
console.log(`Pending: ${status.pendingCount}, Online: ${status.isOnline}`);
```

---

## Firestore Limits (Free Tier)

| Feature | Free Tier Limit | Pricing |
|---------|-----------------|---------|
| Read Operations | 50,000/day | $0.06 per 100K reads |
| Write Operations | 20,000/day | $0.18 per 100K writes |
| Delete Operations | 20,000/day | $0.02 per 100K deletes |
| Storage | 1 GB | $0.18/GB/month |

For a small deployment, you'll never hit these limits!

---

## Troubleshooting

### **"Permission denied" error?**
- Check if you're logged in
- Verify Security Rules are published
- Check that `userId` field is being saved correctly

### **Data not appearing in Firestore?**
- Make sure app has internet connection
- Check browser console for errors
- Verify Firebase config has correct `projectId`

### **Can't see notifications in console?**
- Refresh the Firestore page
- Make sure you're viewing the correct `notifications` collection
- Check that you're logged in as the correct user

---

## Common Commands

### **View your project ID:**
Go to Firebase Console → Project Settings (gear icon) → General tab

### **Reset database (careful!):**
Firestore Console → Trash icon → Delete database → Recreate

### **Monitor database usage:**
Firebase Console → Firestore → Usage tab

---

## Next Steps

1. ✅ Create Firestore database
2. ✅ Create "notifications" collection
3. ✅ Set security rules
4. ✅ Test the app with alerts
5. ✅ Verify data syncs to Firestore
6. (Optional) Create a web dashboard to view all notifications

---

**Questions?** Check Firebase docs: https://firebase.google.com/docs/firestore
