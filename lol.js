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
  const request = await axios
    .get(
      `https://br1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${jogador.id}`,
      { headers: { "X-Riot-Token": process.env.LOL_KEY } }
    )
    .then((e) => {
      if (e.status == 200) {
        emPartida = true
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

  let maiorDano = 0
  let maiorVisao = 0
  let maiorDanoTorre = 0
  let maiorKDA = 0
  let maiorTotalMinions = 0
  let maiorCura = 0
  let maiorShield = 0
  let maiorParticipacao = 0

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

    participante.participacaoAbates = participante.kills + participante.assists
    if (participante.participacaoAbates > maiorParticipacao) {
      maiorParticipacao = participante.participacaoAbates
    }

    participante.kda = (participante.kills + participante.assists) / (participante.deaths == 0 ? 1 : participante.deaths) 
    if (participante.kda > maiorKDA) {
      maiorKDA = participante.kda
    }
  })

  let pontos = []
  data.info.participants.forEach(jogador => {
    let dano = 0 // 25
    let visao = 0 // 10
    let danoTorre = 0 // 10
    let kda = 0 // 35
    let totalMinions = 0 // 10
    let participacaoAbates = 0 // 25
    let cura = 0 // 15
    let escudo = 0 // 15

    if (jogador.totalDamageDealtToChampions > maiorDano) {
      dano = 25
    } else {
      dano = (jogador.totalDamageDealtToChampions * 25) / (maiorDano == 0 ? 1 : maiorDano)
    }

    if (jogador.visionScore > maiorVisao) {
      visao = 10
    } else {
      visao = (jogador.visionScore * 10) / (maiorVisao == 0 ? 1 : maiorVisao)
    }

    if (jogador.damageDealtToTurrets > maiorDanoTorre) {
      danoTorre = 10
    } else {
      danoTorre = (jogador.damageDealtToTurrets * 10) / (maiorDanoTorre == 0 ? 1 : maiorDanoTorre)
    }

    if (jogador.kda > maiorKDA) {
      kda = 35
    } else {
      kda = (jogador.kda * 35) / (maiorKDA == 0 ? 1 : maiorKDA)
    }

    if (jogador.participacaoAbates > maiorParticipacao) {
      participacaoAbates = 25
    } else {
      participacaoAbates = (jogador.participacaoAbates * 25) / (maiorParticipacao == 0 ? 1 : maiorParticipacao)
    }

    if (jogador.totalMinionsKilled > maiorTotalMinions) {
      totalMinions = 10
    } else {
      totalMinions = (jogador.totalMinionsKilled * 10) / (maiorTotalMinions == 0 ? 1 : maiorTotalMinions)
    }

    if (jogador.totalHealsOnTeammates > maiorCura) {
      cura = 15
    } else {
      cura = (jogador.totalHealsOnTeammates * 15) / maiorCura
    }

    // if (jogador.totalDamageShieldedOnTeammates > maiorShield) {
    //   escudo = 15
    // } else {
    //   escudo = (jogador.totalDamageShieldedOnTeammates * 15) / (maiorShield == 0 ? 1 : maiorShield)
    // }

    let total = dano + visao + danoTorre + kda + participacaoAbates + totalMinions + cura + escudo
    if (jogador.win) {
      total = total + 5
    }
    pontos.push({ jogador: jogador, total, win: jogador.win })

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
  return { mvp, inverso }
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

  const connection = await voice_channel.join();
  let audio = win ? `./audios/ganhamo.mp3` : `./audios/perdemo.mp3`
  const dispatcher = connection.play(audio, { volume: getRandomVolume() });
  dispatcher.on('finish', (k) => {
    voice_channel.leave();
  });

  let gif = win ? `ganhamo.gif` : `perdemo.gif`
  Client.channels.fetch("958513274238935100").then(async geral => {
    const attachment = new MessageAttachment(`./gifs/${gif}`, gif);
    const embed = new MessageEmbed()
      .setTitle(win ? 'VITORIA' : 'DERROTA')
      .setDescription(`MVP: **${mvps.mvp.jogador.summonerName}**
      MVP Inverso: **${mvps.inverso.jogador.summonerName}**`)
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