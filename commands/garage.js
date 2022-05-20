const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { errorEmbed } = require('../modules/utility.js');
const { obtainAllUserCars } = require('../modules/database.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('garage')
		.setDescription('View yours or another user\'s garage.')
		.addUserOption(option => option.setName('mention').setDescription('View another user\'s garage.')),

	async execute(interaction) {
		try{
			//Defining user details.
			const initiatorId = interaction.user.id;
			const initiatorUsername = interaction.user.username;
			const initiatorAvatar = interaction.user.displayAvatarURL({ dynamic: true });
			const userDetails = interaction.options.getUser('mention') 
			|| interaction.user;
			const userId = userDetails.id;
			const username = userDetails.username;
			const useravatar = userDetails.displayAvatarURL({ dynamic: true });
			//Guild information
			const guildId = interaction.guild.id;
			const guildName = interaction.guild.name;
			const guildIcon = interaction.guild.iconURL({ dynamic: true });
			//Garage data for specified user.
			const garageData = await obtainAllUserCars(userId);
			const userGarage = garageData.garageCars;
			const userGarageSize = garageData.garageSize;

			async function checklist(){
				/*
				In this function we'll check for the following things:
					1. Check whether the server has been setup.
						1.A. Check if all channels are configured.
					2. Whether user has any cars.
						2.A. If the user is the same as the initiator, ask them to
						verify a ride first.
				*/
				if(userGarageSize === 0){
					let errEmbed;
					let ephemeralStatus = false;
					if(userId === interaction.user.id){
						console.log(userId, interaction.user.id)
						errEmbed = errorEmbed(`**${username},**\nYou do not have any verified rides! Please have them verified first by using the \`/verify\` command for them to show up in your garage.`,initiatorAvatar,null,'#FFFCFF',guildIcon,`${guildName} • Vehicle Verification`)
						ephemeralStatus = true;
					}else{
						errEmbed = errorEmbed(`**${username}** has no verified rides.`,initiatorAvatar,null,'#FFFCFF',guildIcon,`${guildName} • Vehicle Verification`)
					};
					await interaction.reply({
						embeds:[errEmbed],
						ephemeral: ephemeralStatus
					});
					return;
				};
			};
			//Handling any potential errors.
			checklist();
			await interaction.reply(`**insert ${username}'s garage here*`)
		}catch(err) {
			console.log(err);
		};
	},
}; 