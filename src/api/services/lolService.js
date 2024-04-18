const lolExService = require("./lolExService");
const players = require("../../config/contaslol.json");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
let gameId; //BR1_2795172318
let playerPuuid; // pFQQ_7hEMwy22IY8KsfPsNDrQZiFEW2YioJiTVwzVP0mVMIesP5ILHsoJuF2dUusQ70AAzlbeIvKxw
let clientDisc;

async function lol(client, channelVoice, channelTextId) {
  clientDisc = client;
  console.log("gameId = " + gameId);
  if (gameId) {
    const stillInGame = await lolExService.stillInGame(gameId);
    if (!stillInGame) {
      sendMessage(gameId, playerPuuid, channelTextId);
      gameId = null;
    }
  } else {
    for (const player of players) {
      const gameIdPlayer = await lolExService.getGame(player.puuid);
      if (gameIdPlayer) {
        gameId = gameIdPlayer;
        playerPuuid = player.puuid;
        break;
      }
    }
  }
}

async function getLastGame(playerName) {
  const player = players.find((player) => player.name == playerName);
  if (player) {
    const lastGameId = await lolExService.getLastGameParticipants(player.puuid);
    return sendMessageTest(lastGameId, player.puuid);
  }
}

async function sendMessageTest(lastGameId, puuid) {
  const participants = await lolExService.getParticipants(lastGameId);
  if (participants) {
    const participant = participants.find(
      (participant) => participant.puuid == puuid
    );
    const points = getPoints(participants);
    playerPuuid = null;
    if (participant && points) {
      const gif = participant.win ? `ganhamo.gif` : `perdemo.gif`;
      const attachment = new AttachmentBuilder(`./public/gifs/${gif}`, {
        name: gif,
      });
      const embed = new EmbedBuilder()
        .setTitle(participant.win ? "VITORIA" : "DERROTA")
        .setDescription(
          `
                        1º **${points[0].participant.summonerName}** - ${points[0].total}
                        2º **${points[1].participant.summonerName}** - ${points[1].total}
                        3º **${points[2].participant.summonerName}** - ${points[2].total}
                        4º **${points[3].participant.summonerName}** - ${points[3].total}
                        5º **${points[4].participant.summonerName}** - ${points[4].total}
                        6º **${points[5].participant.summonerName}** - ${points[5].total}
                        7º **${points[6].participant.summonerName}** - ${points[6].total}
                        8º **${points[7].participant.summonerName}** - ${points[7].total}
                        9º **${points[8].participant.summonerName}** - ${points[8].total}
                        10º **${points[9].participant.summonerName}** - ${points[9].total}
                    `
        )
        //.setImage(`attachment://${gif}`)
        .setThumbnail(
          `http://ddragon.leagueoflegends.com/cdn/12.1.1/img/champion/${points[0].participant.championName}.png`
        );
      return { embeds: [embed] }; //files: [attachment]
    }
  }
}

async function sendMessage(lastGameId, puuid, channelTextId) {
  const participants = await lolExService.getParticipants(lastGameId);
  if (participants) {
    const participant = participants.find(
      (participant) => participant.puuid == puuid
    );
    const points = getPoints(participants);
    playerPuuid = null;
    if (participant && points) {
      const gif = participant.win ? `ganhamo.gif` : `perdemo.gif`;
      clientDisc.channels.fetch(channelTextId).then(async (chat) => {
        const attachment = new AttachmentBuilder(`./public/gifs/${gif}`, {
          name: gif,
        });
        const embed = new EmbedBuilder()
          .setTitle(participant.win ? "VITORIA" : "DERROTA")
          .setDescription(
            `
                        1º **${points[0].participant.summonerName}** - ${points[0].total}
                        2º **${points[1].participant.summonerName}** - ${points[1].total}
                        3º **${points[2].participant.summonerName}** - ${points[2].total}
                        4º **${points[3].participant.summonerName}** - ${points[3].total}
                        5º **${points[4].participant.summonerName}** - ${points[4].total}
                        6º **${points[5].participant.summonerName}** - ${points[5].total}
                        7º **${points[6].participant.summonerName}** - ${points[6].total}
                        8º **${points[7].participant.summonerName}** - ${points[7].total}
                        9º **${points[8].participant.summonerName}** - ${points[8].total}
                        10º **${points[9].participant.summonerName}** - ${points[9].total}
                    `
          )
          .setImage(`attachment://${gif}`)
          .setThumbnail(
            `http://ddragon.leagueoflegends.com/cdn/12.1.1/img/champion/${points[0].participant.championName}.png`
          );
        return chat.send({ embeds: [embed], files: [attachment] });
      });
    }
  }
}

