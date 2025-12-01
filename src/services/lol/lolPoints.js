const { POINT_WEIGHTS } = require('../../config/constants');

/**
 * Sistema de cálculo de pontos para partidas de LoL
 */

/**
 * Calcula o KDA de um participante
 * @param {number} kills - Abates
 * @param {number} assists - Assistências
 * @param {number} deaths - Mortes
 * @returns {number} KDA calculado
 */
const calculateKDA = (kills, assists, deaths) => {
  const participation = kills + assists;
  return participation / (deaths === 0 ? 1 : deaths);
};

/**
 * Calcula a pontuação normalizada de uma estatística
 * @param {number} value - Valor da estatística
 * @param {number} maxValue - Valor máximo entre todos os jogadores
 * @param {number} weight - Peso da estatística
 * @returns {number} Pontuação calculada
 */
const calculateNormalizedScore = (value, maxValue, weight) => {
  if (maxValue === 0) return 0;
  if (value >= maxValue) return weight;
  return Number(((value * weight) / maxValue).toFixed(2));
};

/**
 * Encontra os valores máximos de cada estatística
 * @param {Array} participants - Lista de participantes
 * @returns {Object} Objeto com os valores máximos
 */
const findMaxStats = (participants) => {
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

    const participation = kills + assists;
    const kda = calculateKDA(kills, assists, deaths);

    stats.damage = Math.max(stats.damage, totalDamageDealtToChampions);
    stats.vision = Math.max(stats.vision, visionScore);
    stats.towerDamage = Math.max(stats.towerDamage, damageDealtToTurrets);
    stats.participation = Math.max(stats.participation, participation);
    stats.healing = Math.max(stats.healing, totalHealsOnTeammates);
    stats.shield = Math.max(stats.shield, totalDamageShieldedOnTeammates);
    stats.tank = Math.max(stats.tank, totalDamageTaken);
    stats.kda = Math.max(stats.kda, kda);
  });

  return stats;
};

/**
 * Calcula os pontos de um participante
 * @param {Object} participant - Dados do participante
 * @param {Object} maxStats - Estatísticas máximas
 * @returns {Object} Pontuação detalhada
 */
const calculateParticipantPoints = (participant, maxStats) => {
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

  const participationValue = kills + assists;
  const kda = calculateKDA(kills, assists, deaths);

  const scores = {
    damage: calculateNormalizedScore(totalDamageDealtToChampions, maxStats.damage, POINT_WEIGHTS.DAMAGE),
    vision: calculateNormalizedScore(visionScore, maxStats.vision, POINT_WEIGHTS.VISION),
    towerDamage: calculateNormalizedScore(damageDealtToTurrets, maxStats.towerDamage, POINT_WEIGHTS.TOWER_DAMAGE),
    participation: calculateNormalizedScore(participationValue, maxStats.participation, POINT_WEIGHTS.PARTICIPATION),
    healing: calculateNormalizedScore(totalHealsOnTeammates, maxStats.healing, POINT_WEIGHTS.HEALING),
    shield: calculateNormalizedScore(totalDamageShieldedOnTeammates, maxStats.shield, POINT_WEIGHTS.SHIELD),
    tank: calculateNormalizedScore(totalDamageTaken, maxStats.tank, POINT_WEIGHTS.TANK),
    kda: calculateNormalizedScore(kda, maxStats.kda, POINT_WEIGHTS.KDA),
  };

  let total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  if (win) {
    total += POINT_WEIGHTS.WIN_BONUS;
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
const calculateRanking = (participants) => {
  const maxStats = findMaxStats(participants);
  
  const ranking = participants.map((participant) => 
    calculateParticipantPoints(participant, maxStats)
  );

  return ranking.sort((a, b) => b.total - a.total);
};

module.exports = {
  calculateRanking,
  calculateKDA,
};

