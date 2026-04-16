/**
 * Camada de compatibilidade para modos de jogo da Riot.
 * ARAM Mayhem/Desordem pode variar no queueId e no gameType,
 * então a detecção usa múltiplos sinais.
 */

const HOWLING_ABYSS_MAP_ID = 12;
const CLASSIC_ARAM_QUEUE_ID = 450;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeMode = (value) => String(value || '').toUpperCase();

const detectModeFromFields = ({ queueId, gameMode, gameType, mapId }) => {
  const normalizedQueueId = toNumber(queueId);
  const normalizedGameMode = normalizeMode(gameMode);
  const normalizedGameType = normalizeMode(gameType);
  const normalizedMapId = toNumber(mapId);

  const isHowlingAbyss = normalizedMapId === HOWLING_ABYSS_MAP_ID;
  const isAramMode = normalizedGameMode === 'ARAM';
  const isClassicAramQueue = normalizedQueueId === CLASSIC_ARAM_QUEUE_ID;
  const isRiotEventType =
    normalizedGameType && normalizedGameType !== 'MATCHED_GAME';

  if (isClassicAramQueue && isAramMode) {
    return {
      key: 'aram',
      label: 'ARAM',
      isAramLike: true,
      isEventLike: false,
      confidence: 'high',
      reason: 'queueId=450 + gameMode=ARAM',
    };
  }

  if (isHowlingAbyss || isAramMode) {
    const isLikelyMayhem =
      isRiotEventType || (isHowlingAbyss && !isClassicAramQueue);

    return {
      key: isLikelyMayhem ? 'aram_mayhem_like' : 'aram_like',
      label: isLikelyMayhem ? 'ARAM Mayhem-like' : 'ARAM-like',
      isAramLike: true,
      isEventLike: Boolean(isLikelyMayhem),
      confidence: isLikelyMayhem ? 'medium' : 'low',
      reason: isLikelyMayhem
        ? 'Howling Abyss/ARAM com tipo ou fila fora do ARAM padrão'
        : 'Sinais parciais de ARAM (mapa/modo)',
    };
  }

  return {
    key: 'standard',
    label: normalizedGameMode || 'Standard',
    isAramLike: false,
    isEventLike: isRiotEventType,
    confidence: 'medium',
    reason: 'Sem sinais claros de ARAM',
  };
};

const detectModeFromMatch = (matchData) => {
  const info = matchData?.info || {};
  return detectModeFromFields({
    queueId: info.queueId,
    gameMode: info.gameMode,
    gameType: info.gameType,
    mapId: info.mapId,
  });
};

const detectModeFromActiveGame = (activeGameData) => {
  return detectModeFromFields({
    queueId: activeGameData?.queueId,
    gameMode: activeGameData?.gameMode,
    gameType: activeGameData?.gameType,
    mapId: activeGameData?.mapId,
  });
};

const buildMatchDebugInfo = (matchData) => {
  const info = matchData?.info || {};
  return {
    gameId: matchData?.metadata?.matchId || null,
    queueId: toNumber(info.queueId),
    gameMode: info.gameMode || null,
    gameType: info.gameType || null,
    mapId: toNumber(info.mapId),
    participantCount: Array.isArray(info.participants)
      ? info.participants.length
      : 0,
  };
};

module.exports = {
  detectModeFromMatch,
  detectModeFromActiveGame,
  buildMatchDebugInfo,
};
