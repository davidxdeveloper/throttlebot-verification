const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { errorEmbed } = require('../../utility.js');
const { exitGlobal } = require('./options/exitGlobal.js');
const { backGlobal } = require('./options/backGlobal.js');
const { cancelDelete } = require('./options/deleteOptions/cancelDelete.js');
const { confirmDelete } = require('./options/deleteOptions/confirmDelete.js');


async function manageDelete(
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

    const manageDeleteDashboardEmbed = new MessageEmbed()
    .setAuthor({
        name: 'Management Dashboard - Delete Vehicle',
        iconURL: initiatorAvatar
    })
    .setDescription('Are you sure you would like to permanently delete the following vehicle? This action is irreversible!')
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
        .setLabel('Confirm')
        .setStyle('SUCCESS')
        .setCustomId(`confirmDelete+${mainInteractionId}`),
        new MessageButton()
        .setLabel('Cancel')
        .setStyle('DANGER')
        .setCustomId(`cancelDelete+${mainInteractionId}`),
        new MessageButton()
        .setLabel('Back')
        .setStyle('SECONDARY')
        .setCustomId(`backDelete+${mainInteractionId}`),
        new MessageButton()
        .setLabel('Exit')
        .setStyle('DANGER')
        .setCustomId(`exitDelete+${mainInteractionId}`)
    );

    await interaction.editReply({
        embeds: [manageDeleteDashboardEmbed],
        components: [buttonsRow]
    });

    const collectedButton = await interaction.channel.awaitMessageComponent({ filter: buttonFilter, componentType: 'BUTTON', time: 60000, max: 1 })
    .catch(e => {
    });
    if(!collectedButton){
        await interaction.followUp({
            embeds: [errorEmbed('No response was received, Ending operation.', initiatorAvatar)],
            ephemeral: true
        });
        await interaction.deleteReply();
        return;
    };
    if(!collectedButton.deferred) await collectedButton.deferUpdate();
    const buttonId = collectedButton.customId;
    switch(buttonId){
        case `confirmDelete+${mainInteractionId}`:
            confirmDelete(
                interaction,
                initiatorData, 
                userData,
                guildData,
                embedColor,
                footerData,
                garageData,
                selectedVehicleData,
                logChannel
            );
            break;
        case `cancelDelete+${mainInteractionId}`:
            cancelDelete(
                interaction,
                initiatorData, 
                userData,
                guildData,
                embedColor,
                footerData,
                garageData,
                selectedVehicleData
            );
            break;
        case `backDelete+${mainInteractionId}`:
            //Back function would take you back to main.
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
            break;
        case `exitDelete+${mainInteractionId}`:
            exitGlobal(
                interaction
            );
            break;
    };

};

module.exports = { 
    manageDelete,
};