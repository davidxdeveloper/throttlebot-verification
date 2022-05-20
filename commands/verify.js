const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('verify')
		.setDescription('Apply for verification of your vehicle.')
		.addStringOption(option => option.setName('name').setDescription('Enter the name of your vehicle.').setRequired(true))
		.addAttachmentOption(option => option.setName('image').setDescription('Please upload the image of your vehicle with all the required items.').setRequired(true)),

		async execute(interaction) {
		await interaction.deferReply({ ephemeral: false })
		//Send the embed asking to upload the verification image with the important points listed.
		const vehicleAttachmentData = interaction.options.getAttachment('image');
		const vehicleImageURL = vehicleAttachmentData.url;
		const vehicleImageProxyURL = vehicleAttachmentData.proxyURL;
		const vehicleImageSize = vehicleAttachmentData.size;
		//Check if the size is not bigger than 8mb
		const vehicleName = interaction.options.getString('name');
		return await interaction.editReply(`__**Vehicle Verification Details**__\nName: ${vehicleName}\nImage: ${vehicleImageURL}`);
		
	},
};