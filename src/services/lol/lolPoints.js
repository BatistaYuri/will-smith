const { POINT_WEIGHTS } = require('../../config/constants');

/**
 * Sistema de cálculo de pontos para partidas de LoL
 */

const METRIC_KEYS = [
  'damage',
  'vision',
  'towerDamage',
  'participation',
  'healing',
  'shield',
  'tank',
  'kda',
];

const MODE_WEIGHTS = {
  default: {
    DAMAGE: POINT_WEIGHTS.DAMAGE,
    VISION: POINT_WEIGHTS.VISION,
    TOWER_DAMAGE: POINT_WEIGHTS.TOWER_DAMAGE,
    PARTICIPATION: POINT_WEIGHTS.PARTICIPATION,
    HEALING: POINT_WEIGHTS.HEALING,
    SHIELD: POINT_WEIGHTS.SHIELD,
    TANK: POINT_WEIGHTS.TANK,
    KDA: POINT_WEIGHTS.KDA,
    WIN_BONUS: POINT_WEIGHTS.WIN_BONUS,
  },
  aram: {
    DAMAGE: 30,
    VISION: 4,
    TOWER_DAMAGE: 4,
    PARTICIPATION: 32,
    HEALING: 12,
    SHIELD: 12,
    TANK: 16,
    KDA: 20,
    WIN_BONUS: POINT_WEIGHTS.WIN_BONUS,
  },
};

const getWeightProfile = (modeKey = 'default') => {
  if (modeKey === 'aram' || modeKey === 'aram_like' || modeKey === 'aram_mayhem_like') {
    return MODE_WEIGHTS.aram;
  }

  return MODE_WEIGHTS.default;
};

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Calcula o KDA de um participante
 * @param {number} kills - Abates
 * @param {number} assists - Assistências
 * @param {number} deaths - Mortes
 * @returns {number} KDA calculado
 */
const calculateKDA = (kills, assists, deaths) => {
  const safeKills = toSafeNumber(kills);
  const safeAssists = toSafeNumber(assists);
  const safeDeaths = toSafeNumber(deaths);
  const participation = safeKills + safeAssists;
  return participation / (safeDeaths === 0 ? 1 : safeDeaths);
};

/**
 * Calcula a pontuação normalizada de uma estatística
 * @param {number} value - Valor da estatística
 * @param {number} maxValue - Valor máximo entre todos os jogadores
 * @param {number} weight - Peso da estatística
 * @returns {number} Pontuação calculada
 */
const calculateNormalizedScore = (value, maxValue, weight) => {
  const safeValue = toSafeNumber(value);
  const safeMax = toSafeNumber(maxValue);
  const safeWeight = toSafeNumber(weight);

  if (safeMax === 0 || safeWeight === 0) return 0;
  if (safeValue >= safeMax) return safeWeight;
  return Number(((safeValue * safeWeight) / safeMax).toFixed(2));
};

const isMetricAvailable = (participant, metricKey) => {
  if (participant?.statsAvailability && metricKey in participant.statsAvailability) {
    return Boolean(participant.statsAvailability[metricKey]);
  }

  const fallbackValues = {
    damage: participant?.totalDamageDealtToChampions,
    vision: participant?.visionScore,
    towerDamage: participant?.damageDealtToTurrets,
    participation: toSafeNumber(participant?.kills) + toSafeNumber(participant?.assists),
    healing: participant?.totalHealsOnTeammates,
    shield: participant?.totalDamageShieldedOnTeammates,
    tank: participant?.totalDamageTaken,
    kda: calculateKDA(participant?.kills, participant?.assists, participant?.deaths),
  };

  return Number.isFinite(Number(fallbackValues[metricKey]));
};

const getActiveMetrics = (participants) => {
  const active = METRIC_KEYS.filter((metricKey) =>
    participants.some((participant) => isMetricAvailable(participant, metricKey))
  );

  // Fallback mínimo para não quebrar MVP em payloads parciais.
  return active.length > 0 ? active : ['participation', 'kda'];
};

const buildScaledWeights = (weights, activeMetrics) => {
  const mapping = {
    damage: weights.DAMAGE,
    vision: weights.VISION,
    towerDamage: weights.TOWER_DAMAGE,
    participation: weights.PARTICIPATION,
    healing: weights.HEALING,
    shield: weights.SHIELD,
    tank: weights.TANK,
    kda: weights.KDA,
  };

  const fullWeightSum = METRIC_KEYS.reduce(
    (sum, metricKey) => sum + toSafeNumber(mapping[metricKey]),
    0
  );

  const activeWeightSum = activeMetrics.reduce(
    (sum, metricKey) => sum + toSafeNumber(mapping[metricKey]),
    0
  );

  const scale = activeWeightSum > 0 ? fullWeightSum / activeWeightSum : 1;

  return {
    damage: activeMetrics.includes('damage') ? toSafeNumber(mapping.damage) * scale : 0,
    vision: activeMetrics.includes('vision') ? toSafeNumber(mapping.vision) * scale : 0,
    towerDamage: activeMetrics.includes('towerDamage')
      ? toSafeNumber(mapping.towerDamage) * scale
      : 0,
    participation: activeMetrics.includes('participation')
      ? toSafeNumber(mapping.participation) * scale
      : 0,
    healing: activeMetrics.includes('healing') ? toSafeNumber(mapping.healing) * scale : 0,
    shield: activeMetrics.includes('shield') ? toSafeNumber(mapping.shield) * scale : 0,
    tank: activeMetrics.includes('tank') ? toSafeNumber(mapping.tank) * scale : 0,
    kda: activeMetrics.includes('kda') ? toSafeNumber(mapping.kda) * scale : 0,
  };
};

