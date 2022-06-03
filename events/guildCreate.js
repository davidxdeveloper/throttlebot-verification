const { obtainGuildProfile } = require('../modules/database.js');
const { guildJoinLogChannelId, botIcon } = require('../modules/utility.js');
const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const guildProfileSchema = require('../mongodb_schema/guildProfileSchema.js');
const moment = require('moment');

module.exports = {
	//Event runs whenever the client (bot) is invited to a new server.
	name: 'guildCreate',
	async execute(guild) {
		const guildJoinLogChannel = await guild.client.channels.fetch(guildJoinLogChannelId);
		const guildName = guild.name;
		const guildId = guild.id;
		const guildIcon = guild.iconURL({dynamic: true});
		const guildOwnerId = guild.ownerId;
		const guildMemberCount = guild.memberCount;
		const todaysDate = moment.utc();
		let totalGuilds = 0;
        let totalMembers = 0;
        guild.client.guilds.cache.map(x => {
            const memberCount = x.memberCount;
            totalGuilds++;
            totalMembers += memberCount
        });
		const guildProfile = await obtainGuildProfile(guildId);
		if(!guildProfile){
			async function createGuildProfile(){
				//Creates the guild profile with required data points.
				const serverProfileDocument = new guildProfileSchema({
					_id: mongoose.Types.ObjectId(),
					guildId: guildId,
					guideChannelId: null,
					verificationChannelId: null,
					loggingChannelId: null,
					verifiedVehicleRoleId: null,
					adddedOn: todaysDate,
					customFooterIcon: null,
					syncEnabled: false,
					syncedGuildId: null,
				})
				serverProfileDocument.save()
              	.then(result => {
					console.log(`New server profile was created with the following details:\n ${result}`);
				}).catch(err => console.log(err));
			};
			await createGuildProfile();
		};
		const guildJoinLogEmbed = new MessageEmbed()
		.setTitle(guildName)
		.setThumbnail(guildIcon)
		.setDescription(`The bot was added to a new server! Now serving a total of **${totalGuilds.toLocaleString()} servers** with \`${totalMembers.toLocaleString()} members\`\nDown below are the details of the server.`)
		.addField('Name', guildName, true)
		.addField('Server Id', guildId, true)
		.addField('Owner', `<@${guildOwnerId}> | ${guildOwnerId}`, true)
		.addField('Member Count', `${guildMemberCount.toLocaleString()} Members`, true)
		.setColor('#FFFCFF')
		.setTimestamp()
		.setFooter({
			text: 'ThrottleBot Vehicle Verification',
			iconURL: botIcon
		})
		await guild.channels.cache.find(r => r.type !== 'GUILD_CATEGORY')
        .createInvite({
			maxAge: 0,
			maxUses: 0 
		})
        .then((invite) => guildJoinLogEmbed.addField("Invite link", invite.url, true))
        .catch(() => guildJoinLogEmbed.addField("Invite link", "Missing permissions", true));
		guildJoinLogChannel.send({
			embeds: [guildJoinLogEmbed]
		});
	},
};