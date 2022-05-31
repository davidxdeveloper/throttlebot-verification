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
		//Misc
		const messageFilter = (m) => m.author.id === initiatorId;
		const embedColor = await defaultEmbedColor(userId);

		//Garage data for specified user.
		const garageData = await obtainAllUserCars(userId, guildToFetchInfoFrom);

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

		await interaction.editReply({
			embeds: [garageEmbed]
		});

		const allowedResponses = Array.from(Array(garageData.length + 1).keys()).slice(1).map(x => `${x}`);
		const messageCollector = interaction.channel.createMessageCollector({ messageFilter, time: 10000, max: 3});
		messageCollector.on('collect', async (collectedMessage) => {
			const messageContent = collectedMessage.content;
			const selectedOption = removeNonIntegers(messageContent);
			if(!allowedResponses.includes(selectedOption)) return;
			messageCollector.stop();
			collectedMessage.delete();
			const selectedVehicle = garageData[parseInt(selectedOption) - 1];
			const vehicleName = selectedVehicle.vehicle;
			const vehicleImages = selectedVehicle.vehicleImages;
			const vehicleDescription = selectedVehicle.description;
			const vehicleEmbedColor = selectedVehicle.embedColor || embedColor;
			if(!vehicleImages || vehicleImages.length === 0){
				await interaction.followUp({
					content: `There are no images to display for **${vehicleName}**`,
					ephemeral: true
				});
				return;
			};
			const vehicleEmbed = new MessageEmbed()
			.setAuthor({
				name: `${vehicleName} - Driven By ${userTag}`,
				iconURL: userAvatar
			})
			.setColor(vehicleEmbedColor)
			.setImage(vehicleImages[0])
			.setFooter({
				text: `${guildName} • Image 1 of ${vehicleImages.length}`,
				iconURL: footerIcon
			})
			if(vehicleDescription) vehicleEmbed.setDescription(vehicleDescription);
			let componentsArray = [];
			const row = new MessageActionRow() 
			const previousButton = new MessageButton()
			.setCustomId(`previousVehicleImage+${userId}`)
			.setLabel('Previous')
			.setStyle('PRIMARY')
			.setDisabled(true);
			const nextButton = new MessageButton()
			.setCustomId(`nextVehicleImage+${userId}`)
			.setLabel('Next')
			.setStyle('PRIMARY');
			if(vehicleImages.length > 1){
				row.addComponents(previousButton).addComponents(nextButton);
				componentsArray = [row];
			};
			await interaction.editReply({
				embeds: [vehicleEmbed],
				components: componentsArray
			});

		});

		messageCollector.on('end', async (collected) => {
			/*
			Checking if there were no responses collected 
			Or if the responses that were collected are invalid.
			*/
			const collectedResponses = collected.map(x => x.content);
			const whetherAllInvalidResponses = collectedResponses.every(x => {
				return !allowedResponses.includes(x);
			});
			if(whetherAllInvalidResponses){
				garageEmbed.setDescription(garageOutput.join('\n'))
				await interaction.editReply({
					embeds: [garageEmbed]
				});
				return;
			}
		});
	},
}; 