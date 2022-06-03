const { MessageActionRow, MessageButton } = require('discord.js');
const { obtainGuildProfile, obtainAllOpenUserApplications } = require('../modules/database.js');
const verificationSchema = require('../mongodb_schema/verificationApplicationSchema.js');
const { redColor, botId } = require('../modules/utility.js');
const moment = require('moment');
const mongoose = require('mongoose');

module.exports = {
	name: 'guildMemberRemove',
	async execute(member) {
		if(member.user.bot) return;
		const userId = member.user.id;
		const guildId = member.guild.id;
		const openApplications = await obtainAllOpenUserApplications(userId, guildId);
		if(!openApplications) return;
		const guildProfile = await obtainGuildProfile(guildId);
		if(!guildProfile) return;
		const verificationChannelId = guildProfile.verificationChannelId;
		const guideChannelId = guildProfile.guideChannelId;
		const loggingChannelId = guildProfile.loggingChannelId;
		const verificationChannel = await member.guild.channels.fetch(verificationChannelId);
		if(!verificationChannel) return;
		const todaysDate = moment.utc();
		openApplications.map(async application => {
			const vehicleName = application.vehicle;
			const applicationMessageId = application.applicationMessageId;
			const applicationMessage = await verificationChannel.messages.fetch(applicationMessageId);
			if(!applicationMessage) return;
			await verificationSchema.updateOne({userId: userId, vehicle: vehicleName, status: 'open'}, {$set: { status: 'closed', decision: `denied | User Left`, decidedBy: botId, decidedOn: todaysDate }});
			const applicationEmbed = applicationMessage.embeds[0];
			applicationEmbed.fields[3].value = `Verification Denied | Reason: User left the server.`;
			applicationEmbed.color = redColor
			applicationEmbed.addField('Decided By', `Automatic`);
			const deniedButton = new MessageButton()
			.setCustomId('disabled')
			.setLabel('Denied - User Left')
			.setStyle('DANGER')
			.setDisabled(true);
			const row = new MessageActionRow()
			.addComponents(deniedButton)
			applicationMessage.edit({
				embeds: [applicationEmbed],
				components: [row]
			});


		});
		
	},
};