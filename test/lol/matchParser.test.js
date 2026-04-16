const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeMatchData } = require('../../src/services/lol/matchParser');

test('normalizeMatchData returns null when participants are missing', () => {
  const normalized = normalizeMatchData({
    metadata: { matchId: 'BR1_1' },
    info: {},
  });

  assert.equal(normalized, null);
});

test('normalizeMatchData fills defaults and extracts augments/perks safely', () => {
  const normalized = normalizeMatchData({
    metadata: { matchId: 'BR1_2' },
    info: {
      queueId: 450,
      gameMode: 'ARAM',
      gameType: 'MATCHED_GAME',
      mapId: 12,
      participants: [
        {
          puuid: 'abcdef123456',
          summonerName: 'FallbackName',
          championName: 'Lux',
          teamId: 100,
          kills: 5,
          assists: 10,
          deaths: 3,
          win: true,
          totalDamageDealtToChampions: 20000,
          visionScore: 12,
          damageDealtToTurrets: 1000,
          totalHealsOnTeammates: 200,
          totalDamageShieldedOnTeammates: 300,
          totalDamageTaken: 14000,
          perks: { styles: [{ style: 8200 }, { style: 8300 }] },
          playerAugment1: 11,
          playerAugment2: 22,
          augments: [22, 33],
        },
        {
          puuid: 'missingstats0001',
          championName: 'UnknownChampion',
          teamId: 200,
          win: false,
        },
      ],
    },
  });

  assert.ok(normalized);
  assert.equal(normalized.metadata.gameId, 'BR1_2');
  assert.equal(normalized.participants.length, 2);

  const first = normalized.participants[0];
  assert.equal(first.riotIdGameName, 'FallbackName');
  assert.deepEqual(first.augmentIds, [11, 22, 33]);
  assert.deepEqual(first.perks, { primaryStyle: 8200, subStyle: 8300 });
  assert.equal(first.statsAvailability.damage, true);

  const second = normalized.participants[1];
  assert.equal(second.riotIdGameName, 'missings');
  assert.equal(second.kills, 0);
  assert.equal(second.visionScore, 0);
  assert.equal(second.statsAvailability.damage, false);
});

test('normalizeMatchData prefers riotIdGameName over summonerName', () => {
  const normalized = normalizeMatchData({
    metadata: { matchId: 'BR1_3' },
    info: {
      participants: [
        {
          puuid: 'aaaa1111',
          riotIdGameName: 'RiotName',
          summonerName: 'SummonerName',
          championName: 'Ashe',
          teamId: 100,
        },
      ],
    },
  });

  assert.equal(normalized.participants[0].riotIdGameName, 'RiotName');
});

test('normalizeMatchData keeps perks null and drops invalid augment values', () => {
  const normalized = normalizeMatchData({
    metadata: { matchId: 'BR1_4' },
    info: {
      participants: [
        {
          puuid: 'bbbb2222',
          championName: 'Sona',
          playerAugment1: 0,
          playerAugment2: null,
          augments: [0, null, 55],
        },
      ],
    },
  });

  const participant = normalized.participants[0];
  assert.deepEqual(participant.perks, { primaryStyle: null, subStyle: null });
  assert.deepEqual(participant.augmentIds, [55]);
});
