const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(bodyParser.json());

// GPT and Maps API keys
const GPT_API_KEY =
  "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";
const MAPS_API_KEY = "AIzaSyC4cCmQZbKylUvOFhg0Fbh1qZPgchJuXzs";

// Helper function to call GPT
async function callGPT(prompt) {
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${GPT_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.choices[0].message.content;
}

// Helper function to call Google Maps API
async function searchText(keyword, address) {
  let textQuery = `${keyword} ${address}`;
  console.log(`Looking for keyswords (${keyword}) near ${address}`);
  const response = await axios.post(
    "https://places.googleapis.com/v1/places:searchText",
    {
      textQuery: textQuery,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.googleMapsUri,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos,places.primaryTypeDisplayName,places.userRatingCount",
      },
    }
  );

  if (null === response.data.places) return [];

  return response.data.places;
}

async function coorsToAddress(latitude, longitude) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${MAPS_API_KEY}`
  );

  if(response.data.results[0].address_components === null) return "me";

  response.data.results[0].address_components.forEach((component) => {
    if ("neighborhood" in component.types) {
      return component.long_name;
    }
  });
  return response.data.results[0].formatted_address;
}

async function addressToCoors(address) {
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search?format=json&q=${address}`
  );
  return { latitude: response.data[0].lat, longitude: response.data[0].lon };
}

async function searchNearby(lat, lng, primaryTypes) {
  let places = [];
  let types = primaryTypes.split(",");

  console.log(types);

  for (let type of types) {
    let response = await axios.post(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        locationRestriction: {
          circle: {
            center: {
              latitude: lat,
              longitude: lng,
            },
            radius: 2000,
          },
        },
        includedTypes: [type],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": MAPS_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.googleMapsUri,places.displayName,places.formattedAddress,places.rating,places.currentOpeningHours,places.photos,places.primaryTypeDisplayName,places.userRatingCount",
        },
      }
    );

    console.log(`Getting nearby places from type ${type}`);

    if (response.data.places) {
      response.data.places.forEach((place) => {
        places.push(place);
      });
    }
  }

  return places;
}

