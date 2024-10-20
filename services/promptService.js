exports.buildLocationPrompt = (prompt, currentLocation) => {
  return `
    1. You must shorten prompts given by a user inside the tags <PROMPT> </PROMPT> in order to select only the important aspects of the prompt. The user is looking for places and it's your job to separate the right keywords so that the place can be found.
    1.1 All keywords must be place related. If a user wants to buy snacks for example, the keywords could be "supermaket", "convenience store".
    1.2 The keywords must always describe the place that will deliver what the user asked for. So if the user is asking to something to drink, never use words like "beer" or "alcohool", always choose words like "bar".
    1.3 The tags <CURRENT_LOCATION></CURRENT_LOCATION> will only contain true or false values and there can only be 4 outcomes: A, B, C or D
    1.3.A If the value inside the tags <CURRENT_LOCATION> </CURRENT_LOCATION> is TRUE, leave the tag <LOCATION/> empty. Skip outcomes B, C and D
    1.3.B If the value inside the tags <CURRENT_LOCATION> </CURRENT_LOCATION> is TRUE but the user is refering to a diferent location, the <SUCCESS/> tag value should be the word false and add a descriptive message in the tag <MESSAGE></MESSAGE> explaining why he can't say a location if he is already using it's own. Skip outcomes C and D.
    1.3.C If the value inside the tags <CURRENT_LOCATION> </CURRENT_LOCATION> is FALSE, use the source location the user mentioned as the value for <LOCATION/>. For example: "Coffees in Grece", the location should be Grece. Skip outcome D
    1.3.D If the value inside the tags <CURRENT_LOCATION> </CURRENT_LOCATION> is FALSE and the user did not mention any location, the <SUCCESS/> tag value should be the word false and add a descriptive message in the tag <MESSAGE></MESSAGE> explaining why he has to say a location if he is not using it's own
    2. Your response should be exclusively a json string using the JSON format inside the tags <JSON> </JSON>.
    2.1 The <JSON> </JSON> tags themselfs must not be part of the response, only what is inside them.
    3. Replace the Tag <KEYWORDS/> with the shortened text from the initial user prompt containing only the keywords
    3.1. The <KEYWORDS/> response should contain between 3 and 7 words, with the most important keywords to represent the users prompt. You must avoid using verbs. If the verb is "buy", you might want to consider using "store", what matches most in the context.
    4. Place inside the tag <PRIMARY_TYPES/> all types that describe what the user wants. Use the types from inside the tags <TYPES> </TYPES>. Separate the types with commas, without white spaces.
    5. If the user's prompt does not seem promissing enought to describe minimally it's desires, you must replace the <SUCCESS/> tag with the word false, otherwize, if the user prompt is descriptive enought, replace <SUCCESS/> with the word true. Also, come up with a short explanation on why you don't understand the prompt, and write it inside the tags <MESSAGE></MESSAGE>
    6. If the response is successfull, add inside the <MESSAGE></MESSAGE> tags with a text as if you were answering the prompt presenting the places: "here are some places that ...". Be creative with the text.

    <JSON>
    {
        "success": <SUCCESS/>,
        "message": "<MESSAGE></MESSAGE>",
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
};

function getPlaceTag(place) {
  return `
      <NAME> ${place.name} </NAME>
      <TYPE> ${
        place.type
      } </TYPE>
      <WEBSITEURL> ${place.websiteUri} </WEBSITEURL>
      <OPENNOW> ${
        place.open
            ? "Open Now"
            : "Closed"
      } </OPENNOW>
      <RATING> ${place.rating} </RATING>
    `.trim();
}

function getPreferencesTag(preferences) {
  return `
    <NATUREVSCITY>${preferences.natureVsCity}</NATUREVSCITY>
    <BUDGET>${preferences.budget}</BUDGET>
    <CULTURE>${preferences.culturalInterests}</CULTURE>
  `;
}

exports.buildPlaceScorePrompt = (prompt, place, preferences) => {
  let placeTag = getPlaceTag(place);
  let preferencesTag = getPreferencesTag(preferences);

  return `
    1. You are a Travel Assistant which helps the user find places that match their interests. You will be given a place inside the <PLACE></PLACE> tags, the user preferences inside the <PREFERENCES></PREFERENCES> tag, the user prompt inside the <PROMPT></PROMPT> tags and will score the place from 0 to 100 based on how much the place represents the needs of the user. Good matches should be assigned a score closer to 100 and bad matches closer to 0.
    2. Your job is to respond in a JSON string following the format inside the <JSON></JSON> tags according to the following steps.
    3. You will use the user preferences under <PREFERENCES></PREFERENCES> tags and user prompt under <PROMPT></PROMPT> tags to identify the score of the selected places. The preferences should only take up 25 points, while the compatibility with what the user asked should take 75.
    4. The place score should always be a number between 0 and 100, where 100 is a perfect match and 0 a miss. The score should be placed inside the tags <SCORE></SCORE> in the JSON response.
    5. A place that is no match at all to what the user requested should be assigned a 0.
    6. Use all the information from the place, but mostly read the website using the <WEBSITEURL></WEBSITEURL> tags, for learning what the place offers.
    7. Use the context of the user's prompt to decide how relevant the place is, if the user didn't ask for open places, you should not give closed places a bad score
    8. If a place is repeated, remove the other instances by scoring them 0.
    9. Regarding the place inside the <PLACE></PLACE> tags:
    9.1. <NAME> </NAME> is the name of the place.
    9.2. <TYPE> </TYPE> is the primary type of the place, which describes what it offers.
    9.3. <WEBSITEURL> </WEBSITEURL> is the url to the place website, in case it has one.
    9.4. <OPENNOW> </OPENNOW> it's values will be Open or Closed. It refers to if the place is open at the moment.
    9.5. <RATING> </RATING> is the rating of the place on google maps.
    10. Regarding the user preferences under <PREFERENCES></PREFERENCES> tags:
    10.1 <NATUREVSCITY> </NATUREVSCITY> tags goes from 0 to 100 in which 0 means the user prefers nature strongly and 100 means user prefers city strongly.
    10.2 <BUDGET> </BUDGET> goes from 0 to 4, in which 0 is super cheap and 4 is super expensive.
    10.3 <CULTURE> </CULTURE> goes from 0 to 100 in which 0 means no interest in local culture and 100 means strong interest in local culture.

    <JSON>
    {
      "score": <SCORE></SCORE>
    }
    </JSON>

    <PREFERENCES>
      ${preferencesTag}
    </PREFERENCES>

    <PLACE>
      ${placeTag}
    </PLACE>

    <PROMPT>
      ${prompt}
    </PROMPT>
  `.trim();
};
