const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { obtainGuildProfile, defaultEmbedColor, obtainAllUserVehicles, obtainUserProfile } = require('../modules/database.js');
const {  errorEmbed, removeNonIntegers, tipsEmbed } = require('../modules/utility.js');

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
		//User Profile 
		const userProfile = await obtainUserProfile(userId);
		const premiumUser = userProfile?.premiumUser;
		const premiumTier = userProfile?.premiumTier;
		let garageThumbnail = userProfile?.garageThumbnail;

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
		const mainInteractionId = interaction.id;

		//Garage data for specified user.
		const garageData = await obtainAllUserVehicles(userId, guildToFetchInfoFrom);

		if(!garageData || garageData?.length === 0){
			let errEmbed;
			if(userId === initiatorId){
				errEmbed = errorEmbed(`**${userName},**\nYou do not have any verified rides, Please visit the <#${guideChannelId}> channel to get started!`, initiatorAvatar)
			}else{
				errEmbed = errorEmbed(`**${userName}** has no verified rides to display.`,initiatorAvatar)
			};
			await interaction.editReply({
				embeds:[errEmbed]
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
		if(garageThumbnail) garageEmbed.setThumbnail(garageThumbnail);

		await interaction.editReply({
			embeds: [garageEmbed]
		});

		const allowedResponses = Array.from(Array(garageData.length + 1).keys()).slice(1).map(x => `${x}`);
		const messageCollector = interaction.channel.createMessageCollector({ filter: messageFilter, time: 60000, max: 3});
		messageCollector.on('collect', async (collectedMessage) => {
			const messageContent = collectedMessage.content;
			const selectedOption = removeNonIntegers(messageContent);
			if(!allowedResponses.includes(selectedOption)) return;
			messageCollector.stop();
			collectedMessage.delete();
			const selectedVehicle = garageData[parseInt(selectedOption) - 1];
			const vehicleName = selectedVehicle.vehicle;
			const vehicleImages = selectedVehicle.vehicleImages;
			const vehicleDescription = selectedVehicle.vehicleDescription;
			const vehicleEmbedColor = selectedVehicle.embedColor || embedColor;
			if(!vehicleImages || vehicleImages.length === 0){
				if(userId === initiatorId){
					await interaction.followUp({
						content: `You have not uploaded any images for your vehicle **${vehicleName}.**\nPlease visit the designated bot commands channel and use the \`/settings\` command.`,
						ephemeral: true
					});
				}else{
					await interaction.followUp({
						content: `There are no images to display for **${vehicleName}**`,
						ephemeral: true
					});
				}
				garageEmbed.setDescription(garageOutput.join('\n'))
				await interaction.editReply({
					embeds: [garageEmbed]
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
			.setCustomId(`previousVehicleImage+${mainInteractionId}`)
			.setLabel('Previous')
			.setStyle('PRIMARY')
			.setDisabled(true);
			const nextButton = new MessageButton()
			.setCustomId(`nextVehicleImage+${mainInteractionId}`)
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

			if(userId === initiatorId && vehicleImages.length === 1){
				await interaction.followUp({
					embeds: [tipsEmbed('You can now upload 5 images of your vehicle by default!\nVisit the dedicated bot commands channel and use the command **`/settings`** to make changes to your vehicles.')],
					ephemeral: true
				});
			};
			//Button collector to manage the multiple images if it exists.
			if(vehicleImages.length > 1){
				let pages = vehicleImages;
				let page = 1;
				//600000 = 10 minutes.
				const buttonCollector = interaction.channel.createMessageComponentCollector({ time: 600000 }); 
				buttonCollector.on('collect', async (collected) => {
					await collected.deferUpdate();
					const buttonId = collected.customId;
					
					switch(buttonId){
						case `nextVehicleImage+${mainInteractionId}`:
							async function nextImage(){
								page++;
								vehicleEmbed
								.setImage(pages[page - 1])
								.setFooter({
									text: `${guildName} • Image ${page} of ${vehicleImages.length}`,
									iconURL: footerIcon
								});
								previousButton.setDisabled(false);
								if (page === pages.length){
									nextButton.setDisabled(true);
								};
								const row = new MessageActionRow() 
								row.addComponents(previousButton).addComponents(nextButton);
								await interaction.editReply({
									embeds: [vehicleEmbed],
									components: [row]
								});
							};
							nextImage();
							break;
						case `previousVehicleImage+${mainInteractionId}`:
							async function previousImage(){
								page--;
								vehicleEmbed
								.setImage(pages[page - 1])
								.setFooter({
									text: `${guildName} • Image ${page} of ${vehicleImages.length}`,
									iconURL: footerIcon
								})
								nextButton.setDisabled(false);
								if (page === 1){
									previousButton.setDisabled(true);
								};
								const row = new MessageActionRow() 
								row.addComponents(previousButton).addComponents(nextButton);
								await interaction.editReply({
									embeds: [vehicleEmbed],
									components: [row]
								});
							};
							previousImage();
							break
					};
				});

				buttonCollector.on('end', async (collected) => {
					await interaction.editReply({
						embeds: [vehicleEmbed],
						components: []
					});
				});
			};
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