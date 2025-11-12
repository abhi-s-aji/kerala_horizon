// Complete User Backend Service with Firebase Integration
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleAPIError } from '../utils/errorHandler';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences: UserPreferences;
  travelHistory: TravelRecord[];
  bookings: BookingRecord[];
  reviews: ReviewRecord[];
  greenScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    screenReader: boolean;
  };
  travel: {
    budgetRange: [number, number];
    preferredAccommodation: string[];
    dietaryRestrictions: string[];
    interests: string[];
  };
}

export interface TravelRecord {
  id: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  companions: number;
  budget: number;
  activities: string[];
  rating: number;
  notes?: string;
}

export interface BookingRecord {
  id: string;
  type: 'hotel' | 'transport' | 'event' | 'experience';
  itemId: string;
  itemName: string;
  bookingDate: Date;
  travelDate: Date;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  confirmationNumber: string;
}

export interface ReviewRecord {
  id: string;
  itemType: 'hotel' | 'restaurant' | 'attraction' | 'transport';
  itemId: string;
  itemName: string;
  rating: number;
  review: string;
  photos?: string[];
  date: Date;
  helpful: number;
}

class UserService {
  private currentUser: User | null = null;
  private userProfile: UserProfile | null = null;

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.loadUserProfile(user.uid);
      } else {
        this.userProfile = null;
      }
    });
  }

  // Authentication Methods
  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      const userProfile = await this.createUserProfile(user, displayName);
      
      return userProfile;
    } catch (error) {
      throw new Error(handleAPIError(error, 'User Registration'));
    }
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userProfile = await this.loadUserProfile(user.uid);
      return userProfile;
    } catch (error) {
      throw new Error(handleAPIError(error, 'User Sign In'));
    }
  }

  async signInWithGoogle(): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile exists, create if not
      let userProfile = await this.getUserProfile(user.uid);
      if (!userProfile) {
        userProfile = await this.createUserProfile(user, user.displayName || 'User');
      }

      return userProfile;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Google Sign In'));
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      this.currentUser = null;
      this.userProfile = null;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Sign Out'));
    }
  }

  // User Profile Methods
  private async createUserProfile(user: User, displayName: string): Promise<UserProfile> {
    const defaultPreferences: UserPreferences = {
      language: 'en',
      currency: 'INR',
      theme: 'auto',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        screenReader: false
      },
      travel: {
        budgetRange: [5000, 50000],
        preferredAccommodation: ['hotel', 'resort'],
        dietaryRestrictions: [],
        interests: ['culture', 'nature', 'food']
      }
    };

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      photoURL: user.photoURL || undefined,
      preferences: defaultPreferences,
      travelHistory: [],
      bookings: [],
      reviews: [],
      greenScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    this.userProfile = userProfile;
    
    return userProfile;
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as UserProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  private async loadUserProfile(uid: string): Promise<UserProfile> {
    const profile = await this.getUserProfile(uid);
    if (profile) {
      this.userProfile = profile;
      return profile;
    }
    
    // Create profile if it doesn't exist
    if (this.currentUser) {
      return await this.createUserProfile(this.currentUser, this.currentUser.displayName || 'User');
    }
    
    throw new Error('Unable to load user profile');
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const docRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Update local profile
      if (this.userProfile) {
        this.userProfile = { ...this.userProfile, ...updates, updatedAt: new Date() };
      }
    } catch (error) {
      throw new Error(handleAPIError(error, 'Profile Update'));
    }
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.userProfile) {
      throw new Error('User profile not loaded');
    }

    const updatedPreferences = { ...this.userProfile.preferences, ...preferences };
    await this.updateUserProfile({ preferences: updatedPreferences });
  }

  // Travel History Methods
  async addTravelRecord(record: Omit<TravelRecord, 'id'>): Promise<string> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const docRef = await addDoc(collection(db, 'users', this.currentUser.uid, 'travelHistory'), {
        ...record,
        createdAt: new Date()
      });

      // Update green score based on travel record
      await this.updateGreenScore(record);

      return docRef.id;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Travel Record Creation'));
    }
  }

  async getTravelHistory(): Promise<TravelRecord[]> {
    if (!this.currentUser) {
      return [];
    }

    try {
      const q = query(
        collection(db, 'users', this.currentUser.uid, 'travelHistory'),
        orderBy('startDate', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate()
      })) as TravelRecord[];
    } catch (error) {
      console.error('Error loading travel history:', error);
      return [];
    }
  }

  // Booking Methods
  async addBookingRecord(record: Omit<BookingRecord, 'id'>): Promise<string> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const docRef = await addDoc(collection(db, 'users', this.currentUser.uid, 'bookings'), {
        ...record,
        createdAt: new Date()
      });

      return docRef.id;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Booking Record Creation'));
    }
  }

  async getBookingHistory(): Promise<BookingRecord[]> {
    if (!this.currentUser) {
      return [];
    }

    try {
      const q = query(
        collection(db, 'users', this.currentUser.uid, 'bookings'),
        orderBy('bookingDate', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        bookingDate: doc.data().bookingDate.toDate(),
        travelDate: doc.data().travelDate.toDate()
      })) as BookingRecord[];
    } catch (error) {
      console.error('Error loading booking history:', error);
      return [];
    }
  }

  // Review Methods
  async addReview(review: Omit<ReviewRecord, 'id' | 'helpful'>): Promise<string> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        ...review,
        userId: this.currentUser.uid,
        userName: this.userProfile?.displayName || 'Anonymous',
        helpful: 0,
        createdAt: new Date()
      });

      // Add to user's review history
      await addDoc(collection(db, 'users', this.currentUser.uid, 'reviews'), {
        reviewId: docRef.id,
        ...review,
        helpful: 0
      });

      return docRef.id;
    } catch (error) {
      throw new Error(handleAPIError(error, 'Review Creation'));
    }
  }

  async getUserReviews(): Promise<ReviewRecord[]> {
    if (!this.currentUser) {
      return [];
    }

    try {
      const q = query(
        collection(db, 'users', this.currentUser.uid, 'reviews'),
        orderBy('date', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as ReviewRecord[];
    } catch (error) {
      console.error('Error loading user reviews:', error);
      return [];
    }
  }

  // Green Score Methods
  private async updateGreenScore(travelRecord: Omit<TravelRecord, 'id'>): Promise<void> {
    if (!this.userProfile) return;

    let scoreIncrease = 0;

    // Calculate green score based on activities
    if (travelRecord.activities.includes('public_transport')) scoreIncrease += 10;
    if (travelRecord.activities.includes('eco_hotel')) scoreIncrease += 15;
    if (travelRecord.activities.includes('local_food')) scoreIncrease += 5;
    if (travelRecord.activities.includes('walking')) scoreIncrease += 8;
    if (travelRecord.activities.includes('cycling')) scoreIncrease += 12;

    const newGreenScore = this.userProfile.greenScore + scoreIncrease;
    await this.updateUserProfile({ greenScore: newGreenScore });
  }

  // Getters
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.userProfile;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Data Export/Import
  async exportUserData(): Promise<any> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const [profile, travelHistory, bookings, reviews] = await Promise.all([
      this.getUserProfile(this.currentUser.uid),
      this.getTravelHistory(),
      this.getBookingHistory(),
      this.getUserReviews()
    ]);

    return {
      profile,
      travelHistory,
      bookings,
      reviews,
      exportDate: new Date().toISOString()
    };
  }
}

export const userService = new UserService();























