const express = require("express");
const { getPlaces, getPlaceOverview,  } = require("../controllers/gptController");
const { getPlacePhoto } = require("../services/mapsService");
const router = express.Router();

// Route for handling GPT-based prompt and place recommendations
router.post("/getPlaces", getPlaces);
router.post("/getPlaceOverview", getPlaceOverview);

// Route for getting place photo
router.get("/placePhoto", getPlacePhoto);

module.exports = router;
