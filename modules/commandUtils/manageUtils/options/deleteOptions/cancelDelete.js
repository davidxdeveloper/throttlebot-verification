const { MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const { exitGlobal } = require('../exitGlobal.js');
const { backGlobal } = require('../backGlobal.js');
const { redColor, errorEmbed } = require('../../../../utility.js');

async function cancelDelete(
    interaction,
    initiatorData, 
    userData,
    guildData,
    embedColor,
    footerData,
    garageData,
    selectedVehicleData
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

    const cancelDeleteEmbed = new MessageEmbed()
    .setAuthor({
        name: 'Management Dashboard - Delete Vehicle',
        iconURL: initiatorAvatar
    })
    .setDescription('The operation was cancelled. Please use the buttons below to proceed.')
    .setColor(redColor)
    .addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
    .addField('Owner', userTag, true)
    .setFooter({
        text: footerText,
        iconURL: footerIcon
    });

    const buttonsRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
        .setLabel('Canceled')
        .setStyle('DANGER')
        .setCustomId(`disabled`)
        .setDisabled(true),
        new MessageButton()
        .setLabel('Back')
        .setStyle('SECONDARY')
        .setCustomId(`backCancelDelete+${mainInteractionId}`),
        new MessageButton()
        .setLabel('Exit')
        .setStyle('DANGER')
        .setCustomId(`exitCancelDelete+${mainInteractionId}`)
    );
    
    await interaction.editReply({
        embeds: [cancelDeleteEmbed],
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
        case `backCancelDelete+${mainInteractionId}`:
            backGlobal(
                interaction,
                initiatorData, 
                userData,
                guildData,
                embedColor,
                backConfirmDelete
            );
            break;
        case `exitCancelDelete+${mainInteractionId}`:
            exitGlobal(interaction)
            break;
    };

};

module.exports = { 
    cancelDelete
};