const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateRanking, calculateKDA } = require('../../src/services/lol/lolPoints');

const makeParticipant = (overrides = {}) => ({
  puuid: overrides.puuid || Math.random().toString(36).slice(2),
  riotIdGameName: overrides.riotIdGameName || 'Player',
  championName: overrides.championName || 'Ashe',
  teamId: overrides.teamId ?? 100,
  kills: overrides.kills ?? 0,
  assists: overrides.assists ?? 0,
  deaths: overrides.deaths ?? 1,
  win: overrides.win ?? false,
  totalDamageDealtToChampions: overrides.totalDamageDealtToChampions ?? 0,
  visionScore: overrides.visionScore ?? 0,
  damageDealtToTurrets: overrides.damageDealtToTurrets ?? 0,
  totalHealsOnTeammates: overrides.totalHealsOnTeammates ?? 0,
  totalDamageShieldedOnTeammates: overrides.totalDamageShieldedOnTeammates ?? 0,
  totalDamageTaken: overrides.totalDamageTaken ?? 0,
  statsAvailability: overrides.statsAvailability,
});

test('calculateKDA handles zero deaths', () => {
  assert.equal(calculateKDA(10, 5, 0), 15);
});

test('calculateRanking ranks strongest contributor first in default mode', () => {
  const participants = [
    makeParticipant({
      puuid: 'a',
      riotIdGameName: 'Carry',
      win: true,
      kills: 20,
      assists: 15,
      deaths: 2,
      totalDamageDealtToChampions: 45000,
      visionScore: 20,
      damageDealtToTurrets: 4000,
      totalHealsOnTeammates: 1200,
      totalDamageShieldedOnTeammates: 800,
      totalDamageTaken: 25000,
    }),
    makeParticipant({
      puuid: 'b',
      riotIdGameName: 'Support',
      win: false,
      kills: 3,
      assists: 12,
      deaths: 10,
      totalDamageDealtToChampions: 12000,
      visionScore: 45,
      damageDealtToTurrets: 700,
      totalHealsOnTeammates: 2400,
      totalDamageShieldedOnTeammates: 1500,
      totalDamageTaken: 17000,
    }),
  ];

  const ranking = calculateRanking(participants, { modeKey: 'default' });

  assert.equal(ranking.length, 2);
  assert.equal(ranking[0].participant.puuid, 'a');
  assert.ok(Number.isFinite(ranking[0].total));
  assert.ok(ranking[0].total > ranking[1].total);
});

test('calculateRanking still works when only participation and kda are available', () => {
  const participants = [
    makeParticipant({
      puuid: 'p1',
      kills: 12,
      assists: 20,
      deaths: 4,
      win: true,
      statsAvailability: {
        damage: false,
        vision: false,
        towerDamage: false,
        participation: true,
        healing: false,
        shield: false,
        tank: false,
        kda: true,
      },
      totalDamageDealtToChampions: null,
      visionScore: null,
      damageDealtToTurrets: null,
      totalHealsOnTeammates: null,
      totalDamageShieldedOnTeammates: null,
      totalDamageTaken: null,
    }),
    makeParticipant({
      puuid: 'p2',
      kills: 5,
      assists: 10,
      deaths: 8,
      win: false,
      statsAvailability: {
        damage: false,
        vision: false,
        towerDamage: false,
        participation: true,
        healing: false,
        shield: false,
        tank: false,
        kda: true,
      },
      totalDamageDealtToChampions: null,
      visionScore: null,
      damageDealtToTurrets: null,
      totalHealsOnTeammates: null,
      totalDamageShieldedOnTeammates: null,
      totalDamageTaken: null,
    }),
  ];

  const ranking = calculateRanking(participants, { modeKey: 'aram_mayhem_like' });

  assert.equal(ranking.length, 2);
  assert.equal(ranking[0].participant.puuid, 'p1');
  assert.ok(Number.isFinite(ranking[0].total));
  assert.ok(Number.isFinite(ranking[1].total));
});

test('calculateRanking applies win bonus when stats are tied', () => {
  const shared = {
    kills: 10,
    assists: 10,
    deaths: 5,
    totalDamageDealtToChampions: 20000,
    visionScore: 15,
    damageDealtToTurrets: 1000,
    totalHealsOnTeammates: 500,
    totalDamageShieldedOnTeammates: 500,
    totalDamageTaken: 12000,
  };

  const ranking = calculateRanking(
    [
      makeParticipant({ puuid: 'win', win: true, ...shared }),
      makeParticipant({ puuid: 'lose', win: false, ...shared }),
    ],
    { modeKey: 'default' }
  );

  assert.equal(ranking[0].participant.puuid, 'win');
  assert.ok(ranking[0].total > ranking[1].total);
});

test('calculateRanking handles empty participant list', () => {
  const ranking = calculateRanking([], { modeKey: 'aram' });
  assert.deepEqual(ranking, []);
});
