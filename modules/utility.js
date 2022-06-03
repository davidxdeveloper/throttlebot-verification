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
const patreonRedColor = '#F96854';
const patreonBlueColor = '#052D49'
const patreonBanner = 'https://cdn.discordapp.com/attachments/975485952325726278/980910367540641852/patreonBanner.png';
const patreonBannerLarge = 'https://cdn.discordapp.com/attachments/975485952325726278/980910391737614346/patreonBannerLarge.png'
const garageIconExample = 'https://cdn.discordapp.com/attachments/975485952325726278/982221023321665546/Garage_Icon.png'

function removeNonIntegers(string){
    return string.replace(/\D/g,'');
};

function errorEmbed(errMsg, useravatar = null, example = null, embedColor = '#ff6961', footerIcon = null, footerText = null){
    //A predefined error embed to use in case there's an error scenario.
    let embed = new MessageEmbed()
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
    .setDescription(description+'\nBy supporting, not only do you help with the development of the bot, your support allows us to keep the bot free for anyone to use and open source!')
    .addField('Checkout Our Github', 'If you would like to support us in other ways, checkout our github page and [star the repository!](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars)')
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
            .setURL('https://www.patreon.com/throttlebotverification'),
        new MessageButton()
            .setLabel('Github')
            .setStyle('LINK')
            .setURL('https://github.com/davidxdeveloper/throttlebot-verification'),
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
    removeNonIntegers,
    errorEmbed,
    isValidHttpUrl,
    patreonAdvertEmbed
};