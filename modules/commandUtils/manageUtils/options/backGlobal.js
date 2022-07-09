const main = require('../main.js');

async function backGlobal(
    interaction, 
    initiatorData, 
    userData, 
    guildData, 
    embedColor
)
{
    return main.manageDashboard(interaction, initiatorData, userData, guildData, embedColor);
};

module.exports = { 
    backGlobal
};