const garageSchema = require('../mongodb_schema/garageSchema.js');
const guildProfileSchema = require('../mongodb_schema/guildProfileSchema.js');
const verificationSchema = require('../mongodb_schema/verificationApplicationSchema.js');
const userProfileSchema = require('../mongodb_schema/userProfileSchema.js');
const { embedColor } = require('../modules/utility.js');
const mongoose = require('mongoose');

async function obtainAllUserCars(userId, guildId){
    /*
        Returns all the verified vehicles for the specified user
        from a specified guild.
    */
    const garageData = await garageSchema.find({ userId: userId, guildId: guildId });
    return garageData
};

async function obtainOneOpenUserApplication(userId, guildId, vehicleName){
    //Returns one open user application with the specified parameters.
    const applicationsData = await verificationSchema.findOne({ userId: userId, guildId: guildId, vehicle: vehicleName, status: 'open'});
    return applicationsData;
};

async function obtainAllUserApplications(userId, guildId){
    //Returns all the applications from a specified user from a guild.
    const applicationsData = await verificationSchema.find({ userId: userId, guildId: guildId });
    return applicationsData;
};

async function obtainAllOpenUserApplications(userId, guildId){
   //Returns all the open applications from a specified user from a guild.
   const applicationsData = await verificationSchema.find({ userId: userId, guildId: guildId, status: 'open' });
   return applicationsData; 
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


module.exports = { 
    obtainAllUserCars, 
    obtainGuildProfile, 
    obtainUserProfile, 
    defaultEmbedColor, 
    obtainAllUserApplications, 
    obtainAllOpenUserApplications, 
    obtainOneOpenUserApplication, 
};