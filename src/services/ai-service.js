// src/services/ai-service.js
const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free';
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
    this.maxRetries = 3;
  }

  async initialize() {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not found');
    }
  }

  async processLocationQuery(query, context = null, retryCount = 0) {
    const systemPrompt = this.getSystemPrompt(retryCount, context);

    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.7,
        max_tokens: 800
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/Cloud-Dark/cilok',
          'X-Title': 'Cilok Location Toolkit'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      throw new Error(`AI Service Error: ${error.message}`);
    }
  }

  getSystemPrompt(retryCount, context) {
    if (retryCount === 0) {
      // First attempt - normal search
      return `
You are Cilok, an AI location assistant. Respond naturally in Indonesian with helpful location information.

When user asks about locations, provide detailed, conversational responses about:
- Location details and coordinates
- Travel time and distance (estimate if needed)
- Nearby places and recommendations
- Practical information

Always be conversational and helpful. Don't return JSON - just natural Indonesian text responses.

Examples:
User: "detail lokasi Transcosmos Indonesia"
Response: "Saya akan mencari informasi detail lokasi Transcosmos Indonesia untuk Anda..."

User: "dari Johor Bahru ke Kuala Lumpur berapa jam?"
Response: "Perjalanan dari Johor Bahru ke Kuala Lumpur biasanya memakan waktu sekitar 4-5 jam dengan berkendara, tergantung kondisi lalu lintas. Jarak tempuhnya sekitar 350 km melalui jalur utama North-South Expressway."
      `;
    } else {
      // Retry attempts - be more creative and search harder
      return `
You are Cilok, an AI location assistant on retry attempt ${retryCount}/3.

Previous search context: ${context || 'Location not found'}

You need to be MORE CREATIVE and THOROUGH in finding locations:
1. Try alternative names, abbreviations, or common variations
2. Search for similar businesses or locations in the area
3. Consider nearby landmarks or areas
4. Provide multiple suggestions or alternatives

If still not found, provide helpful alternatives or suggestions for similar places.

Respond naturally in Indonesian, be conversational and helpful.
      `;
    }
  }

  async intelligentLocationSearch(query, locationService) {
    let lastError = null;
    let searchResults = [];

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔍 Attempt ${attempt}/3: Searching with AI intelligence...`);
        
        // Get AI suggestion for search query
        const context = lastError ? `Previous error: ${lastError}. Results so far: ${JSON.stringify(searchResults)}` : null;
        const aiResponse = await this.processLocationQuery(query, context, attempt - 1);
        
        // Extract potential location names from AI response
        const locationSuggestions = this.extractLocationNames(aiResponse, query);
        
        console.log(`🤖 AI suggests searching for: ${locationSuggestions.join(', ')}`);
        
        // Try each suggestion
        for (const suggestion of locationSuggestions) {
          try {
            const result = await locationService.searchLocation(suggestion);
            if (result) {
              console.log(`✅ Found location: ${result.name}`);
              return {
                success: true,
                result: result,
                aiResponse: aiResponse,
                attempt: attempt,
                searchQuery: suggestion
              };
            }
          } catch (searchError) {
            console.log(`❌ "${suggestion}" not found: ${searchError.message}`);
            searchResults.push({ query: suggestion, error: searchError.message });
          }
        }
        
        lastError = `No results found for suggestions: ${locationSuggestions.join(', ')}`;
        
      } catch (aiError) {
        lastError = aiError.message;
        console.log(`🤖 AI error on attempt ${attempt}: ${aiError.message}`);
      }
    }

    // Final AI response for when nothing is found
    const finalResponse = await this.processLocationQuery(
      `${query} - Tidak ditemukan setelah ${this.maxRetries} percobaan. Berikan saran alternatif atau lokasi serupa.`,
      `Search attempts: ${JSON.stringify(searchResults)}`,
      this.maxRetries
    );

    return {
      success: false,
      aiResponse: finalResponse,
      attempts: this.maxRetries,
      searchHistory: searchResults
    };
  }

  extractLocationNames(aiResponse, originalQuery) {
    // Extract potential location names from AI response
    const suggestions = [];
    
    // Add original query variations
    suggestions.push(originalQuery);
    
    // Extract quoted locations from AI response
    const quotedMatches = aiResponse.match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach(match => {
        suggestions.push(match.replace(/"/g, ''));
      });
    }
    
    // Extract common location patterns
    const locationPatterns = [
      /mencari\s+([^.,:]+)/gi,
      /lokasi\s+([^.,:]+)/gi,
      /tempat\s+([^.,:]+)/gi,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
    ];
    
    locationPatterns.forEach(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/^(mencari|lokasi|tempat)\s+/i, '').trim();
          if (cleaned.length > 2 && !suggestions.includes(cleaned)) {
            suggestions.push(cleaned);
          }
        });
      }
    });
    
    // Remove duplicates and filter
    return [...new Set(suggestions)]
      .filter(s => s.length > 2)
      .slice(0, 5); // Max 5 suggestions per attempt
  }
}

module.exports = AIService;