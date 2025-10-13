// Global Search Service for Kerala Horizon
import { realAPIService } from './realApis';
import { geminiAIService } from './geminiAI';

export interface SearchResult {
  id: string;
  type: 'transport' | 'stay' | 'food' | 'culture' | 'sos' | 'ai' | 'general' | 'destination';
  title: string;
  description: string;
  category?: string;
  location?: string;
  price?: number;
  rating?: number;
  imageUrl?: string;
  action?: string;
  data?: any;
  relevance?: number;
}

export interface SearchFilters {
  type?: string[];
  priceRange?: [number, number];
  location?: string;
  rating?: number;
}

class SearchService {
  private searchHistory: string[] = [];
  private searchCache: Map<string, SearchResult[]> = new Map();
  private keywordIndex: Map<string, SearchResult[]> = new Map();

  constructor() {
    this.buildSearchIndex();
  }

  // Global search across all modules
  async globalSearch(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    // Check cache first
    const cacheKey = `${query}_${JSON.stringify(filters || {})}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Add to search history
    this.addToSearchHistory(query);

    const results: SearchResult[] = [];

    try {
      // Search across all modules in parallel
      const [
        transportResults,
        foodResults,
        stayResults,
        cultureResults,
        aiResults,
        indexResults
      ] = await Promise.all([
        this.searchTransport(query),
        this.searchFood(query),
        this.searchStay(query),
        this.searchCulture(query),
        this.searchAI(query),
        this.searchIndex(query)
      ]);

      results.push(...transportResults, ...foodResults, ...stayResults, ...cultureResults, ...aiResults, ...indexResults);

      // Remove duplicates and sort by relevance
      const uniqueResults = this.removeDuplicates(results);
      const sortedResults = this.sortByRelevance(uniqueResults, query);

      // Apply filters
      const filteredResults = this.applyFilters(sortedResults, filters);

      // Cache results
      this.searchCache.set(cacheKey, filteredResults);

      return filteredResults;
    } catch (error) {
      console.error('Global search error:', error);
      return this.getFallbackSearchResults(query);
    }
  }

  // Build search index for fast lookups
  private buildSearchIndex(): void {
    const searchData: SearchResult[] = [
      // Transport
      { id: 'bus_kochi', title: 'KSRTC Bus to Kochi', description: 'Regular bus service to Kochi', type: 'transport', category: 'bus', relevance: 1.0 },
      { id: 'train_express', title: 'Kerala Express Train', description: 'Daily train service', type: 'transport', category: 'train', relevance: 1.0 },
      { id: 'flight_cial', title: 'Cochin International Airport', description: 'Flight schedules and status', type: 'transport', category: 'flight', relevance: 1.0 },
      
      // Accommodation
      { id: 'hotel_ktdc', title: 'KTDC Hotels', description: 'Government run hotels across Kerala', type: 'stay', category: 'hotel', relevance: 1.0 },
      { id: 'houseboat_alleppey', title: 'Alleppey Houseboats', description: 'Traditional houseboat experience', type: 'stay', category: 'houseboat', relevance: 1.0 },
      
      // Food
      { id: 'food_appam', title: 'Appam and Stew', description: 'Traditional Kerala breakfast', type: 'food', category: 'local', relevance: 1.0 },
      { id: 'food_biryani', title: 'Malabar Biryani', description: 'Famous Kozhikode biryani', type: 'food', category: 'local', relevance: 1.0 },
      
      // Culture
      { id: 'culture_kathakali', title: 'Kathakali Performance', description: 'Traditional dance form', type: 'culture', category: 'art', relevance: 1.0 },
      { id: 'culture_temple', title: 'Guruvayur Temple', description: 'Famous Krishna temple', type: 'culture', category: 'temple', relevance: 1.0 },
      
      // Destinations
      { id: 'dest_munnar', title: 'Munnar Hill Station', description: 'Tea plantations and cool climate', type: 'destination', category: 'hill-station', relevance: 1.0 },
      { id: 'dest_backwaters', title: 'Kerala Backwaters', description: 'Serene waterways and houseboats', type: 'destination', category: 'backwater', relevance: 1.0 },
      { id: 'dest_kochi', title: 'Kochi (Cochin)', description: 'Historic port city', type: 'destination', category: 'city', relevance: 1.0 },
      { id: 'dest_thekkady', title: 'Thekkady Wildlife', description: 'Periyar National Park', type: 'destination', category: 'wildlife', relevance: 1.0 }
    ];

    // Build keyword index
    searchData.forEach(item => {
      const keywords = this.extractKeywords(item);
      keywords.forEach(keyword => {
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, []);
        }
        this.keywordIndex.get(keyword)!.push(item);
      });
    });
  }

  private searchIndex(query: string): SearchResult[] {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const results: SearchResult[] = [];
    const resultMap = new Map<string, SearchResult>();

    queryWords.forEach(word => {
      // Exact matches
      if (this.keywordIndex.has(word)) {
        this.keywordIndex.get(word)!.forEach(result => {
          if (!resultMap.has(result.id)) {
            resultMap.set(result.id, { ...result, relevance: 1.0 });
          } else {
            const existingResult = resultMap.get(result.id);
            if (existingResult) {
              existingResult.relevance = (existingResult.relevance || 0) + 0.5;
            }
          }
        });
      }

      // Partial matches
      this.keywordIndex.forEach((items, keyword) => {
        if (keyword.includes(word) || word.includes(keyword)) {
          items.forEach(result => {
            if (!resultMap.has(result.id)) {
              resultMap.set(result.id, { ...result, relevance: 0.7 });
            } else {
              const existingResult = resultMap.get(result.id);
              if (existingResult) {
                existingResult.relevance = (existingResult.relevance || 0) + 0.3;
              }
            }
          });
        }
      });
    });

    return Array.from(resultMap.values());
  }

  private extractKeywords(item: SearchResult): string[] {
    const text = `${item.title} ${item.description} ${item.category} ${item.type}`.toLowerCase();
    return text.split(/\s+/).filter(word => word.length > 2);
  }

  private removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.id)) {
        return false;
      }
      seen.add(result.id);
      return true;
    });
  }

  private sortByRelevance(results: SearchResult[], query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    
    return results.sort((a, b) => {
      let scoreA = a.relevance || 0;
      let scoreB = b.relevance || 0;

      // Boost exact title matches
      if (a.title.toLowerCase().includes(queryLower)) scoreA += 2;
      if (b.title.toLowerCase().includes(queryLower)) scoreB += 2;

      // Boost exact word matches
      const queryWords = queryLower.split(' ');
      queryWords.forEach(word => {
        if (a.title.toLowerCase().includes(word)) scoreA += 1;
        if (b.title.toLowerCase().includes(word)) scoreB += 1;
        if (a.description.toLowerCase().includes(word)) scoreA += 0.5;
        if (b.description.toLowerCase().includes(word)) scoreB += 0.5;
      });

      return scoreB - scoreA;
    });
  }

  private getFallbackSearchResults(query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    const fallbackResults: SearchResult[] = [];

    // Common search terms and their results
    if (queryLower.includes('kochi') || queryLower.includes('cochin')) {
      fallbackResults.push({
        id: 'kochi_info',
        title: 'Kochi (Cochin) - Queen of Arabian Sea',
        description: 'Historic port city with colonial architecture, Chinese fishing nets, and spice markets',
        type: 'destination',
        category: 'city',
        relevance: 1.0,
        data: { action: 'navigate', section: 'culture' }
      });
    }

    if (queryLower.includes('munnar')) {
      fallbackResults.push({
        id: 'munnar_info',
        title: 'Munnar - Tea Garden Paradise',
        description: 'Hill station famous for tea plantations, cool climate, and scenic beauty',
        type: 'destination',
        category: 'hill-station',
        relevance: 1.0,
        data: { action: 'navigate', section: 'stay' }
      });
    }

    if (queryLower.includes('backwater') || queryLower.includes('alleppey')) {
      fallbackResults.push({
        id: 'backwater_info',
        title: 'Kerala Backwaters - Serene Waterways',
        description: 'Experience traditional houseboats and peaceful waterways',
        type: 'destination',
        category: 'backwater',
        relevance: 1.0,
        data: { action: 'navigate', section: 'stay' }
      });
    }

    if (queryLower.includes('food') || queryLower.includes('restaurant')) {
      fallbackResults.push({
        id: 'food_info',
        title: 'Kerala Cuisine - Spice Paradise',
        description: 'Discover authentic Kerala dishes, restaurants, and local specialties',
        type: 'food',
        category: 'cuisine',
        relevance: 1.0,
        data: { action: 'navigate', section: 'food' }
      });
    }

    if (queryLower.includes('transport') || queryLower.includes('bus') || queryLower.includes('train')) {
      fallbackResults.push({
        id: 'transport_info',
        title: 'Kerala Transport - Buses, Trains & More',
        description: 'Find buses, trains, flights, and local transport options',
        type: 'transport',
        category: 'general',
        relevance: 1.0,
        data: { action: 'navigate', section: 'transport' }
      });
    }

    // If no specific matches, provide general Kerala information
    if (fallbackResults.length === 0) {
      fallbackResults.push({
        id: 'kerala_general',
        title: 'Kerala - God\'s Own Country',
        description: 'Explore the beautiful state of Kerala with its backwaters, hill stations, and rich culture',
        type: 'general',
        category: 'information',
        relevance: 0.8,
        data: { action: 'navigate', section: 'culture' }
      });
    }

    return fallbackResults;
  }

  // Search transport-related content
  private async searchTransport(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // EV Charging Stations
    if (lowerQuery.includes('ev') || lowerQuery.includes('charging') || lowerQuery.includes('electric')) {
      results.push({
        id: 'ev-charging',
        type: 'transport',
        title: 'EV Charging Stations',
        description: 'Find nearby electric vehicle charging stations',
        action: 'Find EV charging stations near you',
        data: { action: 'openEVCharging' }
      });
    }

    // Parking
    if (lowerQuery.includes('parking') || lowerQuery.includes('park')) {
      results.push({
        id: 'parking',
        type: 'transport',
        title: 'Parking Facilities',
        description: 'Find parking spots and facilities',
        action: 'Find parking near you',
        data: { action: 'openParking' }
      });
    }

    // Bus routes
    if (lowerQuery.includes('bus') || lowerQuery.includes('ksrtc')) {
      results.push({
        id: 'bus-routes',
        type: 'transport',
        title: 'Bus Routes & Schedules',
        description: 'KSRTC and Swift bus tracking and schedules',
        action: 'Check bus schedules',
        data: { action: 'openBusRoutes' }
      });
    }

    // Train schedules
    if (lowerQuery.includes('train') || lowerQuery.includes('irctc')) {
      results.push({
        id: 'train-schedules',
        type: 'transport',
        title: 'Train Schedules',
        description: 'IRCTC train schedules and booking',
        action: 'Check train schedules',
        data: { action: 'openTrainSchedules' }
      });
    }

    // Flight status
    if (lowerQuery.includes('flight') || lowerQuery.includes('airport')) {
      results.push({
        id: 'flight-status',
        type: 'transport',
        title: 'Flight Status',
        description: 'Check flight status at Kerala airports',
        action: 'Check flight status',
        data: { action: 'openFlightStatus' }
      });
    }

    return results;
  }

  // Search food-related content
  private async searchFood(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Cuisine types
    const cuisines = ['kerala', 'south indian', 'seafood', 'vegetarian', 'chinese', 'continental'];
    const matchingCuisines = cuisines.filter(cuisine => 
      lowerQuery.includes(cuisine) || lowerQuery.includes(cuisine.replace(' ', ''))
    );

    if (matchingCuisines.length > 0) {
      results.push({
        id: 'cuisine-search',
        type: 'food',
        title: `${matchingCuisines[0].charAt(0).toUpperCase() + matchingCuisines[0].slice(1)} Restaurants`,
        description: `Find ${matchingCuisines[0]} restaurants near you`,
        action: 'Search restaurants',
        data: { action: 'searchRestaurants', cuisine: matchingCuisines[0] }
      });
    }

    // Specific dishes
    const dishes = ['biriyani', 'curry', 'fish', 'rice', 'dosa', 'idli', 'appam'];
    const matchingDishes = dishes.filter(dish => lowerQuery.includes(dish));

    if (matchingDishes.length > 0) {
      results.push({
        id: 'dish-search',
        type: 'food',
        title: `${matchingDishes[0].charAt(0).toUpperCase() + matchingDishes[0].slice(1)} Specialties`,
        description: `Find restaurants serving ${matchingDishes[0]}`,
        action: 'Find restaurants',
        data: { action: 'searchDishes', dish: matchingDishes[0] }
      });
    }

    return results;
  }

  // Search stay-related content
  private async searchStay(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Hotel types
    const hotelTypes = ['ktdc', 'homestay', 'resort', 'budget', 'luxury', 'pwd'];
    const matchingTypes = hotelTypes.filter(type => lowerQuery.includes(type));

    if (matchingTypes.length > 0) {
      results.push({
        id: 'hotel-type',
        type: 'stay',
        title: `${matchingTypes[0].toUpperCase()} Hotels`,
        description: `Find ${matchingTypes[0]} accommodations`,
        action: 'Search hotels',
        data: { action: 'searchHotels', type: matchingTypes[0] }
      });
    }

    // Locations
    const locations = ['kochi', 'munnar', 'alleppey', 'thiruvananthapuram', 'wayanad', 'kumarakom'];
    const matchingLocations = locations.filter(location => lowerQuery.includes(location));

    if (matchingLocations.length > 0) {
      results.push({
        id: 'location-hotels',
        type: 'stay',
        title: `Hotels in ${matchingLocations[0].charAt(0).toUpperCase() + matchingLocations[0].slice(1)}`,
        description: `Find accommodations in ${matchingLocations[0]}`,
        action: 'Search hotels',
        data: { action: 'searchHotels', location: matchingLocations[0] }
      });
    }

    return results;
  }

  // Search culture-related content
  private async searchCulture(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Art forms
    const artForms = ['kathakali', 'theyyam', 'mohiniyattam', 'bharatanatyam'];
    const matchingArtForms = artForms.filter(art => lowerQuery.includes(art));

    if (matchingArtForms.length > 0) {
      results.push({
        id: 'art-form',
        type: 'culture',
        title: `${matchingArtForms[0].charAt(0).toUpperCase() + matchingArtForms[0].slice(1)} Performances`,
        description: `Find ${matchingArtForms[0]} shows and performances`,
        action: 'View performances',
        data: { action: 'searchArtForms', artForm: matchingArtForms[0] }
      });
    }

    // Heritage sites
    const heritageSites = ['temple', 'palace', 'fort', 'monument', 'museum'];
    const matchingSites = heritageSites.filter(site => lowerQuery.includes(site));

    if (matchingSites.length > 0) {
      results.push({
        id: 'heritage-sites',
        type: 'culture',
        title: `${matchingSites[0].charAt(0).toUpperCase() + matchingSites[0].slice(1)}s`,
        description: `Explore ${matchingSites[0]}s in Kerala`,
        action: 'View heritage sites',
        data: { action: 'searchHeritage', type: matchingSites[0] }
      });
    }

    return results;
  }

  // Search AI-related content
  private async searchAI(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // AI tools
    const aiTools = ['itinerary', 'packing', 'budget', 'translate', 'safety', 'weather'];
    const matchingTools = aiTools.filter(tool => lowerQuery.includes(tool));

    if (matchingTools.length > 0) {
      results.push({
        id: 'ai-tool',
        type: 'ai',
        title: `AI ${matchingTools[0].charAt(0).toUpperCase() + matchingTools[0].slice(1)} Assistant`,
        description: `Get AI help with ${matchingTools[0]}`,
        action: 'Use AI assistant',
        data: { action: 'openAITool', tool: matchingTools[0] }
      });
    }

    // General travel questions
    if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('where') || 
        lowerQuery.includes('when') || lowerQuery.includes('why')) {
      results.push({
        id: 'ai-concierge',
        type: 'ai',
        title: 'AI Travel Concierge',
        description: 'Get personalized travel advice and recommendations',
        action: 'Ask AI assistant',
        data: { action: 'openAIConcierge', query }
      });
    }

    return results;
  }

  // Apply filters to search results
  private applyFilters(results: SearchResult[], filters?: SearchFilters): SearchResult[] {
    if (!filters) return results;

    return results.filter(result => {
      // Type filter
      if (filters.type && filters.type.length > 0 && !filters.type.includes(result.type)) {
        return false;
      }

      // Price range filter
      if (filters.priceRange && result.price) {
        const [min, max] = filters.priceRange;
        if (result.price < min || result.price > max) {
          return false;
        }
      }

      // Rating filter
      if (filters.rating && result.rating && result.rating < filters.rating) {
        return false;
      }

      // Location filter
      if (filters.location && result.location && 
          !result.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      return true;
    });
  }

  // Add query to search history
  private addToSearchHistory(query: string) {
    const trimmedQuery = query.trim();
    if (trimmedQuery && !this.searchHistory.includes(trimmedQuery)) {
      this.searchHistory.unshift(trimmedQuery);
      if (this.searchHistory.length > 10) {
        this.searchHistory = this.searchHistory.slice(0, 10);
      }
      localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }
  }

  // Get search history
  getSearchHistory(): string[] {
    if (this.searchHistory.length === 0) {
      const saved = localStorage.getItem('searchHistory');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    }
    return this.searchHistory;
  }

  // Clear search cache
  clearCache() {
    this.searchCache.clear();
  }

  // Get trending searches
  getTrendingSearches(): string[] {
    return [
      'EV charging stations',
      'Kerala backwaters',
      'Kathakali performances',
      'KTDC hotels',
      'Kerala cuisine',
      'Munnar hill station',
      'Fort Kochi',
      'Ayurvedic treatments'
    ];
  }
}

export const searchService = new SearchService();

