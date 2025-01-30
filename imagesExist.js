require("dotenv").config(); // Load environment variables from .env file
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASS,
    authSource: "PortfoliosDB",
  })
  .then(() => {
    console.log("Connected to MongoDB");
    checkImages().then(() => process.exit(0)); // Check images and exit
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Define a schema for art portfolios
const portfolioSchema = new mongoose.Schema(
  {
    artist: { type: String, required: true },
    description: { type: String, required: true },
    tags: { type: [String], required: true },
    imageUrl: { type: String, required: true },
    websiteUrl: { type: String, required: true },
    imageExists: { type: Boolean, default: true }, // Track if the image exists
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create a model from the schema
const Portfolio = mongoose.model("Portfolio", portfolioSchema);

// Folder where images are stored
const IMAGES_FOLDER = path.resolve(__dirname, "imgs");

// Function to check if portfolio images exist
async function checkImages() {
  let presentCount = 0;
  let missingCount = 0;

  try {
    const portfolios = await Portfolio.find(); // Fetch all portfolios
    console.log(`Found ${portfolios.length} portfolios`);

    for (const portfolio of portfolios) {
      const { imageUrl, artist } = portfolio;
      const imagePath = path.join(IMAGES_FOLDER, imageUrl);

      if (fs.existsSync(imagePath)) {
        presentCount++;
      } else {
        missingCount++;
        console.error(`Image for ${artist} does not exist at ${imagePath}.`);
      }
    }

    console.log(
      `Image check completed: ${presentCount} present, ${
        missingCount > 0 ? `${missingCount} missing` : "none missing"
      }.`
    );
    if (missingCount) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Error checking images:", error);
    process.exit(1); // Fail the script if there's an error
  }
}
