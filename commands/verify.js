const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { obtainGuildProfile, defaultEmbedColor, obtainAllUserVehicles, obtainAllOpenUserApplications } = require('../modules/database.js');
const verificationApplicationSchema = require('../mongodb_schema/verificationApplicationSchema.js');
const { greenColor, errorEmbed } = require('../modules/utility.js');
const wait = require('node:timers/promises').setTimeout;
const moment = require('moment')
const mongoose = require('mongoose');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('verify')
		.setDescription('Apply for verification of your vehicle.')
		.addStringOption(option => option.setName('vehicle-name').setDescription('Enter the name of your vehicle.').setRequired(true))
		.addAttachmentOption(option => option.setName('image').setDescription('Please upload the image of your vehicle with all the required items.').setRequired(true)),

		async execute(interaction) {
		await interaction.deferReply({ ephemeral: false })
		//Vehicle details
		const vehicleAttachmentData = interaction.options.getAttachment('image');
		const vehicleImageURL = vehicleAttachmentData.url;
		const vehicleImageProxyURL = vehicleAttachmentData.proxyURL;
		const vehicleImageSize = vehicleAttachmentData.size;
		const vehicleImageName = vehicleAttachmentData.name;
		const vehicleImageType = vehicleAttachmentData.contentType;
		const vehicleName = interaction.options.getString('vehicle-name');
		//Defining user details.
		const initiatorId = interaction.user.id;
		const initiatorUsername = interaction.user.username;
		const initiatorAvatar = interaction.user.displayAvatarURL({ dynamic: true });
		const initiatorTag = interaction.user.tag
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
		let syncedGuildData; 
		const footerIcon = guildProfile.customFooterIcon || guildIcon;
		const footerText = `${guildName} • Vehicle Verification`
		//Misc
		const mainInteractionId = interaction.id;
		const embedColor = await defaultEmbedColor(initiatorId);
		const buttonFilter = (ButtonInteraction) => ButtonInteraction.componentType === 'BUTTON' && ButtonInteraction.user.id === initiatorId && (ButtonInteraction.customId === `confirmVerification+${mainInteractionId}` || ButtonInteraction.customId === `denyVerification+${mainInteractionId}`) && ButtonInteraction.guild.id === guildId;
		const todaysDate = moment.utc();
		const verificationChannel = await interaction.member.guild.channels.fetch(verificationChannelId);
		if(!verificationChannel){
			await interaction.editReply({
				embeds: [errorEmbed(`Failed to obtain the verification channel where the applications will be sent.\nPlease ask the staff to make sure the verification channel is setup properly.`, initiatorAvatar)],
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
		//Checks if the sync is enabled to another server.
		//If it does, then applying for verification will not be allowed unless inside the main server.
		if(syncedGuildId){
			syncedGuildData = await interaction.client.guilds.fetch(syncedGuildId)
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
		//If the attachment is greater than 8mb.
		if(vehicleImageSize > 8000000){
			await interaction.editReply({
				embeds: [errorEmbed('The attachment you provided is too big, it must be under `8mb`', initiatorAvatar)],
				components: [],
				ephemeral: true
			});
			return;
		};
		//If the provided attachment is not an image.
		if(vehicleImageType){
			if(!vehicleImageType.includes('image')){
				await interaction.editReply({
					embeds: [errorEmbed('The attachment you provided does not seem to be a valid image.', initiatorAvatar)],
					components: [],
					ephemeral: true
				});
				return;
			};
		};
		//User's garage
		const initiatorGarage = await obtainAllUserVehicles(initiatorId, guildId);
		//Check if there is a vehicle in the users garage
		//with the same name as the one they're trying to verify.
		if(initiatorGarage?.garageVehicles?.includes(vehicleName)){
			await interaction.editReply({
				embeds: [errorEmbed(`You already have a verified vehicle named \`${vehicleName}\`\nPlease use a different name for this ride.`, initiatorAvatar)],
				components: [],
				ephemeral: true
			});
			return;
		};
		
		//User's applications
		const initiatorOpenApplications = await obtainAllOpenUserApplications(initiatorId, guildId);
		const openApplicationVehicles = initiatorOpenApplications.map(x => x.vehicle);
		if(openApplicationVehicles?.includes(vehicleName)){
			await interaction.editReply({
				embeds: [errorEmbed(`You already have an open application for the vehicle \`${vehicleName}\`\nPlease wait for it to be processed before verifying or use a different vehicle name.`, initiatorAvatar)],
				components: [],
				ephemeral: true
			});
			return;
		};
		
		const verificationApplicationEmbed = new MessageEmbed()
		.setAuthor({
			name: `Vehicle Verification Application`,
			iconURL: initiatorAvatar
		})
		.setDescription(`Hey **${initiatorUsername}!**\nThank you for showing interest in verifying your vehicle.\nCould you please confirm the details down below before we submit your application?`)
		.addField('Vehicle Name', vehicleName, true)
		.addField('Owner', initiatorTag, true)
		.addField('Requirements', `Please make sure that \n1. The vehicle name you entered is correct and the way you like it as it will be the same in your garage.\n2. Your verification application meets the requirements listed out in <#${guideChannelId}> otherwise it will get rejected!`)
		.setImage(vehicleImageURL)
		.setColor(embedColor)
		.setFooter({
			text: footerText,
			iconURL: footerIcon
		});
		const confirmButton = new MessageButton()
		.setCustomId(`confirmVerification+${mainInteractionId}`)
		.setLabel('Confirm')
		.setStyle('SUCCESS');
		const denyButton = new MessageButton()
		.setCustomId(`denyVerification+${mainInteractionId}`)
		.setLabel('Deny')
		.setStyle('DANGER');
		const row = new MessageActionRow()
		.addComponents(confirmButton)
		.addComponents(denyButton)
		await interaction.editReply({
			embeds: [verificationApplicationEmbed],
			components: [row]
		});

		const buttonCollector = interaction.channel.createMessageComponentCollector({
			filter: buttonFilter,
			max: 1,
			time: 60000
		});
		
		
		buttonCollector.on('end', async (collected) => {
			const collectedData = collected.first();
			if(!collectedData){
				await interaction.deleteReply();
				return;
			};
			await collectedData.deferUpdate();
			const buttonId = collectedData.customId;
			if(buttonId === `confirmVerification+${mainInteractionId}`){
				//send it to the verification channel
				//handle err if verification channel does not exist
				const vApplication = new MessageEmbed()
				.setAuthor({
					name: `Vehicle Verification - New Application`,
					iconURL: initiatorAvatar
				})
				.setDescription('A new verification application has been registered. Please process the verification using the buttons provided down below.')
				.addField('Vehicle', `[${vehicleName}](${vehicleImageURL})`, true)
				.addField('Owner', `${initiatorTag} | <@${initiatorId}>`, true)
				.addField('Image Name', `[${vehicleImageName}](${vehicleImageProxyURL})`, true)
				.addField('Status', 'Due for verification',true)
				.setImage(vehicleImageURL)
				.setColor('#FFFCFF') //Overriding the default embed color as white, red and green will be used as application status indicators.
				.setFooter({
					text: footerText,
					iconURL: footerIcon
				});
				const approveButton = new MessageButton()
				.setCustomId(`approveApplication+${initiatorId}`)
				.setLabel('Approve')
				.setStyle('SUCCESS');
				const denyButton = new MessageButton()
				.setCustomId(`denyApplication+${initiatorId}`)
				.setLabel('Deny')
				.setStyle('DANGER');
				const denyButton2 = new MessageButton()
				.setCustomId(`denyReadGuide+${initiatorId}`)
				.setLabel('Read The Guide')
				.setStyle('DANGER');
				const row = new MessageActionRow()
				.addComponents(approveButton)
				.addComponents(denyButton)
				.addComponents(denyButton2)
				
				const applicationMsg = await verificationChannel.send({
					embeds:[vApplication],
					components: [row]
				});

				const applicationMsgId = applicationMsg.id;
				
				const verificationApplication = new verificationApplicationSchema({
					_id: mongoose.Types.ObjectId(),
					guildId: guildId,
					userId: initiatorId,
					vehicle: vehicleName,
					vehicleImageURL: vehicleImageURL,
					vehicleImageProxyURL: vehicleImageProxyURL,
					vehicleImageName: vehicleImageName,
					status: 'open',
					submittedOn: todaysDate,
					applicationMessageId: applicationMsgId,
					decision: null,
					decidedBy: null,
					decidedOn: null
				})
				verificationApplication.save()
              	.then(async result => {
					console.log(`New verification application submitted:\n ${result}`)
					//Logging the newly created verification application.
					const vApplicationLog = new MessageEmbed()
					.setAuthor({
						name: `Vehicle Verification - New Application`,
						iconURL: initiatorAvatar
					})
					.addField('Vehicle', vehicleName, true)
					.addField('Owner', `${initiatorTag} | <@${initiatorId}>`, true)
					.addField('Image Name', vehicleImageName)
					.addField('Status', 'Due for verification', true)
					.addField('Verification Image Proxy Url', `[Click Here](${vehicleImageProxyURL})`)
					.setThumbnail(vehicleImageURL)
					.setColor('#FFFCFF') //Overriding the default embed color as white, red and green will be used as application status indicators.
					.setFooter({
						text: footerText,
						iconURL: footerIcon
					});

					verificationApplicationEmbed
					.setDescription('Your verfication application has been successfully submitted. Please wait for the staff to verify it.')
					.addField('Note','**Please keep your DMs open** to recieve updates regarding your verification.')
					.setColor(greenColor)
					await interaction.editReply({
						embeds:[verificationApplicationEmbed],
						components: []
					});

					logChannel.send({
						embeds: [vApplicationLog]
					});
				}).catch(async err => {
					await interaction.editReply({
						embeds:[errorEmbed(err, initiatorAvatar)],
						components: []
					});
					return;
				});
			}else{
				await collectedData.editReply({
					content: 'Your verification application has been deleted.'
				});
				await wait(3000);
				await interaction.deleteReply()
				await collectedData.deleteReply();
			};
		});
	},
};