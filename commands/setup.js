const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup the bot for your server.'),
	async execute(interaction) {
		await interaction.deferReply({ ephemral: true })
		return await interaction.reply(`*Insert setup here*`);
	},
};