/**
 * Encontra os valores máximos de cada estatística
 * @param {Array} participants - Lista de participantes
 * @returns {Object} Objeto com os valores máximos
 */
const findMaxStats = (participants, activeMetrics) => {
  const stats = {
    damage: 0,
    vision: 0,
    towerDamage: 0,
    participation: 0,
    healing: 0,
    shield: 0,
    tank: 0,
    kda: 0,
  };

  participants.forEach((participant) => {
    const damage = toSafeNumber(participant?.totalDamageDealtToChampions);
    const vision = toSafeNumber(participant?.visionScore);
    const towerDamage = toSafeNumber(participant?.damageDealtToTurrets);
    const healing = toSafeNumber(participant?.totalHealsOnTeammates);
    const shield = toSafeNumber(participant?.totalDamageShieldedOnTeammates);
    const tank = toSafeNumber(participant?.totalDamageTaken);
    const kills = toSafeNumber(participant?.kills);
    const assists = toSafeNumber(participant?.assists);
    const deaths = toSafeNumber(participant?.deaths);

    const participation = kills + assists;
    const kda = calculateKDA(kills, assists, deaths);

    if (activeMetrics.includes('damage')) {
      stats.damage = Math.max(stats.damage, damage);
    }
    if (activeMetrics.includes('vision')) {
      stats.vision = Math.max(stats.vision, vision);
    }
    if (activeMetrics.includes('towerDamage')) {
      stats.towerDamage = Math.max(stats.towerDamage, towerDamage);
    }
    if (activeMetrics.includes('participation')) {
      stats.participation = Math.max(stats.participation, participation);
    }
    if (activeMetrics.includes('healing')) {
      stats.healing = Math.max(stats.healing, healing);
    }
    if (activeMetrics.includes('shield')) {
      stats.shield = Math.max(stats.shield, shield);
    }
    if (activeMetrics.includes('tank')) {
      stats.tank = Math.max(stats.tank, tank);
    }
    if (activeMetrics.includes('kda')) {
      stats.kda = Math.max(stats.kda, kda);
    }
  });

  return stats;
};

/**
 * Calcula os pontos de um participante
 * @param {Object} participant - Dados do participante
 * @param {Object} maxStats - Estatísticas máximas
 * @returns {Object} Pontuação detalhada
 */
const calculateParticipantPoints = (participant, maxStats, scaledWeights, winBonus) => {
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
    win,
  } = participant;

  const participationValue = toSafeNumber(kills) + toSafeNumber(assists);
  const kda = calculateKDA(kills, assists, deaths);

  const scores = {
    damage: calculateNormalizedScore(
      totalDamageDealtToChampions,
      maxStats.damage,
      scaledWeights.damage
    ),
    vision: calculateNormalizedScore(visionScore, maxStats.vision, scaledWeights.vision),
    towerDamage: calculateNormalizedScore(
      damageDealtToTurrets,
      maxStats.towerDamage,
      scaledWeights.towerDamage
    ),
    participation: calculateNormalizedScore(
      participationValue,
      maxStats.participation,
      scaledWeights.participation
    ),
    healing: calculateNormalizedScore(
      totalHealsOnTeammates,
      maxStats.healing,
      scaledWeights.healing
    ),
    shield: calculateNormalizedScore(
      totalDamageShieldedOnTeammates,
      maxStats.shield,
      scaledWeights.shield
    ),
    tank: calculateNormalizedScore(totalDamageTaken, maxStats.tank, scaledWeights.tank),
    kda: calculateNormalizedScore(kda, maxStats.kda, scaledWeights.kda),
  };

  let total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  if (win) {
    total += toSafeNumber(winBonus);
  }

  return {
    participant,
    total: Number(total.toFixed(2)),
    win,
    ...scores,
  };
};

/**
 * Calcula e ordena os pontos de todos os participantes
 * @param {Array} participants - Lista de participantes
 * @returns {Array} Lista ordenada por pontuação
 */
const calculateRanking = (participants, options = {}) => {
  const modeKey = options.modeKey || 'default';
  const weights = getWeightProfile(modeKey);
  const activeMetrics = getActiveMetrics(participants);
  const scaledWeights = buildScaledWeights(weights, activeMetrics);
  const maxStats = findMaxStats(participants, activeMetrics);
  
  const ranking = participants.map((participant) => 
    calculateParticipantPoints(participant, maxStats, scaledWeights, weights.WIN_BONUS)
  );

  return ranking.sort((a, b) => b.total - a.total);
};

module.exports = {
  calculateRanking,
  calculateKDA,
};

