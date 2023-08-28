const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
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
  voiceId,
} = require("./config/config.js");
const { playSong } = require("./api/brabaLauncher.js");
require("dotenv").config();
const commands = require("./config/commands.json");
const fs = require("fs");
const cron = require("node-cron");
const lolService = require("./api/services/lolService.js");
const fpsService = require("./api/services/fpsService.js");

client.on("ready", () => {
  console.log("Connected");
  client.channels.fetch(voiceId).then(async (voice_channel) => {
    cron.schedule(
      "*/10 * * * * *",
      async () => {
        lolService.lol(client, voice_channel);
      },
      {
        scheduled: true,
        timezone: "America/Sao_Paulo",
      }
    );
  });
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
  } else if (opt.name == "lol") {
    return lolService.getLastGame(client, args[2]);
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
