const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		return await interaction.reply(`Pong! \`${Date.now() - interaction.createdTimestamp}ms\` | API: \`${Math.round(interaction.client.ws.ping)}ms\``);
	},
};