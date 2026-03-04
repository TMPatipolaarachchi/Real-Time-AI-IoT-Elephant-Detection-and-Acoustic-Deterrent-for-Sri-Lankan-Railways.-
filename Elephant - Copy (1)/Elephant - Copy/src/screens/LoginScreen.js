import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import {
  COLORS, FONTS, SPACING, RADIUS, SHADOWS, COMMON,
  moderateScale, SCREEN,
} from '../theme';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const { signIn, signUp, isOfflineMode } = useContext(AuthContext);

  const handleSignIn = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    if (!password) { Alert.alert('Error', 'Please enter your password'); return; }
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.success) {
        Alert.alert('Sign In Failed', result.error);
      } else if (result.isOffline) {
        Alert.alert('Offline Mode', 'Signed in using cached credentials. Some features may be limited.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Sign in error:', error);
    } finally { setLoading(false); }
  };

  const handleSignUp = async () => {
    if (!displayName.trim()) { Alert.alert('Error', 'Please enter your name'); return; }
    if (!trainNumber.trim()) { Alert.alert('Error', 'Please enter your train registration number'); return; }
    if (!email.trim()) { Alert.alert('Error', 'Please enter your email'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, displayName.trim(), trainNumber.trim());
      if (!result.success) {
        Alert.alert('Registration Failed', result.error);
      } else {
        Alert.alert('Success', 'Account created successfully! You can now use the app offline.', [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Sign up error:', error);
    } finally { setLoading(false); }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail(''); setPassword(''); setConfirmPassword('');
    setDisplayName(''); setTrainNumber('');
  };

  const renderInput = (icon, placeholder, value, onChangeText, options = {}) => (
    <View style={styles.inputWrapper}>
      <View style={styles.inputIconBox}>
        <Ionicons name={icon} size={moderateScale(18)} color={COLORS.primary} />
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        value={value}
        onChangeText={onChangeText}
        editable={!loading}
        {...options}
      />
      {options.secureTextEntry !== undefined && (
        <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)} style={styles.eyeButton}>
          <Ionicons name={secureEntry ? 'eye-off-outline' : 'eye-outline'} size={moderateScale(18)} color={COLORS.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <Ionicons name="shield-checkmark" size={moderateScale(40)} color={COLORS.textInverse} />
              </View>
            </View>
            <Text style={styles.appName}>ElephantGuard</Text>
            <Text style={styles.tagline}>Railway Safety System</Text>
          </View>
          {isOfflineMode && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline-outline" size={moderateScale(14)} color={COLORS.textInverse} />
              <Text style={styles.offlineText}>Offline Mode</Text>
            </View>
          )}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.formSubtitle}>{isSignUp ? 'Register to get started with the safety system' : 'Sign in to continue monitoring'}</Text>

          {isSignUp && (
            <>
              {renderInput('person-outline', 'Full Name', displayName, setDisplayName, { autoCapitalize: 'words' })}
              {renderInput('train-outline', 'Train Registration (e.g., TR-1234)', trainNumber, setTrainNumber, { autoCapitalize: 'characters' })}
            </>
          )}
          {renderInput('mail-outline', 'Email Address', email, setEmail, { autoCapitalize: 'none', autoCorrect: false, keyboardType: 'email-address' })}
          {renderInput('lock-closed-outline', 'Password', password, setPassword, { secureTextEntry: secureEntry })}
          {isSignUp && renderInput('lock-closed-outline', 'Confirm Password', confirmPassword, setConfirmPassword, { secureTextEntry: true })}

          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={isSignUp ? handleSignUp : handleSignIn} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={COLORS.textInverse} /> : (
              <View style={styles.submitButtonContent}>
                <Text style={styles.submitButtonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
                <Ionicons name="arrow-forward" size={moderateScale(18)} color={COLORS.textInverse} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleButton} onPress={toggleMode} disabled={loading}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleTextBold}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Ionicons name="lock-closed" size={moderateScale(12)} color={COLORS.textTertiary} />
            <Text style={styles.footerText}>Secured with end-to-end encryption</Text>
          </View>
          <Text style={styles.footerSub}>Sign up once online, then use anywhere offline</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDark },
  scrollContent: { flexGrow: 1 },
  topSection: {
    paddingTop: Platform.OS === 'ios' ? SPACING['4xl'] : SPACING['3xl'],
    paddingBottom: SPACING['2xl'],
    alignItems: 'center',
  },
  logoContainer: { alignItems: 'center' },
  logoOuter: {
    width: moderateScale(90), height: moderateScale(90), borderRadius: moderateScale(45),
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.base,
  },
  logoInner: {
    width: moderateScale(68), height: moderateScale(68), borderRadius: moderateScale(34),
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.colored(COLORS.primary),
  },
  appName: { fontSize: moderateScale(28), fontWeight: '800', color: COLORS.textInverse, letterSpacing: -0.5, marginBottom: SPACING.xs },
  tagline: { fontSize: moderateScale(14), color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  offlineBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    marginTop: SPACING.md, gap: SPACING.xs,
  },
  offlineText: { color: COLORS.textInverse, fontSize: moderateScale(12), fontWeight: '700' },
  formCard: {
    flex: 1, backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'],
    paddingHorizontal: SPACING.xl, paddingTop: SPACING['2xl'], paddingBottom: SPACING.lg,
  },
  formTitle: { ...FONTS.h1, color: COLORS.text, marginBottom: SPACING.xs },
  formSubtitle: { ...FONTS.body, color: COLORS.textTertiary, marginBottom: SPACING.xl },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border,
    marginBottom: SPACING.md, overflow: 'hidden',
  },
  inputIconBox: { width: moderateScale(44), alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, paddingVertical: Platform.OS === 'ios' ? SPACING.base : SPACING.md,
    paddingRight: SPACING.base, fontSize: moderateScale(15), color: COLORS.text,
  },
  eyeButton: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  submitButton: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base, marginTop: SPACING.sm,
    ...SHADOWS.colored(COLORS.primary),
  },
  submitButtonDisabled: { backgroundColor: COLORS.primaryLight, opacity: 0.7 },
  submitButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  submitButtonText: { color: COLORS.textInverse, fontSize: moderateScale(16), fontWeight: '700', letterSpacing: 0.3 },
  toggleButton: { marginTop: SPACING.lg, alignItems: 'center', paddingVertical: SPACING.sm },
  toggleText: { fontSize: moderateScale(14), color: COLORS.textSecondary },
  toggleTextBold: { color: COLORS.primary, fontWeight: '700' },
  footer: {
    backgroundColor: COLORS.surface,
    paddingBottom: Platform.OS === 'ios' ? SPACING['3xl'] : SPACING.xl,
    paddingHorizontal: SPACING.xl, alignItems: 'center',
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  footerText: { fontSize: moderateScale(12), color: COLORS.textTertiary, fontWeight: '500' },
  footerSub: { fontSize: moderateScale(11), color: COLORS.textTertiary },
});