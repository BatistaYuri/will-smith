const lolExService = require('./lolExService')
const players = require('../../config/contaslol.json')
const { chatId } = require('../../config/config');
let gameId = null;
let player = null;
let clientDisc;

async function lol(client) {
    clientDisc = client;
    console.log('gameId = ' + gameId)
    if(gameId){
        const stillInGame = await lolExService.stillInGame(gameId);
        if(!stillInGame) {
            sendMessage(gameId)
            gameId = null;
        } 
    } else {
    players.some(async player => {
        const gameIdPlayer = await lolExService.getGame(player.id);
        if (gameIdPlayer) {
            gameId = gameIdPlayer;
            player = player;
            return true;
        } 
    });
    }
}

async function getLastGame(client, playerName) {
    clientDisc = client;
    const player = players.find((player) => player.name == playerName)
    if(player){
        const lastGameId = await lolExService.getLastGameParticipants(player.puuid);
        if(participants) sendMessage(lastGameId)
    }
}


async function sendMessage(lastGameId) {
    const participants = await lolExService.getParticipants(lastGameId)
    if(participants){
        const participant = participants.find(participant => participant.puuid == player.puuid)
        const points = getPoints(participants);
        player = null
        if(participant && points){
            const gif = participant.win ? `ganhamo.gif` : `perdemo.gif`
            clientDisc.channels.fetch(chatId).then(async chat => {
                const attachment = new MessageAttachment(`../../../public/gifs/${gif}`, gif);
                const embed = new MessageEmbed()
                    .setTitle(participant.win ? 'VITORIA' : 'DERROTA')
                    .setDescription(`
                        1º **${pontos[0].jogador.summonerName}** - ${pontos[0].total}
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
                return chat.send({ embed })
            })
        }
    }
}

function getPoints(participants) {
    let points = []
    let maiorKDA = 0
    let maiorDano = 0
    let maiorParticipacao = 0
    let maiorVisao = 0
    let maiorDanoTorre = 0
    let maiorCura = 0
    let maiorShield = 0
    let maiorTank = 0
    
    participants.forEach(participant => {
        const { 
            totalDamageDealtToChampions, 
            visionScore, 
            damageDealtToTurrets, 
            participacaoAbates, 
            totalHealsOnTeammates, 
            totalDamageShieldedOnTeammates, 
            totalDamageTaken,
            kills,
            assists,
            deaths 
        } = participant;
        const kda = (kills + assists) / (deaths == 0 ? 1 : deaths) 
        maiorDano = totalDamageDealtToChampions > maiorDano ? totalDamageDealtToChampions : maiorDano;
        maiorVisao = visionScore > maiorVisao ? visionScore : maiorVisao;
        maiorDanoTorre = damageDealtToTurrets > maiorDanoTorre ? damageDealtToTurrets : maiorDanoTorre;
        maiorParticipacao = participacaoAbates > maiorParticipacao ? participacaoAbates : maiorParticipacao;
        maiorCura = totalHealsOnTeammates > maiorCura ? totalHealsOnTeammates : maiorCura;
        maiorShield = totalDamageShieldedOnTeammates > maiorShield ? totalDamageShieldedOnTeammates : maiorShield;
        maiorTank = totalDamageTaken > maiorTank ? totalDamageTaken : maiorTank;
        maiorKDA = kda > maiorKDA ? kda : maiorKDA;
    })

    participants.forEach(participant => {
        const { 
            totalDamageDealtToChampions, 
            visionScore, 
            damageDealtToTurrets, 
            participacaoAbates, 
            totalHealsOnTeammates, 
            totalDamageShieldedOnTeammates, 
            totalDamageTaken,
            kills,
            assists,
            deaths 
        } = participant;
        const kdaP = (kills + assists) / (deaths == 0 ? 1 : deaths) 
        let participacao = 0;
        let dano = 0;
        let kda = 0;
        let visao = 0;
        let danoTorre = 0;
        let cura = 0;
        let escudo = 0;
        let tank = 0;

        dano = totalDamageDealtToChampions > maiorDano ? 25 : +((totalDamageDealtToChampions * 25) / (maiorDano == 0 ? 1 : maiorDano)).toFixed(2);
        visao = visionScore > maiorDano ? 10 : +((visionScore * 10) / (maiorVisao == 0 ? 1 : maiorVisao)).toFixed(2);
        danoTorre = damageDealtToTurrets > maiorDano ? 10 : +((damageDealtToTurrets * 10) / (maiorDanoTorre == 0 ? 1 : maiorDanoTorre)).toFixed(2);
        participacao = participacaoAbates > maiorDano ? 27.5 : +((participacaoAbates * 27.5) / (maiorParticipacao == 0 ? 1 : maiorParticipacao)).toFixed(2);
        cura = totalHealsOnTeammates > maiorDano ? 12.5 : +((totalHealsOnTeammates * 12.5) / (maiorCura == 0 ? 1 : maiorCura)).toFixed(2);
        escudo = totalDamageShieldedOnTeammates > maiorDano ? 12.5 : +((totalDamageShieldedOnTeammates * 12.5) / (maiorShield == 0 ? 1 : maiorShield)).toFixed(2);
        tank = totalDamageTaken > maiorDano ? 12.5 : +((totalDamageTaken * 12.5) / (maiorTank == 0 ? 1 : maiorTank)).toFixed(2);
        kda = kdaP > maiorDano ? 22.5 : +((kdaP * 22.5) / (maiorKDA == 0 ? 1 : maiorKDA)).toFixed(2);

        const total = dano + visao + danoTorre + kda + participacao + cura + escudo + tank
        if (participant.win) {
            total = total + 5
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
            tank 
        })
    })

    points = points.sort((a, b) => {
        if(a.total > b.total){
            return -1;
        }
        if(a.total < b.total){
            return 1;
        }
        return 0;
    })
    return points;
};

module.exports = {
    lol,
    getLastGame
};