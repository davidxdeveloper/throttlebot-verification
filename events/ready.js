require('dotenv').config()
const mongoURI = process.env.MONGOURI;
const mongoose = require('mongoose');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
        mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(result => console.log('MongoDB connection established.'))
        .catch(e => console.log(`MongoDB connection failed.\nErr: ${e}`));
	},
};