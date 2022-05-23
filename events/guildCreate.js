const { obtainGuildProfile } = require('../modules/database.js')
const mongoose = require('mongoose');
const guildProfileSchema = require('../mongodb_schema/guildProfileSchema.js');
const moment = require('moment');
module.exports = {
	//Event runs whenever the client (bot) is invited to a new server.
	name: 'guildCreate',
	async execute(guild) {

		const guildName = guild.name;
		const guildId = guild.id;
		const guildIcon = guild.iconURL({dynamic: true});
		const guildOwnerId = guild.ownerId;
		const todaysDate = moment.utc();
		const guildProfile = await obtainGuildProfile(guildId) || [];
		if(!guildProfile.length){
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
	},
};