const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  Collection,
  Events,
} = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const {
  prefix,
  prefixSong,
  prefixStopSong,
  token,
} = require("./config/config.js");
const { playSong } = require("./api/brabaLauncher.js");
require("dotenv").config();
const commands = require("./config/commands.json");
const fs = require("fs");
const path = require("node:path");
const cron = require("node-cron");
const lolService = require("./api/services/lolService.js");
const fpsService = require("./api/services/fpsService.js");

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
    (channel) => channel.name == "lol voice"
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

client.on("messageCreate", async (message) => {
  if (message.content.startsWith(prefix)) {
    return execute(message);
  }

  if (message.content === prefixStopSong) message.member.voice.channel.leave();

  if (message.content.startsWith(prefixSong)) {
    const args = message.content.split(" ");
    const url = args[1];

    await playSong(message.member.voice.channel, url);
  }
});

async function execute(message) {
  const args = message.content.split(" ");
  const option = args[1];

  if (!option || option === "help") {
    return message.channel.send({ split: true, embeds: [getDoc(commands)] });
  }

  const voiceChannel = message.member.voice;
  if (!voiceChannel) {
    return message.channel.send("entra no channel desgraça");
  }

  const opt = commands.find((command) => command.name == option);
  if (!opt) {
    return message.channel.send("opção não existe");
  } else if (opt.name == "fps") {
    return fpsService.fps(voiceChannel);
  } else if (opt.name == "stop") {
    return fpsService.stop(voiceChannel);
  }

  const audio = fs.existsSync(`./public/audios/${opt.name}.mp3`)
    ? fs.createReadStream(`./public/audios/${opt.name}.mp3`)
    : null;
  const gif = fs.existsSync(`./public/gifs/${opt.name}.gif`)
    ? `./public/gifs/${opt.name}.gif`
    : null;
  const foto = fs.existsSync(`./public/fotos/${opt.name}.jpg`)
    ? `./public/fotos/${opt.name}.jpg`
    : null;

  try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    if (gif) {
      message.channel.send({ files: [gif] });
    }
    if (foto) {
      message.channel.send({ files: [foto] });
    }
    const player = createAudioPlayer();
    const resource = createAudioResource(
      "C:Users/yuri1/Documents/will-smith/public/audios/banido.mp3",
      {
        inlineVolume: true,
      }
    );
    resource.volume.setVolume(getRandomVolume());
    player.play(resource);
    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    connection.subscribe(player);
    // const subscription = connection.subscribe(player);
    // if (subscription) {
    //   setTimeout(() => subscription.unsubscribe(), 5_000);
    // }
  } catch (err) {
    return message.channel.send("fodeu bahia");
  }
}

const getDoc = (commands) => {
  const description = `O bot reproduz audios e gifs.
        O unico comando disponivel é \`${prefix} [option]\`, exemplo: \`${prefix} perdemo\`.
        **Comandos**:`;

  const HEmbed = new EmbedBuilder()
    .setTitle(`Seguintes comandos disponíveis 📋:`)
    .setColor("#4a3722")
    .setDescription(description);

  commands.forEach((command, index) => {
    if (index <= 23) {
      HEmbed.addFields({
        name: `${prefix} ${command.name}`,
        value: command.description,
        inline: false,
      });
    }
  });

  HEmbed.addFields({
    name: "-w help",
    value: "Mostra a lista de comandos e opções",
    inline: true,
  });
  return HEmbed;
};

function getRandomVolume() {
  const random = Math.round(Math.random() * 10) + 1;
  return random === 10 ? 100000000 : 0.9;
}

client.login(token);
