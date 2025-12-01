const { Events } = require('discord.js');
const cron = require('node-cron');
const config = require('../config');
const { checkGameStatus } = require('../services/lol/lolGame');
const logger = require('../utils/logger');

/**
 * Formata bytes para MB
 */
const formatMemory = (bytes) => (bytes / 1024 / 1024).toFixed(2);

/**
 * Loga o uso de memória
 */
const logMemoryUsage = () => {
  const mem = process.memoryUsage();
  logger.info(`📊 Memória: RSS=${formatMemory(mem.rss)}MB | Heap=${formatMemory(mem.heapUsed)}/${formatMemory(mem.heapTotal)}MB`);
};

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.success(`Bot conectado como ${client.user.tag}`);
    
    // Log inicial de memória
    logMemoryUsage();
    
    // Monitora memória a cada 30 segundos
    setInterval(() => {
      logMemoryUsage();
    }, 30000);

    // Busca canais
    const voiceChannel = client.channels.cache.find(
      (channel) => channel.name === config.channels.voice
    );

    const textChannel = client.channels.cache.find(
      (channel) => channel.name === config.channels.text
    );

    if (!voiceChannel || !textChannel) {
      logger.warn('Canais não encontrados', {
        voice: config.channels.voice,
        text: config.channels.text,
      });
      return;
    }

    // Inicia monitoramento de partidas
    await client.channels.fetch(voiceChannel.id);

    cron.schedule(
      config.cron.lolCheck,
      async () => {
        await checkGameStatus(client, voiceChannel, textChannel.id);
      },
      {
        scheduled: true,
        timezone: config.cron.timezone,
      }
    );

    logger.info('Monitoramento de partidas iniciado');
  },
};

