// Green Score Service for Eco-Friendly Travel Tracking
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export interface GreenScoreActivity {
  id: string;
  type: 'transport' | 'accommodation' | 'food' | 'activity' | 'shopping';
  action: string;
  points: number;
  description: string;
  timestamp: Date;
  location?: string;
  carbonSaved?: number; // in kg CO2
}

export interface GreenScoreProfile {
  userId: string;
  totalScore: number;
  level: number;
  badge: string;
  activities: GreenScoreActivity[];
  achievements: string[];
  carbonFootprint: number; // total kg CO2 saved
  lastUpdated: Date;
}

export interface GreenScoreBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredScore: number;
  category: 'transport' | 'accommodation' | 'food' | 'activity' | 'overall';
}

class GreenScoreService {
  private readonly POINTS_PER_LEVEL = 100;
  private readonly BADGES: GreenScoreBadge[] = [
    {
      id: 'eco-explorer',
      name: 'Eco Explorer',
      description: 'Started your green journey',
      icon: '🌱',
      requiredScore: 50,
      category: 'overall'
    },
    {
      id: 'green-commuter',
      name: 'Green Commuter',
      description: 'Used eco-friendly transport',
      icon: '🚲',
      requiredScore: 100,
      category: 'transport'
    },
    {
      id: 'sustainable-stayer',
      name: 'Sustainable Stayer',
      description: 'Chose eco-friendly accommodation',
      icon: '🏨',
      requiredScore: 150,
      category: 'accommodation'
    },
    {
      id: 'local-foodie',
      name: 'Local Foodie',
      description: 'Supported local and organic food',
      icon: '🍃',
      requiredScore: 200,
      category: 'food'
    },
    {
      id: 'nature-lover',
      name: 'Nature Lover',
      description: 'Engaged in eco-friendly activities',
      icon: '🌿',
      requiredScore: 250,
      category: 'activity'
    },
    {
      id: 'eco-warrior',
      name: 'Eco Warrior',
      description: 'Champion of sustainable travel',
      icon: '🛡️',
      requiredScore: 500,
      category: 'overall'
    },
    {
      id: 'carbon-neutral',
      name: 'Carbon Neutral',
      description: 'Achieved carbon neutral travel',
      icon: '⚖️',
      requiredScore: 1000,
      category: 'overall'
    }
  ];

  // Get user's green score profile
  async getUserGreenScore(userId: string): Promise<GreenScoreProfile | null> {
    try {
      const docRef = doc(db, 'greenScores', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          activities: data.activities.map((activity: any) => ({
            ...activity,
            timestamp: activity.timestamp.toDate()
          })),
          lastUpdated: data.lastUpdated.toDate()
        } as GreenScoreProfile;
      }
      
      // Create new profile if doesn't exist
      const newProfile: GreenScoreProfile = {
        userId,
        totalScore: 0,
        level: 1,
        badge: 'eco-explorer',
        activities: [],
        achievements: [],
        carbonFootprint: 0,
        lastUpdated: new Date()
      };
      
      await this.createUserGreenScore(newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error getting green score:', error);
      return null;
    }
  }

