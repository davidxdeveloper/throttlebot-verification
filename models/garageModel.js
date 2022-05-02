const mongoose = require('mongoose');
const garageModel = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  carName: String,
  userID: String,
  userName: String,
  verificationimage: String,
  Case: Number,
  carImg: Array,
  description: String
});
module.exports = mongoose.model("TccGarage", garageModel); 