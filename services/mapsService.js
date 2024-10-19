const axios = require("axios");
const { MAPS_API_KEY } = require("../config/config");

exports.searchText = async (keyword, address) => {
  const textQuery = `${keyword} near ${address}`;
  const response = await axios.post(
    "https://places.googleapis.com/v1/places:searchText",
    { textQuery },
    {
      headers: {
        "X-Goog-Api-Key": MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.googleMapsUri,places.displayName,places.websiteUri,places.shortFormattedAddress,places.rating,places.currentOpeningHours,places.photos,places.primaryTypeDisplayName,places.userRatingCount",
      },
    }
  );
  return response.data.places || [];
};

exports.coorsToAddress = async (latitude, longitude) => {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${MAPS_API_KEY}`
  );
  return response.data.results[0]?.formatted_address || "me";
};

exports.addressToCoors = async (address) => {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${MAPS_API_KEY}`
  );
  if(response.data.results.length === 0) {
    throw "No place was provided"
  }
  return { latitude: response.data.results[0].geometry.location.lat, longitude: response.data.results[0].geometry.location.lng }
};

exports.searchNearby = async (lat, lng, primaryTypes) => {
  const types = primaryTypes.split(",");
  let places = [];
  for (let type of types) {
    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: 3000 },
        },
        includedTypes: [type],
      },
      {
        headers: {
          "X-Goog-Api-Key": MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask":
            "places.id,places.googleMapsUri,places.displayName,places.websiteUri,places.shortFormattedAddress,places.rating,places.currentOpeningHours,places.photos,places.primaryTypeDisplayName,places.userRatingCount",
        },
      }
    );
    places.push(...(response.data.places || []));
  }
  return places;
};

exports.getPlacePhoto = async (req, res) => {
  const { photoReference } = req.query;
  if (!photoReference)
    return res.status(400).json({ error: "Missing photo reference" });

  const photoUrl = `https://places.googleapis.com/v1/${photoReference}/media?max_height_px=1000&key=${MAPS_API_KEY}`;
  res.json({ url: photoUrl });
};
