import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { collection, addDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebaseConfig';

const PENDING_SYNC_KEY = 'pending_notifications_sync';
const SYNC_IN_PROGRESS_KEY = 'sync_in_progress';

class NotificationSyncService {
  constructor() {
    this.syncInProgress = false;
    this.unsubscribeNetInfo = null;
    this.firestore = firestore;
  }

  /**
   * Initialize the sync service
   * Listens to network changes and syncs when online
   */
  initializeSyncListener() {
    if (this.unsubscribeNetInfo) {
      return; // Already initialized
    }

    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('Internet connected! Syncing pending notifications...');
        this.syncPendingNotifications();
      }
    });

    // Initial check
    this.checkAndSync();
  }

  /**
   * Stop listening to network changes
   */
  destroy() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  /**
   * Check current network status and sync if online
   */
  async checkAndSync() {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected && state.isInternetReachable) {
        await this.syncPendingNotifications();
      }
    } catch (error) {
      console.error('Error checking network status:', error);
    }
  }

  /**
   * Add notification to sync queue (local storage)
   * Will sync to database when internet is available
   */
  async addToSyncQueue(notificationData) {
    try {
      const pending = await this.getPendingNotifications();
      
      const syncItem = {
        id: `${Date.now()}_${Math.random()}`,
        data: notificationData,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      pending.push(syncItem);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
      
      console.log('Notification added to sync queue');
      
      // Try to sync immediately if online
      await this.checkAndSync();
      
      return true;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      return false;
    }
  }

  /**
   * Get pending notifications waiting to sync
   */
  async getPendingNotifications() {
    try {
      const data = await AsyncStorage.getItem(PENDING_SYNC_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Sync pending notifications to Firestore database
   */
  async syncPendingNotifications() {
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.syncInProgress = true;
      await AsyncStorage.setItem(SYNC_IN_PROGRESS_KEY, 'true');

      const pending = await this.getPendingNotifications();
      
      if (pending.length === 0) {
        console.log('No pending notifications to sync');
        this.syncInProgress = false;
        await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
        return;
      }

      const user = auth.currentUser;

      if (!user) {
        console.warn('User not authenticated, cannot sync to database');
        this.syncInProgress = false;
        await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
        return;
      }

      console.log(`Syncing ${pending.length} notifications to database...`);

      let successCount = 0;
      const failedItems = [];

      for (const item of pending) {
        try {
          // Add to Firestore
            await addDoc(collection(this.firestore, 'notifications'), {
            ...item.data,
            userId: user.uid,
            userEmail: user.email,
            syncedAt: new Date().toISOString(),
            localTimestamp: item.timestamp,
          });

          successCount++;
          console.log(`Synced notification: ${item.id}`);
        } catch (error) {
          console.error(`Failed to sync notification ${item.id}:`, error);
          failedItems.push(item);
        }
      }

      // Update local storage with only failed items
      if (failedItems.length > 0) {
        await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(failedItems));
        console.warn(`${failedItems.length} notifications failed to sync`);
      } else {
        // All synced successfully
        await AsyncStorage.removeItem(PENDING_SYNC_KEY);
        console.log(`✓ Successfully synced ${successCount} notifications!`);
      }

      this.syncInProgress = false;
      await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
    } catch (error) {
      console.error('Error during sync:', error);
      this.syncInProgress = false;
      await AsyncStorage.removeItem(SYNC_IN_PROGRESS_KEY);
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    try {
      const pending = await this.getPendingNotifications();
      const state = await NetInfo.fetch();

      return {
        isOnline: state.isConnected && state.isInternetReachable,
        pendingCount: pending.length,
        syncInProgress: this.syncInProgress,
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isOnline: false,
        pendingCount: 0,
        syncInProgress: false,
      };
    }
  }

  /**
   * Manually trigger sync
   */
  async manualSync() {
    return await this.syncPendingNotifications();
  }

  /**
   * Clear all pending notifications
   */
  async clearPending() {
    try {
      await AsyncStorage.removeItem(PENDING_SYNC_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing pending notifications:', error);
      return false;
    }
  }

  /**
   * Get notifications from Firestore (requires user to be authenticated)
   */
  async getStoredNotifications(userId, limit = 100) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn('User not authenticated');
        return [];
      }

      const q = query(
        collection(this.firestore, 'notifications'),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      const notifications = [];
      
      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by date descending
      notifications.sort((a, b) => 
        new Date(b.syncedAt || b.localTimestamp) - new Date(a.syncedAt || a.localTimestamp)
      );

      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }
}

export default new NotificationSyncService();
