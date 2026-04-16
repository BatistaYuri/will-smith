const logger = require('../../utils/logger');

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasValue = (value) => value !== undefined && value !== null;

const getParticipantName = (participant) => {
  if (participant?.riotIdGameName) return participant.riotIdGameName;
  if (participant?.summonerName) return participant.summonerName;
  if (participant?.puuid) return participant.puuid.slice(0, 8);
  return 'Unknown';
};

const extractAugments = (participant) => {
  const augmentKeys = [
    'playerAugment1',
    'playerAugment2',
    'playerAugment3',
    'playerAugment4',
  ];

  const augmentIds = augmentKeys
    .map((key) => safeNumber(participant?.[key]))
    .filter((value) => value > 0);

  if (Array.isArray(participant?.augments)) {
    participant.augments.forEach((augment) => {
      const value = safeNumber(augment);
      if (value > 0) {
        augmentIds.push(value);
      }
    });
  }

  return [...new Set(augmentIds)];
};

const extractPerks = (participant) => {
  const styles = participant?.perks?.styles;
  return {
    primaryStyle: safeNumber(styles?.[0]?.style) || null,
    subStyle: safeNumber(styles?.[1]?.style) || null,
  };
};

const normalizeParticipant = (participant) => {
  const availability = {
    damage: hasValue(participant?.totalDamageDealtToChampions),
    vision: hasValue(participant?.visionScore),
    towerDamage: hasValue(participant?.damageDealtToTurrets),
    healing: hasValue(participant?.totalHealsOnTeammates),
    shield: hasValue(participant?.totalDamageShieldedOnTeammates),
    tank: hasValue(participant?.totalDamageTaken),
    kda: hasValue(participant?.kills) && hasValue(participant?.assists),
    participation: hasValue(participant?.kills) && hasValue(participant?.assists),
  };

  return {
    ...participant,
    riotIdGameName: getParticipantName(participant),
    championName: participant?.championName || 'Unknown',
    teamId: safeNumber(participant?.teamId),
    kills: safeNumber(participant?.kills),
    assists: safeNumber(participant?.assists),
    deaths: safeNumber(participant?.deaths),
    win: Boolean(participant?.win),
    totalDamageDealtToChampions: safeNumber(
      participant?.totalDamageDealtToChampions
    ),
    visionScore: safeNumber(participant?.visionScore),
    damageDealtToTurrets: safeNumber(participant?.damageDealtToTurrets),
    totalHealsOnTeammates: safeNumber(participant?.totalHealsOnTeammates),
    totalDamageShieldedOnTeammates: safeNumber(
      participant?.totalDamageShieldedOnTeammates
    ),
    totalDamageTaken: safeNumber(participant?.totalDamageTaken),
    perks: extractPerks(participant),
    augmentIds: extractAugments(participant),
    statsAvailability: availability,
  };
};

const normalizeMatchData = (matchData) => {
  const participants = matchData?.info?.participants;

  if (!Array.isArray(participants) || participants.length === 0) {
    logger.warn('Payload da partida sem participantes válidos', {
      gameId: matchData?.metadata?.matchId || null,
    });
    return null;
  }

  const normalizedParticipants = participants.map(normalizeParticipant);

  return {
    metadata: {
      gameId: matchData?.metadata?.matchId || null,
      queueId: matchData?.info?.queueId ?? null,
      gameMode: matchData?.info?.gameMode ?? null,
      gameType: matchData?.info?.gameType ?? null,
      mapId: matchData?.info?.mapId ?? null,
    },
    participants: normalizedParticipants,
  };
};

module.exports = {
  normalizeMatchData,
};
