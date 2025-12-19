import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext({
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: true,
  isOfflineMode: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsOfflineMode(false);
        
        // Load user profile
        const profile = await authService.getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const result = await authService.signIn(email, password);
      
      if (result.success) {
        setUser(result.user);
        setIsOfflineMode(result.isOffline || false);
        
        // Store password hash for offline auth
        if (!result.isOffline) {
          await authService.storePasswordHash(email, password);
        }
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const signUp = async (email, password, displayName, trainNumber) => {
    try {
      const result = await authService.registerUser(email, password, displayName, trainNumber);
      
      if (result.success) {
        setUser(result.user);
        setIsOfflineMode(false);
        
        // Load user profile
        const profile = await authService.getUserProfile(result.user.uid);
        setUserProfile(profile);
        
        // Store password hash for offline auth
        await authService.storePasswordHash(email, password);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const signOut = async () => {
    try {
      const result = await authService.signOut();
      
      if (result.success) {
        setUser(null);
        setUserProfile(null);
        setIsOfflineMode(false);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      const result = await authService.updateUserProfile(user.uid, updates);
      
      if (result.success) {
        // Refresh user profile
        const profile = await authService.getUserProfile(user.uid);
        setUserProfile(profile);
        
        // Update user state if display name changed
        if (updates.displayName) {
          setUser({ ...user, displayName: updates.displayName });
        }
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const refreshProfile = async () => {
    try {
      if (!user) return;
      
      const profile = await authService.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const resetPassword = async (email) => {
    return await authService.resetPassword(email);
  };

  const value = {
    user,
    userProfile,
    isAuthenticated: !!user,
    isLoading,
    isOfflineMode,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

