const { MessageEmbed, MessageActionRow,Modal ,MessageSelectMenu, MessageButton, ButtonInteraction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { obtainGuildProfile, defaultEmbedColor } = require('../modules/database.js');
const guildProfileSchema = require('../mongodb_schema/guildProfileSchema.js');
const { botIcon, greenIndicator, redIndicator, greenColor, redColor, errorEmbed, removeNonIntegers, isValidHttpUrl } = require('../modules/utility.js');
const { url } = require('node:inspector');
const wait = require('node:timers/promises').setTimeout;
module.exports = {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup the bot for your server.'),
	async execute(interaction) {
		if(!interaction.deferred) await interaction.deferReply({ ephemral: true });
		//Defining user details.
		const initiatorId = interaction.user.id;
		new Modal
		const initiatorUsername = interaction.user.username;
		const initiatorAvatar = interaction.user.displayAvatarURL({ dynamic: true });
		const initiatorPermissions = interaction.memberPermissions.toArray();
		if(!initiatorPermissions.includes('MANAGE_GUILD')){
			interaction.editReply({
				embeds: [errorEmbed('You do not have authorization to use this command. (Manage Server permission is required)', initiatorAvatar)]
			});
			return;
		};
		//Guild information
		const guildId = interaction.guild.id;
		const guildName = interaction.guild.name;
		const guildIcon = interaction.guild.iconURL({ dynamic: true });
		//Guild Profile
		async function serverSetup(){
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
			let footerIcon = guildProfile.customFooterIcon || botIcon;
			const footerText = `${guildName} • Vehicle Verification`
			
			//Misc 
			const embedColor = await defaultEmbedColor(initiatorId);
			//Filters
			const messageFilter = (m) => m.author.id === initiatorId;
			const buttonFilter = (ButtonInteraction) => ButtonInteraction.componentType === 'BUTTON' && ButtonInteraction.user.id === initiatorId && (ButtonInteraction.customId === 'goBack' || ButtonInteraction.customId === 'exit');
			const menuFilter = (menuInteraction) => menuInteraction.componentType === 'SELECT_MENU' && menuInteraction.customId === 'select' && menuInteraction.user.id === initiatorId;

			const setupEmbed = new MessageEmbed()
			.setAuthor({
				name: 'Server Setup',
				iconURL: initiatorAvatar
			})
			.setDescription("You can use this dashboard to setup your server for vehicle verification.")
			.setColor(embedColor)
			.setFooter({
				text: footerText,
				iconURL: footerIcon
			});
			if(verificationChannelId){
				setupEmbed.addField(`Verification Channel`, `<#${verificationChannelId}>`, true);
			}else{
				setupEmbed.addField(`Verification Channel`, `Not setup.`, true);
			};
			if(guideChannelId){
				setupEmbed.addField(`Guide Channel`, `<#${guideChannelId}>`, true);
			}else{
				setupEmbed.addField(`Guide Channel`, `Not setup.`, true);
			};
			if(loggingChannelId){
				setupEmbed.addField(`Logging Channel`, `<#${loggingChannelId}>`, true);
			}else{
				setupEmbed.addField(`Logging Channel`, `Not setup.`, true);
			};
			if(verificationRoleId){
				setupEmbed.addField(`Verified Role`, `<@&${verificationRoleId}>`, true);
			}else{
				setupEmbed.addField(`Verified Role`, `Not setup.`, true);

			};
			if(syncEnabled){
				setupEmbed.addField(`Sync Status`, `Synced to Id: ${syncedGuildId}`, true);
			}else{
				setupEmbed.addField(`Sync Status`, `Not synced.`, true);
			};
			if(footerIcon){
				setupEmbed.addField(`Custom Embed Icon`, `[Icon Link](${footerIcon})`, true);
			}else{
				footerIcon = guildIcon;
				setupEmbed.addField(`Custom Embed Icon`, `[Default](${footerIcon})`, true);
			};
				
			const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('select')
					.setPlaceholder('Select the option you wish to configure...')
					.addOptions([
						{
							label: 'Verification Channel',
							description: 'Set the verification channel where verifications will be sent.',
							value: 'first_option',
						},
						{
							label: 'Guide Channel',
							description: 'A guide channel on how to verify.',
							value: 'second_option',
						},
						{
							label: 'Logging Channel',
							description: 'Set the channel to log all events.',
							value: 'third_option',
						},
						{
							label: 'Verified Vehicle Role',
							description: 'Set the role which you would like to assign to those which have verified vehicles.',
							value: 'fourth_option',
						},
						{
							label: 'Sync',
							description: 'Link your verification to another server.',
							value: 'fifth_option',
						},
						{
							label: 'Embed Icon',
							description: 'Customize the icon showed on the embed footer.',
							value: 'sixth_option',
						},
						{
							label: 'Exit',
							description: 'Exit the interface.',
							value: 'seventh_option',
						},
					]),
			);

			//Menu collector to obtain the selected option.
			const menuCollector = interaction.channel.createMessageComponentCollector({
				menuFilter,
				max: 1
			});

			menuCollector.on('collect', (collected) => {
				menuCollector.stop();
				//Treating the value as the id.
				const optionId = collected.values[0];
				switch(optionId){
					case "first_option":
						async function setVerificationChannel(){
							if(!collected.deferred) await collected.deferUpdate();
							const verificationChannelEmbed = new MessageEmbed()
							.setAuthor({
								name: 'Server Setup - Setting The Verification Channel',
								iconURL: initiatorAvatar
							})
							.setDescription("The verification channel is where all the vehicle verification applications will be sent.\nPlease **mention the channel** or **enter the channel id.**")
							.setColor(embedColor)
							.setFooter({
								text: footerText,
								iconURL: footerIcon
							});
							const goBackButton = new MessageButton()
							.setCustomId('goBack')
							.setLabel('Go Back')
							.setStyle('SECONDARY');
							const exitButton = new MessageButton()
							.setCustomId('exit')
							.setLabel('Exit')
							.setStyle('DANGER');
							const row = new MessageActionRow()
							.addComponents(goBackButton)
							.addComponents(exitButton)
							interaction.editReply({
								embeds: [verificationChannelEmbed],
								components: [row]
							});

							//The buttons will be managed by button collectors.
							const buttonCollector = interaction.channel.createMessageComponentCollector({
								buttonFilter,
								max: 1
							});
							
							buttonCollector.on('collect', async (collected) => {
								messageCollector.stop();
								await collected.deferUpdate();
								const buttonId = collected.customId;
								if(buttonId === 'goBack'){
									return serverSetup();
								}else if(buttonId === 'exit'){
									await interaction.deleteReply();
								};
							});

							//Using a message collector to obtain the channel details.
							const messageCollector = interaction.channel.createMessageCollector({ messageFilter, time: 60000, max: 1});

							messageCollector.on('collect', async (collectedMessage) => {
								buttonCollector.stop();
								const messageContent = collectedMessage.content;
								const providedChannelId = removeNonIntegers(messageContent);
								if(!providedChannelId){
									interaction.editReply({
										embeds: [errorEmbed('Invalid channel provided, going back to menu in 5 seconds...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								const providedChannel = await interaction.member.guild.channels.fetch(providedChannelId)
								if(!providedChannel){
									interaction.editReply({
										embeds: [errorEmbed('Invalid channel provided, going back to menu in 5 seconds...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								const botPermissionsIn = interaction.guild.me.permissionsIn(providedChannel).serialize();
								const { VIEW_CHANNEL, SEND_MESSAGES, EMBED_LINKS, ATTACH_FILES, READ_MESSAGE_HISTORY } = botPermissionsIn;
								const permissionsArray = [VIEW_CHANNEL, SEND_MESSAGES, EMBED_LINKS, ATTACH_FILES, READ_MESSAGE_HISTORY];
								//Checking if the bot has all the required permissions in the channel being assigned for verification
								const validation = permissionsArray.every(Boolean);
								if(!validation){
									//Error if required permissions are not present.
									interaction.editReply({
										embeds: [errorEmbed(`Missing required permissions.\nPlease make sure i have the following permissions on my role and in channel permissions:\n\`${['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MANAGE_ROLES'].join('\n')}\`\n\nRun the \`/setup\` command once the permissions have been fixed.`, initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return;
								};
								//All validations carried out, proceed to setting it as 
								//the designated verificaton channel.
								await guildProfileSchema.updateOne({guildId: guildId}, {$set: {verificationChannelId: providedChannel.id}})
								.catch(e => {
									interaction.editReply({
										embeds: [errorEmbed(e, initiatorAvatar)],
										components: []
									})
									return;
								});
								const confirmationEmbed = new MessageEmbed()
								.setAuthor({
									name: 'Server Setup - Verification Channel Configured',
									iconURL: initiatorAvatar
								})
								.setDescription(`The verification channel has been set as <#${providedChannel.id}>\nWhen a user applies for verification, the application will be sent in there.\n\nGoing back to main menu in 10 seconds...`)
								.addField('Note','Please make sure that this channel is to be kept private and accessible to only those who will manage verifications in your server.')
								.setColor(greenColor)
								.setFooter({
									text: footerText,
									iconURL: footerIcon
								});
								//confirmation message, then back to menu.
								await interaction.editReply({
									embeds: [confirmationEmbed],
									components: []
								});
								await wait(10000)
								return serverSetup();
							});
								
						};
						setVerificationChannel();
						break;	
					case "second_option":
						async function setGuideChannel(){
							if(!collected.deferred) await collected.deferUpdate();
							const guideChannelEmbed = new MessageEmbed()
							.setAuthor({
								name: 'Server Setup - Setting The Guide Channel',
								iconURL: initiatorAvatar
							})
							.setDescription("The guide channel is where members will be informed on how to verify their rides.\nThe bot will send a default guide embed in that channel.\nThis channel will be referenced in the future when processing verifications\n\nPlease **mention the channel** or **enter the channel id.**")
							.setColor(embedColor)
							.setFooter({
								text: footerText,
								iconURL: footerIcon
							});
							const goBackButton = new MessageButton()
							.setCustomId('goBack')
							.setLabel('Go Back')
							.setStyle('SECONDARY');
							const exitButton = new MessageButton()
							.setCustomId('exit')
							.setLabel('Exit')
							.setStyle('DANGER');
							const row = new MessageActionRow()
							.addComponents(goBackButton)
							.addComponents(exitButton)
							interaction.editReply({
								embeds: [guideChannelEmbed],
								components: [row]
							});

							//The buttons will be managed by button collectors.
							const buttonCollector = interaction.channel.createMessageComponentCollector({
								buttonFilter,
								max: 1
							});
							
							buttonCollector.on('collect', async (collected) => {
								messageCollector.stop();
								await collected.deferUpdate();
								const buttonId = collected.customId;
								if(buttonId === 'goBack'){
									return serverSetup();
								}else if(buttonId === 'exit'){
									await interaction.deleteReply();
								};
							});

							//Using a message collector to obtain the channel details.
							const messageCollector = interaction.channel.createMessageCollector({ messageFilter, time: 60000, max: 1});

							messageCollector.on('collect', async (collectedMessage) => {
								buttonCollector.stop();
								const messageContent = collectedMessage.content;
								const providedChannelId = removeNonIntegers(messageContent);
								if(!providedChannelId){
									interaction.editReply({
										embeds: [errorEmbed('Invalid channel provided, going back to menu in 5 seconds...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								const providedChannel = await interaction.member.guild.channels.fetch(providedChannelId)
								if(!providedChannel){
									interaction.editReply({
										embeds: [errorEmbed('Invalid channel provided, going back to menu in 5 seconds...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								const botPermissionsIn = interaction.guild.me.permissionsIn(providedChannel).serialize();
								const { VIEW_CHANNEL, SEND_MESSAGES, EMBED_LINKS, ATTACH_FILES, READ_MESSAGE_HISTORY } = botPermissionsIn;
								const permissionsArray = [VIEW_CHANNEL, SEND_MESSAGES, EMBED_LINKS, ATTACH_FILES, READ_MESSAGE_HISTORY];
								//Checking if the bot has all the required permissions in the channel being assigned for verification
								const validation = permissionsArray.every(Boolean);
								if(!validation){
									//Error if required permissions are not present.
									interaction.editReply({
										embeds: [errorEmbed(`Missing required permissions.\nPlease make sure i have the following permissions on my role and in channel permissions:\n\`${['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MANAGE_ROLES'].join('\n')}\`\n\nRun the \`/setup\` command once the permissions have been fixed.`, initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return;
								};
								//All validations carried out, proceed to setting it as 
								//the designated verificaton channel.
								await guildProfileSchema.updateOne({guildId: guildId}, {$set: {guideChannelId: providedChannel.id}})
								.catch(e => {
									interaction.editReply({
										embeds: [errorEmbed(e, initiatorAvatar)],
										components: []
									})
									return;
								});
								const confirmationEmbed = new MessageEmbed()
								.setAuthor({
									name: 'Server Setup - Guide Channel Configured',
									iconURL: initiatorAvatar
								})
								.setDescription(`The guide channel has been set as <#${providedChannel.id}>\nA guide on how to verify has been sent in there. This will be referenced in the future when processing the verifications.\n\nGoing back to main menu in 10 seconds...`)
								.setColor(greenColor)
								.setFooter({
									text: footerText,
									iconURL: footerIcon
								});
								//confirmation message, then back to menu.
								await interaction.editReply({
									embeds: [confirmationEmbed],
									components: []
								});
								await wait(10000)
								return serverSetup();
							});
						};
						setGuideChannel();
						break;
					case "third_option":
						async function setLogsChannel(){
							if(!collected.deferred) await collected.deferUpdate();
							const guideChannelEmbed = new MessageEmbed()
							.setAuthor({
								name: 'Server Setup - Setting The Logs Channel',
								iconURL: initiatorAvatar
							})
							.setDescription("The log channel will log the following information:\n1. New verifications\n2. Garage updates\n\nPlease **mention the channel** or **enter the channel id.**")
							.setColor(embedColor)
							.setFooter({
								text: footerText,
								iconURL: footerIcon
							});
							const goBackButton = new MessageButton()
							.setCustomId('goBack')
							.setLabel('Go Back')
							.setStyle('SECONDARY');
							const exitButton = new MessageButton()
							.setCustomId('exit')
							.setLabel('Exit')
							.setStyle('DANGER');
							const row = new MessageActionRow()
							.addComponents(goBackButton)
							.addComponents(exitButton)
							interaction.editReply({
								embeds: [guideChannelEmbed],
								components: [row]
							});

							//The buttons will be managed by button collectors.
							const buttonCollector = interaction.channel.createMessageComponentCollector({
								buttonFilter,
								max: 1
							});
							
							buttonCollector.on('collect', async (collected) => {
								messageCollector.stop();
								await collected.deferUpdate();
								const buttonId = collected.customId;
								if(buttonId === 'goBack'){
									return serverSetup();
								}else if(buttonId === 'exit'){
									await interaction.deleteReply();
								};
							});

							//Using a message collector to obtain the channel details.
							const messageCollector = interaction.channel.createMessageCollector({ messageFilter, time: 60000, max: 1});

							messageCollector.on('collect', async (collectedMessage) => {
								buttonCollector.stop();
								const messageContent = collectedMessage.content;
								const providedChannelId = removeNonIntegers(messageContent);
								if(!providedChannelId){
									interaction.editReply({
										embeds: [errorEmbed('Invalid channel provided, going back to menu in 5 seconds...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								const providedChannel = await interaction.member.guild.channels.fetch(providedChannelId)
								if(!providedChannel){
									interaction.editReply({
										embeds: [errorEmbed('Invalid channel provided, going back to menu in 5 seconds...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								const botPermissionsIn = interaction.guild.me.permissionsIn(providedChannel).serialize();
								const { VIEW_CHANNEL, SEND_MESSAGES, EMBED_LINKS, ATTACH_FILES, READ_MESSAGE_HISTORY } = botPermissionsIn;
								const permissionsArray = [VIEW_CHANNEL, SEND_MESSAGES, EMBED_LINKS, ATTACH_FILES, READ_MESSAGE_HISTORY];
								//Checking if the bot has all the required permissions in the channel being assigned for verification
								const validation = permissionsArray.every(Boolean);
								if(!validation){
									//Error if required permissions are not present.
									interaction.editReply({
										embeds: [errorEmbed(`Missing required permissions.\nPlease make sure i have the following permissions on my role and in channel permissions:\n\`${['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MANAGE_ROLES'].join('\n')}\`\n\nRun the \`/setup\` command once the permissions have been fixed.`, initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return;
								};
								//All validations carried out, proceed to setting it as 
								//the designated verificaton channel.
								await guildProfileSchema.updateOne({guildId: guildId}, {$set: {loggingChannelId: providedChannel.id}})
								.catch(e => {
									interaction.editReply({
										embeds: [errorEmbed(e, initiatorAvatar)],
										components: []
									})
									return;
								});
								const confirmationEmbed = new MessageEmbed()
								.setAuthor({
									name: 'Server Setup - Logs Channel Configured',
									iconURL: initiatorAvatar
								})
								.setDescription(`The logs channel has been set as <#${providedChannel.id}>\nAll new verification applications and garage updates will be logged in here.\n\nGoing back to main menu in 10 seconds...`)
								.setColor(greenColor)
								.setFooter({
									text: footerText,
									iconURL: footerIcon
								});
								//confirmation message, then back to menu.
								await interaction.editReply({
									embeds: [confirmationEmbed],
									components: []
								});
								await wait(10000)
								return serverSetup();
							});
						};
						setLogsChannel();
						break
					case "fourth_option":
						async function setVerifiedRole(){
							if(!collected.deferred) await collected.deferUpdate();
							const verificationChannelEmbed = new MessageEmbed()
							.setAuthor({
								name: 'Server Setup - Setting The Verified Role',
								iconURL: initiatorAvatar
							})
							.setDescription("The verified vehicle role will be given to those that verify their vehicle successfully.\nPlease **mention the role** or **enter the role id.**")
							.setColor(embedColor)
							.setFooter({
								text: footerText,
								iconURL: footerIcon
							});
							const goBackButton = new MessageButton()
							.setCustomId('goBack')
							.setLabel('Go Back')
							.setStyle('SECONDARY');
							const exitButton = new MessageButton()
							.setCustomId('exit')
							.setLabel('Exit')
							.setStyle('DANGER');
							const row = new MessageActionRow()
							.addComponents(goBackButton)
							.addComponents(exitButton)
							interaction.editReply({
								embeds: [verificationChannelEmbed],
								components: [row]
							});

							//The buttons will be managed by button collectors.
							const buttonCollector = interaction.channel.createMessageComponentCollector({
								buttonFilter,
								max: 1
							});
							
							buttonCollector.on('collect', async (collected) => {
								messageCollector.stop();
								await collected.deferUpdate();
								const buttonId = collected.customId;
								if(buttonId === 'goBack'){
									return serverSetup();
								}else if(buttonId === 'exit'){
									await interaction.deleteReply();
								};
							});

							//Using a message collector to obtain the channel details.
							const messageCollector = interaction.channel.createMessageCollector({ messageFilter, time: 60000, max: 1});

							messageCollector.on('collect', async (collectedMessage) => {
								buttonCollector.stop();
								const messageContent = collectedMessage.content;
								const providedRoleId = removeNonIntegers(messageContent);
								if(!providedRoleId){
									interaction.editReply({
										embeds: [errorEmbed('Invalid role provided, going back to menu in 5 seconds...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								const providedRole = await interaction.member.guild.roles.fetch(providedRoleId)
								if(!providedRole){
									interaction.editReply({
										embeds: [errorEmbed('Invalid role provided, going back to menu in 5 seconds...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								
								//All validations carried out, proceed to setting it as 
								//the designated verified role.
								await guildProfileSchema.updateOne({guildId: guildId}, {$set: {verifiedVehicleRoleId: providedRole.id}})
								.catch(e => {
									interaction.editReply({
										embeds: [errorEmbed(e, initiatorAvatar)],
										components: []
									})
									return;
								});
								const confirmationEmbed = new MessageEmbed()
								.setAuthor({
									name: 'Server Setup - Verified Role Configured',
									iconURL: initiatorAvatar
								})
								.setDescription(`The Verified Role has been set as <@&${providedRole.id}>\nWhen a verification is approved, the applicant will be given this role.\n\nGoing back to main menu in 10 seconds...`)
								.addField('Note','Please make sure that:\n1. The bot has permissions to manage roles.\n2. The role you wish to assign is under the bot\'s role.')
								.setColor(greenColor)
								.setFooter({
									text: footerText,
									iconURL: footerIcon
								});
								//confirmation message, then back to menu.
								await interaction.editReply({
									embeds: [confirmationEmbed],
									components: []
								});
								await wait(10000)
								return serverSetup();
							});
						};
						setVerifiedRole();
						break
					case "fifth_option":
						async function sync(){
							if(!collected.deferred) await collected.deferUpdate();
						};
						sync();
						break;
					case "sixth_option":
						async function embedIcon(){
							if(!collected.deferred) await collected.deferUpdate();
							const requestIconEmbed = new MessageEmbed()
							.setAuthor({
								name: 'Server Setup - Custom Embed Footer Icon',
								iconURL: initiatorAvatar
							})
							.setDescription('Please upload the icon you would like to set as the embed footer icon.\nThe image cannot be greater than `8mb` in size.\nIt has to be an image or a gif.')
							.setColor(embedColor)
							.setFooter({
								text: footerText,
								iconURL: footerIcon
							});
							await interaction.editReply({
								embeds: [requestIconEmbed],
								components: []
							});
							//Using a message collector to obtain the attachment link.
							const messageCollector = interaction.channel.createMessageCollector({ messageFilter, time: 60000, max: 1});
							messageCollector.on('collect', async (collectedMessage) => {
								const messageContent = collectedMessage.content;
								const attachmentURL = collectedMessage.attachments.first()?.url || messageContent;
								const attachmentSize = collectedMessage.attachments.first()?.size;
								const attachmentType = collectedMessage.attachments.first()?.contentType;
								if(attachmentSize > 80000){
									//err, attachment too big
									await interaction.editReply({
										embeds: [errorEmbed('The attachment you provided is too big, it must be under `8mb`\nGoing back to main menu in 5s...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								if(attachmentType && !attachmentType.includes('image')){
									await interaction.editReply({
										embeds: [errorEmbed('Please make sure the attachment you upload is an image or gif.\nGoing back to main menu in 5s...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();	
								};
								const whetherValidUrl = isValidHttpUrl(attachmentURL);
								if(!whetherValidUrl){
									interaction.editReply({
										embeds: [errorEmbed('The attachment you provided does not seem to be valid.\nGoing back to main menu in 5s...', initiatorAvatar)],
										components: []
									});
									await wait(5000);
									return serverSetup();
								};
								
								await guildProfileSchema.updateOne({guildId: guildId}, {$set: {customFooterIcon: attachmentURL}})
								.catch(async e => {
									await interaction.editReply({
										embeds: [errorEmbed(e, initiatorAvatar)],
										components: []
									})
									return;
								});
								const confirmationEmbed = new MessageEmbed()
								.setAuthor({
									name: 'Server Setup - Custom Embed Icon Set',
									iconURL: initiatorAvatar
								})
								.setDescription(`The [embed icon](${attachmentURL}) has been set. This will appear on the embed footer (bottom part of the embed) whenever the bots commands are used within your server.\n\nGoing back to main menu in 10 seconds...`)
								.setColor(greenColor)
								.setFooter({
									text: footerText,
									iconURL: footerIcon
								});

								await interaction.editReply({
									embeds: [confirmationEmbed],
									components: []
								});
							});
						};
						embedIcon();
						break;
					case "seventh_option":
						async function exitMenu(){
							if(!collected.deferred) await collected.deferUpdate();
							await interaction.deleteReply();
						};
						exitMenu();
						break;
				};				
			});

			await interaction.editReply({
				embeds:[setupEmbed],
				components: [row]
			});
		};
		serverSetup();
	},
};