function getPoints(participants) {
  let points = [];
  let maiorKDA = 0;
  let maiorDano = 0;
  let maiorParticipacao = 0;
  let maiorVisao = 0;
  let maiorDanoTorre = 0;
  let maiorCura = 0;
  let maiorShield = 0;
  let maiorTank = 0;

  participants.forEach((participant) => {
    const {
      totalDamageDealtToChampions,
      visionScore,
      damageDealtToTurrets,
      totalHealsOnTeammates,
      totalDamageShieldedOnTeammates,
      totalDamageTaken,
      kills,
      assists,
      deaths,
    } = participant;
    const participacaoAbates = kills + assists;
    const kda = participacaoAbates / (deaths == 0 ? 1 : deaths);
    maiorDano =
      totalDamageDealtToChampions > maiorDano
        ? totalDamageDealtToChampions
        : maiorDano;
    maiorVisao = visionScore > maiorVisao ? visionScore : maiorVisao;
    maiorDanoTorre =
      damageDealtToTurrets > maiorDanoTorre
        ? damageDealtToTurrets
        : maiorDanoTorre;
    maiorParticipacao =
      participacaoAbates > maiorParticipacao
        ? participacaoAbates
        : maiorParticipacao;
    maiorCura =
      totalHealsOnTeammates > maiorCura ? totalHealsOnTeammates : maiorCura;
    maiorShield =
      totalDamageShieldedOnTeammates > maiorShield
        ? totalDamageShieldedOnTeammates
        : maiorShield;
    maiorTank = totalDamageTaken > maiorTank ? totalDamageTaken : maiorTank;
    maiorKDA = kda > maiorKDA ? kda : maiorKDA;
  });

  participants.forEach((participant) => {
    const {
      totalDamageDealtToChampions,
      visionScore,
      damageDealtToTurrets,
      totalHealsOnTeammates,
      totalDamageShieldedOnTeammates,
      totalDamageTaken,
      kills,
      assists,
      deaths,
    } = participant;
    const participacaoAbates = kills + assists;
    const kdaP = participacaoAbates / (deaths == 0 ? 1 : deaths);
    let participacao = 0;
    let dano = 0;
    let kda = 0;
    let visao = 0;
    let danoTorre = 0;
    let cura = 0;
    let escudo = 0;
    let tank = 0;

    dano =
      totalDamageDealtToChampions > maiorDano
        ? 25
        : +(
            (totalDamageDealtToChampions * 25) /
            (maiorDano == 0 ? 1 : maiorDano)
          ).toFixed(2);
    visao =
      visionScore > maiorVisao
        ? 10
        : +((visionScore * 10) / (maiorVisao == 0 ? 1 : maiorVisao)).toFixed(2);
    danoTorre =
      damageDealtToTurrets > maiorDanoTorre
        ? 10
        : +(
            (damageDealtToTurrets * 10) /
            (maiorDanoTorre == 0 ? 1 : maiorDanoTorre)
          ).toFixed(2);
    participacao =
      participacaoAbates > maiorParticipacao
        ? 27.5
        : +(
            (participacaoAbates * 27.5) /
            (maiorParticipacao == 0 ? 1 : maiorParticipacao)
          ).toFixed(2);
    cura =
      totalHealsOnTeammates > maiorCura
        ? 12.5
        : +(
            (totalHealsOnTeammates * 12.5) /
            (maiorCura == 0 ? 1 : maiorCura)
          ).toFixed(2);
    escudo =
      totalDamageShieldedOnTeammates > maiorShield
        ? 12.5
        : +(
            (totalDamageShieldedOnTeammates * 12.5) /
            (maiorShield == 0 ? 1 : maiorShield)
          ).toFixed(2);
    tank =
      totalDamageTaken > maiorTank
        ? 12.5
        : +(
            (totalDamageTaken * 12.5) /
            (maiorTank == 0 ? 1 : maiorTank)
          ).toFixed(2);
    kda =
      kdaP > maiorKDA
        ? 22.5
        : +((kdaP * 22.5) / (maiorKDA == 0 ? 1 : maiorKDA)).toFixed(2);

    let total =
      dano + visao + danoTorre + kda + participacao + cura + escudo + tank;
    if (participant.win) {
      total = total + 5;
    }
    total = +total.toFixed(2);
    points.push({
      participant,
      total,
      win: participant.win,
      dano,
      visao,
      danoTorre,
      kda,
      participacao,
      cura,
      escudo,
      tank,
    });
  });

  points = points.sort((a, b) => {
    if (a.total > b.total) {
      return -1;
    }
    if (a.total < b.total) {
      return 1;
    }
    return 0;
  });
  return points;
}

module.exports = {
  lol,
  getLastGame,
};
