import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, COMMON, moderateScale } from '../theme';

export default function ProfileScreen() {
  const [profileImage, setProfileImage] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedTrainNumber, setEditedTrainNumber] = useState('');
  const [editedPhoneNumber, setEditedPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const { user, userProfile, signOut, isOfflineMode, isAdmin, updateProfile, refreshProfile } = useContext(AuthContext);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (userProfile) {
      setEditedName(user?.displayName || '');
      setEditedTrainNumber(userProfile.trainNumber || '');
      setEditedPhoneNumber(userProfile.phoneNumber || '');
    }
  }, [user, userProfile]);

  const loadProfile = async () => {
    try {
      const storedImage = await AsyncStorage.getItem('profileImage');
      if (storedImage) {
        setProfileImage(storedImage);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem('profileImage', imageUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error('Error picking image:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const result = await signOut();
          if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to logout');
          }
        },
      },
    ]);
  };

  const openEditModal = () => {
    setEditedName(user?.displayName || '');
    setEditedTrainNumber(userProfile?.trainNumber || '');
    setEditedPhoneNumber(userProfile?.phoneNumber || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!editedTrainNumber.trim()) {
      Alert.alert('Error', 'Please enter your train registration number');
      return;
    }
    setSaving(true);
    try {
      const result = await updateProfile({
        displayName: editedName.trim(),
        trainNumber: editedTrainNumber.trim(),
        phoneNumber: editedPhoneNumber.trim(),
      });
      if (result.success) {
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
        await refreshProfile();
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Update profile error:', error);
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Driver';
  const email = user?.email || 'No email';
  const trainNumber = userProfile?.trainNumber || 'Not set';
  const phoneNumber = userProfile?.phoneNumber || 'Not set';

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <View style={styles.infoIconCircle}>
          <Ionicons name={icon} size={moderateScale(16)} color={COLORS.primary} />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {isOfflineMode && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline" size={moderateScale(14)} color={COLORS.textInverse} />
              <Text style={styles.offlineBannerText}>Offline Mode</Text>
            </View>
          )}

          <TouchableOpacity onPress={pickImage} style={styles.imageContainer} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={moderateScale(44)} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={moderateScale(14)} color={COLORS.textInverse} />
            </View>
          </TouchableOpacity>

          <Text style={styles.username}>{displayName}</Text>
          <View style={[styles.roleBadge, isAdmin && { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name={isAdmin ? 'shield-checkmark' : 'train'} size={moderateScale(12)} color={isAdmin ? '#E65100' : COLORS.primary} />
            <Text style={[styles.roleText, isAdmin && { color: '#E65100' }]}>{isAdmin ? 'System Admin' : 'Train Driver'}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <InfoRow icon="person-outline" label="Name" value={displayName} />
          <View style={styles.divider} />
          <InfoRow icon="mail-outline" label="Email" value={email} />
          <View style={styles.divider} />
          <InfoRow icon="train-outline" label="Train Number" value={trainNumber} />
          <View style={styles.divider} />
          <InfoRow icon="call-outline" label="Phone" value={phoneNumber} />
          <View style={styles.divider} />
          <InfoRow icon="shield-checkmark-outline" label="Role" value={isAdmin ? 'System Admin' : 'Train Driver'} />
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <View style={styles.infoIconCircle}>
                <Ionicons name="pulse-outline" size={moderateScale(16)} color={COLORS.primary} />
              </View>
              <Text style={styles.infoLabel}>Status</Text>
            </View>
            <View style={styles.activeStatus}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.editButton} onPress={openEditModal} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={moderateScale(18)} color={COLORS.textInverse} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={moderateScale(18)} color={COLORS.textInverse} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={moderateScale(20)} color={COLORS.textTertiary} />
          <Text style={styles.footerText}>ElephantGuard v1.0.0</Text>
          <Text style={styles.footerSubtext}>Real-time AI-IoT collision prevention</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={moderateScale(22)} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={moderateScale(18)} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput style={styles.modalInput} placeholder="Enter your name" placeholderTextColor={COLORS.textTertiary} value={editedName} onChangeText={setEditedName} editable={!saving} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Train Registration Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="train-outline" size={moderateScale(18)} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput style={styles.modalInput} placeholder="e.g., TR-1234" placeholderTextColor={COLORS.textTertiary} value={editedTrainNumber} onChangeText={setEditedTrainNumber} editable={!saving} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={moderateScale(18)} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput style={styles.modalInput} placeholder="Enter your phone number" placeholderTextColor={COLORS.textTertiary} value={editedPhoneNumber} onChangeText={setEditedPhoneNumber} keyboardType="phone-pad" editable={!saving} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[styles.inputWrapper, styles.disabledWrapper]}>
                  <Ionicons name="mail-outline" size={moderateScale(18)} color={COLORS.textTertiary} style={styles.inputIcon} />
                  <TextInput style={[styles.modalInput, styles.disabledInput]} value={email} editable={false} />
                </View>
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)} disabled={saving} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSaveProfile} disabled={saving} activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { paddingBottom: SPACING['3xl'] },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.md,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  offlineBannerText: {
    color: COLORS.textInverse,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  imageContainer: { position: 'relative', marginBottom: SPACING.base },
  profileImage: {
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeholderImage: {
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(55),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: moderateScale(2),
    right: moderateScale(2),
    backgroundColor: COLORS.primary,
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryDark,
  },
  username: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: 0.3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginTop: SPACING.sm,
  },
  roleText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },

  // Info Card
  infoCard: {
    ...COMMON.cardElevated,
    margin: SPACING.base,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 0.45,
  },
  infoIconCircle: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: COLORS.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...FONTS.bodyBold,
    color: COLORS.text,
    flex: 0.55,
    textAlign: 'right',
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  activeDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: COLORS.success,
  },
  activeText: {
    ...FONTS.bodyBold,
    color: COLORS.success,
  },
  divider: { height: 1, backgroundColor: COLORS.divider },

  // Buttons
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.colored(COLORS.primary),
  },
  editButtonText: {
    color: COLORS.textInverse,
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.danger,
    marginHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.lg,
    ...SHADOWS.colored(COLORS.danger),
  },
  logoutButtonText: {
    color: COLORS.textInverse,
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: SPACING['2xl'],
    gap: SPACING.xs,
  },
  footerText: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  footerSubtext: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },

  // Modal
  modalOverlay: { ...COMMON.modalOverlay },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    width: '92%',
    maxHeight: '80%',
    ...SHADOWS.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: { ...FONTS.h3 },
  closeBtn: {
    padding: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  modalBody: { padding: SPACING.lg },
  inputGroup: { marginBottom: SPACING.lg },
  inputLabel: {
    ...FONTS.bodyBold,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputIcon: { marginLeft: SPACING.md },
  modalInput: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: moderateScale(15),
    color: COLORS.text,
  },
  disabledWrapper: { backgroundColor: COLORS.divider },
  disabledInput: { color: COLORS.textTertiary },
  helperText: {
    ...FONTS.caption,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.colored(COLORS.primary),
  },
  saveButtonDisabled: { backgroundColor: COLORS.primaryLight, opacity: 0.7 },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
});