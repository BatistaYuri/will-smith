const express = require("express");
const { json } = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const { MessageEmbed, MessageAttachment } = require('discord.js');

app.use(json());
app.use(cors());
app.listen(process.env.PORT || 3333);
const data = require('../configs/contaslol.json')
const headers = { headers: { "X-Riot-Token": process.env.LOL_KEY } };
let emPartida = false
let gameId = null
let count = 0
let jogador = data.contas[count]
let matchUltimaPartida = null
let clientDisc;

exports.lol = (client) => {
    clientDisc = client;
    return lol();
}

exports.getUltimaPartidaJogador = (client, nomeJogador) => {
    clientDisc = client;
    return getUltimaPartidaJogador(nomeJogador);
}

async function lol() {
    console.log('emPartida = ' + emPartida)
    if(emPartida == true){
        await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${gameId}`, headers).then((e) => {
            if (e.status == 200) {
                emPartida = false;
                getPartida(gameId)
            }
        }).catch((err) => {})
    } else {
        await axios.get(`https://br1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${jogador.id}`, headers).then((e) => {
            if (e.status == 200) {
                emPartida = true
                gameId = `BR1_${e.data.gameId}`
            }
        }).catch((err) => {
            if (count == 4) {
                count = 0
                jogador = data.contas[count]
            } else {
                count = count + 1
                jogador = data.contas[count]
            }
        }
        );
    }
}

async function getPartida(match, conta) {
    const jogadorT = conta || jogador;
    const comando = conta ? true : matchUltimaPartida != match;
    if (comando) {
        matchUltimaPartida = match
        await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${match}`, headers).then((e) => {
            if (e.status == 200) {
                participante = e.data.info.participants.find(participante => participante.puuid == jogadorT.puuid)
                let pontos = getPontos(e.data)
                let gif = participante.win ? `ganhamo.gif` : `perdemo.gif`
                clientDisc.channels.fetch("958513274238935100").then(async geral => {
                  const attachment = new MessageAttachment(`../assets/gifs/${gif}`, gif);
                  const embed = new MessageEmbed()
                    .setTitle(participante.win ? 'VITORIA' : 'DERROTA')
                    .setDescription(`
                    **MVP ${pontos[0].jogador.summonerName}** - ${pontos[0].total}
                      2º **${pontos[1].jogador.summonerName}** - ${pontos[1].total}
                      3º **${pontos[2].jogador.summonerName}** - ${pontos[2].total}
                      4º **${pontos[3].jogador.summonerName}** - ${pontos[3].total}
                      5º **${pontos[4].jogador.summonerName}** - ${pontos[4].total}
                      6º **${pontos[5].jogador.summonerName}** - ${pontos[5].total}
                      7º **${pontos[6].jogador.summonerName}** - ${pontos[6].total}
                      8º **${pontos[7].jogador.summonerName}** - ${pontos[7].total}
                      9º **${pontos[8].jogador.summonerName}** - ${pontos[8].total}
                      10º **${pontos[9].jogador.summonerName}** - ${pontos[9].total}
                    `)
                    .attachFiles(attachment)
                    .setImage(`attachment://${gif}`)
                    .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/12.1.1/img/champion/${pontos[0].jogador.championName}.png`)
                  return geral.send({ embed })

                })
            }
        })
    }
}

function getPontos(data) {
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
    pontos.push({ 
        jogador: jogador,
        total, 
        win: jogador.win, 
        dano, 
        visao, 
        danoTorre, 
        kda, 
        participacaoAbates, 
        cura, 
        escudo, 
        tank })

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
  return pontos
}

async function getUltimaPartidaJogador(nomeJogador) {
    const conta = data.contas.find((conta) => conta.name == nomeJogador)
    if(conta){
        await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${conta.puuid}/ids?start=0&count=1`, headers).then((e) => {
            if (e.status == 200) {
                getPartida(e.data[0], conta)
            }
        }).catch((err) => {
            console.log(err)
        });
    }
}