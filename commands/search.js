const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search server-wide for a specific vehicle.')
		.addStringOption(option => option.setName('vehicle').setDescription('Enter what vehicle you would like to search for.')),
		async execute(interaction) {
		return await interaction.reply({
			content: `Coming soon.`,
			ephemeral: true
		});
	},
};