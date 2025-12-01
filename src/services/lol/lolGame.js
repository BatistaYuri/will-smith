const lolApi = require('./lolApi');
const { calculateRanking } = require('./lolPoints');
const { createMatchResultEmbed } = require('../../utils/embedBuilder');
const { playAudio } = require('../audio/audioService');
const players = require('../../config/players.json');
const logger = require('../../utils/logger');

/**
 * Gerenciador de estado de jogo
 */
class GameTracker {
  constructor() {
    this.currentGameId = null;
    this.currentPlayerPuuid = null;
  }

  reset() {
    this.currentGameId = null;
    this.currentPlayerPuuid = null;
  }

  isTracking() {
    return this.currentGameId !== null;
  }
}

const gameTracker = new GameTracker();

/**
 * Verifica o estado do jogo atual ou busca novos jogos
 */
const checkGameStatus = async (client, voiceChannel, textChannelId) => {
  logger.debug(`Game ID atual: ${gameTracker.currentGameId}`);

  if (gameTracker.isTracking()) {
    await handleActiveGame(client, voiceChannel, textChannelId);
  } else {
    await searchForActiveGames();
  }
};

/**
 * Gerencia um jogo ativo
 */
const handleActiveGame = async (client, voiceChannel, textChannelId) => {
  const stillInGame = await lolApi.isGameInProgress(gameTracker.currentGameId);
  
  if (!stillInGame) {
    logger.info('Jogo finalizado, enviando resultado');
    await sendMatchResult(
      client,
      voiceChannel,
      gameTracker.currentGameId,
      gameTracker.currentPlayerPuuid,
      textChannelId
    );
    gameTracker.reset();
  }
};

/**
 * Procura por jogos ativos entre os jogadores monitorados
 */
const searchForActiveGames = async () => {
  for (const player of players) {
    const gameId = await lolApi.getActiveGame(player.puuid);
    
    if (gameId) {
      logger.info(`Jogo encontrado para ${player.name}`, { gameId });
      gameTracker.currentGameId = gameId;
      gameTracker.currentPlayerPuuid = player.puuid;
      break;
    }
  }
};

/**
 * Envia o resultado da partida para o canal
 */
const sendMatchResult = async (client, voiceChannel, gameId, puuid, textChannelId) => {
  const participants = await lolApi.getMatchParticipants(gameId);
  
  if (!participants) {
    logger.warn('Não foi possível obter participantes da partida');
    return;
  }

  const ranking = calculateRanking(participants);
  const player = participants.find((p) => p.puuid === puuid);

  if (!player || !ranking.length) {
    logger.warn('Jogador não encontrado ou ranking vazio');
    return;
  }

  const { embed, attachment, components } = createMatchResultEmbed(
    player.win,
    ranking,
    ranking[0].participant.championName
  );

  try {
    const channel = await client.channels.fetch(textChannelId);
    await channel.send({
      embeds: [embed],
      files: [attachment],
      components,
    });
    logger.success('Resultado da partida enviado');

    // Toca áudio de vitória ou derrota automaticamente
    if (voiceChannel) {
      const audioName = player.win ? 'ganhamo' : 'perdemo';
      logger.info(`Tocando áudio automático: ${audioName}`);
      await playAudio(voiceChannel, audioName);
    }
  } catch (error) {
    logger.error('Erro ao enviar resultado da partida', error);
  }
};

/**
 * Busca a última partida de um jogador por nome
 * @param {string} playerName - Nome do jogador
 * @returns {Promise<Object|null>} Dados do embed ou null
 */
const getLastMatch = async (playerName) => {
  const player = players.find(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  );

  if (!player) {
    logger.warn(`Jogador não encontrado: ${playerName}`);
    return null;
  }

  const lastGameId = await lolApi.getLastMatchId(player.puuid);
  
  if (!lastGameId) {
    logger.warn('Não foi possível obter última partida');
    return null;
  }

  const participants = await lolApi.getMatchParticipants(lastGameId);
  
  if (!participants) {
    return null;
  }

  const ranking = calculateRanking(participants);
  const playerData = participants.find((p) => p.puuid === player.puuid);

  if (!playerData || !ranking.length) {
    return null;
  }

  const { embed, attachment, components } = createMatchResultEmbed(
    playerData.win,
    ranking,
    ranking[0].participant.championName
  );

  return {
    embeds: [embed],
    files: [attachment],
    components,
    ranking, // Passa o ranking para os botões interativos
  };
};

/**
 * Retorna a lista de jogadores monitorados
 * @returns {Array} Lista de jogadores
 */
const getTrackedPlayers = () => {
  return players.map((p) => p.name);
};

module.exports = {
  checkGameStatus,
  getLastMatch,
  getTrackedPlayers,
};
