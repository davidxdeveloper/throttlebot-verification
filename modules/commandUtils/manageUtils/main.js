
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require('discord.js');
const { obtainGuildProfile, obtainAllUserVehicles } = require('../../database.js');
const { vehicleSelection } = require('../garageUtils/vehicleSelection.js');
const { botIcon, errorEmbed } = require('../../utility.js');
const { manageName } = require('./manage_name.js');
const { manageDescription } = require('./manage_description.js');
const { manageGarageIcon } = require('./manage_garageIcon');
const { manageDelete } = require('./manage_delete');
const { manageReset } = require('./manage_reset');
const { manageExit } = require('./manage_exit');

async function manageDashboard(
    interaction,
    initiatorData, 
    userData,
    guildData,
    embedColor
){

    //Initiator Details
    const initiatorAvatar = initiatorData.displayAvatarURL({ dynamic: true });
    const initiatorUsername = initiatorData.username;
    const initiatorId = initiatorData.id;
    
    //User Details
    const userId = userData.id;
    const userTag = userData.tag;
    
    //Guild Details
    const guildId = guildData.id;
    const guildName = guildData.name;
    const guildIcon = guildData.iconURL({ dynamic: true });	
    
    //Filters
    const menuFilter = (menuInteraction) => menuInteraction.componentType === 'SELECT_MENU' && menuInteraction.customId === `manageMenu+${mainInteractionId}` && menuInteraction.user.id === initiatorId && menuInteraction.guild.id === guildId;
   
    //Misc
    const mainInteractionId = interaction.id;

    //Guild Profile
    const guildProfile = await obtainGuildProfile(guildId);
    if(!guildProfile){
        interaction.editReply({
            embeds: [errorEmbed('Server profile not setup, please kick the bot and invite it again.', initiatorAvatar)]
        });
        return;
    };
    const verificationChannelId = guildProfile.verificationChannelId;
    const guideChannelId = guildProfile.guideChannelId;
    const loggingChannelId = guildProfile.loggingChannelId;
    const verificationRoleId = guildProfile.verifiedVehicleRoleId;
    const syncEnabled = guildProfile.syncEnabled;
    const syncedGuildId = guildProfile.syncedGuildId;
    let syncedGuildData;
    let footerIcon = guildProfile.customFooterIcon || botIcon;
    const footerText = `${guildName} • Vehicle Verification`
    const footerData = {
        icon: footerIcon,
        text: footerText
    };
    if(syncEnabled){
        if(!syncedGuildData){
            await interaction.editReply({
                embeds: [errorEmbed(`There was an error when fetching details of the synced server \`(ID: ${syncedGuildId})\``, initiatorAvatar)],
                ephemeral: true
            });
            return;
        };
        const syncedServerName = syncedGuildData.name;
        await interaction.editReply({
            embeds: [errorEmbed(`This server is synced to the \`${syncedServerName}\` server.\nPlease apply for vehicle verification in there.`, initiatorAvatar)],
            ephemeral: true
        });
        return;
    };

    if(!verificationChannelId || !guideChannelId || !loggingChannelId){
        await interaction.editReply({
            embeds: [errorEmbed('This server has not been setup properly, please ask the moderation team to use the `/setup` command.', initiatorAvatar)]
        });
        return;
    };

    const logChannel = await interaction.member.guild.channels.fetch(loggingChannelId);
    if(!logChannel){
        await interaction.editReply({
            embeds: [errorEmbed(`Failed to obtain the log channel where the logs are sent.\nPlease ask the staff to make sure the log channel is setup properly.`, initiatorAvatar)],
        });
        return;
    };

    const garageData = await obtainAllUserVehicles(userId, guildId);
    if(!garageData || garageData?.length === 0){
        await interaction.editReply({
            embeds:[errorEmbed(`**${initiatorUsername},**\nYou do not have any verified rides! Please have them verified first by using the \`/verify\` command first.`)],
            ephemeral: true
        });
        return;
    };

    const selectedVehicleData = await vehicleSelection(garageData, userData, footerText, footerIcon, embedColor, interaction);
    if(!selectedVehicleData) return;
    const vehicleName = selectedVehicleData.vehicle;
    const verificationImage = selectedVehicleData.verificationImageLink || "https://www.youtube.com/watch?v=dQw4w9WgXcQ" //Checkout this link.
    const vehicleOwnerId = selectedVehicleData.userId;
    let vehicleDescription = selectedVehicleData.vehicleDescription;
    let vehicleImages = selectedVehicleData.vehicleImages;
    
    const settingsDashboardEmbed = new MessageEmbed()
    .setAuthor({
        name: 'Verified Vehicle Management',
        iconURL: initiatorAvatar
    })
    .setDescription('This dashboard allows you to configure verified vehicles owned by a user.\nStart by selecting on the option you would ike to explore from the menu below. ')
    .addField('Vehicle', `[${vehicleName}](${verificationImage})`, true)
    .addField('Owner', userTag, true)
    .setColor(embedColor)
    .setFooter({
        text: footerText,
        iconURL: footerIcon
    });
    
    const row = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId(`manageMenu+${mainInteractionId}`)
            .setPlaceholder('Select the option you wish to configure...')
            .addOptions([
                {
                    label: 'Name',
                    description: 'Edit the name of the vehicle.',
                    value: `manage_name+${mainInteractionId}`,
                },
                {
                    label: 'Image',
                    description: 'Add, remove or reset images on the vehicle.',
                    value: `manage_image+${mainInteractionId}`,
                },
                {
                    label: 'Description',
                    description: 'Edit or reset the description of the vehicle.',
                    value: `manage_description+${mainInteractionId}`,
                },
                {
                    label: 'Garage Icon',
                    description: 'Set or reset the garage icon.',
                    value: `manage_garageIcon+${mainInteractionId}`,
                },
                {
                    label: 'Delete',
                    description: 'Delete a vehicle from the user\`s garage.',
                    value: `manage_delete+${mainInteractionId}`,
                },
                {
                    label: 'Reset',
                    description: 'Reset the user\'s garage.',
                    value: `manage_reset+${mainInteractionId}`,
                },
                {
                    label: 'Exit',
                    description: 'Exit the interface.',
                    value: `manage_exit+${mainInteractionId}`,
                },
            ]),
    );

    await interaction.editReply({
        embeds: [settingsDashboardEmbed],
        components: [row]
    });

    const menuCollector = interaction.channel.createMessageComponentCollector({
        filter: menuFilter,
        max: 1,
        time: 120000
    });

    menuCollector.on('end', async (menuCollected) => {
        const menuCollectedData = menuCollected?.first();
        if(!menuCollectedData){
            await interaction.deleteReply();
            return;
        };
        const selectedOptionId = menuCollectedData.values[0];
        if(!menuCollectedData.deferred) await menuCollectedData.deferUpdate();
        switch(selectedOptionId){
            case `manage_name+${mainInteractionId}`:
                manageName(
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
            case `manage_image+${mainInteractionId}`:
                break;
                
            case `manage_description+${mainInteractionId}`:
                manageDescription();
                break;
            case `manage_garageIcon+${mainInteractionId}`:
                manageGarageIcon();
                break;
            case `manage_delete+${mainInteractionId}`:
                manageDelete(
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
            case `manage_reset+${mainInteractionId}`:
                manageReset();
                break;
            case `manage_exit+${mainInteractionId}`:
                manageExit(
                    interaction
                );
                break;
            
        };
    });

};


exports.manageDashboard = manageDashboard;