
const garageSchema = require('../mongodb_schema/garageSchema.js');
const guildProfileSchema = require('../mongodb_schema/guildProfileSchema.js');
const userProfileSchema = require('../mongodb_schema/userProfileSchema.js')
const { embedColor } = require('../modules/utility.js');
const mongoose = require('mongoose');

async function obtainAllUserCars(userId, guildId){
    /*
        Returns all the verified vehicles for the specified user
        from a specified guild.
        Note: Returns an object containing all the car details + the size of the garage.
    */
    const garageData = await garageSchema.find({ userId: userId, guildId: guildId });
    const garageSize = garageData.length 
    || 0;
    return {
        garageCars: garageData,
        garageSize: garageSize
    };
};

async function obtainGuildProfile(guildId){
    /*
        Returns the server/guild profile containing the configurations and other details.
    */
    const guildData = await guildProfileSchema.findOne({ guildId: guildId });
    return guildData;
};

async function obtainUserProfile(userId){
    /*
        Returns the user profile containing configuration settings and premium status etc.
        Refer to the schema model in ../mongodb_schema/userProfileSchema.js for the data points.
    */
    const userData = await userProfileSchema.findOne({ userId: userId });
    return userData;
};

async function defaultEmbedColor(userId = null){
    /*
        Returns the default embed color the bot needs to use across all commands.
        Since premium users can opt to have their own custom default color,
        this function will return either the normal default embed color which is #FFFCFF (white)
        or the custom color selected by the premium user.
    */
    let color = embedColor;
    if(userId){
        const userData = await userProfileSchema.findOne({ userId: userId });
        const whetherPremiumUser = userData?.premiumUser || null;
        const customEmbedColor = userData?.embedColor || null;
        //If the specified user has premium enabled and has a chosen embed color, that will be returned instead.
        if(whetherPremiumUser){
            if(customEmbedColor) color = customEmbedColor;
        };
    };
    return color;
};

module.exports = { obtainAllUserCars, obtainGuildProfile, obtainUserProfile, defaultEmbedColor }