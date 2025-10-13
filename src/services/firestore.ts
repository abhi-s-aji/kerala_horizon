import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from './auth';

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  mood: 'relaxation' | 'adventure' | 'spiritual' | 'cultural' | 'family';
  itinerary: ItineraryItem[];
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ItineraryItem {
  id: string;
  date: string;
  time: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  type: 'transport' | 'accommodation' | 'food' | 'activity' | 'sightseeing';
  cost: number;
  duration: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled';
}

export interface BlogPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  images: string[];
  location: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Timestamp;
}

export interface GreenScoreActivity {
  id: string;
  userId: string;
  activity: string;
  points: number;
  description: string;
  createdAt: Timestamp;
}

class FirestoreService {
  // User Profile Management
  async saveUserProfile(userProfile: UserProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userProfile.uid), userProfile);
    } catch (error) {
      throw new Error(`Failed to save user profile: ${error}`);
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error}`);
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserProfile['preferences']>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { preferences });
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error}`);
    }
  }

  // Trip Management
  async createTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const tripData = {
        ...trip,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, 'trips'), tripData);
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to create trip: ${error}`);
    }
  }

  async getUserTrips(userId: string): Promise<Trip[]> {
    try {
      const q = query(
        collection(db, 'trips'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trip[];
    } catch (error) {
      throw new Error(`Failed to get user trips: ${error}`);
    }
  }

  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<void> {
    try {
      const tripRef = doc(db, 'trips', tripId);
      await updateDoc(tripRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      throw new Error(`Failed to update trip: ${error}`);
    }
  }

  // Blog Management
  async createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const postData = {
        ...post,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, 'blogPosts'), postData);
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to create blog post: ${error}`);
    }
  }

  async getBlogPosts(limitCount: number = 10): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, 'blogPosts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
    } catch (error) {
      throw new Error(`Failed to get blog posts: ${error}`);
    }
  }

  // Green Score Management
  async addGreenScoreActivity(activity: Omit<GreenScoreActivity, 'id' | 'createdAt'>): Promise<string> {
    try {
      const activityData = {
        ...activity,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'greenScoreActivities'), activityData);
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to add green score activity: ${error}`);
    }
  }

  async getUserGreenScore(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'greenScoreActivities'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.reduce((total, doc) => {
        const data = doc.data() as GreenScoreActivity;
        return total + data.points;
      }, 0);
    } catch (error) {
      throw new Error(`Failed to get green score: ${error}`);
    }
  }

  // Real-time listeners
  subscribeToUserTrips(userId: string, callback: (trips: Trip[]) => void): () => void {
    const q = query(
      collection(db, 'trips'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const trips = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trip[];
      callback(trips);
    });
  }

  subscribeToBlogPosts(callback: (posts: BlogPost[]) => void): () => void {
    const q = query(
      collection(db, 'blogPosts'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (querySnapshot) => {
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
      callback(posts);
    });
  }
}

export const firestoreService = new FirestoreService();