app.post("/api/sendPrompt", async (req, res) => {
  try {
    const { prompt, currentLocation, latitude, longitude } = req.body;
    let address = null;
    let lat = null;
    let lon = null;

    console.log("Request: /api/sendPrompt");
    console.log(`Using current location: ${currentLocation ? "Yes" : "No"}`);

    console.log("Sending prompt to GPT");

    // Build the full prompt string
    const fullPrompt = `
      1. You must shorten prompts given by a user inside the tags <PROMPT> </PROMPT> in order to select only the important aspects of the prompt. The user is looking for places and it's your job to separate the right keywords so that the place can be found.
      1.1 All keywords must be place related. If a user wants to buy snacks for example, the keywords could be "supermaket", "convenience store".
      1.2 The keywords must always describe the place that will deliver what the user asked for. So if the user is asking to something to drink, never use words like "beer" or "alcohool", always choose words like "bar".
      1.3 The tags <CURRENT_LOCATION></CURRENT_LOCATION> will only contain true or false values and there can only be 4 outcomes: A, B, C or D
      1.3.A If the value inside the tags <CURRENT_LOCATION> </CURRENT_LOCATION> is TRUE, leave the tag <LOCATION/> empty. Skip outcomes B, C and D
      1.3.B If the value inside the tags <CURRENT_LOCATION> </CURRENT_LOCATION> is TRUE but the user is refering to a diferent location, the <SUCCESS/> tag value should be the word false and add a descriptive message in the tag <MESSAGE/> explaining why he can't say a location if he is already using it's own. Skip outcomes C and D.
      1.3.C If the value inside the tags <CURRENT_LOCATION> </CURRENT_LOCATION> is FALSE, use the source location the user mentioned as the value for <LOCATION/>. For example: "Coffees in Grece", the location should be Grece. Skip outcome D
      1.3.D If the value inside the tags <CURRENT_LOCATION> </CURRENT_LOCATION> is FALSE and the user did not mention any location, the <SUCCESS/> tag value should be the word false and add a descriptive message in the tag <MESSAGE/> explaining why he has to say a location if he is not using it's own
      2. Your response should be exclusively a json string using the JSON format inside the tags <JSON> </JSON>.
      2.1 The <JSON> </JSON> tags themselfs must not be part of the response, only what is inside them.
      3. Replace the Tag <KEYWORDS/> with the shortened text from the initial user prompt containing only the keywords
      3.1. The <KEYWORDS/> response should contain between 3 and 7 words, with the most important keywords to represent the users prompt. You must avoid using verbs. If the verb is "buy", you might want to consider using "store", what matches most in the context.
      4. Place inside the tag <PRIMARY_TYPES/> all types that describe what the user wants. Use the types from inside the tags <TYPES> </TYPES>. Separate the types with commas, without white spaces.
      5. If the user's prompt does not seem promissing enought to describe minimally it's desires, you must replace the <SUCCESS/> tag with the word false, otherwize, if the user prompt is descriptive enought, replace <SUCCESS/> with the word true. Also, come up with a short explanation on why you don't understand the prompt, and write it inside the tags <MESSAGE></MESSAGE>

      <JSON>
      {
          "success": <SUCCESS/>,
          "message": "<MESSAGE/>",
          "location": "<LOCATION/>",
          "keywords": "<KEYWORDS/>",
          "primary_types": "<PRIMARY_TYPES/>"
      }
      </JSON>

      <TYPES>
      car_dealer,car_rental,car_repair,car_wash,electric_vehicle_charging_station,gas_station,parking,rest_stop,farm,art_gallery,museum,performing_arts_theater,library,preschool,primary_school,school,secondary_school,university,amusement_center,amusement_park,aquarium,banquet_hall,bowling_alley,casino,community_center,convention_center,cultural_center,dog_park,event_venue,hiking_area,historical_landmark,marina,movie_rental,movie_theater,national_park,night_club,park,tourist_attraction,visitor_center,wedding_venue,zoo,accounting,atm,bank,american_restaurant,bakery,bar,barbecue_restaurant,brazilian_restaurant,breakfast_restaurant,brunch_restaurant,cafe,chinese_restaurant,coffee_shop,fast_food_restaurant,french_restaurant,greek_restaurant,hamburger_restaurant,ice_cream_shop,indian_restaurant,indonesian_restaurant,italian_restaurant,japanese_restaurant,korean_restaurant,lebanese_restaurant,meal_delivery,meal_takeaway,mediterranean_restaurant,mexican_restaurant,middle_eastern_restaurant,pizza_restaurant,ramen_restaurant,restaurant,sandwich_shop,seafood_restaurant,spanish_restaurant,steak_house,sushi_restaurant,thai_restaurant,turkish_restaurant,vegan_restaurant,vegetarian_restaurant,vietnamese_restaurant,administrative_area_level_1,administrative_area_level_2,country,locality,postal_code,school_district,city_hall,courthouse,embassy,fire_station,local_government_office,police,post_office,dental_clinic,dentist,doctor,drugstore,hospital,medical_lab,pharmacy,physiotherapist,spa,bed_and_breakfast,campground,camping_cabin,cottage,extended_stay_hotel,farmstay,guest_house,hostel,hotel,lodging,motel,private_guest_room,resort_hotel,rv_park,church,hindu_temple,mosque,synagogue,barber_shop,beauty_salon,cemetery,child_care_agency,consultant,courier_service,electrician,florist,funeral_home,hair_care,hair_salon,insurance_agency,laundry,lawyer,locksmith,moving_company,painter,plumber,real_estate_agency,roofing_contractor,storage,tailor,telecommunications_service_provider,travel_agency,veterinary_care,auto_parts_store,bicycle_store,book_store,cell_phone_store,clothing_store,convenience_store,department_store,discount_store,electronics_store,furniture_store,gift_shop,grocery_store,hardware_store,home_goods_store,home_improvement_store,jewelry_store,liquor_store,market,pet_store,shoe_store,shopping_mall,sporting_goods_store,store,supermarket,wholesaler,athletic_field,fitness_center,golf_course,gym,playground,ski_resort,sports_club,sports_complex,stadium,swimming_pool,airport,bus_station,bus_stop,ferry_terminal,heliport,light_rail_station,park_and_ride,subway_station,taxi_stand,train_station,transit_depot,transit_station,truck_stop,administrative_area_level_3,administrative_area_level_4,administrative_area_level_5,administrative_area_level_6,administrative_area_level_7,archipelago,colloquial_area,continent,establishment,finance,floor,food,general_contractor,geocode,health,intersection,landmark,natural_feature,neighborhood,place_of_worship,plus_code,point_of_interest,political,post_box,postal_code_prefix,postal_code_suffix,postal_town,premise,room,route,street_address,street_number,sublocality,sublocality_level_1,sublocality_level_2,sublocality_level_3,sublocality_level_4,sublocality_level_5,subpremise,town_square
      </TYPES>

      <CURRENT_LOCATION>${currentLocation ? "TRUE" : "FALSE"}</CURRENT_LOCATION>
      <PROMPT>${prompt}</PROMPT>
    `;

    // console.log(fullPrompt);

    // Get the GPT response
    let gptRawResponse = await callGPT(fullPrompt);
    let gptResponse = gptRawResponse
      .replaceAll("<JSON>", "")
      .replaceAll("</JSON>", "")
      .replaceAll("`", "")
      .replaceAll("json", "");
    console.log(`GPT Response:\n${gptResponse}`);

    // Parse GPT response (assuming a structured JSON response)
    const parsedResponse = JSON.parse(gptResponse);

    if (!parsedResponse.success) {
      return res.json({ success: false, message: parsedResponse.message });
    }

    // Get missing data
    if (currentLocation) {
      address = await coorsToAddress(latitude, longitude);
      lat = latitude;
      lon = longitude;
    } else {
      address = parsedResponse.location;
      let coors = await addressToCoors(address);
      lat = coors.latitude;
      lon = coors.longitude;
    }

    console.log(`Address: ${address}`);
    console.log(`Latitude and Longitude: ${lat}, ${lon}`);

    // Perform Maps API searches based on GPT response
    const placesText = await searchText(parsedResponse.keywords, address);
    const placesNearby = await searchNearby(
      lat,
      lon,
      parsedResponse.primary_types
    );

    let allPlaces = [];

    console.log(`placesText count: ${placesText.length}`);
    placesText.forEach((place) => {
      if (!(place.id in allPlaces.map((p) => p.id))) allPlaces.push(place);
    });

    console.log(`placesNearby count: ${placesNearby.length}`);
    placesNearby.forEach((place) => {
      if (!(place.id in allPlaces.map((p) => p.id))) allPlaces.push(place);
    });

    console.log(`Total: ${allPlaces.length}`);

    res.json({ success: true, places: allPlaces });
  } catch (error) {
    res.status(500).send({ success: false, message: `Error: ${error}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
