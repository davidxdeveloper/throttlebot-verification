const { MessageEmbed, MessageActionRow, MessageButton, ButtonInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { obtainGuildProfile, defaultEmbedColor, obtainAllUserCars } = require('../modules/database.js');
const guildProfileSchema = require('../mongodb_schema/guildProfileSchema.js');
const { botIcon, greenIndicator, redIndicator, greenColor, redColor, errorEmbed, removeNonIntegers, embedColor } = require('../modules/utility.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('garage')
		.setDescription('View yours or another user\'s garage.')
		.addUserOption(option => option.setName('mention').setDescription('View another user\'s garage.')),

	async execute(interaction) {
		//Defining user details.
		await interaction.deferReply({ ephemeral: false })
		const initiatorId = interaction.user.id;
		const initiatorUsername = interaction.user.username;
		const initiatorAvatar = interaction.user.displayAvatarURL({ dynamic: true });
		const userDetails = interaction.options.getUser('mention') 
		|| interaction.user;
		const userId = userDetails.id;
		const userName = userDetails.username;
		const userAvatar = userDetails.displayAvatarURL({ dynamic: true });
		const userTag = userDetails.tag;
		if(userDetails.bot){
			interaction.editReply({
				embeds: [errorEmbed('Bots..cannot have verified rides....', initiatorAvatar)]
			});
			return;
		};
		//Guild information
		const guildId = interaction.guild.id;
		const guildName = interaction.guild.name;
		const guildIcon = interaction.guild.iconURL({ dynamic: true });	
		//Garage data for specified user.
		const garageData = await obtainAllUserCars(userId, guildId);

		//Guild Profile
		const guildProfile = await obtainGuildProfile(guildId);
		if(!guildProfile){
			interaction.editReply({
				embeds: [errorEmbed('Server profile not setup, please kick the bot and invite it again.', initiatorAvatar)]
			});
			return;
		};
		const verificationChannelId = guildProfile.verificationChannelId;
		const guideChannelId = guildProfile.guideChannelId;
		const loggingChannelId = guildProfile.loggingChannelId;
		const syncEnabled = guildProfile.syncEnabled;
		const syncedGuildId = guildProfile.syncedGuildId;
		let footerIcon = guildProfile.customFooterIcon || guildIcon;
		const footerText = `${guildName} • Vehicle Verification`
		const guildToFetchInfoFrom = syncedGuildId || guildId
		
		/*
		In this function we'll check for the following things:
			1. Check whether the server has been setup.
				1.A. Check if all channels are configured.
			2. Whether user has any cars.
				2.A. If the user is the same as the initiator, ask them to
				verify a ride first.
		*/
		if(!garageData || garageData?.length === 0){
			let errEmbed;
			let ephemeralStatus = false;
			if(userId === initiatorId){
				errEmbed = errorEmbed(`**${userName},**\nYou do not have any verified rides! Please have them verified first by using the \`/verify\` command for them to show up in your garage.`)
				ephemeralStatus = true
			}else{
				errEmbed = errorEmbed(`**${userName}** has no verified rides to display.`,initiatorAvatar)
			};
			await interaction.editReply({
				embeds:[errEmbed],
				ephemeral: ephemeralStatus
			});
			return;
		};
		
		const garageOutput = garageData.map((x,y) => {
			return `\`${y+1}.\` ${x.vehicle}`
		});

		const garageEmbed = new MessageEmbed()
		.setAuthor({
			name: `${userTag}'s Garage`,
			iconURL: userAvatar
		})
		.setDescription(`Please type the number corresponding the vehicle you would like to checkout.\n${garageOutput.join('\n')}`)
		.setColor(embedColor)
		.setFooter({
			text: footerText,
			iconURL: footerIcon
		});
		//Handling any potential errors.
		await interaction.editReply({
			embeds: [garageEmbed]
		})
	},
}; 