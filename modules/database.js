
const garageSchema = require('../mongodb_schema/garageSchema.js');
const guildProfileSchema = require('../mongodb_schema/guildProfileSchema.js');
const userProfileSchema = require('../mongodb_schema/userProfileSchema.js')

async function obtainAllUserCars(userId, guildId){
    const garageData = await garageSchema.find({ userId: userId, guildId: guildId });
    const garageSize = garageData.length 
    || 0;
    return {
        garageCars: garageData,
        garageSize: garageSize
    };
};

async function obtainServerProfile(guildId){
    const serverData = await guildProfileSchema.find({ guildId: guildId });
    return serverData;
};

async function obtainUserProfile(){
    const userData = await userProfileSchema.find({ guildId: guildId });
    return userData;
};

module.exports = { obtainAllUserCars }