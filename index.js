const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB);
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ error: "Cette route n'existe pas" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
