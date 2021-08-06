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
const cron = require("node-cron");
const express = require("express");
const { json } = require("express");
require("dotenv").config();
const axios = require("axios");
const cors = require("cors");
const app = express();

//-----------------------------------//

//-----------------------------------//

Client.on('message', async message => {
  if (message.content.startsWith(prefix)) {
    execute(message);
  }
});

Client.on('ready', () => {
  console.log('Connected');
  Client.channels.fetch("679831039522373635")
    .then(async alisson => {
      cron.schedule("*/30 * * * * ", async () => {
        glub(alisson);
      }, {
          scheduled: true,
          timezone: "America/Sao_Paulo"
        });
    });
  Client.channels.fetch("679831039522373635")
    .then(async alisson => {
      cron.schedule("*/10 * * * * * ", async () => {
        lol(alisson);
      }, {
          scheduled: true,
          timezone: "America/Sao_Paulo"
        });
    });
});

async function glub(voice_channel) {
  const connection = await voice_channel.join();
  const dispatcher = connection.play(`./audios/glub.mp3`, { volume: getRandomVolume() });
  dispatcher.on('finish', (k) => {
    voice_channel.leave();
  });
}

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
  [
    'an', {
      command: 'an',
      description: 'ãn',
      file: `${prefixAudio}/an.mp3`,
    }
  ],
  [
    'yamete', {
      command: 'yamete',
      description: 'yamete Kudasai',
      file: `${prefixAudio}/yamete.mp3`,
    }
  ],
  [
    'fdp', {
      command: 'fdp',
      description: 'iiui',
      file: `${prefixAudio}/fdp.mp3`,
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

//-----------------------LOL-----------------------//

app.use(json());
app.use(cors());true
app.listen(process.env.PORT || 3333);
let emPartida = false

async function lol(voice_channel){
  console.log('emPartida = ' + emPartida)
  const request = await axios
    .get(
      `https://br1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/-cmAZPGDptxynWp7-PBmSoilLc_fJbqAvS9XrAdovkX2bA`,
      { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    )
    .then((e) => {
      if(e.status == 200){
        emPartida = true 
      }
    }).catch((err) => {
        if(emPartida == true){
          emPartida = false
          getPartida(voice_channel)
        } 
    }
    );
}

async function getPartida(voice_channel){
  const request = await axios
    .get(
      `https://br1.api.riotgames.com/lol/match/v4/matchlists/by-account/hPUjLayREAsin3ZzDGTSrShVJPqBc8_G5ws4Wf3_bXjnlf0`,
      { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    ).then((e) =>{
      if(e.status == 200){
        getVitoria(e.data.matches[0].gameId, voice_channel)
      }
    })
}

async function getVitoria(gameId, voice_channel){
  let teamId = 0
  const request = await axios
    .get(
      `https://br1.api.riotgames.com/lol/match/v4/matches/${gameId}`,
      { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    ).then((e) =>{
      if(e.status == 200){
        participante = e.data.participantIdentities.find(participante => participante.player.summonerName == "Baixo")
        if(participante.participantId < 6){
          teamId = 100
        }else{
          teamId = 200
        }
        let win = e.data.teams.find(team => team.teamId == teamId).win
        if(win == "Win"){
          empatamo(voice_channel)
        }else{
          perdemo(voice_channel)
        }
      }
    })
}

async function perdemo(voice_channel) {
  const connection = await voice_channel.join();
  const dispatcher = connection.play(`./audios/perdemo.mp3`, { volume: getRandomVolume() });
  dispatcher.on('finish', (k) => {
    voice_channel.leave();
  });
}

async function empatamo(voice_channel) {
  const connection = await voice_channel.join();
  const dispatcher = connection.play(`./audios/empatamo.mp3`, { volume: getRandomVolume() });
  dispatcher.on('finish', (k) => {
    voice_channel.leave();
  });
}




