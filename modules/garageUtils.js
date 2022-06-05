const { MessageEmbed } = require('discord.js');
const mongoose = require('mongoose');
const { removeNonIntegers } = require('../modules/utility.js');


async function vehicleSelection(garage, userData, footerText, footerIcon, embedColor, interaction){
    /*
    First, we'll check if the user has only one vehicle or more than one.
    If there's only one, skip the entire selection process and default it to the only vehicle the user has.
    If there's more than one, then display their garage and have them select their ride.
    */
    return new Promise(async function(resolve, reject) {
        try{
            const userAvatar = userData.displayAvatarURL({ dynamic: true });
		    const userTag = userData.tag;
            const userId = userData.id;
            const messageFilter = (m) => m.author.id === userId;

            if(garage.length === 1){
                resolve(garage[0]);
            }else{
                const garageOutput = garage.map((x,y) => {
                    return `\`${y+1}.\` ${x.vehicle}`
                });

                const garageEmbed = new MessageEmbed()
                .setAuthor({
                    name: `${userTag}'s Garage`,
                    iconURL: userAvatar
                })
                .setDescription(`Please type the number corresponding the vehicle you would like to select.\n${garageOutput.join('\n')}`)
                .setColor(embedColor)
                .setFooter({
                    text: footerText,
                    iconURL: footerIcon
                });

                await interaction.editReply({
                    embeds: [garageEmbed]
                });

                const allowedResponses = Array.from(Array(garage.length + 1).keys()).slice(1).map(x => `${x}`);
                const messageCollector = interaction.channel.createMessageCollector({ filter: messageFilter, time: 60000, max: 3});
                messageCollector.on('collect', async (collectedMessage) => {
                    const messageContent = collectedMessage.content;
                    const selectedOption = removeNonIntegers(messageContent);
                    if(!allowedResponses.includes(selectedOption)) return;
                    messageCollector.stop();
                    collectedMessage.delete();
                    const selectedVehicle = garage[parseInt(selectedOption) - 1];
                    resolve(selectedVehicle)
                });

                messageCollector.on('end', async (collected) => {
                    /*
                    Checking if there were no responses collected 
                    Or if the responses that were collected are invalid.
                    */
                    const collectedResponses = collected.map(x => x.content);
                    const whetherAllInvalidResponses = collectedResponses.every(x => {
                        return !allowedResponses.includes(x);
                    });
                    if(whetherAllInvalidResponses){
                        await interaction.deleteReply();
                        return;
                    }
                });
            };
        }catch(err){
            reject(err)
        };
    });
};

module.exports = { 
    vehicleSelection
};