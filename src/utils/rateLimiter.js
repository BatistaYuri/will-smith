/**
 * Rate Limiter para controlar requisições à API
 * 
 * Limites da API da Riot:
 * - 20 requests por segundo
 * - 100 requests por 2 minutos
 */

const logger = require('./logger');

class RateLimiter {
  constructor(options = {}) {
    this.maxRequestsPerSecond = options.maxRequestsPerSecond || 20;
    this.maxRequestsPer2Min = options.maxRequestsPer2Min || 100;
    this.requestsThisSecond = 0;
    this.requestsThis2Min = 0;
    this.queue = [];
    this.processing = false;
    
    // Reset contadores
    setInterval(() => {
      this.requestsThisSecond = 0;
    }, 1000);
    
    setInterval(() => {
      this.requestsThis2Min = 0;
    }, 120000);
  }

  /**
   * Verifica se pode fazer uma requisição
   */
  canRequest() {
    return (
      this.requestsThisSecond < this.maxRequestsPerSecond &&
      this.requestsThis2Min < this.maxRequestsPer2Min
    );
  }

  /**
   * Aguarda até poder fazer uma requisição
   */
  async waitForSlot() {
    while (!this.canRequest()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Executa uma função com rate limiting
   * @param {Function} fn - Função assíncrona a executar
   * @returns {Promise<any>}
   */
  async execute(fn) {
    await this.waitForSlot();
    
    this.requestsThisSecond++;
    this.requestsThis2Min++;
    
    try {
      return await fn();
    } catch (error) {
      // Se for rate limit (429), espera mais
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 5;
        logger.warn(`Rate limited! Aguardando ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.execute(fn);
      }
      throw error;
    }
  }

  /**
   * Retorna estatísticas do rate limiter
   */
  getStats() {
    return {
      requestsThisSecond: this.requestsThisSecond,
      maxPerSecond: this.maxRequestsPerSecond,
      requestsThis2Min: this.requestsThis2Min,
      maxPer2Min: this.maxRequestsPer2Min,
      available: this.canRequest(),
    };
  }
}

// Instância única do rate limiter
const riotRateLimiter = new RateLimiter();

module.exports = {
  RateLimiter,
  riotRateLimiter,
};

