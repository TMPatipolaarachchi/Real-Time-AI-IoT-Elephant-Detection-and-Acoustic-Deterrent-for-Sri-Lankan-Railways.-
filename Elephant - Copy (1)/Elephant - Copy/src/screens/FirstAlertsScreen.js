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
import { Ionicons } from '@expo/vector-icons';
import notificationStorageService from '../services/notificationStorageService';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, COMMON, moderateScale } from '../theme';

export default function FirstAlertsScreen({ navigation }) {
  const [notifications, setNotifications] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = React.useContext(AuthContext);

  useEffect(() => {
    loadNotifications();
  }, [user?.uid, userProfile?.trainNumber]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const allNotifications = await notificationStorageService.getFirstNotifications();
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
      case 'critical': return COLORS.danger;
      case 'high': return COLORS.warning;
      case 'medium': return COLORS.accent;
      case 'low': return COLORS.success;
      default: return COLORS.textTertiary;
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'alert-circle';
      case 'high': return 'warning';
      case 'medium': return 'flash';
      case 'low': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const renderNotificationCard = (pillarIdentifier, notification, index) => {
    const riskColor = getRiskColor(notification.riskLevel);
    return (
      <View key={pillarIdentifier} style={styles.notificationCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: riskColor + '18' }]}>
            <Ionicons name={getRiskIcon(notification.riskLevel)} size={moderateScale(20)} color={riskColor} />
          </View>
          <View style={styles.pillarInfo}>
            <Text style={styles.pillarName}>{notification.pillarName || 'Unknown Pillar'}</Text>
            <Text style={styles.pillarIndex}>Alert #{index + 1}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
            <Text style={styles.riskText}>{notification.riskLevel || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={moderateScale(14)} color={COLORS.textTertiary} />
              <Text style={styles.label}>Date & Time</Text>
            </View>
            <Text style={styles.value}>{formatDateTime(notification.timestamp)}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="train-outline" size={moderateScale(14)} color={COLORS.textTertiary} />
              <Text style={styles.label}>Train Number</Text>
            </View>
            <Text style={styles.value}>{notification.trainNumber || 'N/A'}</Text>
          </View>

          {notification.distance && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="swap-horizontal" size={moderateScale(14)} color={COLORS.textTertiary} />
                <Text style={styles.label}>Distance</Text>
              </View>
              <Text style={styles.value}>{notification.distance} km</Text>
            </View>
          )}

          {notification.pillarId && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={moderateScale(14)} color={COLORS.textTertiary} />
                <Text style={styles.label}>Pillar ID</Text>
              </View>
              <Text style={styles.value}>{notification.pillarId}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const notificationArray = Object.entries(notifications);
  const hasNotifications = notificationArray.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconCircle}>
            <Ionicons name="notifications" size={moderateScale(22)} color={COLORS.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Pillar Alerts</Text>
            <Text style={styles.headerSubtitle}>
              {hasNotifications
                ? `${notificationArray.length} pillar${notificationArray.length > 1 ? 's' : ''} detected`
                : 'Notifications from pillars'}
            </Text>
          </View>
          {hasNotifications && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{notificationArray.length}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
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
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={moderateScale(16)} color={COLORS.textInverse} />
            <Text style={styles.clearAllButtonText}>Clear All Alerts</Text>
          </TouchableOpacity>
        )}

        {/* Empty State */}
        {!hasNotifications && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={moderateScale(40)} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Alerts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Pillar alerts will appear here when{'\n'}elephant detections are recorded
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerIconCircle: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.65)',
    marginTop: SPACING.xs,
  },
  countBadge: {
    backgroundColor: COLORS.danger,
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: COLORS.textInverse,
    fontWeight: '800',
    fontSize: moderateScale(13),
  },

  // Scroll
  scrollView: { flex: 1 },
  contentContainer: { paddingBottom: SPACING['3xl'] },

  // Cards
  notificationsContainer: {
    padding: SPACING.base,
    gap: SPACING.md,
  },
  notificationCard: {
    ...COMMON.cardElevated,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillarInfo: { flex: 1 },
  pillarName: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  pillarIndex: {
    ...FONTS.caption,
    marginTop: SPACING.xs,
  },
  riskBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  riskText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: moderateScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  cardContent: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    ...FONTS.caption,
    fontWeight: '600',
  },
  value: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Clear All
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.danger,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.lg,
    ...SHADOWS.colored(COLORS.danger),
  },
  clearAllButtonText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: moderateScale(15),
    letterSpacing: 0.3,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['4xl'],
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});
