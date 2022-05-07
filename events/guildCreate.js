module.exports = {
	//Event runs whenever the client (bot) is invited to a new server.
	name: 'guildCreate',
	execute(guild) {
		function guildJoinLogging(channelId){
			
			const guildName = guild.name;
			const guildIcon = guild.icon.iconURL({dynamic: true});
			const guildOwnerId = guild.ownerId;
			const guildMemberCount = guild.member.filter(member => !member.user.bot).size;

		};
	},
};