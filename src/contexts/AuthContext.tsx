import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../services/auth';
import { authService } from '../services/auth';
import { firestoreService } from '../services/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserProfile['preferences']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.getCurrentUser();
    if (unsubscribe) {
      // User is already signed in
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        let userProfile = await firestoreService.getUserProfile(currentUser.uid);
        if (!userProfile) {
          // Create new user profile
          userProfile = {
            uid: currentUser.uid,
            email: currentUser.email!,
            displayName: currentUser.displayName || 'Anonymous',
            photoURL: currentUser.photoURL || undefined,
            preferences: {
              language: 'en',
              theme: 'light',
              notifications: true,
              accessibility: {
                highContrast: false,
                fontSize: 16,
                screenReader: false
              }
            },
            greenScore: 0,
            travelHistory: []
          };
          await firestoreService.saveUserProfile(userProfile);
        }
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await authService.signIn(email, password);
      await loadUserProfile();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      const userProfile = await authService.signUp(email, password, displayName);
      await firestoreService.saveUserProfile(userProfile);
      setUser(userProfile);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await authService.signInWithGoogle();
      await loadUserProfile();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (preferences: Partial<UserProfile['preferences']>) => {
    if (!user) return;
    
    try {
      await firestoreService.updateUserPreferences(user.uid, preferences);
      setUser({
        ...user,
        preferences: { ...user.preferences, ...preferences }
      });
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updatePreferences
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

