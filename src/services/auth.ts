import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences: {
    language: string;
    theme: 'light' | 'dark';
    notifications: boolean;
    accessibility: {
      highContrast: boolean;
      fontSize: number;
      screenReader: boolean;
    };
  };
  greenScore: number;
  travelHistory: string[];
}

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
    });
  }

  // Email/Password Authentication
  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName,
        photoURL: userCredential.user.photoURL || undefined,
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
    } catch (error) {
      throw new Error(`Sign up failed: ${error}`);
    }
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return this.getUserProfile(userCredential.user);
    } catch (error) {
      throw new Error(`Sign in failed: ${error}`);
    }
  }

  // Google Authentication
  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return this.getUserProfile(result.user);
    } catch (error) {
      throw new Error(`Google sign in failed: ${error}`);
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(`Sign out failed: ${error}`);
    }
  }

  // Get Current User
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get User Profile
  private getUserProfile(user: User): UserProfile {
    return {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || undefined,
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
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export const authService = new AuthService();

