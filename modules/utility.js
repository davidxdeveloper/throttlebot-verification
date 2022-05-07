const { MessageEmbed } = require('discord.js')

function errorEmbed(errMsg, useravatar = null, example = null, embedColor = '#FFFCFF', footerIcon = null, footerText = null){
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

module.exports = { errorEmbed }