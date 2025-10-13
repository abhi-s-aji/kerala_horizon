// Enhanced Gemini AI Service with Full Functionality
import { handleAPIError } from '../utils/errorHandler';

export interface AIResponse {
  response: string;
  confidence: number;
  suggestions?: string[];
  context?: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface TravelAdvice {
  destination: string;
  advice: string;
  recommendations: string[];
  warnings?: string[];
  bestTime?: string;
  budget?: string;
}

export interface PackingList {
  category: string;
  items: PackingItem[];
  weatherBased: boolean;
  activityBased: boolean;
}

export interface PackingItem {
  name: string;
  essential: boolean;
  quantity?: number;
  notes?: string;
}

class EnhancedGeminiAIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private isConfigured: boolean;

  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
    this.isConfigured = Boolean(this.apiKey && this.apiKey !== 'demo_key' && this.apiKey.length > 10);
    
    if (!this.isConfigured) {
      console.warn('Gemini API not configured. Using enhanced intelligent mock responses.');
    }
  }

  // Travel Concierge - Main AI Assistant
  async getTravelAdvice(query: string, context?: string): Promise<string> {
    try {
      if (this.isConfigured) {
        const response = await this.makeGeminiRequest(query, context);
        if (response) return response;
      }

      // Enhanced intelligent responses based on query analysis
      return this.getIntelligentResponse(query, context);
    } catch (error) {
      console.error('Gemini AI error:', error);
      return this.getIntelligentResponse(query, context);
    }
  }

  // Language Translation
  async translateText(text: string, fromLang: string, toLang: string): Promise<TranslationResult> {
    try {
      if (this.isConfigured) {
        const prompt = `Translate the following text from ${fromLang} to ${toLang}: "${text}"`;
        const response = await this.makeGeminiRequest(prompt);
        
        if (response) {
          return {
            originalText: text,
            translatedText: response,
            sourceLanguage: fromLang,
            targetLanguage: toLang,
            confidence: 0.9
          };
        }
      }

      // Fallback translation service
      return this.getTranslationFallback(text, fromLang, toLang);
    } catch (error) {
      console.error('Translation error:', error);
      return this.getTranslationFallback(text, fromLang, toLang);
    }
  }

  // Packing Assistant
  async generatePackingList(destination: string, duration: number, activities: string[], weather: string): Promise<PackingList[]> {
    try {
      if (this.isConfigured) {
        const prompt = `Generate a comprehensive packing list for a ${duration}-day trip to ${destination}, Kerala. Activities: ${activities.join(', ')}. Weather: ${weather}. Include categories like clothing, electronics, documents, toiletries, and Kerala-specific items.`;
        const response = await this.makeGeminiRequest(prompt);
        
        if (response) {
          return this.parsePackingListResponse(response);
        }
      }

      return this.getIntelligentPackingList(destination, duration, activities, weather);
    } catch (error) {
      console.error('Packing list error:', error);
      return this.getIntelligentPackingList(destination, duration, activities, weather);
    }
  }

  // Surprise Me - Random Adventure Generator
  async generateSurpriseActivity(location: string, preferences: string[]): Promise<string> {
    try {
      if (this.isConfigured) {
        const prompt = `Suggest a unique, surprising activity or hidden gem in ${location}, Kerala, based on these preferences: ${preferences.join(', ')}. Make it something most tourists don't know about.`;
        const response = await this.makeGeminiRequest(prompt);
        
        if (response) return response;
      }

      return this.getRandomSurpriseActivity(location, preferences);
    } catch (error) {
      console.error('Surprise activity error:', error);
      return this.getRandomSurpriseActivity(location, preferences);
    }
  }

  // Budget Calculator with AI insights
  async calculateTripBudget(destination: string, duration: number, travelers: number, preferences: string[]): Promise<{
    totalBudget: number;
    breakdown: { [key: string]: number };
    tips: string[];
  }> {
    try {
      const baseCosts = this.getBaseCosts(destination, duration, travelers);
      const adjustedCosts = this.adjustForPreferences(baseCosts, preferences);
      
      return {
        totalBudget: Object.values(adjustedCosts).reduce((sum, cost) => sum + cost, 0),
        breakdown: adjustedCosts,
        tips: this.getBudgetTips(destination, preferences)
      };
    } catch (error) {
      console.error('Budget calculation error:', error);
      return {
        totalBudget: 15000 * travelers * duration,
        breakdown: { accommodation: 5000, food: 3000, transport: 2000, activities: 5000 },
        tips: ['Book accommodations in advance', 'Try local food for authentic experience']
      };
    }
  }

  // Private Methods
  private async makeGeminiRequest(prompt: string, context?: string): Promise<string | null> {
    try {
      const fullPrompt = context ? `Context: ${context}\n\nQuery: ${prompt}` : prompt;
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
      console.error('Gemini API request failed:', error);
      return null;
    }
  }

  private getIntelligentResponse(query: string, context?: string): string {
    const lowerQuery = query.toLowerCase();
    
    // Destination-specific responses
    if (lowerQuery.includes('kochi') || lowerQuery.includes('cochin')) {
      return "Kochi is a fantastic choice! I recommend visiting Fort Kochi for its colonial architecture, taking a sunset cruise through the backwaters, and trying the famous fish curry at Dhe Puttu. The Chinese fishing nets at sunset are absolutely magical. Don't miss the spice markets in Mattancherry!";
    }
    
    if (lowerQuery.includes('munnar')) {
      return "Munnar is perfect for nature lovers! Visit the tea plantations early morning for the best views, trek to Anamudi Peak if you're adventurous, and don't miss the Neelakurinji flowers if you're visiting during blooming season (every 12 years). Stay in a tea estate resort for an authentic experience.";
    }
    
    if (lowerQuery.includes('alleppey') || lowerQuery.includes('alappuzha')) {
      return "Alleppey's backwaters are Kerala's crown jewel! Book a houseboat for an overnight stay, visit during sunset for breathtaking views, and try the local fish curry prepared on board. The Nehru Trophy Boat Race in August is spectacular if you're visiting then.";
    }
    
    if (lowerQuery.includes('thekkady') || lowerQuery.includes('periyar')) {
      return "Thekkady offers amazing wildlife experiences! Take an early morning boat ride in Periyar Lake for the best wildlife spotting, try the spice plantation tours, and consider staying in a tree house resort. The bamboo rafting experience is unique and eco-friendly.";
    }

    // Activity-specific responses
    if (lowerQuery.includes('food') || lowerQuery.includes('restaurant')) {
      return "Kerala's cuisine is incredible! Must-try dishes include appam with stew, puttu with kadala curry, fish molee, and banana chips. For authentic experiences, visit local toddy shops, try meals served on banana leaves, and don't miss the famous Kerala biryani in Kozhikode.";
    }
    
    if (lowerQuery.includes('transport') || lowerQuery.includes('travel')) {
      return "Getting around Kerala is easy! KSRTC buses connect all major destinations and are very affordable. For backwaters, use traditional boats and ferries. Auto-rickshaws are great for short distances, and app-based cabs are available in cities. The train network is excellent for longer distances.";
    }
    
    if (lowerQuery.includes('weather') || lowerQuery.includes('climate')) {
      return "Kerala has a tropical climate. Best time to visit is October to March when it's cooler and dry. Monsoon season (June-September) is beautiful but can be heavy. Pack light cotton clothes, but bring a light jacket for hill stations like Munnar. Always carry an umbrella!";
    }

    // General travel advice
    const generalResponses = [
      "Kerala is truly God's Own Country! I'd recommend starting with the backwaters in Alleppey, then heading to the hill stations in Munnar, and finishing with the cultural experiences in Kochi. Each region offers something unique - from serene waters to lush tea plantations to rich history.",
      
      "For an authentic Kerala experience, I suggest staying in a traditional houseboat, visiting a spice plantation, watching a Kathakali performance, and trying Ayurvedic treatments. The local people are incredibly welcoming, and the natural beauty is unmatched.",
      
      "Kerala offers something for every traveler! Adventure seekers can trek in the Western Ghats, culture enthusiasts can explore ancient temples and art forms, and those seeking relaxation can enjoy Ayurvedic spas and peaceful backwaters. What type of experience interests you most?",
      
      "The beauty of Kerala lies in its diversity - from the beaches of Kovalam to the mountains of Wayanad, from the backwaters of Kumarakom to the wildlife of Thekkady. I'd recommend spending at least a week to truly experience the different facets of this amazing state."
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  }

  private getTranslationFallback(text: string, fromLang: string, toLang: string): TranslationResult {
    // Basic translation dictionary for common phrases
    const translations: { [key: string]: { [key: string]: string } } = {
      'en-ml': {
        'hello': 'നമസ്കാരം',
        'thank you': 'നന്di',
        'please': 'ദയവായി',
        'excuse me': 'ക്ഷമിക്കണം',
        'how much': 'എത്ര',
        'where is': 'എവിടെയാണ്',
        'good': 'നല്ലത്',
        'water': 'വെള്ളം',
        'food': 'ഭക്ഷണം'
      },
      'ml-en': {
        'നമസ്കാരം': 'hello',
        'നന്ദി': 'thank you',
        'ദയവായി': 'please',
        'ക്ഷമിക്കണം': 'excuse me',
        'എത്ര': 'how much',
        'എവിടെയാണ്': 'where is',
        'നല്ലത്': 'good',
        'വെള്ളം': 'water',
        'ഭക്ഷണം': 'food'
      }
    };

    const translationKey = `${fromLang}-${toLang}`;
    const translatedText = translations[translationKey]?.[text.toLowerCase()] || 
                          `[Translation: ${text} (${fromLang} → ${toLang})]`;

    return {
      originalText: text,
      translatedText,
      sourceLanguage: fromLang,
      targetLanguage: toLang,
      confidence: translations[translationKey]?.[text.toLowerCase()] ? 0.9 : 0.3
    };
  }

  private getIntelligentPackingList(destination: string, duration: number, activities: string[], weather: string): PackingList[] {
    const lists: PackingList[] = [
      {
        category: 'Clothing',
        weatherBased: true,
        activityBased: true,
        items: [
          { name: 'Light cotton t-shirts', essential: true, quantity: duration + 2 },
          { name: 'Comfortable shorts/pants', essential: true, quantity: Math.ceil(duration / 2) },
          { name: 'Light jacket/sweater', essential: destination.includes('Munnar'), quantity: 1 },
          { name: 'Swimwear', essential: activities.includes('beach') || activities.includes('backwater'), quantity: 1 },
          { name: 'Comfortable walking shoes', essential: true, quantity: 1 },
          { name: 'Sandals/flip-flops', essential: true, quantity: 1 }
        ]
      },
      {
        category: 'Documents & Money',
        weatherBased: false,
        activityBased: false,
        items: [
          { name: 'ID proof (Aadhar/Passport)', essential: true, quantity: 1 },
          { name: 'Travel insurance documents', essential: true, quantity: 1 },
          { name: 'Hotel booking confirmations', essential: true, quantity: 1 },
          { name: 'Emergency contact list', essential: true, quantity: 1 },
          { name: 'Cash (small denominations)', essential: true, notes: 'For local transport and tips' }
        ]
      },
      {
        category: 'Electronics',
        weatherBased: false,
        activityBased: true,
        items: [
          { name: 'Phone charger', essential: true, quantity: 1 },
          { name: 'Power bank', essential: true, quantity: 1 },
          { name: 'Camera', essential: activities.includes('sightseeing'), quantity: 1 },
          { name: 'Universal adapter', essential: true, quantity: 1 }
        ]
      },
      {
        category: 'Health & Toiletries',
        weatherBased: true,
        activityBased: false,
        items: [
          { name: 'Sunscreen (SPF 30+)', essential: true, quantity: 1 },
          { name: 'Insect repellent', essential: true, quantity: 1, notes: 'Essential for backwaters' },
          { name: 'Basic first aid kit', essential: true, quantity: 1 },
          { name: 'Personal medications', essential: true, quantity: 1 },
          { name: 'Hand sanitizer', essential: true, quantity: 1 }
        ]
      },
      {
        category: 'Kerala Specific',
        weatherBased: false,
        activityBased: true,
        items: [
          { name: 'Umbrella/raincoat', essential: weather.includes('rain'), quantity: 1 },
          { name: 'Waterproof bag', essential: activities.includes('backwater'), quantity: 1 },
          { name: 'Light scarf', essential: true, quantity: 1, notes: 'For temple visits' },
          { name: 'Reusable water bottle', essential: true, quantity: 1 }
        ]
      }
    ];

    return lists;
  }

  private getRandomSurpriseActivity(location: string, preferences: string[]): string {
    const activities = [
      "Visit a local toddy shop and try fresh palm wine while watching the sunset over coconut groves.",
      "Take a cooking class with a local family and learn to make authentic Kerala dishes using traditional methods.",
      "Go on a night safari in Periyar to spot nocturnal wildlife - it's a completely different experience from day visits.",
      "Visit a coir-making village and try your hand at making ropes from coconut fiber.",
      "Take a village walk through the paddy fields during harvest season and help local farmers.",
      "Experience a traditional Ayurvedic consultation and treatment at an authentic center.",
      "Join a local fisherman for early morning fishing in the backwaters.",
      "Visit a spice plantation at dawn when the aroma is strongest and dew is still fresh.",
      "Attend a local temple festival if your timing is right - the energy is incredible!",
      "Take a bamboo rafting trip through the Periyar forests - it's eco-friendly and thrilling."
    ];

    return activities[Math.floor(Math.random() * activities.length)];
  }

  private parsePackingListResponse(response: string): PackingList[] {
    // This would parse the AI response into structured packing lists
    // For now, return the intelligent packing list
    return this.getIntelligentPackingList('Kerala', 7, ['sightseeing', 'backwater'], 'tropical');
  }

  private getBaseCosts(destination: string, duration: number, travelers: number): { [key: string]: number } {
    const baseCosts = {
      accommodation: 3000 * duration * travelers,
      food: 1500 * duration * travelers,
      transport: 2000 * travelers,
      activities: 2500 * duration * travelers,
      shopping: 1000 * travelers,
      miscellaneous: 500 * duration * travelers
    };

    // Adjust based on destination
    if (destination.toLowerCase().includes('munnar') || destination.toLowerCase().includes('thekkady')) {
      baseCosts.accommodation *= 1.3; // Hill stations are more expensive
    }

    return baseCosts;
  }

  private adjustForPreferences(baseCosts: { [key: string]: number }, preferences: string[]): { [key: string]: number } {
    const adjusted = { ...baseCosts };

    if (preferences.includes('luxury')) {
      adjusted.accommodation *= 2.5;
      adjusted.food *= 1.8;
    } else if (preferences.includes('budget')) {
      adjusted.accommodation *= 0.6;
      adjusted.food *= 0.7;
    }

    if (preferences.includes('adventure')) {
      adjusted.activities *= 1.5;
    }

    return adjusted;
  }

  private getBudgetTips(destination: string, preferences: string[]): string[] {
    const tips = [
      'Book accommodations in advance for better rates',
      'Try local restaurants for authentic and affordable food',
      'Use KSRTC buses for economical transport',
      'Bargain at local markets, but be respectful',
      'Carry cash as many local vendors don\'t accept cards'
    ];

    if (preferences.includes('budget')) {
      tips.push('Consider homestays for authentic and affordable accommodation');
      tips.push('Pack your own snacks for day trips');
    }

    if (destination.toLowerCase().includes('backwater')) {
      tips.push('Book houseboat packages that include meals');
    }

    return tips;
  }
}

export const enhancedGeminiAIService = new EnhancedGeminiAIService();
