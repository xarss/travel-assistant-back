require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const apiRoutes = require("./routes/api");

const app = express();
const port = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(bodyParser.json());

// Use API routes
app.use("/api", apiRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
