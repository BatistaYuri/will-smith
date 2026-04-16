const test = require('node:test');
const assert = require('node:assert/strict');

const { Cache } = require('../../src/utils/cache');

test('Cache set/get returns value before expiration', () => {
  const cache = new Cache(1000);
  cache.set('k', 'v');

  assert.equal(cache.get('k'), 'v');
  assert.equal(cache.has('k'), true);
});

test('Cache expires value after TTL', () => {
  const originalNow = Date.now;
  let now = 1000;
  Date.now = () => now;

  try {
    const cache = new Cache(50);
    cache.set('k', 'v');
    assert.equal(cache.get('k'), 'v');

    now = 1100;
    assert.equal(cache.get('k'), null);
    assert.equal(cache.has('k'), false);
  } finally {
    Date.now = originalNow;
  }
});

test('Cache delete and clear remove values', () => {
  const cache = new Cache(1000);
  cache.set('a', 1);
  cache.set('b', 2);

  cache.delete('a');
  assert.equal(cache.get('a'), null);
  assert.equal(cache.get('b'), 2);

  cache.clear();
  assert.equal(cache.get('b'), null);
});

test('Cache getStats returns only non-expired keys', () => {
  const originalNow = Date.now;
  let now = 2000;
  Date.now = () => now;

  try {
    const cache = new Cache(100);
    cache.set('alive', 'ok', 1000);
    cache.set('dead', 'expired', 10);

    now = 2050;
    cache.cleanup();
    const stats = cache.getStats();

    assert.equal(stats.size, 1);
    assert.deepEqual(stats.keys, ['alive']);
  } finally {
    Date.now = originalNow;
  }
});
