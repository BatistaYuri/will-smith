const { REST, Routes } = require("discord.js");
const { token, clientId, guildId } = require("./config/config");
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

const commands = [];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// instância REST
const rest = new REST({ version: "10" }).setToken(token);
console.log(token);
// deploy
(async () => {
  try {
    console.log(`Resentando ${commands.length} comandos...`);

    // PUT
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log("Comandos registrados com sucesso!");
  } catch (error) {
    console.error(error);
  }
})();
