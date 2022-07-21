const garageSchema = require('../mongodb_schema/garageSchema.js');

module.exports = {
	name: 'messageDelete',
	async execute(message) {
        const attachment = message.attachments.first()
        const attachmentURL = attachment?.url;
        if(attachmentURL){
            const data = await garageSchema.find().all('vehicleImages',[attachmentURL]);
            if(data && data.length > 0){
                const vehicleData = data[0];
                const userId = vehicleData.userId;
                const guildId = vehicleData.guildId
                const vehicleName = vehicleData.vehicle;
                const vehicleImages = vehicleData.vehicleImages;
                const deletedImageURL = attachmentURL;
                const index = vehicleImages.indexOf(deletedImageURL);
                const errorImage = 'https://cdn.discordapp.com/attachments/975485952325726278/995130454502023188/Error_1.png';
                vehicleImages.splice(index, 1, errorImage);
                await garageSchema.updateOne({ vehicle: vehicleName, guildId: guildId, userId: userId }, { $set: { vehicleImages: vehicleImages }});
            };
        };
    },
};
