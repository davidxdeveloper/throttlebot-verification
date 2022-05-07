const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Add images'),
	async execute(interaction) {
		return await interaction.reply(`*Insert settings menu here*`);
	},
};