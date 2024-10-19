const { callGPT } = require("./gptService");
const { buildPlaceScorePrompt } = require("./promptService");

class Place {
    static seenIds = new Set();
  
    constructor(placeData) {
      if (Place.seenIds.has(placeData.id)) {
        return null;
      }
      Place.seenIds.add(placeData.id);
  
      this.id = placeData.id;
      this.open = placeData.currentOpeningHours?.openNow || false;
      this.rating = placeData.rating || null;
      this.ratingCount = placeData.userRatingCount || null;
      this.name = placeData.displayName.text;
      this.type = placeData.primaryTypeDisplayName?.text || null;
      this.mapsUri = placeData.googleMapsUri || "";
      this.websiteUri = placeData.websiteUri || null;
      this.photoRef = placeData.photos?.[0]?.name || null;
  
      this.score = null;  // Initialize the score as null
    }
  
    async calculateScore(prompt, preferences) {
      const placeScorePrompt = buildPlaceScorePrompt(prompt, this, preferences);
      const response = await callGPT(placeScorePrompt);
      const parsedResponse = JSON.parse(response);
      this.score = parseInt(parsedResponse.score);
      return this.score; // Return the score
    }
  }
  
  module.exports = Place;
  