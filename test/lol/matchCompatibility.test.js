const test = require('node:test');
const assert = require('node:assert/strict');

const {
  detectModeFromMatch,
  detectModeFromActiveGame,
  buildMatchDebugInfo,
} = require('../../src/services/lol/matchCompatibility');

test('detectModeFromMatch classifies classic ARAM with high confidence', () => {
  const mode = detectModeFromMatch({
    info: {
      queueId: 450,
      gameMode: 'ARAM',
      gameType: 'MATCHED_GAME',
      mapId: 12,
    },
  });

  assert.equal(mode.key, 'aram');
  assert.equal(mode.isAramLike, true);
  assert.equal(mode.isEventLike, false);
  assert.equal(mode.confidence, 'high');
});

test('detectModeFromMatch classifies ARAM Mayhem-like by map/type even when queue differs', () => {
  const mode = detectModeFromMatch({
    info: {
      queueId: 1700,
      gameMode: 'ARAM',
      gameType: 'CUSTOM_GAME',
      mapId: 12,
    },
  });

  assert.equal(mode.key, 'aram_mayhem_like');
  assert.equal(mode.isAramLike, true);
  assert.equal(mode.isEventLike, true);
});

test('detectModeFromActiveGame classifies standard mode when no ARAM signals exist', () => {
  const mode = detectModeFromActiveGame({
    queueId: 420,
    gameMode: 'CLASSIC',
    gameType: 'MATCHED_GAME',
    mapId: 11,
  });

  assert.equal(mode.key, 'standard');
  assert.equal(mode.isAramLike, false);
});

test('detectModeFromMatch classifies Howling Abyss with non-ARAM queue as mayhem-like', () => {
  const mode = detectModeFromMatch({
    info: {
      queueId: 999,
      gameMode: 'CLASSIC',
      gameType: 'MATCHED_GAME',
      mapId: 12,
    },
  });

  assert.equal(mode.key, 'aram_mayhem_like');
  assert.equal(mode.isEventLike, true);
});

test('detectModeFromMatch handles missing fields safely', () => {
  const mode = detectModeFromMatch({ info: {} });

  assert.equal(mode.key, 'standard');
  assert.equal(mode.label, 'Standard');
  assert.equal(mode.isAramLike, false);
});

test('buildMatchDebugInfo returns normalized debug snapshot', () => {
  const debugInfo = buildMatchDebugInfo({
    metadata: { matchId: 'BR1_123' },
    info: {
      queueId: '450',
      gameMode: 'ARAM',
      gameType: 'MATCHED_GAME',
      mapId: '12',
      participants: new Array(10).fill({}),
    },
  });

  assert.deepEqual(debugInfo, {
    gameId: 'BR1_123',
    queueId: 450,
    gameMode: 'ARAM',
    gameType: 'MATCHED_GAME',
    mapId: 12,
    participantCount: 10,
  });
});
