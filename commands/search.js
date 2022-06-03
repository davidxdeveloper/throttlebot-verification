const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search server-wide for a specific vehicle.')
		.addStringOption(option => option.setName('input').setDescription('Enter a string')),
		async execute(interaction) {
		return await interaction.reply({
			content: `Coming soon.`,
			ephemeral: true
		});
	},
};