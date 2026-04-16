const lolApi = require('./lolApi');
const { calculateRanking } = require('./lolPoints');
const { normalizeMatchData } = require('./matchParser');
const {
  detectModeFromMatch,
  detectModeFromActiveGame,
  buildMatchDebugInfo,
} = require('./matchCompatibility');
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
    this.currentActiveGameContext = null;
  }

  reset() {
    this.currentGameId = null;
    this.currentPlayerPuuid = null;
    this.currentActiveGameContext = null;
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
  const gameStatus = await lolApi.isGameInProgress(
    gameTracker.currentGameId,
    gameTracker.currentPlayerPuuid
  );
  
  if (!gameStatus.inProgress) {
    if (gameStatus.hasData) {
      // Jogo terminou e tem dados disponíveis
      logger.info('Jogo finalizado, enviando resultado');
      await sendMatchResult(
        client,
        voiceChannel,
        gameTracker.currentGameId,
        gameTracker.currentPlayerPuuid,
        textChannelId
      );
    } else {
      // Jogo terminou mas sem dados (ARAM Desordem, Arena, etc)
      const activeMode = detectModeFromActiveGame(gameTracker.currentActiveGameContext);
      logger.warn('Jogo finalizado sem dados disponíveis (modo de evento)', {
        gameId: gameTracker.currentGameId,
        mode: activeMode,
        reason: gameStatus.reason,
      });
      
      // Notifica no canal de texto
      try {
        const channel = await client.channels.fetch(textChannelId);
        await channel.send(
          `⚠️ Partida finalizada sem payload completo da Riot API (${activeMode.label}). ` +
            'Vou tentar normalmente nas próximas partidas.'
        );
      } catch (error) {
        logger.error('Erro ao enviar notificação', error);
      }
    }
    gameTracker.reset();
  }
};

/**
 * Procura por jogos ativos entre os jogadores monitorados
 */
const searchForActiveGames = async () => {
  for (const player of players) {
    const activeGame = await lolApi.getActiveGame(player.puuid);
    
    if (activeGame?.gameId) {
      const activeMode = detectModeFromActiveGame(activeGame);

      logger.info(`Jogo encontrado para ${player.name}`, {
        gameId: activeGame.gameId,
        queueId: activeGame.queueId,
        gameMode: activeGame.gameMode,
        gameType: activeGame.gameType,
        mapId: activeGame.mapId,
        detectedMode: activeMode,
      });

      gameTracker.currentGameId = activeGame.gameId;
      gameTracker.currentPlayerPuuid = player.puuid;
      gameTracker.currentActiveGameContext = activeGame;
      break;
    }
  }
};

/**
 * Envia o resultado da partida para o canal
 */
const sendMatchResult = async (client, voiceChannel, gameId, puuid, textChannelId) => {
  const matchData = await lolApi.getMatchData(gameId);
  const mode = detectModeFromMatch(matchData);
  const parsedMatch = normalizeMatchData(matchData);
  
  if (!parsedMatch?.participants?.length) {
    logger.warn('Não foi possível obter participantes normalizados da partida', {
      gameId,
      mode,
      raw: buildMatchDebugInfo(matchData),
    });
    return;
  }

  const participants = parsedMatch.participants;
  const ranking = calculateRanking(participants, { modeKey: mode.key });
  const player = participants.find((p) => p.puuid === puuid);

  if (!player || !ranking.length) {
    logger.warn('Jogador não encontrado ou ranking vazio');
    return;
  }

  const { embed, attachment, components } = createMatchResultEmbed(
    player.win,
    ranking,
    ranking[0].participant.championName,
    {
      modeLabel: mode.label,
      modeReason: mode.reason,
      modeConfidence: mode.confidence,
      eventLike: mode.isEventLike,
    }
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

  const latestSupportedMatch = await lolApi.getLastSupportedMatch(player.puuid, 10);
  
  if (!latestSupportedMatch?.matchId || !latestSupportedMatch?.matchData) {
    logger.warn('Não foi possível obter uma última partida com payload suportado');
    return null;
  }

  const mode = detectModeFromMatch(latestSupportedMatch.matchData);
  const parsedMatch = normalizeMatchData(latestSupportedMatch.matchData);
  
  if (!parsedMatch?.participants?.length) {
    return null;
  }

  const participants = parsedMatch.participants;

  const ranking = calculateRanking(participants, { modeKey: mode.key });
  const playerData = participants.find((p) => p.puuid === player.puuid);

  if (!playerData || !ranking.length) {
    return null;
  }

  const { embed, attachment, components } = createMatchResultEmbed(
    playerData.win,
    ranking,
    ranking[0].participant.championName,
    {
      modeLabel: mode.label,
      modeReason: mode.reason,
      modeConfidence: mode.confidence,
      eventLike: mode.isEventLike,
    }
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
