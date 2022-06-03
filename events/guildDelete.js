const { guildLeaveLogChannelId } = require('../modules/utility.js');
const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
	name: 'guildDelete',
	async execute(guild) {
		const guildLeaveLogChannel = await guild.client.channels.fetch(guildLeaveLogChannelId);
		const guildName = guild.name;
		const guildId = guild.id;
		const guildIcon = guild.iconURL({dynamic: true});
		const guildOwnerId = guild.ownerId;
		const guildMemberCount = guild.memberCount;
		let totalGuilds = 0;
        let totalMembers = 0;
        guild.client.guilds.cache.map(x => {
            const memberCount = x.memberCount;
            totalGuilds++;
            totalMembers += memberCount
        });
		const guildLeaveLogEmbed = new MessageEmbed()
		.setTitle(guildName)
		.setThumbnail(guildIcon)
		.setDescription(`The bot was removed from a server! Now serving a total of **${totalGuilds.toLocaleString()} servers** with \`${totalMembers.toLocaleString()} members.\`\nDown below are the details of the server.`)
		.addField('Name', guildName, true)
		.addField('Server Id', guildId, true)
		.addField('Owner', `<@${guildOwnerId}> | ${guildOwnerId}`, true)
		.addField('Member Count', `${guildMemberCount.toLocaleString()} members`, true)
		.setColor('#FFFCFF')
		guildLeaveLogChannel.send({
			embeds: [guildLeaveLogEmbed]
		});
	},
};