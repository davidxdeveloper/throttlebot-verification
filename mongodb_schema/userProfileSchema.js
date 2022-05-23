const mongoose = require('mongoose');

const profileSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: String,
  premiumUser: Boolean,
  premiumTier: Number,
  embedColor: String,
  garageThumbnail: String
});

module.exports = mongoose.model("Users", profileSchema); 