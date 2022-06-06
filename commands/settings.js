const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageSelectMenu, MessageButton, Modal, TextInputComponent} = require('discord.js');
const { obtainGuildProfile, defaultEmbedColor, obtainUserProfile, obtainAllUserVehicles } = require('../modules/database.js');
const { vehicleSelection } = require('../modules/garageUtils.js');
const userProfileSchema = require('../mongodb_schema/userProfileSchema.js');
const garageSchema = require('../mongodb_schema/garageSchema.js');
const { botIcon, greenIndicator, redIndicator, greenColor, redColor, patreonRedColor, patreonBanner, garageIconExample, errorEmbed, removeNonIntegers, isValidHttpUrl, patreonAdvertEmbed } = require('../modules/utility.js');
const wait = require('node:timers/promises').setTimeout;
var isHexColor = require( 'validate.io-color-hexadecimal' );

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
			let garageThumbnail = userProfile?.garageThumbnail;
			//Misc 
			const embedColor = await defaultEmbedColor(initiatorId);
			//Filters
			const messageFilter = (m) => m.author.id === initiatorId;
			const menuFilter = (menuInteraction) => menuInteraction.componentType === 'SELECT_MENU' && menuInteraction.customId === 'settingsMenu' && menuInteraction.user.id === initiatorId;
			const modalFilter = (modalInteraction) => modalInteraction.isModalSubmit() && modalInteraction.customId === 'descriptionModal' && modalInteraction.user.id === initiatorId;
			const buttonFilter = i => i.user.id === initiatorId;

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

			const logChannel = await interaction.member.guild.channels.fetch(loggingChannelId);
			if(!logChannel){
				await interaction.editReply({
					embeds: [errorEmbed(`Failed to obtain the log channel where the logs are sent.\nPlease ask the staff to make sure the log channel is setup properly.`, initiatorAvatar)],
				});
				return;
			};

			const garageData = await obtainAllUserVehicles(initiatorId, guildId);
			if(!garageData || garageData?.length === 0){
				await interaction.editReply({
					embeds:[errorEmbed(`**${initiatorUsername},**\nYou do not have any verified rides! Please have them verified first by using the \`/verify\` command first.`)],
					ephemeral: true
				});
				return;
			};

			const selectedVehicle = await vehicleSelection(garageData, initiatorData, footerText, footerIcon, embedColor, interaction);
			if(!selectedVehicle) return;
			const vehicleName = selectedVehicle.vehicle;
			const verificationImage = selectedVehicle.verificationImageLink || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
			const vehicleOwnerId = selectedVehicle.userId;
			let vehicleDescription = selectedVehicle.vehicleDescription;
			let vehicleImages = selectedVehicle.vehicleImages;
			async function settingsDashboard(){
				const settingsDashboardEmbed = new MessageEmbed()
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
					embeds: [settingsDashboardEmbed],
					components: [row]
				});

				const menuCollector = interaction.channel.createMessageComponentCollector({
					filter: menuFilter,
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
								.setCustomId('exitImage')
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
								const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 120000, max: 1 })
								.catch(e => {});
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
										async function uploadImageOption(){
											if(!buttonCollected.deferred) await buttonCollected.deferUpdate();
											//If the vehicle already has an image and the user wishes to add another,
											//We'll check if the user has an image uploaded and if they belong to tier 3 / 4 (Chad Tier & Supreme Overlord respectively.)
											if(vehicleImages.length >= 1 && ![3,4].includes(premiumTier) && !premiumUser){
												const {advertEmbed, buttonsRow} = patreonAdvertEmbed(initiatorAvatar, 'Patreon Exclusive Feature', 'Support us on patreon and be able to showcase your vehicle with multiple images!', footerIcon, footerText)
												await buttonCollected.followUp({
													embeds: [advertEmbed],
													components: [buttonsRow],
													ephemeral: true
												});
												return imagesOption();
											};

											const addImagePromptEmbed = new MessageEmbed()
											.setAuthor({
												name: 'Please Upload The Image',
												iconURL: initiatorAvatar
											})
											.setDescription('Please upload the image for your vehicle down below. Please make sure you meet the requirements listed.')
											.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
											.addField('Owner', initiatorTag, true)
											.addField('Requirements','1. Only upload an image and not a video or any other format.\n2. The image you upload must be under `8mb`\n3. Only upload one image at a time.\n4. Only upload your vehicle\'s image and make sure it abides by the server rules.')
											.setColor(embedColor)
											.setFooter({
												text: footerText,
												iconURL: footerIcon
											});
											/*
											We'll setup two buttons here, 
											Back & Exit
											So two collectors, one for message to collect the image and another for the buttons
											Once the image is uploaded, the image will be updated in the database and in the vehicleImages array,
											And a confirmation of upload message will be displayed with three buttons,
											Add More Images, Back, Exit
											Which will have an awaitMessageComponent and not a collector as it's only for collecting the buttons.
											*/
											const buttonsRow = new MessageActionRow()
											.addComponents(
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('uploadImageBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('uploadImageExit'),
											);
											await interaction.editReply({
												embeds: [addImagePromptEmbed],
												components: [buttonsRow]
											});

											//Setting up the collectors for the buttons and message (to collect the image) respectively.
											//This will let us know once the timer is over, whether the buttons were used so that the 
											//message collector can stop right there, else it can delete the interaction message.
											let whetherButtonCollected = false;
											const buttonCollector = interaction.channel.createMessageComponentCollector({
												filter: buttonFilter,
												max: 1,
												componentType: 'BUTTON',
												time: 120000
											});
											
											buttonCollector.on('end', async (allCollected) => {
												const collected = allCollected?.first();
												if(!collected) return;
												whetherButtonCollected = true;
												await collected.deferUpdate();
												const buttonId = collected.customId;
												if(buttonId === 'uploadImageBack'){
													return imagesOption();
												}else if(buttonId === 'uploadImageExit'){
													await interaction.deleteReply();
												};
											});
				
											//Using a message collector to obtain the channel details.
											const messageCollector = interaction.channel.createMessageCollector({ filter: messageFilter, time: 120000, max: 1});
											messageCollector.on('end', async (allCollected) => {
												const collected = allCollected.first();
												if(!collected){
													if(whetherButtonCollected){
														return;
													}else{
														await interaction.deleteReply();
													};
												};
												buttonCollector.stop();
												const messageContent = collected.content;
												const attachmentURL = collected.attachments.first()?.url || messageContent;
												const attachmentSize = collected.attachments.first()?.size;
												const attachmentType = collected.attachments.first()?.contentType;											
												const whetherValidUrl = isValidHttpUrl(attachmentURL);

												if(!attachmentURL || !whetherValidUrl){
													interaction.editReply({
														embeds: [errorEmbed('A valid image attachment was not provided.\nGoing back to main menu in 5s...', initiatorAvatar)],
														components: []
													});
													await wait(5000);
													return imagesOption();
												};

												if(attachmentType && !attachmentType.includes('image')){
													await interaction.editReply({
														embeds: [errorEmbed('Please make sure the attachment you upload is an image or gif.\nGoing back to main menu in 5s...', initiatorAvatar)],
														components: []
													});
													await wait(5000);
													return imagesOption();	
												};

												if(attachmentSize > 8000000){
													//err, attachment too big
													await interaction.editReply({
														embeds: [errorEmbed('The attachment you provided is too big, it must be under `8mb`\nGoing back to main menu in 5s...', initiatorAvatar)],
														components: []
													});
													await wait(5000);
													return imagesOption();
												};
												
												vehicleImages.push(attachmentURL)
												await garageSchema.updateOne({guildId: guildId, userId: initiatorId, vehicle: vehicleName }, {$push: {vehicleImages: attachmentURL }})
												.catch(async e => {
													await interaction.editReply({
														embeds: [errorEmbed(e, initiatorAvatar)],
														components: []
													})
													return;
												});

												const confirmationEmbed = new MessageEmbed()
												.setAuthor({
													name: 'Image Uploaded Successfully',
													iconURL: initiatorAvatar
												})
												.setDescription('Your vehicle\'s image has been updated successfully! Check it out using the `/garage` command.\nYou can use the buttons down below to add more images or navigate back the the menu.')
												.setColor(greenColor)
												.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
												.addField('Owner', initiatorTag, true)
												.addField('Note','1. Please **do not delete the image** you uploaded. Deleting the image will render it useless and not display it.\n2. The image you upload must be appropriate and not violate any discord/server rules.')
												.setThumbnail(attachmentURL)
												.setFooter({
													text: footerText,
													iconURL: footerIcon
												});
												const buttonsRow = new MessageActionRow()
												.addComponents(
												new MessageButton()
													.setLabel('Add More Images')
													.setStyle('SUCCESS')
													.setCustomId('imageUploadConfirmedAdd'),
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('imageUploadConfirmedBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('imageUploadConfirmedExit'),
												);
												await interaction.editReply({
													embeds: [confirmationEmbed],
													components: [buttonsRow]
												});	

												//Logging that a new vehicle image was uploaded to the logs channel.
												const newImageUploadedLog = new MessageEmbed()
												.setAuthor({
													name: 'New Vehicle Image Added',
													iconURL: initiatorAvatar
												})
												.setDescription('A new image was uploaded to the vehicle specified below. Please ensure that the image is appropriate and does not violate any discord/server rules.')
												.setColor(greenColor)
												.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
												.addField('Owner', initiatorTag, true)
												.setImage(attachmentURL)
												.setFooter({
													text: footerText,
													iconURL: footerIcon
												});
												logChannel.send({
													embeds: [newImageUploadedLog]
												});
												
												const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
												.catch(e => {

												});
												if(!buttonCollected){
													await interaction.editReply({
														embeds: [confirmationEmbed],
														components: []
													});
													return;
												};
												const buttonId = buttonCollected.customId;
												switch(buttonId){
													case 'imageUploadConfirmedAdd':
														async function addMoreImages(){
															await buttonCollected.deferUpdate();
															if(vehicleImages.length >= 1 && ![3,4].includes(premiumTier) && !premiumUser){
																const {advertEmbed, buttonsRow} = patreonAdvertEmbed(initiatorAvatar, 'Patreon Exclusive Feature', 'Support us on patreon and be able to showcase your vehicle with multiple images!', footerIcon, footerText)
																await buttonCollected.followUp({
																	embeds: [advertEmbed],
																	components: [buttonsRow],
																	ephemeral: true
																});
																return imagesOption();
															}else{
																return uploadImageOption();
															};
														};
														addMoreImages();
														break;
													case 'imageUploadConfirmedBack':
														function goBackAfterUploading(){
															return imagesOption();
														};
														goBackAfterUploading();
														break;
													case 'imageUploadConfirmedExit':
														async function exitAfterUploading(){
															await interaction.editReply({
																embeds: [confirmationEmbed],
																components: []
															});
														};
														exitAfterUploading();
														break;
												};
											});
										};
										uploadImageOption();
										break;
									case 'removeImage':
										async function removeImageOption(){
											if(!buttonCollected.deferred) await buttonCollected.deferUpdate();
											const vehicleImagesOutput = vehicleImages.map((x, i) => `${`\`${i+1}.\` [Click Here](${x})`}`)
											const removeImageSelectionEmbed = new MessageEmbed()
											.setAuthor({
												name: 'Remove Vehicle Image',
												iconURL: initiatorAvatar
											})
											.setDescription('Please type the number corresponding to the image you would like to remove.')
											.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
											.addField('Owner', initiatorTag, true)
											.addField('Image(s)', vehicleImagesOutput.join('\n'))
											.setColor(embedColor)
											.setFooter({
												text: footerText,
												iconURL: footerIcon
											});
											const buttonsRow = new MessageActionRow()
											.addComponents(
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('removeImageBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('removeImageExit'),
											);
											await interaction.editReply({
												embeds: [removeImageSelectionEmbed],
												components: [buttonsRow]
											});
											
											let whetherButtonCollected = false;
											const buttonCollector = interaction.channel.createMessageComponentCollector({
												filter: buttonFilter,
												max: 1,
												componentType: 'BUTTON',
												time: 60000
											});
											
											buttonCollector.on('end', async (allCollected) => {
												const collected = allCollected?.first();
												if(!collected) return;
												whetherButtonCollected = true;
												await collected.deferUpdate();
												const buttonId = collected.customId;
												if(buttonId === 'removeImageBack'){
													return imagesOption();
												}else if(buttonId === 'removeImageExit'){
													await interaction.deleteReply();
												};
											});

											const messageCollector = interaction.channel.createMessageCollector({ filter: messageFilter, time: 60000, max: 1});
											messageCollector.on('end', async (allCollected) => {
												const collected = allCollected.first();
												if(!collected){
													if(whetherButtonCollected){
														return;
													}else{
														await interaction.deleteReply();
													};
												};
												buttonCollector.stop();
												const messageContent = collected.content;
												const allowedResponses = Array.from(Array(vehicleImages.length + 1).keys()).slice(1).map(x => `${x}`);
												const selectedOption = removeNonIntegers(messageContent);
												if(!allowedResponses.includes(selectedOption)){
													await interaction.followUp({
														embeds:[errorEmbed('You entered an invalid input, going back to image menu...')],
														ephemeral: true
													});
													return imagesOption();
												};
												const selectedIndex = parseInt(selectedOption) - 1
												const vehicleImagesOutputNew = vehicleImages.map((x,i) => {
													if(i !== selectedIndex){
														return `${`\`${i+1}.\` [Click Here](${x})`}`
													}else{
														return `${`\`${i+1}.\` ~~[Click Here](${x})~~`}`
													};
												});
												const imageRemoved = vehicleImages[selectedIndex]
												vehicleImages.splice(selectedIndex, 1);

												await garageSchema.updateOne({guildId: guildId, userId: initiatorId, vehicle: vehicleName }, {$set: {vehicleImages: vehicleImages }})
												.catch(async e => {
													await interaction.editReply({
														embeds: [errorEmbed(e, initiatorAvatar)],
														components: []
													})
													return;
												});
												
												const removeImageConfirmationEmbed = new MessageEmbed()
												.setAuthor({
													name: 'Removed Vehicle Image Successfully',
													iconURL: initiatorAvatar
												})
												.setDescription(`The [image](${imageRemoved}) has been removed from your vehicle successfully.`)
												.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
												.addField('Owner', initiatorTag, true)
												.addField('Image(s)', vehicleImagesOutputNew.join('\n'))
												.setColor(greenColor)
												.setFooter({
													text: footerText,
													iconURL: footerIcon
												});
												const buttonsRow = new MessageActionRow()
												.addComponents(
													new MessageButton()
														.setLabel('Back')
														.setStyle('SECONDARY')
														.setCustomId('removeImageConfirmedBack'),
													new MessageButton()
														.setLabel('Exit')
														.setStyle('DANGER')
														.setCustomId('removeImageConfirmedExit'),
												);
												await interaction.editReply({
													embeds: [removeImageConfirmationEmbed],
													components: [buttonsRow]
												});

												const removeImageLogEmbed = new MessageEmbed()
												.setAuthor({
													name: 'Vehicle Image Removed',
													iconURL: initiatorAvatar
												})
												.setDescription(`An [image](${imageRemoved}) was removed from the vehicle specified below.`)
												.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
												.addField('Owner', initiatorTag, true)
												.addField('Image(s)', vehicleImagesOutputNew.join('\n'))
												.setThumbnail(imageRemoved)
												.setColor(greenColor)
												.setFooter({
													text: footerText,
													iconURL: footerIcon
												});
												logChannel.send({
													embeds: [removeImageLogEmbed]
												});
												const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
												.catch(e => {});
												if(!buttonCollected){
													await interaction.editReply({
														embeds: [removeImageConfirmationEmbed],
														components: []
													});
													return;
												};
												const buttonId = buttonCollected.customId;
												switch(buttonId){
													case 'removeImageConfirmedBack':
														async function removeImageConfirmedBack(){
															await buttonCollected.deferUpdate();
															return imagesOption();
														};
														removeImageConfirmedBack();
														break;
													case 'removeImageConfirmedExit':
														async function removeImageConfirmedExit(){
															await buttonCollected.deferUpdate();
															await interaction.deleteReply();
														};
														removeImageConfirmedExit();
														break;
												};

											});
										};
										removeImageOption();
										break;
									case 'resetImage':
										async function resetImageOption(){
											if(!buttonCollected.deferred) await buttonCollected.deferUpdate();
											const imagesToReset = vehicleImages.map((x, i) => `${`\`${i+1}.\` [Click Here](${x})`}`)
											const resetEmbed = new MessageEmbed()
											.setAuthor({
												name: 'Reset All Vehicle Images',
												iconURL: initiatorAvatar
											})
											.setDescription(`A total of **${vehicleImages.length}** image(s) will be reset from your vehicle. Please use the buttons down below to proceed.`)
											.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
											.addField('Owner', initiatorTag, true)
											.addField('Image(s)', imagesToReset.join('\n'))
											.setColor(embedColor)
											.setFooter({
												text: footerText,
												iconURL: footerIcon
											});
											const buttonsRow = new MessageActionRow()
											.addComponents(
												new MessageButton()
													.setLabel('Confirm')
													.setStyle('SUCCESS')
													.setCustomId('resetConfirm'),
												new MessageButton()
													.setLabel('Deny')
													.setStyle('DANGER')
													.setCustomId('resetDeny'),
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('resetBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('resetExit'),
											);
											await interaction.editReply({
												embeds: [resetEmbed],
												components: [buttonsRow]
											});

											const buttonCollected_2 = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
											.catch(e => {
											});
											if(!buttonCollected_2){
												await interaction.followUp({
													embeds: [errorEmbed('No response was received, Ending operation.', initiatorAvatar)],
													ephemeral: true
												});
												await interaction.deleteReply();
												return;
											};
											const buttonId_2 = buttonCollected_2.customId;
											switch(buttonId_2){
												case 'resetConfirm':
													async function resetConfirmation(){
														await buttonCollected_2.deferUpdate();

														await garageSchema.updateOne({guildId: guildId, userId: initiatorId, vehicle: vehicleName }, {$set: {vehicleImages: [] }})
														.catch(async e => {
															await interaction.editReply({
																embeds: [errorEmbed(e, initiatorAvatar)],
																components: []
															})
															return;
														});
														vehicleImages = [];

														const resetEmbed = new MessageEmbed()
														.setAuthor({
															name: 'Vehicle Images Reset Successfully',
															iconURL: initiatorAvatar
														})
														.setDescription(`A total of **${vehicleImages.length}** image(s) have been reset from your vehicle. You can find the details down below.`)
														.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
														.addField('Owner', initiatorTag, true)
														.addField('Image(s)', imagesToReset.join('\n'))
														.setColor(greenColor)
														.setFooter({
															text: footerText,
															iconURL: footerIcon
														});
														const buttonsRow = new MessageActionRow()
														.addComponents(
															new MessageButton()
																.setLabel('Back')
																.setStyle('SECONDARY')
																.setCustomId('resetConfirmedBack'),
															new MessageButton()
																.setLabel('Exit')
																.setStyle('DANGER')
																.setCustomId('resetConfirmedExit'),
														);
														await interaction.editReply({
															embeds: [resetEmbed],
															components: [buttonsRow]
														});

														const resetLogEmbed = new MessageEmbed()
														.setAuthor({
															name: 'Vehicle Images Reset',
															iconURL: initiatorAvatar
														})
														.setDescription(`A total of **${vehicleImages.length}** image(s) have been reset from the vehicle specified below.`)
														.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
														.addField('Owner', initiatorTag, true)
														.addField('Image(s)', imagesToReset.join('\n'))
														.setColor(greenColor)
														.setFooter({
															text: footerText,
															iconURL: footerIcon
														});
														logChannel.send({
															embeds: [resetLogEmbed]
														});

														const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
														.catch(e => {});
														if(!buttonCollected){
															await interaction.editReply({
																embeds: [resetEmbed],
																components: []
															});
															return;
														};
														const buttonId = buttonCollected.customId;
														switch(buttonId){
															case 'resetConfirmedBack':
																async function resetConfirmedBack(){
																	await buttonCollected.deferUpdate();
																	return imagesOption();
																};
																resetConfirmedBack();
																break;
															case 'resetConfirmedExit':
																async function resetConfirmedExit(){
																	await buttonCollected.deferUpdate();
																	await interaction.deleteReply();
																};
																resetConfirmedExit();
																break;
														};

													};
													resetConfirmation();
													break;
												case 'resetDeny':
													async function resetDenial(){
														await buttonCollected_2.deferUpdate();
														const resetEmbed = new MessageEmbed()
														.setAuthor({
															name: 'Vehicle Images Reset Declined',
															iconURL: initiatorAvatar
														})
														.setDescription(`Your vehicle's images have not been reset.`)
														.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
														.addField('Owner', initiatorTag, true)
														.addField('Image(s)', imagesToReset.join('\n'))
														.setColor(redColor)
														.setFooter({
															text: footerText,
															iconURL: footerIcon
														});
														const buttonsRow = new MessageActionRow()
														.addComponents(
															new MessageButton()
																.setLabel('Back')
																.setStyle('SECONDARY')
																.setCustomId('resetDeniedBack'),
															new MessageButton()
																.setLabel('Exit')
																.setStyle('DANGER')
																.setCustomId('resetDeniedExit'),
														);
														await interaction.editReply({
															embeds: [resetEmbed],
															components: [buttonsRow]
														});
														
														const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
														.catch(e => {});
														if(!buttonCollected){
															await interaction.editReply({
																embeds: [resetEmbed],
																components: []
															});
															return;
														};
														const buttonId = buttonCollected.customId;
														switch(buttonId){
															case 'resetConfirmedBack':
																async function resetDeniedBack(){
																	await buttonCollected.deferUpdate();
																	return imagesOption();
																};
																resetDeniedBack();
																break;
															case 'resetConfirmedExit':
																async function resetDeniedExit(){
																	await buttonCollected.deferUpdate();
																	await interaction.deleteReply();
																};
																resetDeniedExit();
																break;
														};

													};
													resetDenial();
													break;
												case 'resetBack':
													async function resetGoBack(){
														await buttonCollected_2.deferUpdate();
														return imagesOption();
													};
													resetGoBack();
													break;
												case 'resetExit':
													async function resetExit(){
														await buttonCollected_2.deferUpdate();
														await interaction.deleteReply();
													};
													resetExit();
													break;
											};
										};
										resetImageOption();
										break;
									case 'backImage':
										async function backToMenuFromImageOption(){
											if(!buttonCollected.deferred) await buttonCollected.deferUpdate();
											return settingsDashboard();
										};
										backToMenuFromImageOption();
										break;
									case 'exitImage':
										async function exitImageOption(){
											if(!buttonCollected.deferred) await buttonCollected.deferUpdate();
											await interaction.deleteReply();
											return;
										};
										exitImageOption();
										break;
								};
							};
							imagesOption();
							break;
						case "description_option":
							async function descriptionOption(){
								if(!menuCollectedData.deferred) await menuCollectedData.deferUpdate();
								const descriptionOptionEmbed = new MessageEmbed()
								.setAuthor({
									name: 'Garage Settings Dashboard - Description Config',
									iconURL: initiatorAvatar
								})
								.setDescription('On this dashboard, you can set a description for your vehicle, reset it or go back to the main menu. Use the buttons down below to select the option you wish to explore.  ')
								.setColor(embedColor)
								.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
								.addField('Owner', initiatorTag, true)
								.setFooter({
									text: footerText,
									iconURL: footerIcon
								});
								const setDescriptionButton = new MessageButton()
								.setCustomId('setDescription')
								.setLabel('Set Description')
								.setStyle('SUCCESS');
								const resetDescriptionButton = new MessageButton()
								.setCustomId('resetDescription')
								.setLabel('Reset')
								.setStyle('PRIMARY')
								.setDisabled(true);
								const backDescriptionButton = new MessageButton()
								.setCustomId('backDescription')
								.setLabel('Back')
								.setStyle('SECONDARY');
								const exitDescriptionButton = new MessageButton()
								.setCustomId('exitDescription')
								.setLabel('Exit')
								.setStyle('DANGER');

								if(vehicleDescription) resetDescriptionButton.setDisabled(false);

								const imagesButtonRow = new MessageActionRow()
								.addComponents(setDescriptionButton, resetDescriptionButton, backDescriptionButton, exitDescriptionButton)
								
								await interaction.editReply({
									embeds: [descriptionOptionEmbed],
									components: [imagesButtonRow]
								});

								const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 600000, max: 1 })
								.catch(e => {
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
									case 'setDescription':
										async function setDescription(){
											if(![2,3,4].includes(premiumTier) && !premiumUser){
												const {advertEmbed, buttonsRow} = patreonAdvertEmbed(initiatorAvatar, 'Patreon Exclusive Feature', 'Support us on patreon and be able to showcase your vehicle with descriptions!', footerIcon, footerText)
												await buttonCollected.reply({
													embeds: [advertEmbed],
													components: [buttonsRow],
													ephemeral: true
												});
												return settingsDashboard();
											};
											const modal = new Modal()
											.setCustomId('descriptionModal')
											.setTitle('Garage Settings');
											const vehicleDescriptionInput = new TextInputComponent()
											.setCustomId('vehicleDescriptionInput')
											.setLabel("Vehicle Description")
											.setStyle('PARAGRAPH')
											.setMinLength(30)
											.setMaxLength(300)
											.setRequired(true)
											.setPlaceholder('Type your vehicle\'s description here within 5 minutes.')
											const firstActionRow = new MessageActionRow().addComponents(vehicleDescriptionInput);
											modal.addComponents(firstActionRow);

											await buttonCollected.showModal(modal);
											buttonCollected.awaitModalSubmit({filter: modalFilter, time: 300000 }) //
											.then(async modalResponse => {
												const providedVehicleDescription = modalResponse.fields.getTextInputValue('vehicleDescriptionInput');
												await modalResponse.deferUpdate();
												await garageSchema.updateOne({guildId: guildId, userId: initiatorId, vehicle: vehicleName }, {$set: {vehicleDescription: providedVehicleDescription }})
												.catch(async e => {
													await interaction.editReply({
														embeds: [errorEmbed(e, initiatorAvatar)],
														components: []
													})
													return;
												});
												vehicleDescription = providedVehicleDescription;
												
												const confirmationEmbed = new MessageEmbed()
												.setAuthor({
													name: 'Description Added Successfully',
													iconURL: initiatorAvatar
												})
												.setDescription('Your vehicle\'s description has been updated successfully! Check it out using the `/garage` command.\nYou can use the buttons down below if you wish to proceed.')
												.setColor(greenColor)
												.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
												.addField('Owner', initiatorTag, true)
												.addField('Description', providedVehicleDescription)
												.addField('Note','1. The description you added must be appropriate and not violate any discord/server rules.')
												.setFooter({
													text: footerText,
													iconURL: footerIcon
												});
												const buttonsRow = new MessageActionRow()
												.addComponents(
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('descriptionConfirmedBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('descriptionConfirmedExit'),
												);
												await interaction.editReply({
													embeds: [confirmationEmbed],
													components: [buttonsRow]
												});	
												
												const newDescriptionLog = new MessageEmbed()
												.setAuthor({
													name: 'New Description Assigned',
													iconURL: initiatorAvatar
												})
												.setDescription('A description was provided for the vehicle specified below. Please ensure that the description is appropriate and does not violate any discord/server rules.')
												.setColor(greenColor)
												.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
												.addField('Owner', initiatorTag, true)
												.addField('Description', providedVehicleDescription)
												.setFooter({
													text: footerText,
													iconURL: footerIcon
												});
												logChannel.send({
													embeds: [newDescriptionLog]
												});

												const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
												.catch(e => {});
												if(!buttonCollected){
													await interaction.editReply({
														embeds: [confirmationEmbed],
														components: []
													});
													return;
												};
												const buttonId = buttonCollected.customId;
												switch(buttonId){
													case 'descriptionConfirmedBack':
														async function descriptionBack(){
															await buttonCollected.deferUpdate();
															return settingsDashboard();
														};
														descriptionBack();
														break;
													case 'descriptionConfirmedExit':
														async function descriptionExit(){
															await buttonCollected.deferUpdate();
															await interaction.editReply({
																embeds: [confirmationEmbed],
																components: []
															});															
															return;
														};
														descriptionExit();
														break;
												};

											}).catch(async err => {
												await buttonCollected.followUp({
													embeds: [errorEmbed('You failed to provide a description within 5 minutes, going back to main menu...', initiatorAvatar)],
													ephemeral: true
												});
												return settingsDashboard();
											});
										};
										setDescription()
										break;
									case 'resetDescription':
										async function resetDescription(){
											const descriptionResetOptionEmbed = new MessageEmbed()
											.setAuthor({
												name: 'Garage Settings Dashboard - Description Config',
												iconURL: initiatorAvatar
											})
											.setDescription('On this dashboard, you can set a description for your vehicle, reset it or go back to the main menu. Use the buttons down below to select the option you wish to explore.  ')
											.setColor(embedColor)
											.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
											.addField('Owner', initiatorTag, true)
											.addField('Description', vehicleDescription)
											.setFooter({
												text: footerText,
												iconURL: footerIcon
											});
											const buttonsRow = new MessageActionRow()
											.addComponents(
												new MessageButton()
													.setLabel('Confirm')
													.setStyle('SUCCESS')
													.setCustomId('confirmDescriptionReset'),
												new MessageButton()
													.setLabel('Deny')
													.setStyle('DANGER')
													.setCustomId('denyDescriptionReset'),
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('resetDescriptionBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('resetDescriptionExit'),
											);
											await interaction.editReply({
												embeds: [descriptionResetOptionEmbed],
												components: [buttonsRow]
											});

											const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
											.catch(e => {
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
												case 'confirmDescriptionReset':
													async function descriptionResetConfirmation(){
														await buttonCollected.deferUpdate();
														await garageSchema.updateOne({guildId: guildId, userId: initiatorId, vehicle: vehicleName }, {$set: {vehicleDescription: null }})
														.catch(async e => {
															await interaction.editReply({
																embeds: [errorEmbed(e, initiatorAvatar)],
																components: []
															})
															return;
														});
														const descriptionResetConfirmationEmbed = new MessageEmbed()
														.setAuthor({
															name: 'Vehicle Description Reset Successfully',
															iconURL: initiatorAvatar
														})
														.setDescription(`The description on your vehicle was reset successfully.`)
														.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
														.addField('Owner', initiatorTag, true)
														.addField('Description', `~~${vehicleDescription}~~`)
														.setColor(greenColor)
														.setFooter({
															text: footerText,
															iconURL: footerIcon
														});
														vehicleDescription = null;
														const buttonsRow = new MessageActionRow()
														.addComponents(
															new MessageButton()
																.setLabel('Back')
																.setStyle('SECONDARY')
																.setCustomId('resetDescriptionConfirmedBack'),
															new MessageButton()
																.setLabel('Exit')
																.setStyle('DANGER')
																.setCustomId('resetDescriptionConfirmedExit'),
														);

														await interaction.editReply({
															embeds: [descriptionResetConfirmationEmbed],
															components: [buttonsRow]
														});

														const resetLogEmbed = new MessageEmbed()
														.setAuthor({
															name: 'Vehicle Description Reset',
															iconURL: initiatorAvatar
														})
														.setDescription(`The description on the following vehicle was reset successfully.`)
														.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
														.addField('Owner', initiatorTag, true)
														.addField('Description', `~~${vehicleDescription}~~`)
														.setColor(greenColor)
														.setFooter({
															text: footerText,
															iconURL: footerIcon
														});
														logChannel.send({
															embeds: [resetLogEmbed]
														});
														const buttonCollected = await interaction.channel.awaitMessageComponent({ filter:buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
														.catch(e => {});
														if(!buttonCollected){
															await interaction.editReply({
																embeds: [descriptionResetConfirmationEmbed],
																components: []
															});
															return;
														};
														const buttonId = buttonCollected.customId;
														switch(buttonId){
															case 'resetDescriptionConfirmedBack':
																async function resetConfirmedBack(){
																	await buttonCollected.deferUpdate();
																	return descriptionOption();
																};
																resetConfirmedBack();
																break;
															case 'resetDescriptionConfirmedExit':
																async function resetConfirmedExit(){
																	await buttonCollected.deferUpdate();
																	await interaction.deleteReply();
																};
																resetConfirmedExit();
																break;
														};

													};
													descriptionResetConfirmation();
													break;
												case 'denyDescriptionReset':
													async function denyDescriptionReset(){
														const descriptionResetDenyEmbed = new MessageEmbed()
														.setAuthor({
															name: 'Vehicle Description Reset Denied',
															iconURL: initiatorAvatar
														})
														.setDescription(`The description on your vehicle was not reset.`)
														.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
														.addField('Owner', initiatorTag, true)
														.addField('Description', `${vehicleDescription}`)
														.setColor(redColor)
														.setFooter({
															text: footerText,
															iconURL: footerIcon
														});
														const buttonsRow = new MessageActionRow()
														.addComponents(
															new MessageButton()
																.setLabel('Back')
																.setStyle('SECONDARY')
																.setCustomId('descriptionResetDeniedBack'),
															new MessageButton()
																.setLabel('Exit')
																.setStyle('DANGER')
																.setCustomId('descriptionResetDeniedExit'),
														);
														await interaction.editReply({
															embeds: [descriptionResetDenyEmbed],
															components: [buttonsRow]
														});

														const buttonCollected = await interaction.channel.awaitMessageComponent({ filter:buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
														.catch(e => {});
														if(!buttonCollected){
															await interaction.editReply({
																embeds: [descriptionResetDenyEmbed],
																components: []
															});
															return;
														};
														const buttonId = buttonCollected.customId;
														switch(buttonId){
															case 'descriptionResetDeniedBack':
																async function descriptionResetDeniedBack(){
																	await buttonCollected.deferUpdate();
																	return descriptionOption();
																};
																descriptionResetDeniedBack();
																break;
															case 'descriptionResetDeniedExit':
																async function descriptionResetDeniedExit(){
																	await buttonCollected.deferUpdate();
																	await interaction.deleteReply();
																};
																descriptionResetDeniedExit();
																break;
														};
													};
													denyDescriptionReset();
													break;
												case 'resetDescriptionBack':
													async function resetDescriptionBack(){
														await buttonCollected.deferUpdate();
														return descriptionOption();
													};
													resetDescriptionBack();
													break;
												case 'resetDescriptionExit':
													break;
											}
										};
										resetDescription();
										break;
									case 'backDescription':
										async function backDescription(){
											await buttonCollected.deferUpdate();
											return settingsDashboard();
										};
										backDescription();
										break;
									case 'exitDescription':
										async function exitDescription(){
											await buttonCollected.deferUpdate();
											await interaction.deleteReply();
										};
										exitDescription();
										break;

								};
							};
							descriptionOption()
							break
						case "garageIcon_option":
							async function garageIconOption(){
								if(!menuCollectedData.deferred) await menuCollectedData.deferUpdate();
								const garageIconDashboard = new MessageEmbed()
								.setAuthor({
									name: 'Garage Settings Dashboard - Garage Icon Config',
									iconURL: initiatorAvatar
								})
								.setDescription('On this dashboard, You can configure your garage icon! This is applicable across all servers.')
								.setColor(embedColor)
								.setImage(garageIconExample)
								.setFooter({
									text: footerText,
									iconURL: footerIcon
								});
								const setIconButton = new MessageButton()
								.setCustomId('setGarageIcon')
								.setLabel('Set Icon')
								.setStyle('SUCCESS');
								const resetIconButton = new MessageButton()
								.setCustomId('resetGarageIcon')
								.setLabel('Reset')
								.setStyle('PRIMARY')
								.setDisabled(true);
								const backButton = new MessageButton()
								.setCustomId('garageIconBack')
								.setLabel('Back')
								.setStyle('SECONDARY')								
								const exitButton = new MessageButton()
								.setCustomId('garageIconExit')
								.setLabel('Exit')
								.setStyle('DANGER');
								if(garageThumbnail) resetIconButton.setDisabled(false);
								const buttonRow = new MessageActionRow()
								.addComponents(setIconButton, resetIconButton, backButton, exitButton)
								await interaction.editReply({
									embeds: [garageIconDashboard],
									components: [buttonRow]
								});
								
								const buttonCollected = await interaction.channel.awaitMessageComponent({ filter:buttonFilter, componentType: 'BUTTON', time: 120000, max: 1 })
								.catch(e => {});
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
									case 'setGarageIcon':
										async function setGarageIcon(){
											await buttonCollected.deferUpdate();
											const addGarageIconPrompt = new MessageEmbed()
											.setAuthor({
												name: 'Please Upload The Garage Icon',
												iconURL: initiatorAvatar
											})
											.setDescription('Please upload the garage icon, Make sure you meet the requirements listed down below.')
											.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
											.addField('Owner', initiatorTag, true)
											.addField('Requirements','1. Only upload an image and not a video or any other format.\n2. The image you upload must be under `8mb`\n3. Make sure it abides by the server rules.')
											.setColor(embedColor)
											.setFooter({
												text: footerText,
												iconURL: footerIcon
											});
											const buttonsRow = new MessageActionRow()
											.addComponents(
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('uploadIconBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('uploadIconExit'),
											);
											await interaction.editReply({
												embeds: [addGarageIconPrompt],
												components: [buttonsRow]
											});

											let whetherButtonCollected = false;
											const buttonCollector = interaction.channel.createMessageComponentCollector({
												filter: buttonFilter,
												max: 1,
												componentType: 'BUTTON',
												time: 120000
											});
											
											buttonCollector.on('end', async (allCollected) => {
												const collected = allCollected?.first();
												if(!collected) return;
												whetherButtonCollected = true;
												await collected.deferUpdate();
												const buttonId = collected.customId;
												if(buttonId === 'uploadIconBack'){
													return settingsDashboard();
												}else if(buttonId === 'uploadIconExit'){
													await interaction.deleteReply();
												};
											});
											const messageCollector = interaction.channel.createMessageCollector({ filter: messageFilter, time: 120000, max: 1});
											messageCollector.on('end', async (allCollected) => {
												const collected = allCollected.first();
												if(!collected){
													if(whetherButtonCollected){
														return;
													}else{
														await interaction.deleteReply();
													};
												};
												buttonCollector.stop();
												const messageContent = collected.content;
												const attachmentURL = collected.attachments.first()?.url || messageContent;
												const attachmentSize = collected.attachments.first()?.size;
												const attachmentType = collected.attachments.first()?.contentType;											
												const whetherValidUrl = isValidHttpUrl(attachmentURL);
												if(!attachmentURL || !whetherValidUrl){
													interaction.editReply({
														embeds: [errorEmbed('A valid image attachment was not provided.\nGoing back to main menu in 5s...', initiatorAvatar)],
														components: []
													});
													await wait(5000);
													return settingsDashboard();
												};
												if(attachmentSize > 8000000){
													//err, attachment too big
													await interaction.editReply({
														embeds: [errorEmbed('The attachment you provided is too big, it must be under `8mb`\nGoing back to main menu in 5s...', initiatorAvatar)],
														components: []
													});
													await wait(5000);
													return settingsDashboard();
												};
												await userProfileSchema.updateOne({userId: initiatorId}, {$set: {vehicleImages: garageThumbnail }})
												.catch(async e => {
													await interaction.editReply({
														embeds: [errorEmbed(e, initiatorAvatar)],
														components: []
													})
													return;
												});
												const confirmationEmbed = new MessageEmbed()
												.setAuthor({
													name: 'Garage Icon Uploaded Successfully',
													iconURL: initiatorAvatar
												})
												.setDescription('Your garage icon has been successfully updated. Check it out using the `/garage` command.')
												.setColor(greenColor)
												.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
												.addField('Owner', initiatorTag, true)
												.setThumbnail(attachmentURL)
												.setFooter({
													text: footerText,
													iconURL: footerIcon
												});
												const buttonsRow = new MessageActionRow()
												.addComponents(
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('iconUploadConfirmedBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('iconUploadConfirmedExit'),
												);
												await interaction.editReply({
													embeds: [confirmationEmbed],
													components: [buttonsRow]
												});	
												garageThumbnail = attachmentURL;
												await userProfileSchema.updateOne({ userId: initiatorId }, {$set: { garageThumbnail: attachmentURL }})
												const newGarageIconUploadedLog = new MessageEmbed()
												.setAuthor({
													name: 'Garage Icon Uploaded',
													iconURL: initiatorAvatar
												})
												.setDescription('A new garage icon was set to the users garage.')
												.setColor(greenColor)
												.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
												.addField('Owner', initiatorTag, true)
												.setImage(attachmentURL)
												.setFooter({
													text: footerText,
													iconURL: footerIcon
												});
												logChannel.send({
													embeds: [newGarageIconUploadedLog]
												});

												const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
												.catch(e => {

												});
												if(!buttonCollected){
													await interaction.editReply({
														embeds: [confirmationEmbed],
														components: []
													});
													return;
												};
												const buttonId = buttonCollected.customId;
												switch(buttonId){
													case 'iconUploadConfirmedBack':
														function iconUploadConfirmedBack(){
															return settingsDashboard();
														};
														iconUploadConfirmedBack();
														break;
													case 'iconUploadConfirmedExit':
														async function iconUploadConfirmedExit(){
															await interaction.editReply({
																embeds: [confirmationEmbed],
																components: []
															});
														};
														iconUploadConfirmedExit();
														break;
												};
											});
										};
										setGarageIcon();
										break;
									case 'resetGarageIcon':
										async function resetGarageIcon(){
											await buttonCollected.deferUpdate();
											const garageIconReset = new MessageEmbed()
											.setAuthor({
												name: 'Garage Icon Reset Sucessfully',
												iconURL: initiatorAvatar
											})
											.setDescription('The garage icon was reset successfully. The details are down below.')
											.addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
											.addField('Owner', initiatorTag, true)
											.addField('Icon Reset', `[Click Here](${garageThumbnail})`, true)
											.setColor(greenColor)
											.setFooter({
												text: footerText,
												iconURL: footerIcon
											});
											const buttonsRow = new MessageActionRow()
											.addComponents(
												new MessageButton()
													.setLabel('Back')
													.setStyle('SECONDARY')
													.setCustomId('resetIconBack'),
												new MessageButton()
													.setLabel('Exit')
													.setStyle('DANGER')
													.setCustomId('resetIconExit'),
											);
											await interaction.editReply({
												embeds: [garageIconReset],
												components: [buttonsRow]
											});
											await userProfileSchema.updateOne({ userId: initiatorId }, {$set: { garageThumbnail: '' }})


											const buttonCollected = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
											.catch(e => {});
											if(!buttonCollected){
												await interaction.editReply({
													embeds: [resetEmbed],
													components: []
												});
												return;
											};
											const buttonId = buttonCollected.customId;
											switch(buttonId){
												case 'resetIconBack':
													async function resetIconBack(){
														await buttonCollected.deferUpdate();
														return settingsDashboard();
													};
													resetIconBack();
													break;
												case 'resetIconExit':
													async function resetIconExit(){
														await buttonCollected.deferUpdate();
														await interaction.deleteReply();
													};
													resetIconExit();
													break;
											};
										};
										resetGarageIcon();
										break;
									case 'garageIconBack':
										async function garageIconBack(){
											await buttonCollected.deferUpdate();
											return settingsDashboard();
										};
										garageIconBack();
										break;
									case 'garageIconExit':
										async function garageIconExit(){
											await buttonCollected.deferUpdate();
											await interaction.deleteReply();
										};
										garageIconExit();
										break;
								};

							};
							garageIconOption();
							break;
						case "embedColor_option":
							async function embedColorOption(){
								if(!menuCollectedData.deferred) await menuCollectedData.deferUpdate();
								await interaction.followUp({
									content: 'Releasing tomorrow.',
									ephemeral: true
								});
								return settingsDashboard();
							};
							embedColorOption();
							break;
						case "exit_option":
							async function exitOption(){
								if(!menuCollectedData.deferred) await menuCollectedData.deferUpdate();
								await interaction.deleteReply();
							};
							exitOption();
							break;
					};
				});
			};
			settingsDashboard()
		};
		settingsSetup();
	},
};