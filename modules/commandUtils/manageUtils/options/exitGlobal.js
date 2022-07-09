async function exitGlobal(
    interaction,
)
{
    await interaction.deleteReply();
};

module.exports = { 
    exitGlobal
};