const { callGPT } = require("../services/gptService");
const {
  coorsToAddress,
  addressToCoors,
  searchText,
  searchNearby,
} = require("../services/mapsService");
const Place = require("../services/placeModel");
const {
  buildLocationPrompt,
  buildPlaceOverviewPrompt,
} = require("../services/promptService");

exports.getPlaces = async (req, res) => {
  try {
    const { prompt, currentLocation, latitude, longitude, preferences } =
      req.body;
    let address = null;
    let lat = null;
    let lon = null;

    const fullPrompt = buildLocationPrompt(prompt, currentLocation);
    const gptLocationResponse = await callGPT(fullPrompt);
    const parsedLocationResponse = JSON.parse(gptLocationResponse);

    if (!parsedLocationResponse.success) {
      return res
        .status(500)
        .send({ success: false, message: parsedLocationResponse.message });
    }

    // Handle location information
    if (currentLocation) {
      address = await coorsToAddress(latitude, longitude);
      lat = latitude;
      lon = longitude;
    } else {
      address = parsedLocationResponse.location;
      const coors = await addressToCoors(address);
      lat = coors.latitude;
      lon = coors.longitude;
    }

    const placesText = await searchText(
      parsedLocationResponse.keywords,
      address
    );
    const placesNearby = await searchNearby(
      lat,
      lon,
      parsedLocationResponse.primary_types
    );

    const rawPlaces = [...placesText, ...placesNearby];

    // Create Place instances and calculate scores in parallel using Promise.all
    const placeInstances = await Promise.all(
      rawPlaces.map(async (placeData) => {
        const placeInstance = new Place(placeData);

        // Calculate score and assign it to the place instance
        await placeInstance.calculateScore(prompt, preferences);

        return placeInstance;
      })
    );

    const validPlaces = placeInstances.filter((place) => {
      if (place === null) {
        return false;
      }

      if (place.score === 0) {
        return false;
      }

      return true;
    });

    if (validPlaces.length === 0) {
      res.json({
        success: true,
        places: [],
        message: "Could not find any places that matched this description.",
      });
      return;
    }

    validPlaces.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      places: validPlaces, // Return the places with their scores
      message: parsedLocationResponse.message,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: `Error: ${error.message}` });

    console.log(error);
  }
};

exports.getPlaceOverview = async (req, res) => {
  try {
    const { place } = req.body;

    const prompt = buildPlaceOverviewPrompt(place);
    const response = await callGPT(prompt);

    res.json({
      success: true,
      message: response,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: `Error: ${error.message}` });

    console.log(error);
  }
};
