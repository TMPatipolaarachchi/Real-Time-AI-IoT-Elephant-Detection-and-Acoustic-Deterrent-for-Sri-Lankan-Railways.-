import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationSyncService from './notificationSyncService';

const PILLAR_NOTIFICATIONS_KEY = 'pillar_first_notifications';
const ALL_NOTIFICATIONS_KEY = 'all_notifications_history';

class NotificationStorageService {
  /**
   * Create a composite key from pillar and train number
   * @param {string} pillarIdentifier - Pillar ID or name
   * @param {string} trainNumber - Train number
   */
  createCompositeKey(pillarIdentifier, trainNumber) {
    const train = trainNumber || 'unknown_train';
    return `${pillarIdentifier}__${train}`;
  }

  /**
   * Save first notification from a pillar with specific train
   * @param {object} data - Notification data with pillars details
   */
  async saveFirstNotification(data) {
    try {
      const pillarIdentifier = data.elephantLocation?.pillarId || data.elephantLocation?.pillarName || 'unknown';
      const trainNumber = data.trainNumber || 'unknown_train';
      
      // Create composite key: pillar_train
      const compositeKey = this.createCompositeKey(pillarIdentifier, trainNumber);
      
      const notificationData = {
        pillarName: data.elephantLocation?.pillarName,
        pillarId: data.elephantLocation?.pillarId,
        latitude: data.elephantLocation?.latitude,
        longitude: data.elephantLocation?.longitude,
        trainNumber: data.trainNumber,
        riskLevel: data.riskLevel,
        timestamp: new Date().toISOString(),
        distance: data.distance,
        deviceInfo: data.deviceInfo,
        userId: data.userId,
      };

      // Get existing notifications
      const allNotifications = await this.getFirstNotifications();
      
      // Check if this pillar with this train already has a notification
      if (allNotifications[compositeKey]) {
        return false; // Already exists, don't save
      }

      // Add new notification with composite key
      allNotifications[compositeKey] = notificationData;
      
      // Save back to storage
      await AsyncStorage.setItem(PILLAR_NOTIFICATIONS_KEY, JSON.stringify(allNotifications));

      // Also save to history
      await this.addToHistory(notificationData);

      // Enqueue for cloud sync (will be synced when internet is available)
      try {
        await notificationSyncService.addToSyncQueue(notificationData);
      } catch (syncError) {
        console.warn('Failed to enqueue notification for sync:', syncError);
      }

      return true;
    } catch (error) {
      console.error('Error saving first notification:', error);
      return false;
    }
  }

  /**
   * Get all first notifications from all pillars
   */
  async getFirstNotifications() {
    try {
      const data = await AsyncStorage.getItem(PILLAR_NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting first notifications:', error);
      return {};
    }
  }

  /**
   * Get notification from specific pillar
   */
  async getNotificationByPillar(pillarIdentifier) {
    try {
      const allNotifications = await this.getFirstNotifications();
      return allNotifications[pillarIdentifier] || null;
    } catch (error) {
      console.error('Error getting pillar notification:', error);
      return null;
    }
  }

  /**
   * Add notification to history
   */
  async addToHistory(notificationData) {
    try {
      const history = await this.getHistory();
      history.unshift({
        ...notificationData,
      });

      // Keep only last 100 notifications
      const limitedHistory = history.slice(0, 100);
      await AsyncStorage.setItem(ALL_NOTIFICATIONS_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error adding to notification history:', error);
    }
  }

  /**
   * Get all notification history
   */
  async getHistory() {
    try {
      const data = await AsyncStorage.getItem(ALL_NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Clear notification by composite key (pillar + train)
   */
  async clearNotificationByPillar(pillarIdentifier, trainNumber = null) {
    try {
      const allNotifications = await this.getFirstNotifications();
      
      if (trainNumber) {
        // Clear specific pillar + train combination
        const compositeKey = this.createCompositeKey(pillarIdentifier, trainNumber);
        delete allNotifications[compositeKey];
      } else {
        // Clear all notifications for this pillar (all trains)
        const keysToDelete = Object.keys(allNotifications).filter(key =>
          key.startsWith(pillarIdentifier + '__')
        );
        keysToDelete.forEach(key => delete allNotifications[key]);
      }
      
      await AsyncStorage.setItem(PILLAR_NOTIFICATIONS_KEY, JSON.stringify(allNotifications));
      return true;
    } catch (error) {
      console.error('Error clearing notification:', error);
      return false;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    try {
      await AsyncStorage.removeItem(PILLAR_NOTIFICATIONS_KEY);
      await AsyncStorage.removeItem(ALL_NOTIFICATIONS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      return false;
    }
  }

  /**
   * Check if we already have a notification from this pillar with this train
   */
  async hasNotificationFromPillar(pillarIdentifier, trainNumber = null) {
    try {
      const notifications = await this.getFirstNotifications();
      
      if (trainNumber) {
        // Check specific pillar + train combination
        const compositeKey = this.createCompositeKey(pillarIdentifier, trainNumber);
        return !!notifications[compositeKey];
      } else {
        // Check if pillar exists with any train
        return Object.keys(notifications).some(key =>
          key.startsWith(pillarIdentifier + '__')
        );
      }
    } catch (error) {
      console.error('Error checking pillar notification:', error);
      return false;
    }
  }

  /**
   * Get notifications filtered by current train number
   * @param {string} trainNumber - Current train number to filter by
   */
  async getNotificationsByTrain(trainNumber) {
    try {
      const allNotifications = await this.getFirstNotifications();
      const filtered = {};
      
      Object.entries(allNotifications).forEach(([key, notification]) => {
        if (notification.trainNumber === trainNumber) {
          filtered[key] = notification;
        }
      });
      
      return filtered;
    } catch (error) {
      console.error('Error filtering notifications by train:', error);
      return {};
    }
  }

  /**
   * Get count of stored notifications
   */
  async getNotificationCount() {
    try {
      const notifications = await this.getFirstNotifications();
      return Object.keys(notifications).length;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }
}

export default new NotificationStorageService();
