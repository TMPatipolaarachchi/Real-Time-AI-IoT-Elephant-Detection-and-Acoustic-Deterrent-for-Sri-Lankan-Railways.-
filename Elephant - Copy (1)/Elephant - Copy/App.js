import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CalibrationScreen from './src/screens/CalibrationScreen';
import FirstAlertsScreen from './src/screens/FirstAlertsScreen';
import { AuthContext, AuthProvider } from './src/context/AuthContext';
import { Audio } from "expo-av";
import notificationSyncService from './src/services/notificationSyncService';
import { COLORS, SHADOWS, moderateScale, SPACING, RADIUS, FONTS } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICON = {
  Dashboard: { focused: 'shield-checkmark', unfocused: 'shield-checkmark-outline' },
  Alerts: { focused: 'notifications', unfocused: 'notifications-outline' },
  Calibration: { focused: 'settings', unfocused: 'settings-outline' },
  Profile: { focused: 'person-circle', unfocused: 'person-circle-outline' },
};

function MainTabs() {
  const { isAdmin } = useContext(AuthContext);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          ...SHADOWS.lg,
          height: Platform.OS === 'ios' ? moderateScale(88) : moderateScale(64),
          paddingBottom: Platform.OS === 'ios' ? moderateScale(24) : moderateScale(8),
          paddingTop: moderateScale(8),
        },
        tabBarLabelStyle: {
          fontSize: moderateScale(11),
          fontWeight: '600',
          marginTop: moderateScale(2),
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconSet = TAB_ICON[route.name] || TAB_ICON.Dashboard;
          const iconName = focused ? iconSet.focused : iconSet.unfocused;
          return <Ionicons name={iconName} size={moderateScale(22)} color={color} />;
        },
        headerStyle: {
          backgroundColor: COLORS.primaryDark,
          ...SHADOWS.lg,
        },
        headerTintColor: COLORS.textInverse,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: moderateScale(17),
          letterSpacing: 0.3,
        },
        headerTitleAlign: 'center',
      })}
    >
      {!isAdmin && (
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{
            title: 'Elephant Detection',
            tabBarLabel: 'Dashboard',
          }}
        />
      )}
      {isAdmin && (
        <Tab.Screen 
          name="Alerts" 
          component={FirstAlertsScreen}
          options={{
            title: 'Pillar Alerts',
            tabBarLabel: 'Alerts',
          }}
        />
      )}
      {isAdmin && (
        <Tab.Screen 
          name="Calibration" 
          component={CalibrationScreen}
          options={{
            title: 'Calibration & Pillars',
            tabBarLabel: 'Calibrate',
            headerShown: false,
          }}
        />
      )}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading, isAdmin } = useContext(AuthContext);
  React.useEffect(() => {
    if (isAuthenticated) {
      notificationSyncService.initializeSyncListener();
    } else {
      notificationSyncService.destroy();
    }
    return () => {
      notificationSyncService.destroy();
    };
  }, [isAuthenticated]);

  React.useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      shouldDuckAndroid: false,
    });
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
    ...SHADOWS.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
});