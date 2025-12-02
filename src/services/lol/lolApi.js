const axios = require('axios');
const { riotApiKey } = require('../../config');
const { RIOT_API, ENDPOINTS } = require('../../config/constants');
const logger = require('../../utils/logger');
const { matchCache, playerCache } = require('../../utils/cache');
const { riotRateLimiter } = require('../../utils/rateLimiter');

/**
 * Cliente da API da Riot Games
 * Com cache e rate limiting
 */

const headers = {
  headers: { 'X-Riot-Token': riotApiKey },
};

/**
 * Faz uma requisição com rate limiting
 */
const makeRequest = async (url) => {
  return riotRateLimiter.execute(async () => {
    const response = await axios.get(url, headers);
    return response;
  });
};

/**
 * Busca o jogo ativo de um jogador
 * @param {string} puuid - PUUID do jogador
 * @returns {Promise<string|null>} ID do jogo ou null
 */
const getActiveGame = async (puuid) => {
  // Cache curto para jogos ativos (10 segundos)
  const cacheKey = `active_game_${puuid}`;
  const cached = playerCache.get(cacheKey);
  if (cached !== null) return cached;

  try {
    const url = `${RIOT_API.BR}${ENDPOINTS.SPECTATOR}/${puuid}`;
    const response = await makeRequest(url);
    
    if (response.status === 200 && response.data.gameId) {
      const gameId = `BR1_${response.data.gameId}`;
      playerCache.set(cacheKey, gameId, 10000); // 10 segundos
      return gameId;
    }
    playerCache.set(cacheKey, null, 10000);
    return null;
  } catch (error) {
    // 404 significa que o jogador não está em jogo (comportamento esperado)
    if (error.response?.status !== 404) {
      logger.error('Erro ao buscar jogo ativo', error.message);
    }
    playerCache.set(cacheKey, null, 10000);
    return null;
  }
};

/**
 * Verifica se um jogo ainda está em andamento
 * @param {string} gameId - ID do jogo
 * @returns {Promise<boolean>} true se ainda está em andamento
 */
const isGameInProgress = async (gameId) => {
  // Se já temos os dados da partida no cache, ela terminou
  const cacheKey = `match_${gameId}`;
  if (matchCache.has(cacheKey)) {
    return false;
  }

  try {
    const url = `${RIOT_API.AMERICAS}${ENDPOINTS.MATCH}/${gameId}`;
    const response = await makeRequest(url);
    
    // Se conseguiu buscar os dados, o jogo terminou
    if (response.status === 200) {
      // Cacheia os dados da partida
      matchCache.set(cacheKey, response.data);
      return false;
    }
    return true;
  } catch (error) {
    // Se deu erro 404, o jogo ainda está em andamento
    return true;
  }
};

/**
 * Busca os participantes de uma partida
 * @param {string} gameId - ID do jogo
 * @returns {Promise<Array|null>} Lista de participantes ou null
 */
const getMatchParticipants = async (gameId) => {
  // Verifica cache primeiro
  const cacheKey = `match_${gameId}`;
  const cached = matchCache.get(cacheKey);
  if (cached?.info?.participants) {
    logger.debug(`Cache hit para partida ${gameId}`);
    return cached.info.participants;
  }

  try {
    const url = `${RIOT_API.AMERICAS}${ENDPOINTS.MATCH}/${gameId}`;
    const response = await makeRequest(url);
    
    if (response.status === 200 && response.data?.info?.participants) {
      // Cacheia os dados da partida (5 minutos)
      matchCache.set(cacheKey, response.data);
      return response.data.info.participants;
    }
    return null;
  } catch (error) {
    logger.error('Erro ao buscar participantes da partida', error.message);
    return null;
  }
};

/**
 * Busca dados completos de uma partida
 * @param {string} gameId - ID do jogo
 * @returns {Promise<Object|null>} Dados da partida ou null
 */
const getMatchData = async (gameId) => {
  const cacheKey = `match_${gameId}`;
  const cached = matchCache.get(cacheKey);
  if (cached) {
    logger.debug(`Cache hit para dados da partida ${gameId}`);
    return cached;
  }

  try {
    const url = `${RIOT_API.AMERICAS}${ENDPOINTS.MATCH}/${gameId}`;
    const response = await makeRequest(url);
    
    if (response.status === 200 && response.data) {
      matchCache.set(cacheKey, response.data);
      return response.data;
    }
    return null;
  } catch (error) {
    logger.error('Erro ao buscar dados da partida', error.message);
    return null;
  }
};

/**
 * Busca o ID da última partida de um jogador
 * @param {string} puuid - PUUID do jogador
 * @returns {Promise<string|null>} ID da última partida ou null
 */
const getLastMatchId = async (puuid) => {
  // Sem cache - sempre busca a partida mais recente
  try {
    const url = `${RIOT_API.AMERICAS}${ENDPOINTS.MATCH_BY_PUUID}/${puuid}/ids?start=0&count=1`;
    const response = await makeRequest(url);
    
    if (response.status === 200 && response.data?.[0]) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    logger.error('Erro ao buscar última partida', error.message);
    return null;
  }
};

/**
 * Retorna estatísticas de cache e rate limiting
 */
const getApiStats = () => {
  return {
    rateLimiter: riotRateLimiter.getStats(),
    matchCache: matchCache.getStats(),
    playerCache: playerCache.getStats(),
  };
};

module.exports = {
  getActiveGame,
  isGameInProgress,
  getMatchParticipants,
  getMatchData,
  getLastMatchId,
  getApiStats,
};
