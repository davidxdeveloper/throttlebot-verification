const { MessageEmbed } = require('discord.js')

const guildJoinLogChannelId = '974705965653979227';
const guildLeaveLogChannelId = '974705992698822727';
const embedColor = '#FFFCFF';
const botIcon = 'https://cdn.discordapp.com/attachments/975485952325726278/975485974710714458/ThrottleBotLogo.png';
const botName = 'ThrottleBot Verification';
const greenIndicator = '<:greenIndicator:975489221643108482>';
const redIndicator = '<:redIndicator:975489221534031892>';
const greenColor = '#77DD77';
const redColor = '#FF6961';
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
  }

module.exports = { botName, botIcon, greenIndicator, redIndicator, guildJoinLogChannelId, guildLeaveLogChannelId, embedColor, greenColor, redColor, removeNonIntegers, errorEmbed, isValidHttpUrl }