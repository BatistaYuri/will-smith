const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { detectModeFromMatch, buildMatchDebugInfo } = require('../../src/services/lol/matchCompatibility');
const { normalizeMatchData } = require('../../src/services/lol/matchParser');
const { calculateRanking } = require('../../src/services/lol/lolPoints');

const fixturesDir = path.join(__dirname, '..', 'fixtures', 'lol');

const loadFixture = (name) => {
  const filePath = path.join(fixturesDir, name);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

test('integration: classic ARAM fixture goes through mode -> parser -> ranking', () => {
  const matchData = loadFixture('aram-classic.json');

  const mode = detectModeFromMatch(matchData);
  const parsed = normalizeMatchData(matchData);

  assert.equal(mode.key, 'aram');
  assert.ok(parsed);
  assert.equal(parsed.participants.length, 10);

  const ranking = calculateRanking(parsed.participants, { modeKey: mode.key });
  assert.equal(ranking.length, 10);
  assert.ok(Number.isFinite(ranking[0].total));
  assert.equal(ranking[0].participant.teamId, 100);
});

test('integration: ARAM Mayhem-like partial fixture still ranks with degraded metrics', () => {
  const matchData = loadFixture('aram-mayhem-like-partial.json');

  const mode = detectModeFromMatch(matchData);
  const parsed = normalizeMatchData(matchData);

  assert.equal(mode.key, 'aram_mayhem_like');
  assert.ok(parsed);
  assert.equal(parsed.participants.length, 10);

  const ranking = calculateRanking(parsed.participants, { modeKey: mode.key });
  assert.equal(ranking.length, 10);
  assert.ok(Number.isFinite(ranking[0].total));

  const hasAugments = parsed.participants.some((p) => p.augmentIds.length > 0);
  assert.equal(hasAugments, true);
});

test('integration: unsupported fixture without participants is rejected by parser', () => {
  const matchData = loadFixture('unsupported-no-participants.json');

  const mode = detectModeFromMatch(matchData);
  const parsed = normalizeMatchData(matchData);
  const debug = buildMatchDebugInfo(matchData);

  assert.equal(mode.isAramLike, true);
  assert.equal(mode.isEventLike, true);
  assert.equal(parsed, null);
  assert.equal(debug.participantCount, 0);
});
