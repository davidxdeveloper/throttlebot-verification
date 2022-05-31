const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, ButtonInteraction, Modal, TextInputComponent} = require('discord.js');
const { obtainGuildProfile, defaultEmbedColor, obtainUserProfile, obtainAllUserCars } = require('../modules/database.js');
const { vehicleSelection } = require('../modules/garageUtils.js');
const guildProfileSchema = require('../mongodb_schema/guildProfileSchema.js');
const { botIcon, greenIndicator, redIndicator, greenColor, redColor, patreonRedColor, patreonBanner, errorEmbed, removeNonIntegers, isValidHttpUrl, patreonAdvertEmbed, patreonRedColor } = require('../modules/utility.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Add your vehicle images, set descriptions and more personalisation options.'),
	async execute(interaction) {
		if(!interaction.deferred) await interaction.deferReply({ ephemral: true });
		//Initiator info
		const initiatorData = interaction.user;
		const initiatorId = interaction.user.id;
		const initiatorUsername = interaction.user.username;
		const initiatorAvatar = interaction.user.displayAvatarURL({ dynamic: true });
		const initiatorTag = interaction.user.tag;
		const guildId = interaction.guild.id;
		const guildName = interaction.guild.name;
		const guildIcon = interaction.guild.iconURL({ dynamic: true });
		//Guild Profile
		async function settingsSetup(){
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
			const verificationRoleId = guildProfile.verifiedVehicleRoleId;
			const syncEnabled = guildProfile.syncEnabled;
			const syncedGuildId = guildProfile.syncedGuildId;
			//const syncedGuildData = await interaction.client.guilds.fetch(syncedGuildId);
			let footerIcon = guildProfile.customFooterIcon || botIcon;
			const footerText = `${guildName} • Vehicle Verification`
			//User profile 
			const userProfile = await obtainUserProfile(initiatorId);
			const premiumUser = userProfile?.premiumUser;
			const premiumTier = userProfile?.premiumTier;
			const garageThumbnail = userProfile?.garageThumbnail;
			//Misc 
			const embedColor = await defaultEmbedColor(initiatorId);
			//Filters
			const messageFilter = (m) => m.author.id === initiatorId;
			const menuFilter = (menuInteraction) => menuInteraction.componentType === 'SELECT_MENU' && menuInteraction.customId === 'settingsMenu' && menuInteraction.user.id === initiatorId;
			const modalFilter = (modalInteraction) => modalInteraction.isModalSubmit() && modalInteraction.customId === 'descriptionModal' && modalInteraction.user.id === initiatorId;

			const logChannel = await interaction.member.guild.channels.fetch(loggingChannelId);
			if(!logChannel){
				await interaction.editReply({
					embeds: [errorEmbed(`Failed to obtain the log channel where the logs are sent.\nPlease ask the staff to make sure the log channel is setup properly.`, initiatorAvatar)],
				});
				return;
			};
			//Checks if the sync is enabled to another server.
			//If it does, then applying for settings will not be allowed unless inside the main server.
			if(syncedGuildId){
				if(!syncedGuildData){
					await interaction.editReply({
						embeds: [errorEmbed(`There was an error when fetching details of the synced server \`(ID: ${syncedGuildId})\``, initiatorAvatar)],
						ephemeral: true
					});
					return;
				};
				const syncedServerName = syncedGuildData.name;
				await interaction.editReply({
					embeds: [errorEmbed(`This server is synced to the \`${syncedServerName}\` server.\nPlease apply for vehicle verification in there.`, initiatorAvatar)],
					ephemeral: true
				});
				return;
			};
			//If any of required channels are not setup.
			if(!verificationChannelId || !guideChannelId || !loggingChannelId){
				await interaction.editReply({
					embeds: [errorEmbed('This server has not been setup properly, please ask the moderation team to use the `/setup` command.', initiatorAvatar)]
				});
				return;
			};

			const garageData = await obtainAllUserCars(initiatorId, guildId);
			if(!garageData || garageData?.length === 0){
				await interaction.editReply({
					embeds:[errorEmbed(`**${userName},**\nYou do not have any verified rides! Please have them verified first by using the \`/verify\` command first.`)],
					ephemeral: true
				});
				return;
			};

			async function settingsDashboard(){
				const selectedVehicle = await vehicleSelection(garageData, initiatorData, footerText, footerIcon, embedColor, interaction);
				if(!selectedVehicle) return;
				const vehicleName = selectedVehicle.vehicle;
				const verificationImage = selectedVehicle.verificationImageLink;
				const vehicleOwnerId = selectedVehicle.userId;
				const vehicleDescription = selectedVehicle.vehicleDescription;
				const vehicleImages = selectedVehicle.vehicleImages;

				const settingsDashboard = new MessageEmbed()
				.setAuthor({
					name: 'Garage Settings Dashboard',
					iconURL: initiatorAvatar
				})
				.setDescription('This dashboard will give you access to configuring your garage and your verified vehicles.\nStart by selecting on the option you would ike to explore from the menu below. ')
				.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
				.addField('Owner', initiatorTag, true)
				.setColor(embedColor)
				.setFooter({
					text: footerText,
					iconURL: footerIcon
				});
				
				const row = new MessageActionRow()
				.addComponents(
					new MessageSelectMenu()
						.setCustomId('settingsMenu')
						.setPlaceholder('Select the option you wish to configure...')
						.addOptions([
							{
								label: 'Images',
								description: 'Add, remove or reset images on your vehicle.',
								value: 'images_option',
							},
							{
								label: 'Description',
								description: 'Provide a description for your vehicle.',
								value: 'description_option',
							},
							{
								label: 'Garage Icon',
								description: 'Set a personalised icon for your garage.',
								value: 'garageIcon_option',
							},
							{
								label: 'Embed Color',
								description: 'Customize the color on the embeds.',
								value: 'embedColor_option',
							},
							{
								label: 'Exit',
								description: 'Exit the interface.',
								value: 'exit_option',
							},
						]),
				);
			
			
				await interaction.editReply({
					embeds: [settingsDashboard],
					components: [row]
				});

				const menuCollector = interaction.channel.createMessageComponentCollector({
					menuFilter,
					max: 1
				});

				menuCollector.on('end', async (menuCollected) => {
					const menuCollectedData = menuCollected?.first();
					if(!menuCollectedData){
						await interaction.deleteReply();
						return;
					};
					const selectedOptionId = menuCollectedData.values[0];
					switch(selectedOptionId){
						case "images_option":
							async function imagesOption(){
								if(!menuCollectedData.deferred) await menuCollectedData.deferUpdate();
								const imagesOptionEmbed = new MessageEmbed()
								.setAuthor({
									name: 'Garage Settings Dashboard - Images Config',
									iconURL: initiatorAvatar
								})
								.setDescription('On this dashboard, you can upload images to the vehicle you selected, remove any you wish or reset them entirely.')
								.setColor(embedColor)
								.setFooter({
									text: footerText,
									iconURL: footerIcon
								});
								const uploadImageButton = new MessageButton()
								.setCustomId('uploadImage')
								.setLabel('Upload')
								.setStyle('PRIMARY');
								const removeImageButton = new MessageButton()
								.setCustomId('removeImage')
								.setLabel('Remove')
								.setStyle('PRIMARY')
								.setDisabled(true);
								const resetImageButton = new MessageButton()
								.setCustomId('resetImage')
								.setLabel('Reset')
								.setStyle('PRIMARY')
								.setDisabled(true);
								const backButton = new MessageButton()
								.setCustomId('backImage')
								.setLabel('Back')
								.setStyle('SECONDARY');
								const exitButton = new MessageButton()
								.setCustomId('exit')
								.setLabel('Exit')
								.setStyle('DANGER');

								if(vehicleImages.length > 0) removeImageButton.setDisabled(false), resetImageButton.setDisabled(false);
								const imagesButtonRow = new MessageActionRow()
								.addComponents(uploadImageButton, removeImageButton, resetImageButton, backButton, exitButton)
								
								await interaction.editReply({
									embeds: [imagesOptionEmbed],
									components: [imagesButtonRow]
								});

								//Component collector to handle the buttons.
								const buttonFilter = i => i.user.id === initiatorId;
								const buttonCollected = await interaction.channel.awaitMessageComponent({ buttonFilter, componentType: 'BUTTON', time: 10000, max: 1 })
								.catch(err => {
									console.log(err)
								});
								if(!buttonCollected){
									await interaction.followUp({
										embeds: [errorEmbed('No response was received, Ending operation.', initiatorAvatar)],
										ephemeral: true
									});
									await interaction.deleteReply();
									return;
								};
								const buttonId = buttonCollected.customId;

								switch(buttonId){
									case 'uploadImage':
										buttonCollected.deferReply();
										//If the vehicle already has an image and the user wishes to add another,
										//We'll check if the user has an image uploaded and if they belong to tier 3 / 4 (Chad Tier & Supreme Overlord respectively.)
										if(vehicleImages.length > 1 && ![3,4].includes(premiumTier)){
											const patreonAd = patreonAdvertEmbed(initiatorAvatar, 'Patreon Exclusive Feature', 'Support us on patreon and be able to showcase your vehicle with multiple images!', footerIcon, footerText)
											await buttonCollected.followUp(patreonAd);
											return imagesOption();
										};

										break;
									case 'removeImage':
										break;
									case 'resetImage':
										break;
									case 'backImage':
										break;
									case 'exitImage':
										break;
								};
							};
							imagesOption();
							break;
						case "description_option":
							async function descriptionOption(){

							};
							break
						case "garageIcon_option":
							async function garageIconOption(){

							};
							break;
						case "embedColor_option":
							async function embedColorOption(){

							};
							break;
						case "exit_option":
							async function exitOption(){

							};
							break;
					};
				});
			};
			settingsDashboard()
		};
		settingsSetup();
	},
};