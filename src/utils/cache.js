/**
 * Sistema de cache em memória com TTL
 */

class Cache {
  constructor(defaultTTL = 300000) { // 5 minutos padrão
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Define um valor no cache
   * @param {string} key - Chave
   * @param {any} value - Valor
   * @param {number} ttl - Tempo de vida em ms (opcional)
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Obtém um valor do cache
   * @param {string} key - Chave
   * @returns {any|null} Valor ou null se expirado/inexistente
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Verifica se existe uma chave válida no cache
   * @param {string} key - Chave
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove uma chave do cache
   * @param {string} key - Chave
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove itens expirados
   */
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats() {
    this.cleanup();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Cache para dados de partidas (5 minutos)
const matchCache = new Cache(300000);

// Cache para dados de jogadores (1 minuto)
const playerCache = new Cache(60000);

module.exports = {
  Cache,
  matchCache,
  playerCache,
};

