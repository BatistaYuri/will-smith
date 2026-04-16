const test = require('node:test');
const assert = require('node:assert/strict');

const { getLastSupportedMatch } = require('../../src/services/lol/lolApi');

test('getLastSupportedMatch picks first match that has participants', async () => {
  const calls = [];

  const result = await getLastSupportedMatch('puuid-1', 5, {
    getRecentMatchIds: async () => ['BR1_1', 'BR1_2', 'BR1_3'],
    getMatchData: async (matchId) => {
      calls.push(matchId);

      if (matchId === 'BR1_1') return null;
      if (matchId === 'BR1_2') return { info: {} };

      return {
        metadata: { matchId: 'BR1_3' },
        info: { participants: [{ puuid: 'x' }] },
      };
    },
  });

  assert.deepEqual(calls, ['BR1_1', 'BR1_2', 'BR1_3']);
  assert.equal(result.matchId, 'BR1_3');
  assert.deepEqual(result.skippedMatchIds, ['BR1_1', 'BR1_2']);
});

test('getLastSupportedMatch returns null when no recent matches exist', async () => {
  const result = await getLastSupportedMatch('puuid-2', 5, {
    getRecentMatchIds: async () => [],
    getMatchData: async () => {
      throw new Error('should not be called');
    },
  });

  assert.equal(result, null);
});

test('getLastSupportedMatch returns null when all matches are unsupported', async () => {
  const result = await getLastSupportedMatch('puuid-3', 5, {
    getRecentMatchIds: async () => ['BR1_a', 'BR1_b'],
    getMatchData: async () => ({ info: { participants: [] } }),
  });

  assert.equal(result, null);
});

test('getLastSupportedMatch forwards count to recent-id provider', async () => {
  let receivedCount = null;

  const result = await getLastSupportedMatch('puuid-4', 7, {
    getRecentMatchIds: async (_puuid, count) => {
      receivedCount = count;
      return ['BR1_9'];
    },
    getMatchData: async () => ({
      metadata: { matchId: 'BR1_9' },
      info: { participants: [{ puuid: 'x' }] },
    }),
  });

  assert.equal(receivedCount, 7);
  assert.equal(result.matchId, 'BR1_9');
  assert.deepEqual(result.skippedMatchIds, []);
});
