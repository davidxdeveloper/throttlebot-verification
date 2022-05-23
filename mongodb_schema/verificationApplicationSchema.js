const mongoose = require('mongoose');

const verificationApplication = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  guildId: String,
  userId: String,
  vehicle: String,
  vehicleImageURL: String,
  vehicleImageProxyURL: String,
  vehicleImageName: String,
  status: String,
  submittedOn: String,
  applicationMessageId: String,
  decision: String,
  decidedBy: String,
  decidedOn: String
});

module.exports = mongoose.model("Verification Applications", verificationApplication); 