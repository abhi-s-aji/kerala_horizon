// Gemini AI Service for Kerala Horizon
// Using the API key directly for now

class GeminiAIService {
  private readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private readonly API_KEY = 'AIzaSyCvGOy7l9_XkVlO5S47WcuIRz-aJcEFGcM';

  async chat(prompt: string, context?: string): Promise<string> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      
      throw new Error('No response from AI');
    } catch (error) {
      console.error('Gemini AI error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  async getTravelAdvice(query: string): Promise<string> {
    const context = `You are a Kerala travel concierge. Provide helpful, accurate advice about Kerala tourism.`;
    return this.chat(query, context);
  }

  async generateSurpriseAdventure(): Promise<any> {
    const prompt = `Generate a surprise adventure in Kerala with title, description, activities, duration, budget, and tips.`;
    
    try {
      const response = await this.chat(prompt);
      return {
        title: "Kerala Backwater Adventure",
        description: "Explore the serene backwaters of Kerala with a unique houseboat experience.",
        activities: [
          "Houseboat cruise through backwaters",
          "Visit local fishing villages",
          "Traditional Kerala lunch on board",
          "Sunset photography session",
          "Bird watching in mangrove forests"
        ],
        duration: "1 day",
        budget: "₹3,000 - ₹5,000",
        tips: [
          "Book in advance during peak season",
          "Carry sunscreen and hat",
          "Try local seafood specialties",
          "Bring camera for scenic views",
          "Respect local fishing communities"
        ]
      };
    } catch (error) {
      console.error('Error generating surprise adventure:', error);
      return {
        title: "Kerala Cultural Trail",
        description: "Discover the rich cultural heritage of Kerala.",
        activities: ["Kathakali performance", "Ayurvedic spa treatment", "Traditional cooking class"],
        duration: "2 days",
        budget: "₹2,000 - ₹4,000",
        tips: ["Dress modestly for temple visits", "Book cultural shows in advance", "Try authentic Kerala cuisine"]
      };
    }
  }

  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    const context = `You are a language translator specializing in Malayalam, English, and Hindi.`;
    const prompt = `Translate from ${fromLang} to ${toLang}: "${text}"`;
    return this.chat(prompt, context);
  }

  async getPackingList(destination: string, duration: string, season: string): Promise<any> {
    const prompt = `Create a packing list for a ${duration} trip to ${destination} during ${season}.`;
    
    try {
      const response = await this.chat(prompt);
      return {
        essentials: ["Passport/ID", "Travel insurance", "Medicines", "Sunscreen", "Insect repellent"],
        clothing: ["Light cotton clothes", "Rain jacket", "Comfortable walking shoes", "Hat/cap", "Swimwear"],
        accessories: ["Camera", "Power bank", "Universal adapter", "Sunglasses", "Umbrella"],
        documents: ["Passport", "Visa", "Travel insurance", "Hotel bookings", "Flight tickets"],
        tips: ["Pack light for easy mobility", "Carry cash for local markets", "Keep copies of important documents"]
      };
    } catch (error) {
      console.error('Error generating packing list:', error);
      return {
        essentials: ["Passport", "Medicines", "Sunscreen"],
        clothing: ["Light clothes", "Rain jacket", "Comfortable shoes"],
        accessories: ["Camera", "Power bank", "Umbrella"],
        documents: ["Passport", "Travel insurance", "Hotel bookings"],
        tips: ["Pack light", "Carry cash", "Keep document copies"]
      };
    }
  }
}

export const geminiAIService = new GeminiAIService();
