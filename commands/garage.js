const { SlashCommandBuilder } = require('@discordjs/builders');
const garageDB = require("../models/garageModel.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('garage')
		.setDescription('View yours or another user\'s garage.')
		.addUserOption(option => option.setName('mention').setDescription('View another user\'s garage.')),
	async execute(interaction) {
		const userId = interaction.user.id;
		const username = interaction.user.username;
		const garageData = await garageDB.find({ userID: userId });
		return interaction.reply('*insert garage here*');
	},
}; 