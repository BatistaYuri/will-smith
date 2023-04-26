const { Client: DiscordClient, Intents, MessageEmbed } = require('discord.js');
const Client = new DiscordClient({ ws: { intents: Intents.GUILD_MESSAGES } });
const { prefix, prefixSong, prefixStopSong, token } = require('./config/config.js');
const { playSong } = require('./api/brabaLauncher.js');
require("dotenv").config();
const commands = require('./config/commands.json');
const fs = require('fs');
const cron = require("node-cron");
const lolService = require('./api/services/lolService.js')
const fpsService = require('./api/services/fpsService.js')

Client.on('ready', () => {
  console.log('Connected');
  Client.channels.fetch("679831039522373635")
    .then(async voice_channel => {
      cron.schedule("*/10 * * * * *", async () => {
        lolService.lol(Client, voice_channel)
      }, {
          scheduled: true,
          timezone: "America/Sao_Paulo"
        });
    });
});

Client.on('message', async message => {
  if (message.content.startsWith(prefix)) {
    return execute(message);
  }

  if (message.content === prefixStopSong) message.member.voice.channel.leave();

  if (message.content.startsWith(prefixSong)) {
    const args = message.content.split(' ');
    const url = args[1];

    await playSong(message.member.voice.channel, url);
  }
});

async function execute(message) {
  const args = message.content.split(' ');
  const option = args[1];

  if (!option || option === 'help') {
    const embed = getDoc(commands);
    return message.channel.send({ split: true, embed });
  }

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.channel.send('entra no channel desgraça')
  }

  const permissions = voiceChannel.permissionsFor(message.client.user);
  const opt = commands.find(command => command.name == option);

  if (!opt) {
    return message.channel.send('opção não existe')
  } else if (opt.name == 'fps') {
    return fpsService.fps(voiceChannel)
  } else if (opt.name == 'stop') {
    return fpsService.stop(voiceChannel)
  } else if(opt.name == 'lol') {
    return lolService.getLastGame(Client, args[2])
  }

  const audio = fs.existsSync(`./audios/${opt.name}.mp3`) ? `./audios/${opt.name}.mp3` : null;
  const gif = fs.existsSync(`./gifs/${opt.name}.gif`) ? `./gifs/${opt.name}.gif` : null;
  const foto = fs.existsSync(`./fotos/${opt.name}.jpg`) ? `./fotos/${opt.name}.jpg` : null;

  try {
    const connection = await voiceChannel.join();
    if (gif) {
      message.channel.send({ files: [gif] });
    }
    if (foto) {
      message.channel.send({ files: [foto] });
    }
    const timeout = gif || foto ? 2500 : 0;
    setTimeout(() => {
      const dispatcher = connection.play(audio, { volume: getRandomVolume() });
      dispatcher.on('finish', (k) => {
        voiceChannel.leave();
      });
    }, timeout)

  } catch (err) {
    voiceChannel.leave();
    return message.channel.send('fodeu bahia');
  }

}

const getDoc = (commands) => {
  const description = `O bot reproduz audios e gifs.
        O unico comando disponivel é \`${prefix} [option]\`, exemplo: \`${prefix} perdemo\`.
        **Comandos**:`;

  const HEmbed = new MessageEmbed()
    .setTitle(`Seguintes comandos disponíveis 📋:`)
    .setColor('#4a3722')
    .setDescription(description);

  commands.forEach(command => {
    HEmbed.addField(`${prefix} ${command.name}`, command.description, false);
  });

  HEmbed.addField('help', 'Mostra a lista de comandos e opções', true);
  return HEmbed;
};

function getRandomVolume() {
  const random = Math.round(Math.random() * 10) + 1;
  return random === 10 ? 100000000 : 0.9;
}

Client.login(token);
