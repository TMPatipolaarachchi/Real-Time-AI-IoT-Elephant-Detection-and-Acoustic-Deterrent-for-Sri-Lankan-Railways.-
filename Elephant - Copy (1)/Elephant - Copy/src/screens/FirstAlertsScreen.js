import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notificationStorageService from '../services/notificationStorageService';
import { AuthContext } from '../context/AuthContext';

export default function FirstAlertsScreen({ navigation }) {
  const [notifications, setNotifications] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = React.useContext(AuthContext);

  useEffect(() => {
    loadNotifications();
  }, [user?.uid, userProfile?.trainNumber]); // Reload when user or train number changes

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Get all notifications first
      const allNotifications = await notificationStorageService.getFirstNotifications();
      
      // Filter by current train number if available
      let filteredNotifications = allNotifications;
      if (userProfile?.trainNumber) {
        filteredNotifications = await notificationStorageService.getNotificationsByTrain(
          userProfile.trainNumber
        );
      }
      
      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleClearNotification = (compositeKey, notification) => {
    Alert.alert(
      'Clear Notification',
      `Are you sure you want to clear the alert from ${notification.pillarName}?`,
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: async () => {
            await notificationStorageService.clearNotificationByPillar(
              compositeKey,
              notification.trainNumber
            );
            await loadNotifications();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all pillar alerts?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear All',
          onPress: async () => {
            await notificationStorageService.clearAllNotifications();
            await loadNotifications();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    return `${dateStr} ${timeStr}`;
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return '#D32F2F';
      case 'high':
        return '#F57C00';
      case 'medium':
        return '#FBC02D';
      case 'low':
        return '#388E3C';
      default:
        return '#757575';
    }
  };

  const renderNotificationCard = (pillarIdentifier, notification, index) => {
    return (
      <View key={pillarIdentifier} style={styles.notificationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.pillarInfo}>
            <Text style={styles.pillarName}>{notification.pillarName || 'Unknown Pillar'}</Text>
            <Text style={styles.pillarIndex}>Alert #{index + 1}</Text>
          </View>
          <View
            style={[
              styles.riskBadge,
              { backgroundColor: getRiskColor(notification.riskLevel) },
            ]}
          >
            <Text style={styles.riskText}>{notification.riskLevel || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date & Time:</Text>
            <Text style={styles.value}>{formatDateTime(notification.timestamp)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Train Number:</Text>
            <Text style={styles.value}>{notification.trainNumber || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>
              {notification.latitude?.toFixed(4)}, {notification.longitude?.toFixed(4)}
            </Text>
          </View>

          {notification.distance && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Distance:</Text>
              <Text style={styles.value}>{notification.distance} km</Text>
            </View>
          )}

          {notification.pillarId && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Pillar ID:</Text>
              <Text style={styles.value}>{notification.pillarId}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => handleClearNotification(pillarIdentifier, notification)}
        >
          <Text style={styles.clearButtonText}>Clear This Alert</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const notificationArray = Object.entries(notifications);
  const hasNotifications = notificationArray.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pillar Alerts</Text>
          <Text style={styles.headerSubtitle}>
            {hasNotifications ? `${notificationArray.length} pillar${notificationArray.length > 1 ? 's' : ''} detected` : 'Notifications from pillars'}
          </Text>
        </View>

        {/* Notifications */}
        {hasNotifications && (
          <View style={styles.notificationsContainer}>
            {notificationArray.map(([pillarId, notification], index) =>
              renderNotificationCard(pillarId, notification, index)
            )}
          </View>
        )}

        {/* Clear All Button */}
        {hasNotifications && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearAllButtonText}>Clear All Alerts</Text>
          </TouchableOpacity>
        )}

        {!hasNotifications && (
          <View style={styles.noNotificationsContainer}>
            <Text style={styles.noNotificationsText}>
              No pillar alerts recorded yet
            </Text>
            <Text style={styles.noNotificationsSubtext}>
              Alerts will appear here when detected
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  notificationsContainer: {
    padding: 15,
    gap: 15,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pillarInfo: {
    flex: 1,
  },
  pillarName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  pillarIndex: {
    fontSize: 12,
    color: '#757575',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  cardContent: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    flex: 0.4,
  },
  value: {
    fontSize: 13,
    color: '#1B5E20',
    fontWeight: '500',
    flex: 0.6,
    textAlign: 'right',
  },
  clearButton: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  clearButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 13,
  },
  clearAllButton: {
    marginHorizontal: 15,
    marginTop: 10,
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAllButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  noNotificationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noNotificationsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  noNotificationsSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
  },
});