  // Create new green score profile
  async createUserGreenScore(profile: GreenScoreProfile): Promise<void> {
    try {
      const docRef = doc(db, 'greenScores', profile.userId);
      await setDoc(docRef, {
        ...profile,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error creating green score:', error);
      throw error;
    }
  }

  // Add activity and update score
  async addActivity(userId: string, activity: Omit<GreenScoreActivity, 'id' | 'timestamp'>): Promise<GreenScoreProfile | null> {
    try {
      const profile = await this.getUserGreenScore(userId);
      if (!profile) return null;

      const newActivity: GreenScoreActivity = {
        ...activity,
        id: Date.now().toString(),
        timestamp: new Date()
      };

      const updatedProfile = {
        ...profile,
        totalScore: profile.totalScore + activity.points,
        activities: [...profile.activities, newActivity],
        carbonFootprint: profile.carbonFootprint + (activity.carbonSaved || 0),
        lastUpdated: new Date()
      };

      // Update level and badge
      updatedProfile.level = Math.floor(updatedProfile.totalScore / this.POINTS_PER_LEVEL) + 1;
      updatedProfile.badge = this.getCurrentBadge(updatedProfile.totalScore);
      
      // Check for new achievements
      const newAchievements = this.checkAchievements(updatedProfile);
      updatedProfile.achievements = Array.from(new Set([...profile.achievements, ...newAchievements]));

      // Update in Firestore
      const docRef = doc(db, 'greenScores', userId);
      await updateDoc(docRef, {
        totalScore: updatedProfile.totalScore,
        level: updatedProfile.level,
        badge: updatedProfile.badge,
        activities: updatedProfile.activities,
        achievements: updatedProfile.achievements,
        carbonFootprint: updatedProfile.carbonFootprint,
        lastUpdated: new Date()
      });

      return updatedProfile;
    } catch (error) {
      console.error('Error adding activity:', error);
      return null;
    }
  }

  // Get current badge based on score
  private getCurrentBadge(score: number): string {
    const sortedBadges = this.BADGES.sort((a, b) => b.requiredScore - a.requiredScore);
    const currentBadge = sortedBadges.find(badge => score >= badge.requiredScore);
    return currentBadge?.id || 'eco-explorer';
  }

  // Check for new achievements
  private checkAchievements(profile: GreenScoreProfile): string[] {
    const newAchievements: string[] = [];
    
    // Check for badge achievements
    const currentBadge = this.BADGES.find(badge => badge.id === profile.badge);
    if (currentBadge && !profile.achievements.includes(currentBadge.id)) {
      newAchievements.push(currentBadge.id);
    }

    // Check for milestone achievements
    if (profile.totalScore >= 100 && !profile.achievements.includes('century-club')) {
      newAchievements.push('century-club');
    }
    
    if (profile.totalScore >= 500 && !profile.achievements.includes('half-millennium')) {
      newAchievements.push('half-millennium');
    }
    
    if (profile.totalScore >= 1000 && !profile.achievements.includes('millennium-master')) {
      newAchievements.push('millennium-master');
    }

    // Check for category-specific achievements
    const categoryCounts = profile.activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count >= 10 && !profile.achievements.includes(`${category}-expert`)) {
        newAchievements.push(`${category}-expert`);
      }
    });

