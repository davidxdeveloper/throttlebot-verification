const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, Modal, TextInputComponent} = require('discord.js');
const { obtainGuildProfile, defaultEmbedColor, obtainUserProfile, obtainAllUserVehicles } = require('../modules/database.js');
const { vehicleSelection } = require('../modules/commandUtils/garageUtils/vehicleSelection.js');
const { manageDashboard } = require('../modules/commandUtils/manageUtils/main.js');
const userProfileSchema = require('../mongodb_schema/userProfileSchema.js');
const garageSchema = require('../mongodb_schema/garageSchema.js');
const { botIcon, greenColor, redColor, garageIconExample, garageEmbedColorExample, errorEmbed, removeNonIntegers, isValidHttpUrl, patreonAdvertEmbed } = require('../modules/utility.js');
const wait = require('node:timers/promises').setTimeout;
var isHexColor = require('validate.io-color-hexadecimal');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('manage')
		.setDescription('Manage verified vehicles, edit, delete them etc.')
		.addUserOption(option => option.setName('user').setDescription('Manage the mentioned user.')),
	async execute(interaction) {
		if(!interaction.deferred) await interaction.deferReply({ ephemral: true });
		//Initiator info
		const initiatorData = interaction.user;
		const initiatorId = interaction.user.id;
		const initiatorUsername = interaction.user.username;
		const initiatorAvatar = interaction.user.displayAvatarURL({ dynamic: true });
		const initiatorTag = interaction.user.tag;
		const userData = interaction.options.getUser('user') 
		|| interaction.user;
		const userId = userData.id;
		const userName = userData.username;
		const userAvatar = userData.displayAvatarURL({ dynamic: true });
		const userTag = userData.tag;
		if(userData.bot){
			interaction.editReply({
				embeds: [errorEmbed('Bots..cannot have verified rides....', initiatorAvatar)]
			});
			return;
		};
		//Guild information
		const guildData = interaction.guild;
		const guildId = interaction.guild.id;
		const guildName = interaction.guild.name;
		const guildIcon = interaction.guild.iconURL({ dynamic: true });	
		//Misc
		const embedColor = await defaultEmbedColor(initiatorId);
		

		manageDashboard(interaction, initiatorData, userData, guildData, embedColor);		
	},
	
};