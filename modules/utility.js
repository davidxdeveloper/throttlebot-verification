const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js')

const guildJoinLogChannelId = '974705965653979227';
const guildLeaveLogChannelId = '974705992698822727';
const embedColor = '#FFFCFF';
const botIcon = 'https://cdn.discordapp.com/attachments/975485952325726278/975485974710714458/ThrottleBotLogo.png';
const botName = 'ThrottleBot Verification';
const greenIndicator = '<:greenIndicator:975489221643108482>';
const redIndicator = '<:redIndicator:975489221534031892>';
const greenColor = '#77DD77';
const redColor = '#FF6961';
const patreonLogChannelId = '982377337754619985';
const patreonLink = 'https://www.patreon.com/throttlebotverification'
const patreonRedColor = '#F96854';
const patreonBlueColor = '#052D49';
const patreonBanner = 'https://cdn.discordapp.com/attachments/975485952325726278/980910367540641852/patreonBanner.png';
const patreonBannerLarge = 'https://cdn.discordapp.com/attachments/975485952325726278/980910391737614346/patreonBannerLarge.png';
const garageIconExample = 'https://cdn.discordapp.com/attachments/975485952325726278/982221023321665546/Garage_Icon.png';
const garageEmbedColorExample = 'https://cdn.discordapp.com/attachments/975485952325726278/983741574125076490/embed_color.png'
const botInvite = 'https://discord.com/api/oauth2/authorize?client_id=851411747641884712&permissions=157035129920&scope=bot%20applications.commands';
const botInviteAdmin = 'https://discord.com/api/oauth2/authorize?client_id=851411747641884712&permissions=8&scope=bot%20applications.commands';
const supportServerInvite = 'https://discord.gg/Nh4A6HDZT4'
const githubLink = 'https://github.com/davidxdeveloper/throttlebot-verification/'
const ownerAvatar = 'https://cdn.discordapp.com/avatars/378171973429231616/a_a1790dd0cba3c69e26d515b531385e1e.gif?size=4096';
const ownerTag = 'Davidddddddd#7076';
const patreonT1 = '982011560794923038';
const patreonT2 = '982012168482455582';
const patreonT3 = '982012171569463317';
const patreonT4 = '982012172269924483';
const patreonDefault = '982012172483829893';
const supportServerId = '851413403222147073';
const botId = '851411747641884712';

function removeNonIntegers(string){
    return string.replace(/\D/g,'');
};

function errorEmbed(errMsg, useravatar = null, example = null, embedColor = '#ff6961', footerIcon = null, footerText = null){
    //A predefined error embed to use in case there's an error scenario.
    const embed = new MessageEmbed()
    .setColor(embedColor)
    .setAuthor(
        {
            name: "There was an error",
            iconURL: useravatar
        }
    )
    .setDescription(errMsg);
    if(example) embed.addField("Example", example);
    if(footerText && footerIcon) embed.setFooter({ text: footerText, iconURL: footerIcon });

    return embed;
};

function tipsEmbed(tipMsg, embedColor = '#FFFCFF'){
    const embed = new MessageEmbed()
    .setColor(embedColor)
    .setAuthor(
        {
            name: "Throttle Tips",
            iconURL: 'https://www.pngmart.com/files/6/Light-Bulb-PNG-File.png'
        }
    )
    .setDescription(tipMsg);
    return embed;
}


function isValidHttpUrl(string) {
    //Checks whether the provided string is a valid URL.
    let url;
    
    try {
      url = new URL(string);
    } catch (_) {
      return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
};

function patreonAdvertEmbed(avatar, title, description, footerIcon, footerText){
    const patreonAdvertisementEmbed = new MessageEmbed()
    .setAuthor({
        name: title,
        iconURL: avatar
    })
    .setDescription(description+'\n\nBy supporting, not only do you help with the development of the bot, your support allows us to keep the bot free for anyone to use and [open source!](https://github.com/davidxdeveloper/throttlebot-verification/)')
    .setImage(patreonBanner)
    .setColor(patreonRedColor)
    .setFooter({
        text: footerText,
        iconURL: footerIcon
    })
    const linksRow = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setLabel('Patreon')
            .setStyle('LINK')
            .setURL(patreonLink)
    );
    return {
        advertEmbed: patreonAdvertisementEmbed,
        buttonsRow: linksRow
    };
}

module.exports = { 
    botName,
    botIcon,
    greenIndicator,
    redIndicator,
    patreonLogChannelId,
    guildJoinLogChannelId,
    guildLeaveLogChannelId,
    embedColor,
    greenColor,
    redColor,
    patreonBanner,
    patreonBannerLarge,
    patreonRedColor,
    patreonBlueColor,
    garageIconExample,
    botInvite,
    botInviteAdmin,
    supportServerInvite,
    patreonLink,
    githubLink,
    ownerAvatar,
    ownerTag,
    patreonT1,
    patreonT2,
    patreonT3,
    patreonT4,
    patreonDefault,
    supportServerId,
    garageEmbedColorExample,
    removeNonIntegers,
    errorEmbed,
    isValidHttpUrl,
    patreonAdvertEmbed,
    tipsEmbed,
};