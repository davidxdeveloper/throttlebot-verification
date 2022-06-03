const { Client, Collection, Intents } = require('discord.js');
const fs = require('node:fs');
require('dotenv').config()
const discordToken = process.env.TOKEN;

// Client instances.
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_MEMBERS ] });

//Command Handler Collection
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for(const file of commandFiles){
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
};

//Event handler:
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	};
};

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

client.login(discordToken);