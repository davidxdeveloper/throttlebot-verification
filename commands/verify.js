const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('verify')
		.setDescription('Apply for verification of your vehicle.')
		.addStringOption(option => option.setName('name').setDescription('Enter the name of your vehicle.').setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true })
		//Send the embed asking to upload the verification image with the important points listed.
		return await interaction.editReply(`*Insert verification stuff here*`);
		
	},
};