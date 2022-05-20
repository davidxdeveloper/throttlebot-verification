const mongoose = require('mongoose');

const guildSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  guildId: String,
  guideChannelId: String,
  verificationChannelId: String,
  loggingChannelId: Array,
  addedOn: String,
  customFooterIcon: String,
  syncEnabled: Boolean,
  syncedGuildId: String,
});

module.exports = mongoose.model("Guilds Collection", guildSchema); 