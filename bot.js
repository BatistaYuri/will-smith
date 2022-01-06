const {
  Client: DiscordClient,
  Intents,
  MessageEmbed
} = require('discord.js');
const Client = new DiscordClient({ ws: { intents: Intents.GUILD_MESSAGES } });
const {
  prefix,
  prefixSong,
  prefixStopSong,
  token,
} = require('./config.js');
const { playSong } = require('./lib/brabaLauncher');
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
    return execute(message);
  }

  if (message.content === prefixStopSong) message.member.voice.channel.leave();
  
  if (message.content.startsWith(prefixSong)) {
    const args = message.content.split(' ');
    const url = args[1];


    await playSong(message.member.voice.channel, url);
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
      cron.schedule("* * * * *", async () => { // cron 1 minuto
       lol(alisson);
      }, {
          scheduled: true,
          timezone: "America/Sao_Paulo"
        });
    });
});

async function glub(voice_channel) {
  const connection = await voice_channel.join();
  const audios = [`./audios/glub.mp3`, `./audios/an.mp3`, `./audios/yamete.mp3`, `./audios/fdp.mp3`]
  const audio = Math.floor(Math.random() * audios.length);
  const dispatcher = connection.play(audios[audio], { volume: getRandomVolume() });
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
    [
    'ganhamo', {
      command: 'ganhamo',
      description: 'ganhamo',
      file: `${prefixAudio}/ganhamo.mp3`,
      gif: `${prefixGifs}/ganhamo.gif`
    }
  ],
    [
    'derrota', {
      command: 'derrota',
      description: 'derrota',
      file: `${prefixAudio}/derrota.mp3`,
    }
  ],
    [
    'éele', {
      command: 'éele',
      description: 'caralho will smith?',
      file: `${prefixAudio}/eele.mp3`,
    }
  ],
  [
    'machista2', {
      command: 'machista2',
      description: 'vai dirigir a cozinha',
      file: `${prefixAudio}/machista2.mp3`,
      foto: `${prefixFoto}/machista.jpg`
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
const data = require('./contaslol.json')
let emPartida = false
let count = 0
let jogador = data.contas[count]

async function lol(voice_channel){
  console.log('emPartida = ' + emPartida)
  const request = await axios
    .get(
      `https://br1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${jogador.id}`,
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
        }else{
          //gambiarra (2 da manha, to com preguiça)
          if(count == 4){
            count = 0
            jogador = data.contas[count]
          }else{
            count = count + 1
            jogador = data.contas[count]
          }
        }
    }
    );
}

async function getPartida(voice_channel){
  const request = await axios
    .get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${jogador.puuid}/ids?start=0&count=1`,
      { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    ).then((e) =>{
      if(e.status == 200){
        getVitoria(e.data[0], voice_channel)
      }
    }).catch((err) => {
        console.log(err)
    }
    );
}

async function getVitoria(match, voice_channel){
  let teamId = 0
  const request = await axios
    .get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/${match}`,
      { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    ).then((e) =>{
      if(e.status == 200){
        participante = e.data.info.participants.find(participante => participante.puuid == jogador.puuid)
        teamId = participante.teamId
        // if(participante.participantId < 6){
        //   teamId = 100
        // }else{
        //   teamId = 200
        // }
        let jogadores =[]
        e.data.metadata.participants.forEach(participantePuuid =>{
          let player = data.contas.find(jogadori => participantePuuid == jogadori.puuid)
          if(player){
            jogadores.push(player.discord)
          }
        })
        let win = e.data.info.teams.find(team => team.teamId == teamId).win
        let mvp = getMVP(e.data, win)
         if(win){
           audio(`./audios/ganhamo.mp3`, `gifs/ganhamo.gif`, voice_channel, jogadores, mvp)
         }else{
           audio(`./audios/perdemo.mp3`, `gifs/perdemo.gif`, voice_channel, jogadores, mvp)
         }
      }
    })
}

/*
todos:
totalDamageDealtToChampions -> a maior dano ganha 25 pontos, os demais ganham postos proporcionais ao maior dano
visionScore -> a maior visao ganha 10 pontos, os demais ganham postos proporcionais ao maior dano
damageDealtToTurrets -> a maior dano ganha 10 pontos, os demais ganham postos proporcionais ao maior dano
kills/deaths/assists - KDA - a maior kda 25 pontos, os demais ganham postos proporcionais ao maior dano
vitoria -> 5 pontos

todos menos suporte
totalMinionsKilled -> 100 minius a cada 10 min, calcular porcetagem, maior 10 pontos, os demais ganham postos proporcionais ao maior dano

suporte ("individualPosition": "UTILITY")
totalHealsOnTeammates ou totalDamageShieldedOnTeammates -> a maior cura ganha 15 pontos, os demais ganham postos proporcionais ao maior dano (tem q ver se curou bastante mesmo)

outros
damageSelfMitigated
*/

function getMVP(data, win) {
  let teamId = 200
  let maiorDano = 0
  let maiorVisao = 0
  let maiorDanoTorre = 0
  let maiorKDA = 0
  let maiorTotalMinions = 0
  let maiorCura = 0
  let maiorShield = 0
  let time = []
  data.info.participants.forEach(participante => {
    if (participante.totalDamageDealtToChampions > maiorDano) {
      maiorDano = participante.totalDamageDealtToChampions
    }
    if (participante.visionScore > maiorVisao) {
      maiorVisao = participante.visionScore
    }
    if (participante.damageDealtToTurrets > maiorDanoTorre) {
      maiorDanoTorre = participante.damageDealtToTurrets
    }
    if (participante.totalMinionsKilled > maiorTotalMinions) {
      maiorTotalMinions = participante.totalMinionsKilled
    }
    if (participante.totalHealsOnTeammates > maiorCura) {
      maiorCura = participante.totalHealsOnTeammates
    }
    if (participante.totalDamageShieldedOnTeammates > maiorShield) {
      maiorShield = participante.totalDamageShieldedOnTeammates
    }

    
    participante.kda = (participante.kills + participante.assists) / participante.deaths
    if (participante.kda > maiorKDA) {
      maiorKDA = participante.kda
    }
  })

  let pontos = []
  data.info.participants.forEach(jogador => {
    let dano = 0
    let visao = 0
    let danoTorre = 0
    let kda = 0
    let totalMinions = 0
    let cura = 0
    let escudo = 0

    if (jogador.totalDamageDealtToChampions > maiorDano) {
      dano = 25
    } else {
      dano = (jogador.totalDamageDealtToChampions * 25) / maiorDano
    }

    if (jogador.visionScore > maiorVisao) {
      visao = 10
    } else {
      visao = (jogador.visionScore * 10) / maiorVisao
    }

    if (jogador.damageDealtToTurrets > maiorDanoTorre) {
      danoTorre = 25
    } else {
      danoTorre = (jogador.damageDealtToTurrets * 25) / maiorDanoTorre
    }

    if (jogador.kda > maiorKDA) {
      kda = 25
    } else {
      kda = (jogador.kda * 25) / maiorKDA
    }

    if (jogador.totalMinionsKilled > maiorTotalMinions) { // não significa que farmou bem
      totalMinions = 10
    } else {
      totalMinions = (jogador.totalMinionsKilled * 10) / maiorTotalMinions
    }

    // if (jogador.totalHealsOnTeammates > maiorCura) {
    //   cura = 25
    // } else {
    //   cura = (jogador.totalHealsOnTeammates * 25) / maiorCura
    // }

    // if (jogador.totalDamageShieldedOnTeammates > maiorShield) {
    //   escudo = 25
    // } else {
    //   escudo = (jogador.totalDamageShieldedOnTeammates * 25) / maiorShield
    // }

    let total = dano + visao + danoTorre + kda + totalMinions + cura + escudo
    pontos.push({ nomeJogador: jogador.summonerName, puuidJogador: jogador.puuid, dano, visao, danoTorre, kda, totalMinions, cura, escudo, total })

  })

  let mvp = { total: 0 }
  pontos.forEach(ponto => {
      if(win){
        if (ponto.total > mvp.total) {
          mvp = ponto
        }
      } else {
        if (ponto.total < mvp.total || mvp.total == 0) {
          mvp = ponto
        }
      }
  })

  return mvp
}


async function audio(audio, gif, voice_channel, jogadores, mvp, win) {
  let mamadores = []
  //gambiarra, pq sou um inutil, find() não funciou por algum motivo vsf javascripto
  Client.users.cache.forEach(user =>{
    jogadores.forEach(jogador =>{
      if(jogador == user.username){
        mamadores.push(`<@${user.id}>`)
      }
    })
  })
  //if(voice_channel.members){
  //  voice_channel.members.forEach(member =>{
  //    jogadores.forEach(jogador =>{
  //      if(jogador == member.user.username){
  //        mamadores.push(`<@${member.user.id}>`)
  //      }
  //    })
  //  })

  const connection = await voice_channel.join();
  const dispatcher = connection.play(audio, { volume: getRandomVolume() });
  dispatcher.on('finish', (k) => {
    voice_channel.leave();
  });
  Client.channels.fetch("679831038796628048").then(async geral => {
    geral.send(mamadores.join(' '));
    geral.send(win ? `MVP: ${mvp.nomeJogador}` : `MVP inverso: ${mvp.nomeJogador}`)
    return geral.send({ files: [gif] });
  })
  }
  
//}