const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('manage')
		.setDescription('Manage verified vehicles, edit, delete them etc.'),
	async execute(interaction) {
		return await interaction.reply({
			content: `Coming soon.`,
			ephemeral: true
		});
	},
};