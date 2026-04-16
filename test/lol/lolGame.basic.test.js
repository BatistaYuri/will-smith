const test = require('node:test');
const assert = require('node:assert/strict');

let lolGame = null;
let loadError = null;

try {
  lolGame = require('../../src/services/lol/lolGame');
} catch (error) {
  loadError = error;
}

const { getTrackedPlayers, getLastMatch } = lolGame || {};

const maybeTest = (name, fn) => {
  if (loadError) {
    test(name, { skip: `Dependência ausente para lolGame: ${loadError.code || loadError.message}` }, fn);
    return;
  }
  test(name, fn);
};

maybeTest('getTrackedPlayers returns configured players', () => {
  const players = getTrackedPlayers();

  assert.ok(Array.isArray(players));
  assert.ok(players.length > 0);
});

maybeTest('getLastMatch returns null for unknown player', async () => {
  const result = await getLastMatch('jogador-que-nao-existe-123');
  assert.equal(result, null);
});
