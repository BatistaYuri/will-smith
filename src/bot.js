const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const { token } = require("./config/config.js");
require("dotenv").config();
const fs = require("fs");
const path = require("node:path");
const cron = require("node-cron");
const lolService = require("./api/services/lolService.js");

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

client.commands = new Collection();

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `Esse comando em ${filePath} está com "data" ou "execute ausentes"`
    );
  }
}

client.on("ready", () => {
  console.log("Connected");
  const channelVoice = client.channels.cache.find(
    (channel) => channel.name == "Amantes do Alisson"
  );
  const channelText = client.channels.cache.find(
    (channel) => channel.name == "lol"
  );
  client.channels.fetch(channelVoice.id).then(async () => {
    cron.schedule(
      "*/10 * * * * *",
      async () => {
        lolService.lol(client, channelVoice, channelText.id);
      },
      {
        scheduled: true,
        timezone: "America/Sao_Paulo",
      }
    );
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error("Comando não encontrado");
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply("Houve um erro ao executar esse comando!");
  }
});

client.login(token);
