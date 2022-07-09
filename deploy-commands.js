const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config()
const discordToken = process.env.TOKEN;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const clientId = "851411747641884712";

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
};
const rest = new REST({ version: '9' }).setToken(discordToken);

rest.put(Routes.applicationCommands(clientId), { body: commands }) 
    .then((result) => console.log('Successfully registered application commands. - ', result.length) )
    .catch(console.error);

