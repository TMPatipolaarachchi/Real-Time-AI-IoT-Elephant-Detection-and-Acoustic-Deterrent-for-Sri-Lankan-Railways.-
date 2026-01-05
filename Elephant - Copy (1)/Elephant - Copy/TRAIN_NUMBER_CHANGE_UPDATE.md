# Train Number Change Handling - Update Documentation

## What Was Changed

### Problem
When a train driver logged out and logged back in with a different train number, the previous pillar notifications were not being re-saved if the same pillar sent an alert again.

### Solution
Implemented a **composite key system** that combines pillar identifier with train number to track notifications independently per train.

## Implementation Details

### 1. **Composite Key System** (notificationStorageService.js)
- Created `createCompositeKey(pillarIdentifier, trainNumber)` method
- Format: `pillarId__trainNumber` (e.g., `pillar_1__train_001`)
- Allows same pillar to have separate notifications for different trains

### 2. **Enhanced Storage Methods**

#### `saveFirstNotification(data)`
- Now uses composite key (pillar + train) instead of just pillar ID
- Same pillar with different train = new notification stored
- Prevents duplicates only for the same pillar + train combination

#### `hasNotificationFromPillar(pillarIdentifier, trainNumber)`
- Checks specific pillar + train combination
- Optional trainNumber parameter for backwards compatibility
- Returns true only if exact match found

#### `clearNotificationByPillar(pillarIdentifier, trainNumber)`
- Can clear specific pillar + train combination
- Can clear all trains for a pillar if trainNumber not provided
- Updated to work with composite keys

#### `getNotificationsByTrain(trainNumber)` - NEW
- Filters notifications by current train number
- Used when displaying alerts to show only current train's notifications
- Enables train-specific notification views

### 3. **Updated FirstAlertsScreen**

#### Auto-Reload on Train Change
```javascript
useEffect(() => {
  loadNotifications();
}, [user?.uid, userProfile?.trainNumber]);
```
- Reloads notifications when user logs in/out or train number changes
- Only shows notifications for current train

#### Train-Filtered Display
```javascript
const filteredNotifications = await notificationStorageService.getNotificationsByTrain(
  userProfile.trainNumber
);
```
- Displays only notifications from current train
- If train changes, old train's notifications are hidden

### 4. **Updated DashboardScreen**

#### Train Number Passed to Check Function
```javascript
const hasNotification = await notificationStorageService.hasNotificationFromPillar(
  pillarIdentifier,
  trainNumber
);
```
- Checks if current train has notification from this pillar
- Allows same pillar to alert multiple different trains

## Scenario Example

### Before Update
1. Train A receives alert from Pillar 1 → Stored
2. Driver logs out, logs in as Train B
3. Pillar 1 sends alert again → NOT stored (duplicate check failed)
4. ❌ Train B doesn't see the new alert

### After Update
1. Train A receives alert from Pillar 1 → Stored as `pillar_1__train_a`
2. Driver logs out, logs in as Train B
3. Pillar 1 sends alert again → Stored as `pillar_1__train_b` ✓
4. FirstAlertsScreen shows only Train B's alert `pillar_1__train_b`
5. ✅ Train B sees the new alert correctly

## Storage Structure

### Before
```javascript
{
  "pillar_1": { trainNumber: "Train A", ... },
  "pillar_2": { trainNumber: "Train A", ... }
}
```

### After
```javascript
{
  "pillar_1__train_a": { trainNumber: "Train A", ... },
  "pillar_1__train_b": { trainNumber: "Train B", ... },
  "pillar_2__train_a": { trainNumber: "Train A", ... },
  "pillar_2__train_b": { trainNumber: "Train B", ... }
}
```

## Files Modified

1. **notificationStorageService.js**
   - Added `createCompositeKey()` method
   - Updated `saveFirstNotification()` to use composite keys
   - Updated `hasNotificationFromPillar()` with train number parameter
   - Updated `clearNotificationByPillar()` with train number parameter
   - Added `getNotificationsByTrain()` method

2. **FirstAlertsScreen.js**
   - Added AuthContext import and user/userProfile access
   - Added useEffect dependency on user and trainNumber
   - Updated `loadNotifications()` to filter by train
   - Updated `handleClearNotification()` to pass full notification object

3. **DashboardScreen.js**
   - Added authService import
   - Updated `saveNotification()` to pass trainNumber to hasNotificationFromPillar()

## Key Features

✅ **Per-Train Notifications** - Each train sees only its own alerts
✅ **Automatic Reload** - Notifications update when train number changes
✅ **Duplicate Prevention** - Per train+pillar combination (not global)
✅ **Backward Compatible** - Existing data can coexist with new format
✅ **Multi-Driver Support** - Different drivers with different trains work correctly
✅ **Complete History** - All historical notifications preserved in history

## Testing Scenarios

1. **Single Train, Multiple Pillars**
   - ✅ Different pillars send alerts
   - ✅ All stored with same train number

2. **Same Pillar, Multiple Trains**
   - ✅ Train A detects from Pillar 1
   - ✅ Switch to Train B
   - ✅ Pillar 1 sends alert again
   - ✅ Stored separately as Train B's alert

3. **Train Number Change**
   - ✅ Device stores Train A's notification
   - ✅ User logs out/changes train number
   - ✅ Same pillar sends alert
   - ✅ Displayed as Train B's new alert

4. **Clearing Notifications**
   - ✅ Clear specific alert (by pillar + train)
   - ✅ Switch trains - other train's alerts remain
   - ✅ Clear all - removes all alerts for all trains

## No Breaking Changes

- Existing code continues to work
- New notifications use composite keys automatically
- Old notifications can coexist (though with basic keys)
- Display automatically filters by current train
