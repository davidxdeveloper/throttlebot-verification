const mongoose = require('mongoose');

const garageSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  guildId: String,
  userId: String,
  vehicle: String,
  vehicleImages: Array,
  vehicleDescription: String,
  vehicleAddedDate: String,
  verificationImageLink: String,
  embedColor: String,
});

module.exports = mongoose.model("Verified Vehicles", garageSchema); 