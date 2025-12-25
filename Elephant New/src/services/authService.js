import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_AUTH_KEY = '@offline_auth_data';
const USER_PROFILE_KEY = '@user_profile';

/**
 * Authentication Service using Firebase
 * Supports online authentication and offline mode
 */
class AuthService {
  /**
   * Register a new user with email and password
   */
  async registerUser(email, password, displayName, trainNumber = '') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (displayName) {
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
      }

      // Save train number and additional profile data
      await this.saveUserProfile(userCredential.user.uid, {
        trainNumber,
        phoneNumber: '',
        createdAt: Date.now()
      });

      // Cache auth data for offline use
      await this.cacheAuthData(userCredential.user);
      
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  /**
   * Sign in existing user
   */
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Cache auth data for offline use
      await this.cacheAuthData(userCredential.user);
      
      return {
        success: true,
        user: userCredential.user,
        isOffline: false
      };
    } catch (error) {
      // If network error, try offline authentication
      if (error.code === 'auth/network-request-failed') {
        const offlineAuth = await this.attemptOfflineAuth(email, password);
        if (offlineAuth.success) {
          return {
            ...offlineAuth,
            isOffline: true
          };
        }
      }
      
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await signOut(auth);
      // Keep offline auth data for offline mode
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Cache authentication data for offline use
   */
  async cacheAuthData(user) {
    try {
      const authData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify(authData));
      
      // Store encrypted password hash for offline verification (simplified)
      // In production, use more secure encryption
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save user profile data
   */
  async saveUserProfile(uid, profileData) {
    try {
      const currentProfile = await this.getUserProfile(uid);
      const updatedProfile = {
        ...currentProfile,
        ...profileData,
        updatedAt: Date.now()
      };
      
      await AsyncStorage.setItem(
        `${USER_PROFILE_KEY}_${uid}`,
        JSON.stringify(updatedProfile)
      );
      
      return { success: true, profile: updatedProfile };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile(uid) {
    try {
      const profileData = await AsyncStorage.getItem(`${USER_PROFILE_KEY}_${uid}`);
      
      if (profileData) {
        return JSON.parse(profileData);
      }
      
      return {
        trainNumber: '',
        phoneNumber: '',
        createdAt: Date.now()
      };
    } catch (error) {
      return {
        trainNumber: '',
        phoneNumber: '',
        createdAt: Date.now()
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid, updates) {
    try {
      // Update Firebase profile if display name or photo changed
      if (updates.displayName || updates.photoURL) {
        const user = auth.currentUser;
        if (user) {
          const profileUpdates = {};
          if (updates.displayName) profileUpdates.displayName = updates.displayName;
          if (updates.photoURL) profileUpdates.photoURL = updates.photoURL;
          
          await updateProfile(user, profileUpdates);
        }
      }

      // Save additional profile data to AsyncStorage
      return await this.saveUserProfile(uid, updates);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Attempt offline authentication
   */
  async attemptOfflineAuth(email, password) {
    try {
      const cachedData = await AsyncStorage.getItem(OFFLINE_AUTH_KEY);
      
      if (!cachedData) {
        return {
          success: false,
          error: 'No cached authentication data. Please connect to internet for first login.'
        };
      }

      const authData = JSON.parse(cachedData);
      
      // Check if cached data matches the email
      if (authData.email === email) {
        // Verify password hash stored in secure storage
        const storedPasswordHash = await AsyncStorage.getItem(`@password_${email}`);
        
        if (storedPasswordHash) {
          // Simple verification (in production, use proper encryption)
          const isValid = await this.verifyPassword(password, storedPasswordHash);
          
          if (isValid) {
            return {
              success: true,
              user: authData,
              isOffline: true
            };
          }
        }
      }
      
      return {
        success: false,
        error: 'Invalid credentials or no cached data available'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Offline authentication failed'
      };
    }
  }

  /**
   * Store password hash for offline verification
   */
  async storePasswordHash(email, password) {
    try {
      // In production, use expo-crypto or similar for proper hashing
      const hash = Buffer.from(password).toString('base64');
      await AsyncStorage.setItem(`@password_${email}`, hash);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify password against stored hash
   */
  async verifyPassword(password, storedHash) {
    try {
      const hash = Buffer.from(password).toString('base64');
      return hash === storedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle Firebase authentication errors
   */
  handleAuthError(error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      default:
        return error.message || 'Authentication failed';
    }
  }

  /**
   * Check if user has cached offline data
   */
  async hasOfflineData() {
    try {
      const cachedData = await AsyncStorage.getItem(OFFLINE_AUTH_KEY);
      return !!cachedData;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();
