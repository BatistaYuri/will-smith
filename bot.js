const {
  Client: DiscordClient,
  Intents,
  MessageEmbed
} = require('discord.js');
const Client = new DiscordClient({ ws: { intents: Intents.GUILD_MESSAGES } });
const {
  prefix,
  token,
} = require('./config.js');

timeout()
async function timeout() {
  setTimeout(function () {
    if (Client.users.cache.find(user => user.bot == false)) {
      Client.guilds.cache.forEach(canal => {
        canal.widgetChannel.send('/tts glub')
        if (canal.name = 'galera de cowboy') {
          canal.members.cache.forEach(u => {
            if (u.user.bot == false) {
              glub(u)
              timeout();
            }
          })
        }
      })
    }
  }, 60000); // 60000ms = 1min
}

async function glub(u) {
  const connection = await u.voice.channel.join();
  const dispatcher = connection.play('./audios/glub.mp3', { volume: getRandomVolume() });
  dispatcher.on('finish', (k) => {
    voiceChannel.leave();
  });
}

Client.on('message', async message => {
  if (message.content.startsWith(prefix)) {
    execute(message);
  }
});

const prefixAudio = './audios';
const prefixGifs = './gifs';
const prefixFoto = './fotos';
const options = new Map([
  [
    'banido', {
      command: 'banido',
      description: 'audio e gif do banido',
      file: `${prefixAudio}/banido.mp3`,
      gif: `${prefixGifs}/banido.gif`
    }
  ],
  [
    'perdemo', {
      command: 'perdemo',
      description: 'audio e gif do perdemo',
      file: `${prefixAudio}/perdemo.mp3`,
      gif: `${prefixGifs}/perdemo.gif`
    }
  ],
  [
    'empatamo', {
      command: 'empatamo',
      description: 'audio e gif do empatamo',
      file: `${prefixAudio}/empatamo.mp3`,
      gif: `${prefixGifs}/empatamo.gif`
    }
  ],
  [
    'legal', {
      command: 'legal',
      description: 'audio e imagem do legal',
      file: `${prefixAudio}/legal.mp3`,
      foto: `${prefixFoto}/legal.jpg`
    }
  ],
  [
    'machista', {
      command: 'machista',
      description: 'finn machista',
      file: `${prefixAudio}/machista.mp3`,
      foto: `${prefixFoto}/machista.jpg`
    }
  ],
  [
    'triste', {
      command: 'triste',
      description: 'eu fico mt triste com uma noticia dessas :(',
      file: `${prefixAudio}/triste.mp3`,
      foto: `${prefixFoto}/triste.jpg`
    }
  ],
  [
    'confia', {
      command: 'confia',
      description: 'só confia',
      file: `${prefixAudio}/confia.mp3`,
      foto: `${prefixFoto}/confia.jpg`
    }
  ],
  [
    'alek', {
      command: 'alek',
      description: 'alek talking in english',
      file: `${prefixAudio}/alek.mp3`,
    }
  ],
  [
    'ohuhalek', {
      command: 'ohuhalek',
      description: 'alek destruindo na pista de danca',
      file: `${prefixAudio}/ohuhalek.mp3`,
    }
  ],
  [
    'bota', {
      command: 'bota',
      description: 'audio e gif do bota',
      file: `${prefixAudio}/bota.mp3`,
      gif: `${prefixGifs}/bota.gif`
    }
  ],
  [
    'cavalo', {
      command: 'cavalo',
      description: 'cavalo',
      file: `${prefixAudio}/cavalo.mp3`,
    }
  ],
  [
    'massachusetts', {
      command: 'massachusetts',
      description: 'massachusetts',
      file: `${prefixAudio}/massachusetts.mp3`,
    }
  ],
  [
    'etsirt', {
      command: 'etsirt',
      description: '(: sassed aiciton amu moc etsirt tm ocif ue',
      file: `${prefixAudio}/etsirt.mp3`,
      foto: `${prefixFoto}/etsirt.jpg`
    }
  ],
  [
    'oi', {
      command: 'oi',
      description: '(: oi linda, ai kawaii',
      file: `${prefixAudio}/KAWAII.mp3`,
    }
  ],
  [
    'nicolas', {
      command: 'nicolas',
      description: '(: turugudum cha cha turugu cha turuudum cha cha',
      file: `${prefixAudio}/CAGEZINHO.mp3`,
    }
  ],
  [
    'glub', {
      command: 'glub',
      description: 'glub glub',
      file: `${prefixAudio}/glub.mp3`,
    }
  ],
]);

function vazei(channel) {
  channel.send({ files: [`${prefixFoto}/saifora.jpg`] })
}

const getDoc = (commands) => {
  const description = `O bot reproduz audios e gifs.
        O unico comando disponivel é \`${prefix} [option]\`, exemplo: \`${prefix} perdemo\`.
        **Comandos**:`;

  const HEmbed = new MessageEmbed()
    .setTitle(`Seguintes comandos disponíveis 📋:`)
    .setColor('#4a3722')
    .setDescription(description);

  commands.forEach((value, key) => {
    HEmbed.addField(`${prefix} ${value.command}`, value.description, false);
  });

  HEmbed.addField('help', 'Mostra a lista de comandos e opções', true);
  return HEmbed;
};

function getRandomVolume() {
  const random = Math.round(Math.random() * 10) + 1;
  return random === 10 ? 100000000 : 0.9;
}

async function execute(message) {
  const args = message.content.split(' ');
  const option = args[1];

  if (!option || option === 'help') {
    const embed = getDoc(options);
    return message.channel.send({ split: true, embed });
  }

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.channel.send('entra no channel desgraça')
  }

  const permissions = voiceChannel.permissionsFor(message.client.user);
  const opt = options.get(option);

  if (!opt) {
    return message.channel.send('opção n existe')
  }

  const audio = opt.file;
  const gif = opt.gif;
  const foto = opt.foto;
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

Client.login(token);
