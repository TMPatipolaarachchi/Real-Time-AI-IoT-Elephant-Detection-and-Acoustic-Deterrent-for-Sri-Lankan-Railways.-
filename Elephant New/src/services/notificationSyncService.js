import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const LOCAL_NOTIFICATIONS_KEY = '@local_notifications';
const SYNC_QUEUE_KEY = '@sync_queue';
const LAST_SYNC_TIME_KEY = '@last_sync_time';

/**
 * Notification Sync Service
 * Handles offline storage and online synchronization of elephant detection notifications
 */
class NotificationSyncService {
  constructor() {
    this.isOnline = false;
    this.isSyncing = false;
    this.syncListeners = [];
    
    // Monitor network status
    this.initializeNetworkMonitoring();
  }

  /**
   * Initialize network status monitoring
   */
  initializeNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      // Auto-sync when coming back online
      if (!wasOnline && this.isOnline) {
        this.syncNotifications();
      }
    });
  }

  /**
   * Save notification locally and sync to Firestore if online
   */
  async saveNotification(notificationData) {
    try {
      const notification = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notificationData,
        createdAt: new Date().toISOString(),
        synced: false,
      };

      // Save to local storage
      await this.saveToLocalStorage(notification);

      // Try to sync immediately if online
      if (this.isOnline) {
        await this.syncSingleNotification(notification);
      }

      return { success: true, notification };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save notification to local AsyncStorage
   */
  async saveToLocalStorage(notification) {
    try {
      // Get existing notifications
      const existingData = await AsyncStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      const notifications = existingData ? JSON.parse(existingData) : [];

      // Add new notification
      notifications.unshift(notification);

      // Keep only last 100 notifications to prevent storage overflow
      const limitedNotifications = notifications.slice(0, 100);

      // Save back to storage
      await AsyncStorage.setItem(
        LOCAL_NOTIFICATIONS_KEY,
        JSON.stringify(limitedNotifications)
      );

      // Add to sync queue if not synced
      if (!notification.synced) {
        await this.addToSyncQueue(notification.id);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add notification ID to sync queue
   */
  async addToSyncQueue(notificationId) {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = queueData ? JSON.parse(queueData) : [];

      if (!queue.includes(notificationId)) {
        queue.push(notificationId);
        await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
    }
  }

  /**
   * Sync a single notification to Firestore
   */
  async syncSingleNotification(notification) {
    try {
      if (!this.isOnline) {
        return { success: false, error: 'Offline' };
      }

      // Prepare data for Firestore (remove local-only fields)
      const firestoreData = {
        elephantDetected: notification.elephantDetected,
        elephantLeft: notification.elephantLeft,
        riskLevel: notification.riskLevel,
        distance: notification.distance,
        elephantLocation: notification.elephantLocation || null,
        trainLocation: notification.trainLocation || null,
        userId: notification.userId || null,
        trainNumber: notification.trainNumber || null,
        timestamp: notification.timestamp || serverTimestamp(),
        createdAt: notification.createdAt,
        deviceInfo: notification.deviceInfo || {},
      };

      // Add to Firestore
      const docRef = await addDoc(collection(firestore, 'notifications'), firestoreData);

      // Update local notification as synced
      await this.markAsSynced(notification.id, docRef.id);

      // Remove from sync queue
      await this.removeFromSyncQueue(notification.id);

      return { success: true, firestoreId: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync all pending notifications to Firestore
   */
  async syncNotifications() {
    if (this.isSyncing) {
      return;
    }

    if (!this.isOnline) {
      return { success: false, error: 'Offline' };
    }

    this.isSyncing = true;
    this.notifySyncListeners({ status: 'syncing', progress: 0 });

    try {
      // Get sync queue
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = queueData ? JSON.parse(queueData) : [];

      if (queue.length === 0) {
        this.notifySyncListeners({ status: 'complete', synced: 0 });
        return { success: true, synced: 0 };
      }

      // Get all local notifications
      const notificationsData = await AsyncStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      const notifications = notificationsData ? JSON.parse(notificationsData) : [];

      let syncedCount = 0;
      let failedCount = 0;

      // Sync each queued notification
      for (let i = 0; i < queue.length; i++) {
        const notificationId = queue[i];
        const notification = notifications.find(n => n.id === notificationId);

        if (notification && !notification.synced) {
          const result = await this.syncSingleNotification(notification);
          
          if (result.success) {
            syncedCount++;
          } else {
            failedCount++;
          }
        }

        // Update progress
        const progress = ((i + 1) / queue.length) * 100;
        this.notifySyncListeners({ 
          status: 'syncing', 
          progress, 
          synced: syncedCount,
          failed: failedCount 
        });
      }

      // Update last sync time
      await AsyncStorage.setItem(LAST_SYNC_TIME_KEY, new Date().toISOString());
      
      this.notifySyncListeners({ 
        status: 'complete', 
        synced: syncedCount, 
        failed: failedCount 
      });

      return { 
        success: true, 
        synced: syncedCount, 
        failed: failedCount 
      };
    } catch (error) {
      this.notifySyncListeners({ status: 'error', error: error.message });
      return { success: false, error: error.message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Mark notification as synced
   */
  async markAsSynced(localId, firestoreId) {
    try {
      const notificationsData = await AsyncStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      const notifications = notificationsData ? JSON.parse(notificationsData) : [];

      const updatedNotifications = notifications.map(n => 
        n.id === localId 
          ? { ...n, synced: true, firestoreId } 
          : n
      );

      await AsyncStorage.setItem(
        LOCAL_NOTIFICATIONS_KEY,
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
    }
  }

  /**
   * Remove notification from sync queue
   */
  async removeFromSyncQueue(notificationId) {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = queueData ? JSON.parse(queueData) : [];

      const updatedQueue = queue.filter(id => id !== notificationId);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
    }
  }

  /**
   * Get all local notifications
   */
  async getLocalNotifications() {
    try {
      const data = await AsyncStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get unsynced notifications count
   */
  async getUnsyncedCount() {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = queueData ? JSON.parse(queueData) : [];
      return queue.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime() {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_TIME_KEY);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear all local notifications
   */
  async clearLocalNotifications() {
    try {
      await AsyncStorage.removeItem(LOCAL_NOTIFICATIONS_KEY);
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch notifications from Firestore for current user
   */
  async fetchFromFirestore(userId, limit = 50) {
    try {
      if (!this.isOnline) {
        return { success: false, error: 'Offline' };
      }

      const q = query(
        collection(firestore, 'notifications'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          firestoreId: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, notifications };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add sync status listener
   */
  addSyncListener(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all sync listeners
   */
  notifySyncListeners(status) {
    this.syncListeners.forEach(callback => callback(status));
  }

  /**
   * Check if online
   */
  checkOnlineStatus() {
    return this.isOnline;
  }
}

export default new NotificationSyncService();
