const express = require("express");
const { json } = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const { MessageEmbed, MessageAttachment } = require('discord.js');

app.use(json());
app.use(cors());
app.listen(process.env.PORT || 3333);
const data = require('./contaslol.json')
let emPartida = false
let gameId = null
let count = 0
let jogador = data.contas[count]
let Client
let matchUltimaPartida = null

exports.lol = (client, voice_channel) => {
  Client = client;
  return lol(voice_channel);
}

async function lol(voice_channel) {
  console.log('emPartida = ' + emPartida)
  if(emPartida == true){
    await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${gameId}`,
    { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    ).then((e) => {
      if (e.status == 200) {
      emPartida = false;
      getVitoria(gameId, voice_channel)
      }
    }).catch((err) => {
      
    })
  } else {
    const request = await axios
    .get(
      `https://br1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${jogador.id}`,
      { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    )
    .then((e) => {
      if (e.status == 200) {
        emPartida = true
        gameId = `BR1_${e.data.gameId}`
      }
    }).catch((err) => {
      if (emPartida == true) {
        emPartida = false
        getPartida(voice_channel)
      } else {
        //gambiarra (2 da manha, to com preguiça)
        if (count == 4) {
          count = 0
          jogador = data.contas[count]
        } else {
          count = count + 1
          jogador = data.contas[count]
        }
      }
    }
    );
  }
}

async function getPartida(voice_channel) {
  const request = await axios
    .get(
      `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${jogador.puuid}/ids?start=0&count=1`,
      { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    ).then((e) => {
      if (e.status == 200) {
        getVitoria(e.data[0], voice_channel)
      }
    }).catch((err) => {
      console.log(err)
    }
    );
}

async function getVitoria(match, voice_channel) {
  if (matchUltimaPartida != match) {
    matchUltimaPartida = match
    const request = await axios
      .get(
        `https://americas.api.riotgames.com/lol/match/v5/matches/${match}`,
        { headers: { "X-Riot-Token": process.env.LOL_KEY } }
      ).then((e) => {
        if (e.status == 200) {
          participante = e.data.info.participants.find(participante => participante.puuid == jogador.puuid)
          let jogadores = []
          e.data.metadata.participants.forEach(participantePuuid => {
            let player = data.contas.find(jogadori => participantePuuid == jogadori.puuid)
            if (player) {
              jogadores.push(player.discord)
            }
          })
          let mvps = getMVP(e.data, participante.win)
          audio(voice_channel, jogadores, mvps, participante.win)
        }
      })
  }
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

  let maiorKDA = 0
  let maiorDano = 0
  let maiorParticipacao = 0
  let maiorVisao = 0
  let maiorDanoTorre = 0
  //sup
  let maiorCura = 0
  let maiorShield = 0
  let maiorTank = 0

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
    participante.participacaoAbates = participante.kills + participante.assists
    if (participante.participacaoAbates > maiorParticipacao) {
      maiorParticipacao = participante.participacaoAbates
    }
    participante.kda = (participante.kills + participante.assists) / (participante.deaths == 0 ? 1 : participante.deaths) 
    if (participante.kda > maiorKDA) {
      maiorKDA = participante.kda
    }
    //if(participante.individualPosition == 'UTILITY'){
      if (participante.totalHealsOnTeammates > maiorCura) {
        maiorCura = participante.totalHealsOnTeammates
      }
      if (participante.totalDamageShieldedOnTeammates > maiorShield) {
        maiorShield = participante.totalDamageShieldedOnTeammates
      }
      if (participante.totalDamageTaken > maiorTank) {
        maiorShield = participante.totalDamageTaken
      }
    //}
  })

  let pontos = []
  data.info.participants.forEach(jogador => {
    let participacaoAbates = 0 // 27,5
    let dano = 0 // 25
    let kda = 0 // 22,5
    let visao = 0 // 10
    let danoTorre = 0 // 10
    // sup
    let cura = 0 // 12,5
    let escudo = 0 // 12,5
    let tank = 0 // 12,5

    if (jogador.participacaoAbates > maiorParticipacao) {
      participacaoAbates = 27.5
    } else {
      participacaoAbates = (jogador.participacaoAbates * 27.5) / (maiorParticipacao == 0 ? 1 : maiorParticipacao)
      participacaoAbates = +participacaoAbates.toFixed(2);
    }

    if (jogador.totalDamageDealtToChampions > maiorDano) {
      dano = 25
    } else {
      dano = (jogador.totalDamageDealtToChampions * 25) / (maiorDano == 0 ? 1 : maiorDano)
      dano = +dano.toFixed(2);
    }

    if (jogador.kda > maiorKDA) {
      kda = 22.5
    } else {
      kda = (jogador.kda * 22.5) / (maiorKDA == 0 ? 1 : maiorKDA)
      kda = +kda.toFixed(2);
    }

    if (jogador.visionScore > maiorVisao) {
      visao = 10
    } else {
      visao = (jogador.visionScore * 10) / (maiorVisao == 0 ? 1 : maiorVisao)
      visao = +visao.toFixed(2);
    }

    if (jogador.damageDealtToTurrets > maiorDanoTorre) {
      danoTorre = 10
    } else {
      danoTorre = (jogador.damageDealtToTurrets * 10) / (maiorDanoTorre == 0 ? 1 : maiorDanoTorre)
      danoTorre = +danoTorre.toFixed(2);
    }

    //if(jogador.individualPosition == 'UTILITY'){
      if (jogador.totalHealsOnTeammates > maiorCura) {
        cura = 12.5
      } else {
        cura = (jogador.totalHealsOnTeammates * 12.5) /  (maiorCura == 0 ? 1 : maiorCura)
        cura = +cura.toFixed(2);
      }
      if (jogador.totalDamageShieldedOnTeammates > maiorShield) {
        escudo = 12.5
      } else {
        escudo = (jogador.totalDamageShieldedOnTeammates * 12.5) /  (maiorShield == 0 ? 1 : maiorShield)
        escudo = +escudo.toFixed(2);
      }
      if (jogador.totalDamageTaken > maiorTank) {
        tank = 12.5
      } else {
        tank = (jogador.totalDamageTaken * 12.5) /  (maiorTank == 0 ? 1 : maiorTank)
        tank = +tank.toFixed(2);
      }
    //}

    let total = dano + visao + danoTorre + kda + participacaoAbates + cura + escudo + tank
    if (jogador.win) {
      total = total + 5
    }
    total = +total.toFixed(2);
    pontos.push(
      { jogador: jogador,
        total, 
        win: jogador.win, 
        dano, 
        visao, 
        danoTorre, 
        kda, 
        participacaoAbates, 
        cura, 
        escudo, 
        tank }
        )

  })

  let mvp = { total: 0 }
  let inverso = { total: 0 }
  pontos.forEach(ponto => {

    if (ponto.win) {
      if (ponto.total > mvp.total) {
        mvp = ponto
      }
    }

    if (!ponto.win) {
      if (ponto.total < inverso.total || inverso.total == 0) {
        inverso = ponto
      }
    }
  })
  pontos = pontos.sort((a, b) => {
    if(a.total > b.total){
      return -1;
    }
    if(a.total < b.total){
      return 1;
    }
    return 0;
  })
  return { mvp, inverso, pontos }
}