    return newAchievements;
  }

  // Get all available badges
  getBadges(): GreenScoreBadge[] {
    return this.BADGES;
  }

  // Get badge by ID
  getBadge(badgeId: string): GreenScoreBadge | undefined {
    return this.BADGES.find(badge => badge.id === badgeId);
  }

  // Calculate points for specific activities
  calculatePoints(activityType: string, activityDetails: any): { points: number; carbonSaved: number } {
    switch (activityType) {
      case 'transport':
        return this.calculateTransportPoints(activityDetails);
      case 'accommodation':
        return this.calculateAccommodationPoints(activityDetails);
      case 'food':
        return this.calculateFoodPoints(activityDetails);
      case 'activity':
        return this.calculateActivityPoints(activityDetails);
      case 'shopping':
        return this.calculateShoppingPoints(activityDetails);
      default:
        return { points: 0, carbonSaved: 0 };
    }
  }

  private calculateTransportPoints(details: any): { points: number; carbonSaved: number } {
    const { mode, distance } = details;
    
    switch (mode) {
      case 'walking':
        return { points: 5, carbonSaved: 0.1 * (distance || 1) };
      case 'cycling':
        return { points: 10, carbonSaved: 0.2 * (distance || 1) };
      case 'public_transport':
        return { points: 15, carbonSaved: 0.5 * (distance || 1) };
      case 'electric_vehicle':
        return { points: 20, carbonSaved: 0.8 * (distance || 1) };
      case 'shared_ride':
        return { points: 8, carbonSaved: 0.3 * (distance || 1) };
      case 'private_car':
        return { points: 2, carbonSaved: 0.1 * (distance || 1) };
      default:
        return { points: 0, carbonSaved: 0 };
    }
  }

  private calculateAccommodationPoints(details: any): { points: number; carbonSaved: number } {
    const { type, ecoCertified, nights } = details;
    let points = 0;
    let carbonSaved = 0;

    switch (type) {
      case 'homestay':
        points = 25;
        carbonSaved = 5;
        break;
      case 'eco_resort':
        points = 30;
        carbonSaved = 8;
        break;
      case 'ktdc':
        points = 15;
        carbonSaved = 3;
        break;
      case 'budget_hotel':
        points = 10;
        carbonSaved = 2;
        break;
      case 'luxury_hotel':
        points = 5;
        carbonSaved = 1;
        break;
    }

    if (ecoCertified) {
      points += 10;
      carbonSaved += 2;
    }

    return { 
      points: points * (nights || 1), 
      carbonSaved: carbonSaved * (nights || 1) 
    };
  }

  private calculateFoodPoints(details: any): { points: number; carbonSaved: number } {
    const { type, local, organic } = details;
    let points = 0;
    let carbonSaved = 0;

    switch (type) {
      case 'local_restaurant':
        points = 15;
        carbonSaved = 2;
        break;
      case 'street_food':
        points = 20;
        carbonSaved = 3;
        break;
      case 'organic_restaurant':
        points = 25;
        carbonSaved = 4;
        break;
      case 'chain_restaurant':
        points = 5;
        carbonSaved = 1;
        break;
    }

    if (local) {
      points += 5;
      carbonSaved += 1;
    }

    if (organic) {
      points += 10;
      carbonSaved += 2;
    }

    return { points, carbonSaved };
  }

  private calculateActivityPoints(details: any): { points: number; carbonSaved: number } {
    const { type, ecoFriendly } = details;
    let points = 0;
    let carbonSaved = 0;

    switch (type) {
      case 'nature_trail':
        points = 20;
        carbonSaved = 3;
        break;
      case 'cultural_heritage':
        points = 15;
        carbonSaved = 2;
        break;
      case 'eco_tourism':
        points = 30;
        carbonSaved = 5;
        break;
      case 'adventure_sport':
        points = 10;
        carbonSaved = 1;
        break;
      case 'shopping_mall':
        points = 2;
        carbonSaved = 0;
        break;
    }

    if (ecoFriendly) {
      points += 10;
      carbonSaved += 2;
    }

    return { points, carbonSaved };
  }

  private calculateShoppingPoints(details: any): { points: number; carbonSaved: number } {
    const { type, local, sustainable } = details;
    let points = 0;
    let carbonSaved = 0;

    switch (type) {
      case 'local_market':
        points = 20;
        carbonSaved = 3;
        break;
      case 'artisan_shop':
        points = 25;
        carbonSaved = 4;
        break;
      case 'souvenir_shop':
        points = 10;
        carbonSaved = 1;
        break;
      case 'chain_store':
        points = 2;
        carbonSaved = 0;
        break;
    }

    if (local) {
      points += 10;
      carbonSaved += 2;
    }

    if (sustainable) {
      points += 15;
      carbonSaved += 3;
    }

    return { points, carbonSaved };
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<Array<{ userId: string; score: number; badge: string }>> {
    try {
      // This would typically be done with a Firestore query
      // For now, return mock data
      return [
        { userId: 'user1', score: 1250, badge: 'carbon-neutral' },
        { userId: 'user2', score: 850, badge: 'eco-warrior' },
        { userId: 'user3', score: 650, badge: 'nature-lover' },
        { userId: 'user4', score: 450, badge: 'local-foodie' },
        { userId: 'user5', score: 350, badge: 'sustainable-stayer' }
      ];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
}

export const greenScoreService = new GreenScoreService();
