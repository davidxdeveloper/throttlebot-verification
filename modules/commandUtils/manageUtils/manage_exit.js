async function manageExit(interaction)
{
    await interaction.deleteReply();   
};

module.exports = { 
    manageExit
};