async function audio(voice_channel, jogadores, mvps, win) {
  let mamadores = []
  //gambiarra, pq sou um inutil, find() não funciou por algum motivo vsf javascripto
  Client.users.cache.forEach(user => {
    jogadores.forEach(jogador => {
      if (jogador == user.username) {
        mamadores.push(`<@${user.id}>`)
      }
    })
  })

  //const connection = await voice_channel.join();
  //let audio = win ? `./audios/ganhamo.mp3` : `./audios/perdemo.mp3`
  //const dispatcher = connection.play(audio, { volume: getRandomVolume() });
  //dispatcher.on('finish', (k) => {
  //  voice_channel.leave();
  //});

  let gif = win ? `ganhamo.gif` : `perdemo.gif`
  Client.channels.fetch("958513274238935100").then(async geral => {
    const attachment = new MessageAttachment(`./gifs/${gif}`, gif);
    const embed = new MessageEmbed()
      .setTitle(win ? 'VITORIA' : 'DERROTA')
      .setDescription(`
      **MVP ${mvps.pontos[0].jogador.summonerName}** - ${mvps.pontos[0].total}
        2º **${mvps.pontos[1].jogador.summonerName}** - ${mvps.pontos[1].total}
        3º **${mvps.pontos[2].jogador.summonerName}** - ${mvps.pontos[2].total}
        4º **${mvps.pontos[3].jogador.summonerName}** - ${mvps.pontos[3].total}
        5º **${mvps.pontos[4].jogador.summonerName}** - ${mvps.pontos[4].total}
        6º **${mvps.pontos[5].jogador.summonerName}** - ${mvps.pontos[5].total}
        7º **${mvps.pontos[6].jogador.summonerName}** - ${mvps.pontos[6].total}
        8º **${mvps.pontos[7].jogador.summonerName}** - ${mvps.pontos[7].total}
        9º **${mvps.pontos[8].jogador.summonerName}** - ${mvps.pontos[8].total}
        10º **${mvps.pontos[9].jogador.summonerName}** - ${mvps.pontos[9].total}
      `)
      .attachFiles(attachment)
      .setImage(`attachment://${gif}`)
      .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/12.1.1/img/champion/${mvps.mvp.jogador.championName}.png`)
    return geral.send({ embed })
  })
}

function getRandomVolume() {
  const random = Math.round(Math.random() * 10) + 1;
  return random === 10 ? 100000000 : 0.9;
}