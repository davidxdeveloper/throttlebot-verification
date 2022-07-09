const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { exitGlobal } = require('./options/exitGlobal.js');
const { backGlobal } = require('./options/backGlobal.js');
const { setName } = require('./options/nameOptions/setName.js');

async function manageName(
    interaction,
    initiatorData, 
    userData,
    guildData,
    embedColor,
    footerData,
    garageData,
    selectedVehicleData,
    logChannel
)
{

    //Initiator Details
    const initiatorAvatar = initiatorData.displayAvatarURL({ dynamic: true });
    const initiatorUsername = initiatorData.username;
    const initiatorId = initiatorData.id;

    //User Details
    const userId = userData.id;
    const userName = userData.username;
    const userAvatar = userData.displayAvatarURL({ dynamic: true });
    const userTag = userData.tag;

    //Guild Details
    const guildId = guildData.id;
    const guildName = guildData.name;
    const guildIcon = guildData.iconURL({ dynamic: true });	

    //Vehicle Details
    const vehicleName = selectedVehicleData.vehicle;
    const verificationImage = selectedVehicleData.verificationImageLink || "https://www.youtube.com/watch?v=dQw4w9WgXcQ" //Checkout this link.
    const vehicleOwnerId = selectedVehicleData.userId;
    let vehicleDescription = selectedVehicleData.vehicleDescription;
    let vehicleImages = selectedVehicleData.vehicleImages;
    
    //Misc
    const mainInteractionId = interaction.id;
    const footerIcon = footerData.icon;
    const footerText = footerData.text;

    //Filters
    const buttonFilter = i => i.user.id === initiatorId && i.guild.id === guildId;
    const messageFilter = (m) => m.author.id === initiatorId && m.guild.id === guildId;

    const manageNameDashboardEmbed = new MessageEmbed()
    .setAuthor({
        name: 'Management Dashboard - Vehicle Name',
        iconURL: initiatorAvatar
    })
    .setDescription('What would you like to change the name of the following vehicle to?')
    .setColor(embedColor)
    .addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
    .addField('Owner', userTag, true)
    .setFooter({
        text: footerText,
        iconURL: footerIcon
    });

    const buttonsRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
        .setLabel('Back')
        .setStyle('SECONDARY')
        .setCustomId(`backName+${mainInteractionId}`),
        new MessageButton()
        .setLabel('Exit')
        .setStyle('DANGER')
        .setCustomId(`exitName+${mainInteractionId}`)
    );

    await interaction.editReply({
        embeds: [manageNameDashboardEmbed],
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
        if(buttonId === `backName+${mainInteractionId}`){
            backGlobal(
                interaction,
                initiatorData, 
                userData,
                guildData,
                embedColor,
                footerData,
                garageData,
                selectedVehicleData
            );
        }else if(buttonId === `exitName+${mainInteractionId}`){
            exitGlobal(interaction);
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
        if(!messageContent){
            exitGlobal(interaction);
        };
        
        setName(
            interaction,
            initiatorData, 
            userData,
            guildData,
            embedColor,
            footerData,
            garageData,
            selectedVehicleData,
            logChannel,
            messageContent
        );

    });

};

module.exports = { 
    manageName
};