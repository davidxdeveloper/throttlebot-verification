const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { botInvite, botInviteAdmin, ownerAvatar, ownerTag} = require('../modules/utility.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('Invite the bot to your own server!'),
		async execute(interaction) {
			const initiatorId = interaction.user.id;
			const initiatorUsername = interaction.user.username;
			const initiatorAvatar = interaction.user.displayAvatarURL({ dynamic: true });
			const aboutEmbed = new MessageEmbed()
			.setTitle('ThrottleBot Vehicle Verification')
			.setDescription('We\'re simplifying the process of verifying your vehicles across Discord by providing a seamless and feature full experience.\nThe bot utilizes Discord\'s latest API version V9 to provide you with the latest features that are available.')
			.addField('Freatures','• A garage system to store and display all your vehicles.\n• Seamless verifcation process with the help of buttons.\n• Slash commands for a powerful and interactive experience.\n• Syncing across different servers.')
			.setColor('#FFFCFF')
			.setFooter({
				text: `Made with 💖 by ${ownerTag}`,
				iconURL: ownerAvatar
			});
	
			const InviteButton = new MessageButton()
			.setLabel('Invite')
			.setStyle('LINK')
			.setURL(botInvite);

			const InviteAdminButton = new MessageButton()
			.setLabel('Invite (Admin)')
			.setStyle('LINK')
			.setURL(botInviteAdmin);
	
			const row = new MessageActionRow() 
			.addComponents(InviteButton, InviteAdminButton)
			
			await interaction.reply({
				embeds: [aboutEmbed],
				components: [row]
			});
		},
};