const test = require('node:test');
const assert = require('node:assert/strict');

const { RateLimiter } = require('../../src/utils/rateLimiter');

test('RateLimiter execute increments counters and returns function result', async () => {
  const limiter = new RateLimiter({ maxRequestsPerSecond: 50, maxRequestsPer2Min: 50 });

  const result = await limiter.execute(async () => 'ok');

  assert.equal(result, 'ok');
  assert.equal(limiter.requestsThisSecond, 1);
  assert.equal(limiter.requestsThis2Min, 1);
});

test('RateLimiter retries on 429 and succeeds', async () => {
  const limiter = new RateLimiter({ maxRequestsPerSecond: 50, maxRequestsPer2Min: 50 });
  let attempts = 0;

  const result = await limiter.execute(async () => {
    attempts += 1;

    if (attempts === 1) {
      const error = new Error('rate limited');
      error.response = { status: 429, headers: { 'retry-after': 0 } };
      throw error;
    }

    return 'retried-ok';
  });

  assert.equal(result, 'retried-ok');
  assert.equal(attempts, 2);
});

test('RateLimiter canRequest reflects internal counters', () => {
  const limiter = new RateLimiter({ maxRequestsPerSecond: 2, maxRequestsPer2Min: 3 });

  limiter.requestsThisSecond = 1;
  limiter.requestsThis2Min = 2;
  assert.equal(limiter.canRequest(), true);

  limiter.requestsThisSecond = 2;
  assert.equal(limiter.canRequest(), false);

  limiter.requestsThisSecond = 1;
  limiter.requestsThis2Min = 3;
  assert.equal(limiter.canRequest(), false);
});

test('RateLimiter getStats exposes limits and availability', () => {
  const limiter = new RateLimiter({ maxRequestsPerSecond: 2, maxRequestsPer2Min: 3 });
  limiter.requestsThisSecond = 0;
  limiter.requestsThis2Min = 1;

  const stats = limiter.getStats();

  assert.equal(stats.maxPerSecond, 2);
  assert.equal(stats.maxPer2Min, 3);
  assert.equal(stats.available, true);
});
