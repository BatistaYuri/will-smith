const { RIOT_API, ENDPOINTS } = require('../../config/constants');
const logger = require('../../utils/logger');
const { matchCache, playerCache } = require('../../utils/cache');
const { riotRateLimiter } = require('../../utils/rateLimiter');

/**
 * Cliente da API da Riot Games
 * Com cache e rate limiting
 */

let axiosClient = null;

const getAxios = () => {
  if (!axiosClient) {
    axiosClient = require('axios');
  }
  return axiosClient;
};

const getRiotApiKey = () => {
  if (process.env.LOL_KEY) {
    return process.env.LOL_KEY;
  }

  try {
    return require('../../config').riotApiKey;
  } catch (_error) {
    return null;
  }
};

const getHeaders = () => {
  const riotApiKey = getRiotApiKey();
  return {
    headers: { 'X-Riot-Token': riotApiKey || '' },
  };
};

/**
 * Faz uma requisição com rate limiting
 */
const makeRequest = async (url) => {
  return riotRateLimiter.execute(async () => {
    const response = await getAxios().get(url, getHeaders());
    return response;
  });
};

const extractActiveGameContext = (data) => ({
  gameId: data?.gameId ? `BR1_${data.gameId}` : null,
  queueId: data?.gameQueueConfigId ?? null,
  gameMode: data?.gameMode ?? null,
  gameType: data?.gameType ?? null,
  mapId: data?.mapId ?? null,
});

/**
 * Busca o jogo ativo de um jogador
 * @param {string} puuid - PUUID do jogador
 * @returns {Promise<Object|null>} Contexto do jogo ativo ou null
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
      const activeGameContext = extractActiveGameContext(response.data);
      playerCache.set(cacheKey, activeGameContext, 10000); // 10 segundos
      return activeGameContext;
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
 * @param {string} puuid - PUUID do jogador (para verificar na Spectator API)
 * @returns {Promise<{inProgress: boolean, hasData: boolean, reason?: string}>} Status do jogo
 */
const isGameInProgress = async (gameId, puuid = null) => {
  // Se já temos os dados da partida no cache, ela terminou com dados
  const cacheKey = `match_${gameId}`;
  if (matchCache.has(cacheKey)) {
    return { inProgress: false, hasData: true };
  }

  try {
    const url = `${RIOT_API.AMERICAS}${ENDPOINTS.MATCH}/${gameId}`;
    const response = await makeRequest(url);
    
    // Se conseguiu buscar os dados, o jogo terminou com dados
    if (response.status === 200) {
      matchCache.set(cacheKey, response.data);
      return { inProgress: false, hasData: true, reason: 'match-data-available' };
    }
    return { inProgress: true, hasData: false, reason: 'match-data-not-ready' };
  } catch (error) {
    const status = error.response?.status;

    if (status && status !== 404) {
      logger.warn(`Erro ao verificar status da partida ${gameId}`, {
        status,
        message: error.message,
      });
      return { inProgress: true, hasData: false, reason: `match-api-${status}` };
    }

    // Match API retornou 404 - pode ser:
    // 1. Jogo ainda em andamento
    // 2. Jogo terminou mas não tem dados (ARAM Desordem, Arena, etc)
    
    // Verifica na Spectator API se o jogador ainda está em jogo
    if (puuid) {
      try {
        const spectatorUrl = `${RIOT_API.BR}${ENDPOINTS.SPECTATOR}/${puuid}`;
        await makeRequest(spectatorUrl);
        // Se não deu erro, jogador ainda está em jogo
        return { inProgress: true, hasData: false, reason: 'still-in-spectator' };
      } catch (spectatorError) {
        // 404 na Spectator = jogador não está mais em jogo
        // Jogo terminou, mas sem dados disponíveis (modo de evento)
        if (spectatorError.response?.status === 404) {
          logger.warn(`Partida ${gameId} terminou sem dados (modo de evento?)`);
          return { inProgress: false, hasData: false, reason: 'ended-without-match-data' };
        }
      }
    }
    
    // Se não tem puuid para verificar, assume em andamento
    return { inProgress: true, hasData: false, reason: 'missing-spectator-context' };
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
  const recentMatches = await getRecentMatchIds(puuid, 1);
  return recentMatches[0] || null;
};

/**
 * Busca IDs recentes de partida de um jogador
 * @param {string} puuid - PUUID do jogador
 * @param {number} count - Quantidade máxima de partidas
 * @returns {Promise<Array>} Lista de IDs
 */
const getRecentMatchIds = async (puuid, count = 5) => {
  // Sem cache - sempre busca a partida mais recente
  try {
    const safeCount = Number.isFinite(Number(count))
      ? Math.max(1, Math.min(Number(count), 20))
      : 5;

    const url = `${RIOT_API.AMERICAS}${ENDPOINTS.MATCH_BY_PUUID}/${puuid}/ids?start=0&count=${safeCount}`;
    const response = await makeRequest(url);
    
    if (response.status === 200 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error('Erro ao buscar IDs recentes de partida', error.message);
    return [];
  }
};

/**
 * Busca a última partida com payload disponível na Match API.
 * Útil quando o jogo mais recente é de evento e não retorna dados.
 */
const getLastSupportedMatch = async (puuid, count = 10, overrides = {}) => {
  const fetchRecentMatchIds = overrides.getRecentMatchIds || getRecentMatchIds;
  const fetchMatchData = overrides.getMatchData || getMatchData;

  const matchIds = await fetchRecentMatchIds(puuid, count);

  if (!matchIds.length) {
    return null;
  }

  const skippedMatchIds = [];

  for (const matchId of matchIds) {
    const matchData = await fetchMatchData(matchId);

    if (matchData?.info?.participants?.length) {
      if (skippedMatchIds.length > 0) {
        logger.info('Usando fallback de partida suportada', {
          selectedMatchId: matchId,
          skippedMatchIds,
        });
      }

      return {
        matchId,
        matchData,
        skippedMatchIds,
      };
    }

    skippedMatchIds.push(matchId);
  }

  return null;
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
  getRecentMatchIds,
  getLastSupportedMatch,
  getApiStats,
};
