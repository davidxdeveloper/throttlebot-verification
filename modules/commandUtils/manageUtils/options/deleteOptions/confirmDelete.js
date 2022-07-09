const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { exitGlobal } = require('../exitGlobal.js');
const { backGlobal } = require('../backGlobal.js');
const garageSchema = require('../../../../../mongodb_schema/garageSchema.js');
const { greenColor,errorEmbed } = require('../../../../utility.js');

async function confirmDelete(
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

    await garageSchema.deleteOne({ vehicle: vehicleName, userId: userId })
    .catch(async e => {
        await interaction.editReply({
            embeds: [errorEmbed(e, initiatorAvatar)],
            components: []
        })
        return;
    });

    const confirmDeleteEmbed = new MessageEmbed()
    .setAuthor({
        name: 'Management Dashboard - Delete Vehicle',
        iconURL: initiatorAvatar
    })
    .setDescription('The following vehicle was successfully deleted from the users garage.')
    .setColor(greenColor)
    .addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
    .addField('Owner', userTag, true)
    .setFooter({
        text: footerText,
        iconURL: footerIcon
    });

    const buttonsRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
        .setLabel('Confirmed')
        .setStyle('SUCCESS')
        .setCustomId(`disabled`)
        .setDisabled(true),
        new MessageButton()
        .setLabel('Back')
        .setStyle('SECONDARY')
        .setCustomId(`backConfirmDelete+${mainInteractionId}`),
        new MessageButton()
        .setLabel('Exit')
        .setStyle('DANGER')
        .setCustomId(`exitConfirmDelete+${mainInteractionId}`)
    );

    logChannel.send({
        embeds: [confirmDeleteEmbed]
    });

    await interaction.editReply({
        embeds: [confirmDeleteEmbed],
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
        case `backConfirmDelete+${mainInteractionId}`:
            backGlobal(
                interaction,
                initiatorData, 
                userData,
                guildData,
                embedColor
            );
            break;
        case `exitConfirmDelete+${mainInteractionId}`:
            exitGlobal(interaction)
            break;
    };
    
};

module.exports = { 
    confirmDelete
};